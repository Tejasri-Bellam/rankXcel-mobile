import { getassessmentReviewService, getassessmentSolutionsService } from '@/src/libs/services/assessments-attempts';
import { solutionViewerStyles } from '../../styles/sidebar/assessments/solutionViewer';
import { stripHtml } from '@/src/libs/utils/html';
import React, { useState, useMemo, useEffect } from 'react';
import {View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  attemptId: number;
  answers: Record<string, string[]>;
  onBack: () => void;
}

const GREEN = '#22C55E';
const RED = '#EF4444';
const GRAY = '#9898B0';

const getQuestionId = (q: any): string | number | undefined =>
  q?.question_id ?? q?.id;

const getCorrectChoiceIds = (q: any): string[] => {
  const choices: any[] = Array.isArray(q?.choices) ? q.choices : Array.isArray(q?.options) ? q.options : [];
  return choices.filter((c: any) => c?.is_correct === true).map((c: any) => String(c.id));
};

const getApiSelectedIds = (q: any): string[] => {
  const raw =
    q?.your_answer?.selected_choice_ids ??
    q?.selected_choice_ids ??
    q?.selected_options ??
    [];
  return (Array.isArray(raw) ? raw : []).map((v: any) => String(v?.id ?? v));
};

const getChoiceExplanation = (q: any): string | null => {
  const choices: any[] = Array.isArray(q?.choices) ? q.choices : Array.isArray(q?.options) ? q.options : [];
  const correct = choices.find((c: any) => c?.is_correct === true);
  return correct?.explanation ? String(correct.explanation) : null;
};

export default function SolutionViewer({ attemptId, answers, onBack }: Props) {
  const [reviewData, setReviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [solutionsMap, setSolutionsMap] = useState<Record<string, any>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadReview();
  }, []);

  const questions: any[] = reviewData?.questions ?? [];

  const allQuestions = useMemo(
    () =>
      questions.map((q: any) => ({
        ...q,
        sectionName: q?.section_name ?? '',
      })),
    [questions]
  );

  const totalQ = allQuestions.length;

  const loadReview = async () => {
    try {
      setLoading(true);

      const res = await getassessmentReviewService(attemptId);

      console.log('REVIEW API:', JSON.stringify(res, null, 2));

      const data: any = res?.data ?? null;

      setReviewData(data);

      if (data) {
        const qs = data?.questions ?? [];

        const results = await Promise.allSettled(
          qs.map((q: any) => {
            const qid = getQuestionId(q);
            return qid != null
              ? getassessmentSolutionsService(Number(qid))
              : Promise.reject(new Error('no question id'));
          })
        );

        const map: Record<string, any> = {};

        qs.forEach((q: any, i: number) => {
          const r = results[i];
          const qid = getQuestionId(q);
          if (qid != null && r.status === 'fulfilled' && r.value?.data) {
            map[String(qid)] = r.value.data;
          }
        });

        setSolutionsMap(map);
      }
    } catch (error) {
      console.log('REVIEW ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={{ marginTop: 12, color: '#9898B0' }}>Loading solutions...</Text>
      </SafeAreaView>
    );
  }

  if (!reviewData) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#9898B0' }}>Solutions are not available yet.</Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={{ color: '#6C5CE7', fontWeight: '600' }}>← Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (totalQ === 0) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#9898B0' }}>No questions found in solutions.</Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={{ color: '#6C5CE7', fontWeight: '600' }}>← Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentQ = allQuestions[currentIndex];
  const currentQId = getQuestionId(currentQ);
  const choices: any[] = Array.isArray(currentQ?.choices)
    ? currentQ.choices
    : Array.isArray(currentQ?.options)
      ? currentQ.options
      : [];

  const sortedChoices = [...choices].sort(
    (a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0)
  );

  const correctAnswers = getCorrectChoiceIds(currentQ);
  const apiSelected = getApiSelectedIds(currentQ);

  // Prefer just-submitted answers from props; fall back to API's your_answer.
  const userAnswer = (currentQId != null && answers[String(currentQId)]?.length)
    ? answers[String(currentQId)]
    : apiSelected;

  const isCorrect = currentQ?.outcome === 'correct' ||
    (currentQ?.outcome == null &&
      userAnswer.length > 0 &&
      correctAnswers.length === userAnswer.length &&
      correctAnswers.every((a: string) => userAnswer.includes(a)));
  const isSkipped = currentQ?.outcome === 'unattempted' ||
    currentQ?.outcome === 'skipped' ||
    (currentQ?.outcome == null && userAnswer.length === 0);

  const currentSolution = currentQId != null ? solutionsMap[String(currentQId)] : null;
  const explanation =
    currentSolution?.explanation ??
    currentSolution?.solution ??
    currentQ?.explanation ??
    getChoiceExplanation(currentQ);

  const questionText = currentQ?.question_text ?? currentQ?.text ?? currentQ?.statement ?? '';
  const questionType = currentQ?.question_type ?? currentQ?.type ?? 'MCQ';
  const marksCorrect = currentQ?.max_score ?? currentQ?.marks_correct ?? 4;
  const marksIncorrect = currentQ?.marks_incorrect ?? -1;

  const getOptionState = (optId: string) => {
    const isCorrectOpt = correctAnswers.includes(optId);
    const isSelected = userAnswer.includes(optId);
    if (isCorrectOpt) return 'correct';
    if (isSelected && !isCorrectOpt) return 'wrong';
    return 'neutral';
  };

  const getQuestionDotColor = (idx: number) => {
    const q = allQuestions[idx];
    if (q?.outcome === 'correct') return GREEN;
    if (q?.outcome === 'wrong')   return RED;
    if (q?.outcome === 'unattempted' || q?.outcome === 'skipped') return GRAY;

    const qid = getQuestionId(q);
    const ua = (qid != null && answers[String(qid)]?.length)
      ? answers[String(qid)]
      : getApiSelectedIds(q);
    if (ua.length === 0) return GRAY;
    const ca = getCorrectChoiceIds(q);
    const ok = ca.length === ua.length && ca.every((a: string) => ua.includes(a));
    return ok ? GREEN : RED;
  };

  return (
    <SafeAreaView style={solutionViewerStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={solutionViewerStyles.header}>
        <TouchableOpacity onPress={onBack} style={solutionViewerStyles.backBtn}>
          <Text style={solutionViewerStyles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={solutionViewerStyles.headerCenter}>
          <Text style={solutionViewerStyles.headerTitle}>Solution Viewer</Text>
          <Text style={solutionViewerStyles.headerSub}>Review answers & explanations</Text>
        </View>
        <Text style={solutionViewerStyles.headerCounter}>Q {currentIndex + 1}/{totalQ}</Text>
      </View>

      {/* Question number strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={solutionViewerStyles.pillsRow}
        style={solutionViewerStyles.pillsScroll}
      >
        {allQuestions.map((_: any, idx: number) => {
          const active = idx === currentIndex;
          const dotColor = getQuestionDotColor(idx);
          return (
            <TouchableOpacity
              key={idx}
              style={[
                solutionViewerStyles.pill,
                active && { backgroundColor: dotColor, borderColor: dotColor },
                !active && { borderColor: dotColor },
              ]}
              onPress={() => setCurrentIndex(idx)}
            >
              <Text style={[solutionViewerStyles.pillText, active && { color: '#fff' }]}>
                {idx + 1}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Question meta bar */}
      <View style={solutionViewerStyles.qMetaBar}>
        <Text style={solutionViewerStyles.qMetaLeft}>{currentIndex + 1} of {totalQ}</Text>
        <View style={solutionViewerStyles.qTypeBadge}>
          <Text style={solutionViewerStyles.qTypeText}>{questionType}</Text>
        </View>
        <View style={solutionViewerStyles.marksBadges}>
          <View style={solutionViewerStyles.markBadgeGreen}>
            <Text style={solutionViewerStyles.markText}>+{marksCorrect}</Text>
          </View>
          <View style={solutionViewerStyles.markBadgeRed}>
            <Text style={solutionViewerStyles.markText}>{marksIncorrect}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={solutionViewerStyles.scroll}
        contentContainerStyle={solutionViewerStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={solutionViewerStyles.questionText}>{stripHtml(questionText)}</Text>

        {sortedChoices.map((opt: any, idx: number) => {
          const optId = String(opt?.id);
          const state = getOptionState(optId);
          const letter = String.fromCharCode(65 + idx);
          return (
            <View
              key={optId}
              style={[
                solutionViewerStyles.optionRow,
                state === 'correct' && solutionViewerStyles.optionCorrect,
                state === 'wrong' && solutionViewerStyles.optionWrong,
              ]}
            >
              <View
                style={[
                  solutionViewerStyles.optionBubble,
                  state === 'correct' && solutionViewerStyles.bubbleCorrect,
                  state === 'wrong' && solutionViewerStyles.bubbleWrong,
                ]}
              >
                <Text
                  style={[
                    solutionViewerStyles.optionBubbleText,
                    (state === 'correct' || state === 'wrong') && { color: '#fff' },
                  ]}
                >
                  {letter}
                </Text>
              </View>
              <Text
                style={[
                  solutionViewerStyles.optionText,
                  state === 'correct' && { color: '#166534', fontWeight: '600' },
                  state === 'wrong' && { color: '#991B1B', fontWeight: '600' },
                ]}
              >
                {stripHtml(opt?.text)}
              </Text>
              {state === 'correct' && <Text style={{ fontSize: 16, color: GREEN }}>✓</Text>}
              {state === 'wrong'   && <Text style={{ fontSize: 16, color: RED }}>✗</Text>}
            </View>
          );
        })}

        <View
          style={[
            solutionViewerStyles.statusBadge,
            isSkipped && solutionViewerStyles.statusSkipped,
            !isSkipped && isCorrect && solutionViewerStyles.statusCorrect,
            !isSkipped && !isCorrect && solutionViewerStyles.statusWrong,
          ]}
        >
          <Text style={solutionViewerStyles.statusBadgeText}>
            {isSkipped ? '— Skipped' : isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </Text>
        </View>


        {explanation && (
          <View style={solutionViewerStyles.explanationCard}>
            <View style={solutionViewerStyles.explanationHeader}>
              <Text style={solutionViewerStyles.explanationLabel}>💡 EXPLANATION</Text>
              {typeof explanation === 'object' && explanation?.steps && (
                <View style={solutionViewerStyles.stepsChip}>
                  <Text style={solutionViewerStyles.stepsChipText}>
                    {explanation.steps.length} steps
                  </Text>
                </View>
              )}
            </View>

            {typeof explanation === 'object' && explanation?.steps?.map((step: any, i: number) => (
              <View key={i} style={solutionViewerStyles.explanationStep}>
                <Text style={solutionViewerStyles.stepLabel}>Step {i + 1}. {stripHtml(step.title)}</Text>
                <Text style={solutionViewerStyles.stepBody}>{stripHtml(step.body)}</Text>
              </View>
            ))}

            {typeof explanation === 'object' && explanation?.summary && (
              <Text style={solutionViewerStyles.explanationSummary}>
                {stripHtml(explanation.summary)}
              </Text>
            )}

            {typeof explanation === 'string' && (
              <Text style={solutionViewerStyles.stepBody}>{stripHtml(explanation)}</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={solutionViewerStyles.navRow}>
        <TouchableOpacity
          style={[solutionViewerStyles.navBtn, currentIndex === 0 && solutionViewerStyles.navBtnDisabled]}
          onPress={() => setCurrentIndex((p) => Math.max(0, p - 1))}
          disabled={currentIndex === 0}
        >
          <Text style={[solutionViewerStyles.navBtnText, currentIndex === 0 && { color: GRAY }]}>
            ‹ Prev
          </Text>
        </TouchableOpacity>

        <Text style={solutionViewerStyles.navCounter}>{currentIndex + 1} / {totalQ}</Text>

        <TouchableOpacity
          style={[solutionViewerStyles.navBtn, currentIndex === totalQ - 1 && solutionViewerStyles.navBtnDisabled]}
          onPress={() => setCurrentIndex((p) => Math.min(totalQ - 1, p + 1))}
          disabled={currentIndex === totalQ - 1}
        >
          <Text style={[solutionViewerStyles.navBtnText, currentIndex === totalQ - 1 && { color: GRAY }]}>
            Next ›
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
 