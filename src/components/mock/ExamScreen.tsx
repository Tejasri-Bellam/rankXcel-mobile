import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { submitMockTestService, submitMockResponseService } from '../../libs/services/mock-library';
import { stripHtml } from '../../libs/utils/html';
import QuestionPalette, { PaletteStatus } from '../common/QuestionPalette';

interface Props {
  mockId: number | string;
  durationMinutes: number;
  exam: any;
  initialAnswers?: Record<string, string[]>;
  initialStatuses?: Record<string, QuestionStatus>;
  onSubmit: (answers: Record<string, string[]>, timeTaken: number) => void;
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
    const promise = submitMockResponseService(mockId, qId, {
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

  const handleFinalSubmit = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      setShowSubmitSheet(false);
      setShowPalette(false);
      // Persist the question on screen (e.g. the last one, which has no Next).
      commitCurrentAnswer();
      if (pendingSaves.current.size > 0) {
        await Promise.all(Array.from(pendingSaves.current));
      }
      await submitMockTestService(mockId);
      onSubmit(answers, timeTaken);
    } catch (err) {
      console.log('SUBMIT ERROR:', err);
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
        <TouchableOpacity style={styles.closeBtn} onPress={onBackToMocks} activeOpacity={0.7}>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F1117' },
  scroll: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 24 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1117',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E2130',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 11, color: '#9CA3AF' },
  progressBar: { flexDirection: 'row', gap: 2, marginTop: 5, height: 2 },
  progressSeg: { flex: 1, height: 2, borderRadius: 1 },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E2130',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerChipRed: { backgroundColor: '#2D0A0A' },
  timerText: { fontSize: 12, fontWeight: '700', color: '#E5E7EB', fontVariant: ['tabular-nums'] as any },
  menuBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#1E2130',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Q meta
  qMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  qLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1 },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  markBtnActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  markText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  markTextActive: { color: '#B45309' },

  // Question
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    lineHeight: 26,
    marginBottom: 24,
  },

  // Options
  optionsList: { gap: 10 },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  optRowSelected: {
    borderColor: '#3B7DF8',
    backgroundColor: '#F0F6FF',
  },
  optLetter: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optLetterSelected: {
    backgroundColor: '#3B7DF8',
    borderColor: '#3B7DF8',
  },
  optLetterText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  optLetterTextSelected: { color: '#fff' },
  optText: { flex: 1, fontSize: 15, color: '#1A1A2E', fontWeight: '500' },
  optTextSelected: { color: '#3B7DF8', fontWeight: '600' },

  swipeHint: { textAlign: 'center', fontSize: 12, color: '#D1D5DB', marginTop: 20 },

  // Bottom bar
  bottomBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B7DF8',
    borderRadius: 16,
    paddingVertical: 16,
  },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  navRow: { flexDirection: 'row', gap: 10 },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  prevBtnText: { fontSize: 14, fontWeight: '700', color: '#555' },
  prevBtnDisabled: { borderColor: '#F0F1F4', backgroundColor: '#fff' },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 15,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Palette
  paletteOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  paletteSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  paletteHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  paletteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  paletteTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  paletteCell: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  paletteCellCurrent: {
    borderColor: '#1A1A2E',
    borderWidth: 2,
  },
  paletteCellText: { fontSize: 14, fontWeight: '700' },
  paletteMark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  paletteLegend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  legendText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  paletteSubmitBtn: {
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  paletteSubmitText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Submit sheet
  submitOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  submitSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  submitSheetTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginBottom: 10 },
  submitSheetDesc: { fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 24 },
  submitSheetBtns: { flexDirection: 'row', gap: 12 },
  keepGoingBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  keepGoingText: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  submitNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    paddingVertical: 15,
  },
  submitNowText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});