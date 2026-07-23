import { examScreenStyles as styles } from '@/src/styles/styles/mock/examscreenstyles';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  BackHandler,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MockTestResult, submitMockAttemptResponseService, submitMockAttemptService } from '../../libs/services/mock-library';
import { stripHtml } from '../../libs/utils/html';
import { questionTypeLabel } from '@/src/libs/utils/questionType';
import {
  EXAM_BACKGROUND_GRACE_MS,
  clearActiveAttempt,
  saveActiveAttempt,
} from '../../libs/utils/examSession';
import QuestionPalette, { PaletteStatus } from '../common/QuestionPalette';
import FlagQuestionModal from '../common/FlagQuestionModal';
import ConfirmModal from '../common/ConfirmModal';

interface Props {
  mockId: number | string;
  attemptId: number | string;
  durationMinutes: number;
  exam: any;
  initialAnswers?: Record<string, string[]>;
  initialStatuses?: Record<string, QuestionStatus>;
  // Absolute epoch-ms deadline from the attempt's server clock (started_at +
  // duration), when the questions endpoint provides it. Anchoring to it is what
  // makes RESUME continue from the real remaining time instead of restarting the
  // full duration. Null/omitted → self-paced fallback of full duration from now.
  serverDeadlineMs?: number | null;
  onSubmit: (
    answers: Record<string, string[]>,
    timeTaken: number,
    result?: MockTestResult | null,
  ) => void;
  onBackToMocks?: () => void;
}

type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked';

const isMultiSelect = (type: string | undefined) => {
  if (!type) return false;
  const t = type.toUpperCase();
  return t === 'MCQ_MULTIPLE' || t === 'MULTI_CORRECT' || t.includes('MULTI');
};

const isNumericalType = (type: string | undefined) =>
  !!type && type.toUpperCase().includes('NUMERIC');

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function MockExamScreen({
  mockId,
  attemptId,
  durationMinutes,
  exam,
  initialAnswers,
  initialStatuses,
  serverDeadlineMs,
  onSubmit,
  onBackToMocks,
}: Props) {
  const insets = useSafeAreaInsets();
  const totalSeconds = (exam?.duration_minutes ?? durationMinutes) * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [timeTaken, setTimeTaken] = useState(0);
  // Absolute epoch-ms the attempt ends. The countdown is derived from this on
  // every tick / resume, so a suspended JS timer (app-switch, screen-lock)
  // can't desync it from real elapsed time.
  const [deadline, setDeadline] = useState<number | null>(null);
  // Timestamp the app was backgrounded at, used to measure the grace window.
  const backgroundedAtRef = useRef<number | null>(null);
  // Pending submit fired while the app stays in the background past the grace
  // window (best-effort — JS may be suspended; the on-return check is fallback).
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQIdx, setActiveQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>(initialAnswers ?? {});
  const [qStatuses, setQStatuses] = useState<Record<string, QuestionStatus>>(initialStatuses ?? {});
  const [showPalette, setShowPalette] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showSubmitSheet, setShowSubmitSheet] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pendingSaves = useRef<Set<Promise<any>>>(new Set());

  const [isInputFocused, setIsInputFocused] = useState(false);


  // `timeTaken` value when the on-screen question became active, so each saved
  // response carries the seconds spent on that question (see commitCurrentAnswer).
  const qEnterRef = useRef<number>(0);

  // Always call the latest handleFinalSubmit from inside long-lived effects
  // (timer / AppState) without re-subscribing them on every render.
  const finalSubmitRef = useRef<() => void>(() => {});

  // Establish the wall-clock deadline once the exam is ready, and register the
  // attempt so a killed app can be auto-submitted on next launch.
  useEffect(() => {
    if (!exam?.sections?.length || deadline != null) return;
    // Prefer the server clock when present (resume-safe); otherwise count the
    // full duration from now for a fresh, self-paced attempt.
    const usingServerClock =
      serverDeadlineMs != null && Number.isFinite(serverDeadlineMs);
    const dl = usingServerClock
      ? (serverDeadlineMs as number)
      : Date.now() + totalSeconds * 1000;
    setDeadline(dl);
    saveActiveAttempt({ kind: 'mock', attemptId, deadline: dl });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam]);

  // Wall-clock countdown: recompute time left from the deadline each tick (and
  // immediately on mount/resume) so suspended JS timers can't drift the clock.
  useEffect(() => {
    if (deadline == null) return;
    const sync = () => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setTimeLeft(left);
      setTimeTaken(totalSeconds - left);
      if (left <= 0) finalSubmitRef.current();
      return left;
    };
    sync();
    const interval = setInterval(() => {
      if (sync() <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  // Leaving the app (app-switch / screen-lock / kill all look the same to JS):
  // start a grace clock on background; on return, recompute the timer and, if
  // the app stayed away past the grace window, auto-submit the attempt.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev === 'active' && (next === 'background' || next === 'inactive')) {
        backgroundedAtRef.current = Date.now();
        // Submit once the grace window elapses even while still away.
        if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
        graceTimerRef.current = setTimeout(
          () => finalSubmitRef.current(),
          EXAM_BACKGROUND_GRACE_MS,
        );
      } else if (next === 'active') {
        if (graceTimerRef.current) {
          clearTimeout(graceTimerRef.current);
          graceTimerRef.current = null;
        }
        // Fallback: if JS was suspended and the timer never fired, submit now.
        if (backgroundedAtRef.current != null) {
          const away = Date.now() - backgroundedAtRef.current;
          backgroundedAtRef.current = null;
          if (away >= EXAM_BACKGROUND_GRACE_MS) finalSubmitRef.current();
        }
      }
    });
    return () => {
      sub.remove();
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
    };
  }, []);

  // Android hardware back: an in-progress attempt can't simply be abandoned —
  // close any open sheet first, otherwise surface the submit confirmation.
  useEffect(() => {
    const onBackPress = () => {
      if (submitting) return true;
      if (showPalette) { setShowPalette(false); return true; }
      if (showSubmitSheet) { setShowSubmitSheet(false); return true; }
      setShowSubmitSheet(true);
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [showPalette, showSubmitSheet, submitting]);

  if (!exam?.sections?.length) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: '#9CA3AF' }}>No questions found for this mock test.</Text>
        {onBackToMocks && (
          <TouchableOpacity onPress={onBackToMocks} style={{ marginTop: 16 }}>
            <Text style={{ color: '#6C63FF', fontWeight: '600' }}>← Go Back</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  const activeSection = exam.sections[activeSectionIdx];
  const activeQuestion = activeSection?.questions?.[activeQIdx];
  const currentQId = activeQuestion?.id;
  const selectedOptions = answers[currentQId] || [];
  const currentStatus = qStatuses[currentQId];
  const isMarked = currentStatus === 'marked';
  const isLast =
    activeSectionIdx === exam.sections.length - 1 &&
    activeQIdx === activeSection.questions.length - 1;
  const isFirst = activeSectionIdx === 0 && activeQIdx === 0;
  const isTimeLow = timeLeft < 300;

  // Flat list of all questions for the palette
  const allQuestions = exam.sections.flatMap((s: any, si: number) =>
    (s?.questions ?? []).map((q: any, qi: number) => ({ q, si, qi }))
  );
  const totalQ = allQuestions.length;
  const answeredCount = Object.keys(answers).filter((id) => answers[id]?.length > 0).length;
  const markedCount = Object.values(qStatuses).filter((s) => s === 'marked').length;

  const saveAnswerToServer = (
    qId: number | string,
    selectedOpts: string[],
    markedForReview = false,
    timeSpent = 0,
    isNumeric = false,
  ) => {
    // NUMERICAL questions submit the typed value via numeric_answer; choice-based
    // questions submit the selected option ids. Sending a typed number as a choice
    // id makes the server reject it ("selected choices do not belong to this question").
    const payload = isNumeric
      ? {
          numeric_answer:
            selectedOpts[0] && selectedOpts[0].trim() !== '' ? selectedOpts[0].trim() : null,
          selected_choice_ids: [],
          is_marked_for_review: markedForReview,
          time_spent_seconds: timeSpent,
        }
      : {
          selected_choice_ids: selectedOpts
            .map((v) => Number(v))
            .filter((n) => Number.isFinite(n)),
          numeric_answer: null,
          is_marked_for_review: markedForReview,
          time_spent_seconds: timeSpent,
        };
    const promise = submitMockAttemptResponseService(attemptId, qId, payload).catch((e) =>
      console.log('SAVE ERROR:', e),
    );
    pendingSaves.current.add(promise);
    promise.finally(() => pendingSaves.current.delete(promise));
    return promise;
  };

  // Persist the question currently on screen, stamping the seconds spent on it
  // since it became active, then reset the per-question timer for the next one.
  // PUT /v1/mock-tests/{mockId}/responses/{questionId}/
  const commitCurrentAnswer = (markedForReview = isMarked) => {
    if (!currentQId) return;
    const spent = Math.max(0, timeTaken - qEnterRef.current);
    qEnterRef.current = timeTaken;
    const isNumeric =
      isNumericalType(activeQuestion?.type) || (activeQuestion?.options?.length ?? 0) === 0;
    saveAnswerToServer(currentQId, selectedOptions, markedForReview, spent, isNumeric);
  };

  const handleOptionSelect = (optionId: string) => {
    if (!currentQId) return;
    const isMulti = isMultiSelect(activeQuestion?.type);
    const current = answers[currentQId] || [];
    const newSel = isMulti
      ? current.includes(optionId)
        ? current.filter((o) => o !== optionId)
        : [...current, optionId]
      : [optionId];
    setAnswers((prev) => ({ ...prev, [currentQId]: newSel }));
    setQStatuses((prev) => ({
      ...prev,
      [currentQId]:
        prev[currentQId] === 'marked' ? 'marked' : newSel.length > 0 ? 'answered' : 'not_answered',
    }));
    // Answer is persisted to the server on navigation (Next/Prev/jump) and on
    // submit — see commitCurrentAnswer — not on every tap.
  };

  const handleMarkForReview = () => {
    if (!currentQId) return;
    const next = isMarked ? (selectedOptions.length > 0 ? 'answered' : 'not_answered') : 'marked';
    setQStatuses((prev) => ({ ...prev, [currentQId]: next }));
    commitCurrentAnswer(!isMarked);
  };

  const handleNext = () => {
    // Save the current question's answer before moving on.
    commitCurrentAnswer();
    if (currentQId) {
      setQStatuses((prev) => ({
        ...prev,
        [currentQId]:
          prev[currentQId] && prev[currentQId] !== 'not_visited'
            ? prev[currentQId]
            : selectedOptions.length > 0
            ? 'answered'
            : 'not_answered',
      }));
    }
    if (activeQIdx < activeSection.questions.length - 1) {
      const nextId = activeSection.questions[activeQIdx + 1].id;
      setActiveQIdx(activeQIdx + 1);
      setQStatuses((prev) => ({ ...prev, [nextId]: prev[nextId] || 'not_answered' }));
    } else if (activeSectionIdx < exam.sections.length - 1) {
      const nextSection = exam.sections[activeSectionIdx + 1];
      const nextId = nextSection.questions[0].id;
      setActiveSectionIdx(activeSectionIdx + 1);
      setActiveQIdx(0);
      setQStatuses((prev) => ({ ...prev, [nextId]: prev[nextId] || 'not_answered' }));
    }
  };

  const handlePrev = () => {
    commitCurrentAnswer();
    if (activeQIdx > 0) {
      setActiveQIdx(activeQIdx - 1);
    } else if (activeSectionIdx > 0) {
      const prevSection = exam.sections[activeSectionIdx - 1];
      setActiveSectionIdx(activeSectionIdx - 1);
      setActiveQIdx(prevSection.questions.length - 1);
    }
  };

  const jumpToQuestion = (si: number, qi: number) => {
    commitCurrentAnswer();
    setActiveSectionIdx(si);
    setActiveQIdx(qi);
    setShowPalette(false);
  };

  // Flush the on-screen answer + any in-flight saves, then submit the attempt.
  const flushAndSubmit = async () => {
    // Persist the question on screen (e.g. the last one, which has no Next).
    commitCurrentAnswer();
    if (pendingSaves.current.size > 0) {
      await Promise.all(Array.from(pendingSaves.current));
    }
    return submitMockAttemptService(attemptId);
  };

  const handleFinalSubmit = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      setShowSubmitSheet(false);
      setShowPalette(false);
      const submitRes = await flushAndSubmit();
      await clearActiveAttempt();
      const result = (submitRes as any)?.data ?? (submitRes as any) ?? null;
      onSubmit(answers, timeTaken, result);
      console.log('ressss', answers, timeTaken, result);

    } catch (err) {
      console.log('SUBMIT ERROR:', err);
      Alert.alert('Error', 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };
  // Keep the ref pointed at the freshest closure for the timer / AppState hooks.
  finalSubmitRef.current = handleFinalSubmit;

  // X (close) in the header: confirm, submit the attempt, then leave to the
  // mock list. Submitting here means the mock can't be restarted from scratch.
  const handleExit = () => {
    if (submitting) return;
    setShowExitConfirm(true);
  };

  const confirmExit = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      setShowSubmitSheet(false);
      setShowPalette(false);
      await flushAndSubmit();
      await clearActiveAttempt();
      setShowExitConfirm(false);
      onBackToMocks?.();
    } catch (err) {
      console.log('SUBMIT ERROR:', err);
      setShowExitConfirm(false);
      Alert.alert('Error', 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  // Current flat index
  let currentFlatIdx = 0;
  for (let si = 0; si < activeSectionIdx; si++) {
    currentFlatIdx += exam.sections[si].questions.length;
  }
  currentFlatIdx += activeQIdx;

  // Progress bar segments
  const progressSegs = allQuestions.map(({ q, si, qi }: any) => {
    const qid = q?.id;
    const isCurrent = si === activeSectionIdx && qi === activeQIdx;
    const status = qStatuses[qid];
    if (isCurrent) return '#6C63FF';
    if (status === 'answered') return '#6C63FF';
    if (status === 'marked') return '#F59E0B';
    return '#E5E7EB';
  });

  // Build the flat list the shared question palette renders.
  const paletteItems = allQuestions.map(({ q, si, qi }: any) => {
    const qid = q?.id;
    const status = qStatuses[qid];
    const hasAnswer = (answers[qid] || []).length > 0;
    const pStatus: PaletteStatus =
      status === 'marked' ? 'marked' : hasAnswer ? 'answered' : 'not_answered';
    return {
      key: String(qid ?? `${si}-${qi}`),
      status: pStatus,
      isCurrent: si === activeSectionIdx && qi === activeQIdx,
    };
  });

  const handlePaletteJump = (idx: number) => {
    const target = allQuestions[idx];
    if (target) jumpToQuestion(target.si, target.qi);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleExit} activeOpacity={0.7}>
          <Ionicons name="close" size={18} color="#555" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {exam?.name ?? mockId}
          </Text>
          <Text style={styles.headerSub}>Mock · Sample</Text>
          {/* Progress bar */}
          <View style={styles.progressBar}>
            {progressSegs.map((color: string, i: number) => (
              <View
                key={i}
                style={[styles.progressSeg, { backgroundColor: color }]}
              />
            ))}
          </View>
        </View>
        <View style={[styles.timerChip, isTimeLow && styles.timerChipRed]}>
          <Ionicons name="time-outline" size={12} color={isTimeLow ? '#EF4444' : '#555'} />
          <Text style={[styles.timerText, isTimeLow && { color: '#EF4444' }]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setShowPalette(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="menu-outline" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Question body */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Q label + Mark */}
        <View style={[styles.qMetaRow, { alignItems: 'flex-start' }]}>
          <View>
            <Text style={styles.qLabel}>QUESTION {currentFlatIdx + 1} / {totalQ}</Text>
            <View style={{ alignSelf: 'flex-start', marginTop: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#EEF0F4' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#6C63FF' }}>
                {questionTypeLabel(activeQuestion?.type)}
              </Text>
            </View>
          </View>

          <View style={styles.rightActionsRow}>
            <View style={styles.marksRow}>
              <View style={[styles.marksChip, styles.marksChipPositive]}>
                <Text style={[styles.marksChipText, styles.marksChipTextPositive]}>
                  +{activeQuestion?.marks_correct}
                </Text>
              </View>
              {(() => {
                const marksWrong = Number(activeQuestion?.marks_incorrect);
                const isNegative = marksWrong < 0;
                return (
                  <View style={[styles.marksChip, isNegative ? styles.marksChipNegative : styles.marksChipWarning]}>
                    <Text style={[styles.marksChipText, isNegative ? styles.marksChipTextNegative : styles.marksChipTextWarning]}>
                      {activeQuestion?.marks_incorrect}
                    </Text>
                  </View>
                );
              })()}
            </View>

            <TouchableOpacity style={styles.flagBtn} onPress={() => setShowFlagModal(true)} activeOpacity={0.75}>
              <Ionicons name="flag-outline" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.markBtn, isMarked && styles.markBtnActive]}
              onPress={handleMarkForReview}
              activeOpacity={0.75}
            >
              <Ionicons name={isMarked ? 'bookmark' : 'bookmark-outline'} size={14} color={isMarked ? '#F59E0B' : '#9CA3AF'} />
              <Text style={[styles.markText, isMarked && styles.markTextActive]}>
                {isMarked ? 'Marked' : 'Mark'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Question text */}
        <Text style={styles.questionText}>{stripHtml(activeQuestion?.text ?? '')}</Text>

        {/* Question image */}
        {activeQuestion?.image ? (
          <Image
            source={{ uri: activeQuestion.image }}
            style={styles.questionImage}
            resizeMode="contain"
          />
        ) : null}

        {/* Options */}
        {(activeQuestion?.options?.length ?? 0) > 0 ? (
        <View style={styles.optionsList}>
          {isMultiSelect(activeQuestion?.type) && (
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6C63FF', marginBottom: 2 }}>
              Select all that apply
            </Text>
          )}
          {(activeQuestion?.options ?? []).map((opt: any, idx: number) => {
            const isSelected = selectedOptions.includes(String(opt.id));
            const multi = isMultiSelect(activeQuestion?.type);
            const optLabel = stripHtml(opt.text);
            return (
              <TouchableOpacity
                key={String(opt.id)}
                style={[styles.optRow, isSelected && styles.optRowSelected]}
                onPress={() => handleOptionSelect(String(opt.id))}
                activeOpacity={0.7}
              >
                <View style={[styles.optLetter, multi && { borderRadius: 8 }, isSelected && styles.optLetterSelected]}>
                  <Text style={[styles.optLetterText, isSelected && styles.optLetterTextSelected]}>
                    {multi && isSelected ? '✓' : String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <View style={styles.optBody}>
                  {optLabel ? (
                    <Text style={[styles.optText, isSelected && styles.optTextSelected]}>
                      {optLabel}
                    </Text>
                  ) : null}
                  {opt.image ? (
                    <Image source={{ uri: opt.image }} style={styles.optImage} resizeMode="contain" />
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        ) : (
          <View style={styles.fillBlankWrap}>
            <Text style={styles.fillBlankLabel}>Enter your answer (numeric value):</Text>
            <View style={[styles.fillBlankBox, isInputFocused && styles.fillBlankBoxFocused]}>
              <TextInput
                style={styles.fillBlankInput}
                placeholder="e.g. 3.14"
                placeholderTextColor="#C7CAD1"
                keyboardType="decimal-pad"
                value={selectedOptions[0] ?? ''}
                onChangeText={(text) => {
                  // allow only digits, one leading minus, one dot, max 2 decimals
                  const cleaned = text.replace(/[^0-9.-]/g, '');
                  const parts = cleaned.split('.');
                  const safe =
                    parts.length > 2
                      ? parts[0] + '.' + parts[1].slice(0, 2)
                      : parts.length === 2
                      ? parts[0] + '.' + parts[1].slice(0, 2)
                      : cleaned;
                  handleOptionSelect(safe);
                }}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
            </View>
            <Text style={styles.fillBlankHint}>Decimal values are accepted (up to 2 decimal places).</Text>
          </View>
        )}

        <Text style={styles.swipeHint}>— Swipe to move between questions —</Text>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.prevBtn, isFirst && styles.prevBtnDisabled]}
            onPress={handlePrev}
            disabled={isFirst}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={16} color={isFirst ? '#C7CBD3' : '#555'} />
            <Text style={[styles.prevBtnText, isFirst && { color: '#C7CBD3' }]}>Prev</Text>
          </TouchableOpacity>
          {isLast ? (
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => setShowSubmitSheet(true)}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Submit</Text>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Question Palette ── */}
      <QuestionPalette
        visible={showPalette}
        onClose={() => setShowPalette(false)}
        items={paletteItems}
        answeredCount={answeredCount}
        totalCount={totalQ}
        onJump={handlePaletteJump}
        onSubmit={() => {
          setShowPalette(false);
          setTimeout(() => setShowSubmitSheet(true), 300);
        }}
        insetsBottom={insets.bottom}
      />

      {/* ── Submit Confirmation Sheet ── */}
      <Modal visible={showSubmitSheet} transparent animationType="slide">
        <TouchableOpacity
          style={styles.submitOverlay}
          activeOpacity={1}
          onPress={() => setShowSubmitSheet(false)}
        >
          <View style={[styles.submitSheet, { paddingBottom: 24 + insets.bottom }]}>
            <View style={styles.paletteHandle} />
            <Text style={styles.submitSheetTitle}>Submit attempt?</Text>
            <Text style={styles.submitSheetDesc}>
              You&apos;ve answered{' '}
              <Text style={{ fontWeight: '700' }}>{answeredCount} of {totalQ}</Text>.
              {markedCount > 0 ? ` ${markedCount} marked for review.` : ''}
              {'\n'}You can&apos;t change answers after submitting.
            </Text>
            <View style={styles.submitSheetBtns}>
              <TouchableOpacity
                style={styles.keepGoingBtn}
                onPress={() => setShowSubmitSheet(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.keepGoingText}>Keep going</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitNowBtn}
                onPress={handleFinalSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitNowText}>Submit now</Text>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Exit (submit & leave) confirmation ── */}
      <ConfirmModal
        visible={showExitConfirm}
        title="Exit test?"
        message="Your test will be submitted and you won't be able to change your answers."
        cancelLabel="Cancel"
        confirmLabel="Submit & Exit"
        confirmIcon="exit-outline"
        destructive
        loading={submitting}
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={confirmExit}
      />
      <FlagQuestionModal
        visible={showFlagModal}
        onClose={() => setShowFlagModal(false)}
        questionId={currentQId}
        questionNumber={currentFlatIdx + 1}
        choices={
          (activeQuestion?.options?.length ?? 0) === 0
            ? []
            : (activeQuestion?.options ?? []).map((o: any, idx: number) => ({
                id: String(o.id),
                label: String.fromCharCode(65 + idx),
                text: stripHtml(o.text),
              }))
        }
      />
    </SafeAreaView>
  );
}
