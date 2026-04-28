import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { examScreenStyles as styles } from '../../styles/sidebar/assessments/exam';
import examData from '../json/assessmentExam';

interface Props {
  onSubmit: (answers: Record<string, string[]>, timeTakenSeconds: number) => void;
}

type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked';

export default function ExamScreen({ onSubmit }: Props) {
  const { exam } : any = examData;

  const totalDurationSeconds = exam.duration_minutes * 60;
  const [timeLeft, setTimeLeft] = useState(totalDurationSeconds);
  const [timeTaken, setTimeTaken] = useState(0);

  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQIdx, setActiveQIdx] = useState(0);

  // answers: { [questionId]: string[] }
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  // question statuses
  const [qStatuses, setQStatuses] = useState<Record<string, QuestionStatus>>({});

  // tab switch tracking
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const tabWarningTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // submit modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const activeSection = exam.sections[activeSectionIdx];
  const activeQuestion = activeSection.questions[activeQIdx];

  // Timer countdown
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

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // AppState / tab switch detection
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

  const getCurrentQuestionId = () => activeQuestion.id;

  const handleOptionSelect = (optionId: string) => {
    const qId = getCurrentQuestionId();
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
  };

  const handleMarkForReview = () => {
    const qId = getCurrentQuestionId();
    setQStatuses((prev) => ({ ...prev, [qId]: 'marked' }));
  };

  const handleSaveAndNext = () => {
    const qId = getCurrentQuestionId();
    const hasAnswer = (answers[qId] || []).length > 0;

    if (!qStatuses[qId]) {
      setQStatuses((prev) => ({
        ...prev,
        [qId]: hasAnswer ? 'answered' : 'not_answered',
      }));
    }

    // Move to next question or section
    if (activeQIdx < activeSection.questions.length - 1) {
      const nextQId = activeSection.questions[activeQIdx + 1].id;
      setActiveQIdx(activeQIdx + 1);
      setQStatuses((prev) => ({
        ...prev,
        [nextQId]: prev[nextQId] || 'not_answered',
      }));
    } else if (activeSectionIdx < exam.sections.length - 1) {
      const nextSection = exam.sections[activeSectionIdx + 1];
      const nextQId = nextSection.questions[0].id;
      setActiveSectionIdx(activeSectionIdx + 1);
      setActiveQIdx(0);
      setQStatuses((prev) => ({
        ...prev,
        [nextQId]: prev[nextQId] || 'not_answered',
      }));
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

  // Compute submit summary
  const getAllQuestions = () =>
    exam.sections.flatMap((s: any) => s.questions);

  const getSubmitSummary = () => {
    const allQs = getAllQuestions();
    let answered = 0;
    let notAnswered = 0;
    let markedForReview = 0;
    let notVisited = 0;

    allQs.forEach((q: any) => {
      const status = qStatuses[q.id];
      const hasAnswer = (answers[q.id] || []).length > 0;
      if (!status) {
        notVisited++;
      } else if (status === 'answered' && hasAnswer) {
        answered++;
      } else if (status === 'marked') {
        markedForReview++;
      } else {
        notAnswered++;
      }
    });

    return { answered, notAnswered, markedForReview, notVisited };
  };

  const getSectionSummary = () =>
    exam.sections.map((section: any) => {
      let ans = 0;
      let notAns = 0;
      section.questions.forEach((q: any) => {
        const hasAnswer = (answers[q.id] || []).length > 0;
        if (hasAnswer) ans++;
        else notAns++;
      });
      return {
        name: section.name,
        total: section.questions.length,
        answered: ans,
        notAnswered: notAns,
      };
    });

  const handleFinalSubmit = useCallback(() => {
    setShowSubmitModal(false);
    onSubmit(answers, timeTaken);
  }, [answers, timeTaken, onSubmit]);

  // Question number within current section (1-based)
  const qNumberInSection = activeQIdx + 1;
  const totalInSection = activeSection.questions.length;

  const selectedOptions = answers[getCurrentQuestionId()] || [];

  const summary = getSubmitSummary();
  const sectionSummary = getSectionSummary();

  // Section tab answered counts for top bar
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
          <Text style={styles.examName}>Eamcet</Text>
        </View>

        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>TIME LEFT</Text>
          <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
        </View>

        <TouchableOpacity
          style={styles.submitTopBtn}
          onPress={() => setShowSubmitModal(true)}
        >
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
            style={[
              styles.sectionTab,
              activeSectionIdx === idx && styles.sectionTabActive,
            ]}
            onPress={() => {
              setActiveSectionIdx(idx);
              setActiveQIdx(0);
            }}
          >
            <Text
              style={[
                styles.sectionTabText,
                activeSectionIdx === idx && styles.sectionTabTextActive,
              ]}
            >
              {section.name}
            </Text>
            <Text
              style={[
                styles.sectionTabCount,
                activeSectionIdx === idx && styles.sectionTabCountActive,
              ]}
            >
              {sectionAnswered[idx]}/{section.total_questions}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Question content */}
      <ScrollView
        style={styles.questionScroll}
        contentContainerStyle={styles.questionScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Q meta */}
        <View style={styles.qMetaRow}>
          <Text style={styles.qNumber}>
            Q {qNumberInSection} of {totalInSection}
          </Text>
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

        {/* Question text */}
        <Text style={styles.questionText}>{activeQuestion.text}</Text>

        {/* Options */}
        <Text style={styles.selectLabel}>
          {activeQuestion.type === 'Multi Correct'
            ? 'Select one or more correct options'
            : 'Select one correct option'}
        </Text>

        {activeQuestion.options.map((option: any) => {
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

      {/* Bottom action row */}
      <View style={styles.bottomActionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleMarkForReview}>
          <Text style={styles.actionBtnText}>🔖 Mark for Review</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>🚩 Flag Question</Text>
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
            {/* Modal header */}
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

            {/* Answered / Not answered */}
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

            {/* Section table */}
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

            {/* Tab switch warning */}
            {tabSwitchCount > 0 && (
              <View style={styles.tabSwitchWarning}>
                <Text style={styles.tabSwitchWarningIcon}>⚠</Text>
                <Text style={styles.tabSwitchWarningText}>
                  {tabSwitchCount} tab switch{tabSwitchCount > 1 ? 'es' : ''} detected during this exam. This will be recorded in your results.
                </Text>
              </View>
            )}

            {/* Modal buttons */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.goBackBtn}
                onPress={() => setShowSubmitModal(false)}
              >
                <Text style={styles.goBackBtnText}>Go Back to Exam</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitExamBtn}
                onPress={handleFinalSubmit}
              >
                <Text style={styles.submitExamBtnText}>Submit Exam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}