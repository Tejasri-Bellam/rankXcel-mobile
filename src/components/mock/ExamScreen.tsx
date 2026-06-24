import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { submitMockAttemptService, submitMockAttemptResponseService, MockTestResult } from '../../libs/services/mock-library';
import { stripHtml } from '../../libs/utils/html';
import QuestionPalette, { PaletteStatus } from '../common/QuestionPalette';
import { examScreenStyles as styles } from '@/src/styles/styles/mock/examscreenstyles';

interface Props {
  mockId: number | string;
  attemptId: number | string;
  durationMinutes: number;
  exam: any;
  initialAnswers?: Record<string, string[]>;
  initialStatuses?: Record<string, QuestionStatus>;
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
  onSubmit,
  onBackToMocks,
}: Props) {
  const insets = useSafeAreaInsets();
  const [timeLeft, setTimeLeft] = useState((exam?.duration_minutes ?? durationMinutes) * 60);
  const [timeTaken, setTimeTaken] = useState(0);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQIdx, setActiveQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>(initialAnswers ?? {});
  const [qStatuses, setQStatuses] = useState<Record<string, QuestionStatus>>(initialStatuses ?? {});
  const [showPalette, setShowPalette] = useState(false);
  const [showSubmitSheet, setShowSubmitSheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pendingSaves = useRef<Set<Promise<any>>>(new Set());
  // `timeTaken` value when the on-screen question became active, so each saved
  // response carries the seconds spent on that question (see commitCurrentAnswer).
  const qEnterRef = useRef<number>(0);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(interval); handleFinalSubmit(); return 0; }
        return prev - 1;
      });
      setTimeTaken((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!exam?.sections?.length) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: '#9CA3AF' }}>No questions found for this mock test.</Text>
        {onBackToMocks && (
          <TouchableOpacity onPress={onBackToMocks} style={{ marginTop: 16 }}>
            <Text style={{ color: '#3B7DF8', fontWeight: '600' }}>← Go Back</Text>
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
  ) => {
    const ids = selectedOpts.map((v) => Number(v)).filter((n) => Number.isFinite(n));
    const promise = submitMockAttemptResponseService(attemptId, qId, {
      selected_choice_ids: ids,
      numeric_answer: null,
      is_marked_for_review: markedForReview,
      time_spent_seconds: timeSpent,
    }).catch((e) => console.log('SAVE ERROR:', e));
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
    saveAnswerToServer(currentQId, selectedOptions, markedForReview, spent);
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
      const result = (submitRes as any)?.data ?? (submitRes as any) ?? null;
      onSubmit(answers, timeTaken, result);
    } catch (err) {
      console.log('SUBMIT ERROR:', err);
      Alert.alert('Error', 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  // X (close) in the header: confirm, submit the attempt, then leave to the
  // mock list. Submitting here means the mock can't be restarted from scratch.
  const handleExit = () => {
    if (submitting) return;
    Alert.alert(
      'Exit test?',
      "Your test will be submitted and you won't be able to change your answers.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit & Exit',
          style: 'destructive',
          onPress: async () => {
            if (submitting) return;
            try {
              setSubmitting(true);
              setShowSubmitSheet(false);
              setShowPalette(false);
              await flushAndSubmit();
              onBackToMocks?.();
            } catch (err) {
              console.log('SUBMIT ERROR:', err);
              Alert.alert('Error', 'Submission failed. Please try again.');
              setSubmitting(false);
            }
          },
        },
      ],
    );
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
    if (isCurrent) return '#3B7DF8';
    if (status === 'answered') return '#3B7DF8';
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
        <View style={styles.qMetaRow}>
          <Text style={styles.qLabel}>
            QUESTION {currentFlatIdx + 1} / {totalQ}
          </Text>
          <TouchableOpacity
            style={[styles.markBtn, isMarked && styles.markBtnActive]}
            onPress={handleMarkForReview}
            activeOpacity={0.75}
          >
            <Ionicons
              name={isMarked ? 'bookmark' : 'bookmark-outline'}
              size={14}
              color={isMarked ? '#F59E0B' : '#9CA3AF'}
            />
            <Text style={[styles.markText, isMarked && styles.markTextActive]}>
              {isMarked ? 'Marked' : 'Mark'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Question text */}
        <Text style={styles.questionText}>{stripHtml(activeQuestion?.text ?? '')}</Text>

        {/* Options */}
        <View style={styles.optionsList}>
          {(activeQuestion?.options ?? []).map((opt: any, idx: number) => {
            const isSelected = selectedOptions.includes(String(opt.id));
            return (
              <TouchableOpacity
                key={String(opt.id)}
                style={[styles.optRow, isSelected && styles.optRowSelected]}
                onPress={() => handleOptionSelect(String(opt.id))}
                activeOpacity={0.7}
              >
                <View style={[styles.optLetter, isSelected && styles.optLetterSelected]}>
                  <Text style={[styles.optLetterText, isSelected && styles.optLetterTextSelected]}>
                    {String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text style={[styles.optText, isSelected && styles.optTextSelected]}>
                  {stripHtml(opt.text)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

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
    </SafeAreaView>
  );
}
