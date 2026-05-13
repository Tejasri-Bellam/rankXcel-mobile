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
import { examScreenStyles as styles } from '../../styles/sidebar/assessments/exam';
import { getassessmentsQuestionsService } from '../../libs/services/assessments';
import {
  assessmentSubmitService,
  updateAssessmentResponsesService,
} from '@/src/libs/services/assessments-attempts';

interface Props {
  assessmentId: number;
  attemptId: number;
  onSubmit: (answers: Record<string, string[]>, timeTakenSeconds: number) => void;
  onBackToAssessments?: () => void;
}

type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked';

export default function ExamScreen({ assessmentId, attemptId, onSubmit, onBackToAssessments }: Props) {
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Timer state — initialised after exam data loads
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);

  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQIdx, setActiveQIdx] = useState(0);

  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [qStatuses, setQStatuses] = useState<Record<string, QuestionStatus>>({});

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const tabWarningTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // ── Load questions ──
  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await getassessmentsQuestionsService(assessmentId);
      console.log('QUESTIONS API:', res);

      const raw: any = res?.data;
      let examData: any = null;
      if (raw?.sections) {
        examData = raw;
      } else if (Array.isArray(raw)) {
        examData = { sections: raw, duration_minutes: 60 };
      } else if (raw?.results) {
        examData = { sections: raw.results, duration_minutes: 60 };
      } else {
        examData = raw;
      }

      setExam(examData);
      const durationSeconds = (examData?.duration_minutes ?? 60) * 60;
      setTimeLeft(durationSeconds);
    } catch (error) {
      console.log('QUESTIONS ERROR:', error);
      Alert.alert('Error', 'Failed to load questions. Please go back and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Countdown timer
  useEffect(() => {
    if (!exam) return;
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
  }, [exam]);

  // ── AppState / tab-switch detection ──
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (
        appStateRef.current === 'active' &&
        (nextState === 'background' || nextState === 'inactive')
      ) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          setShowTabWarning(true);
          if (tabWarningTimeout.current) clearTimeout(tabWarningTimeout.current);
          tabWarningTimeout.current = setTimeout(() => setShowTabWarning(false), 4000);
          return newCount;
        });
      }
      appStateRef.current = nextState;
    });
    return () => {
      subscription.remove();
      if (tabWarningTimeout.current) clearTimeout(tabWarningTimeout.current);
    };
  }, []);

  // ── Loading / empty guard ──
  if (loading || !exam) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={{ marginTop: 12, color: '#9898B0' }}>Loading exam...</Text>
      </SafeAreaView>
    );
  }

  if (!exam.sections || exam.sections.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#9898B0' }}>No questions found for this assessment.</Text>
        {onBackToAssessments && (
          <TouchableOpacity onPress={onBackToAssessments} style={{ marginTop: 16 }}>
            <Text style={{ color: '#6C5CE7', fontWeight: '600' }}>← Go Back</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  const activeSection = exam.sections[activeSectionIdx];
  const activeQuestion = activeSection?.questions?.[activeQIdx];

  const getCurrentQuestionId = () => activeQuestion?.id;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleOptionSelect = async (optionId: string) => {
    const qId = getCurrentQuestionId();
    if (!qId) return;

    // Optimistically update local state first for snappy UX
    const isMulti = activeQuestion.type === 'Multi Correct';
    setAnswers((prev) => {
      const current = prev[qId] || [];
      if (isMulti) {
        if (current.includes(optionId)) {
          return { ...prev, [qId]: current.filter((o) => o !== optionId) };
        }
        return { ...prev, [qId]: [...current, optionId] };
      }
      return { ...prev, [qId]: [optionId] };
    });
    setQStatuses((prev) => ({ ...prev, [qId]: 'answered' }));

    // Persist to server
    try {
      await updateAssessmentResponsesService(attemptId, qId, {
        selected_options: [optionId],
      });
    } catch (error) {
      console.log('SAVE ANSWER ERROR:', error);
    }
  };

  const handleMarkForReview = () => {
    const qId = getCurrentQuestionId();
    if (qId) setQStatuses((prev) => ({ ...prev, [qId]: 'marked' }));
  };

  const handleSaveAndNext = () => {
    const qId = getCurrentQuestionId();
    const hasAnswer = (answers[qId] || []).length > 0;
    if (qId && !qStatuses[qId]) {
      setQStatuses((prev) => ({
        ...prev,
        [qId]: hasAnswer ? 'answered' : 'not_answered',
      }));
    }

    if (activeQIdx < activeSection.questions.length - 1) {
      const nextQId = activeSection.questions[activeQIdx + 1].id;
      setActiveQIdx(activeQIdx + 1);
      setQStatuses((prev) => ({ ...prev, [nextQId]: prev[nextQId] || 'not_answered' }));
    } else if (activeSectionIdx < exam.sections.length - 1) {
      const nextSection = exam.sections[activeSectionIdx + 1];
      const nextQId = nextSection.questions[0].id;
      setActiveSectionIdx(activeSectionIdx + 1);
      setActiveQIdx(0);
      setQStatuses((prev) => ({ ...prev, [nextQId]: prev[nextQId] || 'not_answered' }));
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

  const getAllQuestions = () => exam.sections.flatMap((s: any) => s.questions);

  const getSubmitSummary = () => {
    const allQs = getAllQuestions();
    let answered = 0, notAnswered = 0, markedForReview = 0, notVisited = 0;
    allQs.forEach((q: any) => {
      const status = qStatuses[q.id];
      const hasAnswer = (answers[q.id] || []).length > 0;
      if (!status)                              notVisited++;
      else if (status === 'answered' && hasAnswer) answered++;
      else if (status === 'marked')             markedForReview++;
      else                                      notAnswered++;
    });
    return { answered, notAnswered, markedForReview, notVisited };
  };

  const getSectionSummary = () =>
    exam.sections.map((section: any) => {
      let ans = 0, notAns = 0;
      section.questions.forEach((q: any) => {
        if ((answers[q.id] || []).length > 0) ans++;
        else notAns++;
      });
      return { name: section.name, total: section.questions.length, answered: ans, notAnswered: notAns };
    });

  const handleFinalSubmit = async () => {
    try {
      await assessmentSubmitService(attemptId);
      console.log('ASSESSMENT SUBMITTED');
      onSubmit(answers, timeTaken);
    } catch (error) {
      console.log('SUBMIT ERROR:', error);
      Alert.alert('Error', 'Submission failed. Please try again.');
    }
  };

  const qNumberInSection = activeQIdx + 1;
  const totalInSection = activeSection?.questions?.length ?? 0;
  const selectedOptions = answers[getCurrentQuestionId()] || [];
  const summary = getSubmitSummary();
  const sectionSummary = getSectionSummary();
  const sectionAnswered = exam.sections.map((s: any) =>
    s.questions.filter((q: any) => (answers[q.id] || []).length > 0).length
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Text style={styles.examLabel}>Mock Test</Text>
          <Text style={styles.examName}>{exam?.name ?? 'Assessment'}</Text>
        </View>
        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>TIME LEFT</Text>
          <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
        </View>
        <TouchableOpacity style={styles.submitTopBtn} onPress={() => setShowSubmitModal(true)}>
          <Text style={styles.submitTopBtnText}>⚑  Submit</Text>
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
            key={section.id}
            style={[styles.sectionTab, activeSectionIdx === idx && styles.sectionTabActive]}
            onPress={() => { setActiveSectionIdx(idx); setActiveQIdx(0); }}
          >
            <Text style={[styles.sectionTabText, activeSectionIdx === idx && styles.sectionTabTextActive]}>
              {section.name}
            </Text>
            <Text style={[styles.sectionTabCount, activeSectionIdx === idx && styles.sectionTabCountActive]}>
              {sectionAnswered[idx]}/{section.total_questions ?? section.questions?.length ?? 0}
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
          <View style={styles.qMetaRow}>
            <Text style={styles.qNumber}>Q {qNumberInSection} of {totalInSection}</Text>
            <View style={styles.qTypeBadge}>
              <Text style={styles.qTypeText}>{activeQuestion.type}</Text>
            </View>
            <View style={styles.marksBadges}>
              <View style={styles.correctMarkBadge}>
                <Text style={styles.marksBadgeText}>+{activeQuestion.marks_correct} marks</Text>
              </View>
              <View style={styles.wrongMarkBadge}>
                <Text style={styles.marksBadgeText}>{activeQuestion.marks_incorrect} marks</Text>
              </View>
            </View>
          </View>

          <Text style={styles.questionText}>{activeQuestion.text}</Text>

          <Text style={styles.selectLabel}>
            {activeQuestion.type === 'Multi Correct'
              ? 'Select one or more correct options'
              : 'Select one correct option'}
          </Text>

          {activeQuestion.options?.map((option: any) => {
            const isSelected = selectedOptions.includes(option.id);
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                onPress={() => handleOptionSelect(option.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.optionBubble, isSelected && styles.optionBubbleSelected]}>
                  <Text style={[styles.optionBubbleText, isSelected && styles.optionBubbleTextSelected]}>
                    {option.id}
                  </Text>
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option.text}
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
                  <Text style={styles.modalTitle}>Submit Exam?</Text>
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
                <Text style={[styles.modalStatLabel, { color: '#8B5CF6' }]}>Marked for Review</Text>
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
                  <Text style={[styles.sectionTableCell, { flex: 2 }]}>{s.name}</Text>
                  <Text style={styles.sectionTableCell}>{s.total}</Text>
                  <Text style={[styles.sectionTableCell, { color: '#22C55E' }]}>{s.answered}</Text>
                  <Text style={[styles.sectionTableCell, { color: '#EF4444' }]}>{s.notAnswered}</Text>
                </View>
              ))}
            </View>

            {tabSwitchCount > 0 && (
              <View style={styles.tabSwitchWarning}>
                <Text style={styles.tabSwitchWarningIcon}>⚠</Text>
                <Text style={styles.tabSwitchWarningText}>
                  {tabSwitchCount} tab switch{tabSwitchCount > 1 ? 'es' : ''} detected. This will be recorded.
                </Text>
              </View>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.goBackBtn} onPress={() => setShowSubmitModal(false)}>
                <Text style={styles.goBackBtnText}>Go Back to Exam</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitExamBtn} onPress={handleFinalSubmit}>
                <Text style={styles.submitExamBtnText}>Submit Exam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
