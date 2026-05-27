import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  AppState,
  AppStateStatus,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockExamScreenStyles as styles } from '../../styles/sidebar/mockExams/examScreen';
import {
  submitMockTestService,
  submitMockResponseService,
} from '../../libs/services/mock-library';
import { stripHtml } from '../../libs/utils/html';

interface Props {
  mockId: number | string;
  durationMinutes: number;
  exam: any;
  initialAnswers?: Record<string, string[]>;
  initialStatuses?: Record<string, 'not_visited' | 'not_answered' | 'answered' | 'marked'>;
  onSubmit: (answers: Record<string, string[]>, timeTakenSeconds: number) => void;
  onBackToMocks?: () => void;
}

type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked';

const isMultiSelectType = (type: string | undefined) => {
  if (!type) return false;
  const t = type.toUpperCase();
  return (
    t === 'MCQ_MULTIPLE' ||
    t === 'MULTI_CORRECT' ||
    t === 'MULTI CORRECT' ||
    t === 'MULTIPLE' ||
    t.includes('MULTI')
  );
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
  const [timeLeft, setTimeLeft]   = useState((exam?.duration_minutes ?? durationMinutes) * 60);
  const [timeTaken, setTimeTaken] = useState(0);

  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQIdx, setActiveQIdx]             = useState(0);

  const [answers, setAnswers]     = useState<Record<string, string[]>>(initialAnswers ?? {});
  const [qStatuses, setQStatuses] = useState<Record<string, QuestionStatus>>(initialStatuses ?? {});

  const [tabSwitchCount, setTabSwitchCount]   = useState(0);
  const [showTabWarning, setShowTabWarning]   = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const tabWarningTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting]           = useState(false);

  const pendingSaves = useRef<Set<Promise<any>>>(new Set());

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
      setTimeTaken((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // AppState tab-switch detection
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (
        appStateRef.current === 'active' &&
        (next === 'background' || next === 'inactive')
      ) {
        setTabSwitchCount((prev) => {
          const n = prev + 1;
          setShowTabWarning(true);
          if (tabWarningTimeout.current) clearTimeout(tabWarningTimeout.current);
          tabWarningTimeout.current = setTimeout(() => setShowTabWarning(false), 4000);
          return n;
        });
      }
      appStateRef.current = next;
    });
    return () => {
      sub.remove();
      if (tabWarningTimeout.current) clearTimeout(tabWarningTimeout.current);
    };
  }, []);

  if (!exam?.sections?.length) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: '#9898B0' }}>No questions found for this mock test.</Text>
        {onBackToMocks && (
          <TouchableOpacity onPress={onBackToMocks} style={{ marginTop: 16 }}>
            <Text style={{ color: '#6C5CE7', fontWeight: '600' }}>← Go Back</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  const activeSection  = exam.sections[activeSectionIdx];
  const activeQuestion = activeSection?.questions?.[activeQIdx];
  const currentQId     = activeQuestion?.id;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isTimeLow = timeLeft < 300; // < 5 min

  // Handlers
  const saveAnswerToServer = (
    qId: number | string,
    selectedOptions: string[],
    markedForReview = false,
  ) => {
    const numericChoiceIds = selectedOptions
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n));

    const promise = submitMockResponseService(mockId, qId, {
      selected_choice_ids: numericChoiceIds,
      is_marked_for_review: markedForReview,
      time_spent_seconds: 0,
    })
      .then((r) => {
        console.log('MOCK SAVE OK for question', qId, 'status:', (r as any)?.status);
        return r;
      })
      .catch((e) => {
        console.log('MOCK SAVE ANSWER ERROR for question', qId, ':', e);
      });

    pendingSaves.current.add(promise);
    promise.finally(() => pendingSaves.current.delete(promise));
    return promise;
  };

  const handleOptionSelect = (optionId: string) => {
    if (!currentQId) return;
    const isMulti = isMultiSelectType(activeQuestion?.type);
    const current = answers[currentQId] || [];
    const newSelection = isMulti
      ? current.includes(optionId)
        ? current.filter((o) => o !== optionId)
        : [...current, optionId]
      : [optionId];

    setAnswers((prev) => ({ ...prev, [currentQId]: newSelection }));
    const wasMarked = qStatuses[currentQId] === 'marked';
    setQStatuses((prev) => ({
      ...prev,
      [currentQId]: wasMarked
        ? 'marked'
        : newSelection.length > 0
          ? 'answered'
          : 'not_answered',
    }));

    saveAnswerToServer(currentQId, newSelection, wasMarked);
  };

  const handleMarkForReview = () => {
    if (!currentQId) return;
    setQStatuses((prev) => ({ ...prev, [currentQId]: 'marked' }));
    saveAnswerToServer(currentQId, answers[currentQId] ?? [], true);
  };

  const handleSaveAndNext = () => {
    if (currentQId) {
      const hasAnswer = (answers[currentQId] || []).length > 0;
      if (!qStatuses[currentQId]) {
        setQStatuses((prev) => ({
          ...prev,
          [currentQId]: hasAnswer ? 'answered' : 'not_answered',
        }));
      }
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
    if (activeQIdx > 0) {
      setActiveQIdx(activeQIdx - 1);
    } else if (activeSectionIdx > 0) {
      const prevSection = exam.sections[activeSectionIdx - 1];
      setActiveSectionIdx(activeSectionIdx - 1);
      setActiveQIdx(prevSection.questions.length - 1);
    }
  };

  const handleNext = () => {
    if (activeQIdx < activeSection.questions.length - 1) {
      setActiveQIdx(activeQIdx + 1);
    } else if (activeSectionIdx < exam.sections.length - 1) {
      setActiveSectionIdx(activeSectionIdx + 1);
      setActiveQIdx(0);
    }
  };

  const getSubmitSummary = () => {
    const allQs = exam.sections.flatMap((s: any) => s?.questions ?? []).filter(Boolean);
    let answered = 0, notAnswered = 0, markedForReview = 0, notVisited = 0;
    allQs.forEach((q: any) => {
      if (q?.id == null) return;
      const status = qStatuses[q.id];
      const hasAnswer = (answers[q.id] || []).length > 0;
      if (!status) notVisited++;
      else if (status === 'answered' && hasAnswer) answered++;
      else if (status === 'marked') markedForReview++;
      else notAnswered++;
    });
    return { answered, notAnswered, markedForReview, notVisited };
  };

  const getSectionSummary = () =>
    exam.sections.map((section: any) => {
      const questions = (section?.questions ?? []).filter(Boolean);
      let ans = 0, notAns = 0;
      questions.forEach((q: any) => {
        if (q?.id == null) return;
        if ((answers[q.id] || []).length > 0) ans++;
        else notAns++;
      });
      return { name: section?.name ?? '', total: questions.length, answered: ans, notAnswered: notAns };
    });

  const handleFinalSubmit = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      setShowSubmitModal(false);

      if (pendingSaves.current.size > 0) {
        console.log('Waiting for', pendingSaves.current.size, 'mock saves...');
        await Promise.all(Array.from(pendingSaves.current));
      }

      const res = await submitMockTestService(mockId);
      console.log('MOCK SUBMIT RESPONSE:', JSON.stringify(res, null, 2));
      onSubmit(answers, timeTaken);
    } catch (err) {
      console.log('MOCK SUBMIT ERROR:', err);
      Alert.alert('Error', 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  const summary        = getSubmitSummary();
  const sectionSummary = getSectionSummary();
  const selectedOptions = answers[currentQId] || [];
  const sectionAnswered = exam.sections.map((s: any) =>
    (s?.questions ?? []).filter((q: any) => q?.id != null && (answers[q.id] || []).length > 0).length
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Text style={styles.examLabel}>Mock Test</Text>
          <Text style={styles.examName} numberOfLines={1}>
            {exam?.name ?? 'Mock Test'}
          </Text>
        </View>
        <View style={[styles.timerBox, isTimeLow && styles.timerBoxRed]}>
          <Text style={styles.timerLabel}>TIME LEFT</Text>
          <Text style={[styles.timerValue, isTimeLow && { color: '#FCA5A5' }]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.submitTopBtn}
          onPress={() => setShowSubmitModal(true)}
        >
          <Text style={styles.submitTopBtnText}>⚑ Submit</Text>
        </TouchableOpacity>
      </View>

      {/* Tab switch warning */}
      {showTabWarning && (
        <View style={styles.tabWarningBanner}>
          <Text style={styles.tabWarningIcon}>⚠</Text>
          <Text style={styles.tabWarningText}>
            Tab switch detected ({tabSwitchCount} time{tabSwitchCount > 1 ? 's' : ''}). This is being recorded.
          </Text>
        </View>
      )}

      {/* Section tabs */}
      <View style={styles.sectionTabsRow}>
        {exam.sections.map((section: any, idx: number) => (
          <TouchableOpacity
            key={section.id ?? idx}
            style={[styles.sectionTab, activeSectionIdx === idx && styles.sectionTabActive]}
            onPress={() => { setActiveSectionIdx(idx); setActiveQIdx(0); }}
          >
            <Text style={[styles.sectionTabText, activeSectionIdx === idx && styles.sectionTabTextActive]}>
              {section.name}
            </Text>
            <Text style={[styles.sectionTabCount, activeSectionIdx === idx && styles.sectionTabCountActive]}>
              {sectionAnswered[idx]}/{section.questions?.length ?? 0}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Question content */}
      {activeQuestion ? (
        <ScrollView
          style={styles.questionScroll}
          contentContainerStyle={styles.questionScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Q meta */}
          <View style={styles.qMetaRow}>
            <Text style={styles.qNumber}>
              Q {activeQIdx + 1} of {activeSection?.questions?.length ?? 0}
            </Text>
            <View style={styles.qTypeBadge}>
              <Text style={styles.qTypeText}>{activeQuestion.type ?? 'MCQ'}</Text>
            </View>
            <View style={styles.marksBadges}>
              <View style={styles.correctMarkBadge}>
                <Text style={styles.marksBadgeText}>+{activeQuestion.marks_correct ?? 4}</Text>
              </View>
              <View style={styles.wrongMarkBadge}>
                <Text style={styles.marksBadgeText}>{activeQuestion.marks_incorrect ?? -1}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.questionText}>{stripHtml(activeQuestion.text)}</Text>

          <Text style={styles.selectLabel}>
            {activeQuestion.type === 'MCQ_MULTIPLE' || activeQuestion.type === 'Multi Correct'
              ? 'Select one or more correct options'
              : 'Select one correct option'}
          </Text>

          {activeQuestion.options?.map((option: any, index: number) => {
            const isSelected = selectedOptions.includes(String(option.id));
            return (
              <TouchableOpacity
                key={String(option.id)}
                style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                onPress={() => handleOptionSelect(String(option.id))}
                activeOpacity={0.8}
              >
                <View style={[styles.optionBubble, isSelected && styles.optionBubbleSelected]}>
                  <Text style={[styles.optionBubbleText, isSelected && styles.optionBubbleTextSelected]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {stripHtml(option.text)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#9898B0' }}>No question available.</Text>
        </View>
      )}

      {/* Bottom action row */}
      <View style={styles.bottomActionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleMarkForReview}>
          <Text style={styles.actionBtnText}>🔖 Mark for Review</Text>
        </TouchableOpacity>
        <View style={styles.notVisitedDot} />
        <Text style={styles.notVisitedLabel}>Not Answered</Text>
      </View>

      {/* Nav row */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtn} onPress={handlePrev}>
          <Text style={styles.navBtnText}>‹ Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveNextBtn} onPress={handleSaveAndNext}>
          <Text style={styles.saveNextBtnText}>💾 Save & Next</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={handleNext}>
          <Text style={styles.navBtnText}>Next ›</Text>
        </TouchableOpacity>
      </View>

      {/* Submit Modal */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalWarningIcon}>⚠</Text>
                <View>
                  <Text style={styles.modalTitle}>Submit Mock?</Text>
                  <Text style={styles.modalSubtitle}>This action cannot be undone.</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowSubmitModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalStatsRow}>
              <View style={[styles.modalStatBox, styles.modalStatBoxGreen]}>
                <Text style={styles.modalStatValue}>{summary.answered}</Text>
                <Text style={[styles.modalStatLabel, { color: '#22C55E' }]}>Answered</Text>
              </View>
              <View style={[styles.modalStatBox, styles.modalStatBoxRed]}>
                <Text style={styles.modalStatValue}>{summary.notAnswered}</Text>
                <Text style={[styles.modalStatLabel, { color: '#EF4444' }]}>Not Answered</Text>
              </View>
            </View>

            <View style={styles.modalStatsRow}>
              <View style={[styles.modalStatBox, styles.modalStatBoxPurple]}>
                <Text style={styles.modalStatValue}>{summary.markedForReview}</Text>
                <Text style={[styles.modalStatLabel, { color: '#8B5CF6' }]}>Marked</Text>
              </View>
              <View style={[styles.modalStatBox, styles.modalStatBoxGray]}>
                <Text style={styles.modalStatValue}>{summary.notVisited}</Text>
                <Text style={[styles.modalStatLabel, { color: '#6B7280' }]}>Not Visited</Text>
              </View>
            </View>

            <View style={styles.sectionTable}>
              <View style={styles.sectionTableHeader}>
                <Text style={[styles.sectionTableCell, styles.sectionTableHeaderText, { flex: 2 }]}>SECTION</Text>
                <Text style={[styles.sectionTableCell, styles.sectionTableHeaderText]}>TOTAL</Text>
                <Text style={[styles.sectionTableCell, styles.sectionTableHeaderText]}>ANS.</Text>
                <Text style={[styles.sectionTableCell, styles.sectionTableHeaderText]}>NOT ANS.</Text>
              </View>
              {sectionSummary.map((s: any, idx: number) => (
                <View key={idx} style={styles.sectionTableRow}>
                  <Text style={[styles.sectionTableCell, { flex: 2 }]} numberOfLines={1}>{s.name}</Text>
                  <Text style={styles.sectionTableCell}>{s.total}</Text>
                  <Text style={[styles.sectionTableCell, { color: '#22C55E' }]}>{s.answered}</Text>
                  <Text style={[styles.sectionTableCell, { color: '#EF4444' }]}>{s.notAnswered}</Text>
                </View>
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.goBackBtn}
                onPress={() => setShowSubmitModal(false)}
              >
                <Text style={styles.goBackBtnText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitExamBtn}
                onPress={handleFinalSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitExamBtnText}>Submit Mock</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}