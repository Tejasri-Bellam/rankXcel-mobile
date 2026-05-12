import { getassessmentReviewService } from '@/src/libs/services/assessments-attempts';
import { solutionViewerStyles } from '@/src/styles/sidebar/assessments/solutionViewer';
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  attemptId: number;
  answers: Record<string, string[]>;
  onBack: () => void;
}

const GREEN = '#22C55E';
const RED = '#EF4444';
const GRAY = '#9898B0';

export default function SolutionViewer({ attemptId, answers, onBack }: Props) {
  
  const [reviewData, setReviewData] = useState<any>(null);

  const exam = reviewData;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      loadReview();
    }, []);

    const loadReview = async () => {
      try {

        setLoading(true);

        const res = await getassessmentReviewService(
          attemptId
        );

        console.log("REVIEW API:", res);

        setReviewData(res);

      } catch (error) {

        console.log("REVIEW ERROR:", error);

      } finally {

        setLoading(false);
      }
    };

    if (loading || !reviewData) {
      return (
        <SafeAreaView>
          <Text>Loading SolutionsolutionViewerStyles...</Text>
        </SafeAreaView>
      );
    }


  // Flatten all questions across all sections
  const allQuestions = useMemo(
    () => exam.s.flatMap((s: any) => s.question.map((q: any) => ({ ...q, sectionName: s.name }))),
    [exam]
  );

  const totalQ = allQuestions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQ = allQuestions[currentIndex];

  const userAnswer = answers[currentQ?.id] || [];
  const correctAnswers = currentQ?.correct_answers || [];

  const isCorrect =
    correctAnswers.length === userAnswer.length &&
    correctAnswers.every((a: string) => userAnswer.includes(a));

  const isSkipped = userAnswer.length === 0;

  const getOptionState = (optId: string) => {
    const isCorrectOpt = correctAnswers.includes(optId);
    const isSelected = userAnswer.includes(optId);
    if (isCorrectOpt) return 'correct';
    if (isSelected && !isCorrectOpt) return 'wrong';
    return 'neutral';
  };

  // Question number pills at top — show correct/wrong/skipped per question
  const getQuestionDotColor = (idx: number) => {
    const q = allQuestions[idx];
    const ua = answers[q.id] || [];
    if (ua.length === 0) return GRAY;
    const ca = q.correct_answers || [];
    const ok = ca.length === ua.length && ca.every((a: string) => ua.includes(a));
    return ok ? GREEN : RED;
  };

  return (
    <SafeAreaView style={solutionViewerStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Header ── */}
      <View style={solutionViewerStyles.header}>
        <TouchableOpacity onPress={onBack} style={solutionViewerStyles.backBtn}>
          <Text style={solutionViewerStyles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={solutionViewerStyles.headerCenter}>
          <Text style={solutionViewerStyles.headerTitle}>Solution Viewer</Text>
          <Text style={solutionViewerStyles.headerSub}>Review answers & explanations</Text>
        </View>

        <Text style={solutionViewerStyles.headerCounter}>
          Q {currentIndex + 1}/{totalQ}
        </Text>
      </View>

      {/* ── Question number strip ── */}
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

      {/* ── Question meta bar ── */}
      <View style={solutionViewerStyles.qMetaBar}>
        <Text style={solutionViewerStyles.qMetaLeft}>
          {currentIndex + 1} of {totalQ}
        </Text>

        <View style={solutionViewerStyles.qTypeBadge}>
          <Text style={solutionViewerStyles.qTypeText}>{currentQ?.type}</Text>
        </View>

        <View style={solutionViewerStyles.marksBadges}>
          <View style={solutionViewerStyles.markBadgeGreen}>
            <Text style={solutionViewerStyles.markText}>+{currentQ?.marks_correct}</Text>
          </View>
          <View style={solutionViewerStyles.markBadgeRed}>
            <Text style={solutionViewerStyles.markText}>{currentQ?.marks_incorrect} / 4</Text>
          </View>
          <View style={solutionViewerStyles.markBadgeGray}>
            <Text style={solutionViewerStyles.markText}>□</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={solutionViewerStyles.scroll}
        contentContainerStyle={solutionViewerStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question text */}
        <Text style={solutionViewerStyles.questionText}>{currentQ?.text}</Text>

        {/* Options */}
        {currentQ?.options?.map((opt: any) => {
          const state = getOptionState(opt.id);
          return (
            <View
              key={opt.id}
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
                  {opt.id}
                </Text>
              </View>

              <Text
                style={[
                  solutionViewerStyles.optionText,
                  state === 'correct' && { color: '#166534', fontWeight: '600' },
                  state === 'wrong' && { color: '#991B1B', fontWeight: '600' },
                ]}
              >
                {opt.text}
              </Text>

              {/* Indicator icon */}
              {state === 'correct' && (
                <Text style={{ fontSize: 16, color: GREEN }}>✓</Text>
              )}
              {state === 'wrong' && (
                <Text style={{ fontSize: 16, color: RED }}>✗</Text>
              )}
            </View>
          );
        })}

        {/* ── Status badge ── */}
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

        {/* ── Explanation ── */}
        {currentQ?.explanation && (
          <View style={solutionViewerStyles.explanationCard}>
            <View style={solutionViewerStyles.explanationHeader}>
              <Text style={solutionViewerStyles.explanationLabel}>💡 EXPLANATION</Text>
              {currentQ.explanation.steps && (
                <View style={solutionViewerStyles.stepsChip}>
                  <Text style={solutionViewerStyles.stepsChipText}>
                    {currentQ.explanation.stepsolutionViewerStyles.length} steps
                  </Text>
                </View>
              )}
            </View>

            {/* Steps */}
            {currentQ.explanation.steps?.map((step: any, i: number) => (
              <View key={i} style={solutionViewerStyles.explanationStep}>
                <Text style={solutionViewerStyles.stepLabel}>Step {i + 1}. {step.title}</Text>
                <Text style={solutionViewerStyles.stepBody}>{step.body}</Text>
              </View>
            ))}

            {/* Summary */}
            {currentQ.explanation.summary && (
              <Text style={solutionViewerStyles.explanationSummary}>{currentQ.explanation.summary}</Text>
            )}

            {/* Fallback plain text */}
            {!currentQ.explanation.steps && typeof currentQ.explanation === 'string' && (
              <Text style={solutionViewerStyles.stepBody}>{currentQ.explanation}</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Navigation ── */}
      <View style={solutionViewerStyles.navRow}>
        <TouchableOpacity
          style={[solutionViewerStyles.navBtn, currentIndex === 0 && solutionViewerStyles.navBtnDisabled]}
          onPress={() => setCurrentIndex((p) => Math.max(0, p - 1))}
          disabled={currentIndex === 0}
        >
          <Text style={[solutionViewerStyles.navBtnText, currentIndex === 0 && { color: GRAY }]}>‹ Prev</Text>
        </TouchableOpacity>

        <Text style={solutionViewerStyles.navCounter}>
          {currentIndex + 1} / {totalQ}
        </Text>

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