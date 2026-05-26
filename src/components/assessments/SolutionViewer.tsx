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

export default function SolutionViewer({ attemptId, answers, onBack }: Props) {
  const [reviewData, setReviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [solutionsMap, setSolutionsMap] = useState<Record<string, any>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadReview();
  }, []);

  const sections: any[] = reviewData?.sections ?? reviewData?.results ?? [];

  const allQuestions = useMemo(
    () =>
      sections.flatMap((s: any) =>
        (s.questions ?? s.question ?? []).map((q: any) => ({ ...q, sectionName: s.name }))
      ),
    [reviewData]
  );

  const totalQ = allQuestions.length;

  const loadReview = async () => {
    try {
      setLoading(true);
      const res = await getassessmentReviewService(attemptId);
      console.log('REVIEW API:', res);
      const data: any = res?.data ?? null;
      setReviewData(data);

      //fetch Solutions
      if (data) {
        const sections: any[] = data?.sections ?? data?.results ?? [];
        const questions = sections.flatMap((s: any) =>
          (s.questions ?? s.question ?? [])
        );

        const results = await Promise.allSettled(
          questions.map((q: any) => getassessmentSolutionsService(q.id))
        );

        const map: Record<string, any> = {};
        questions.forEach((q: any, i: number) => {
          const r = results[i];
          if (r.status === 'fulfilled' && r.value?.data) {
            map[q.id] = r.value.data;
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
  const userAnswer = answers[currentQ?.id] || [];
  const correctAnswers: string[] = (() => {
    const topLevel =
      currentQ?.correct_answers ??
      currentQ?.correct_options ??
      currentQ?.correct_choice_ids ??
      null;
    if (Array.isArray(topLevel) && topLevel.length > 0) {
      return topLevel.map((v: any) => String(v?.id ?? v));
    }
    const opts: any[] = Array.isArray(currentQ?.options) ? currentQ.options : [];
    return opts
      .filter((o: any) => o?.is_correct === true || o?.correct === true)
      .map((o: any) => String(o.id));
  })();

  const isCorrect =
    correctAnswers.length === userAnswer.length &&
    correctAnswers.every((a: string) => userAnswer.includes(a));
  const isSkipped = userAnswer.length === 0;

  // Solutions
  const currentSolution = solutionsMap[currentQ?.id];
  const explanation = currentSolution?.explanation ?? currentQ?.explanation ?? null;

  const getOptionState = (optId: string) => {
    const isCorrectOpt = correctAnswers.includes(optId);
    const isSelected = userAnswer.includes(optId);
    if (isCorrectOpt) return 'correct';
    if (isSelected && !isCorrectOpt) return 'wrong';
    return 'neutral';
  };

  const correctIdsFor = (q: any): string[] => {
    const topLevel = q?.correct_answers ?? q?.correct_options ?? q?.correct_choice_ids ?? null;
    if (Array.isArray(topLevel) && topLevel.length > 0) {
      return topLevel.map((v: any) => String(v?.id ?? v));
    }
    const opts: any[] = Array.isArray(q?.options) ? q.options : [];
    return opts
      .filter((o: any) => o?.is_correct === true || o?.correct === true)
      .map((o: any) => String(o.id));
  };

  const getQuestionDotColor = (idx: number) => {
    const q = allQuestions[idx];
    const ua = answers[q.id] || [];
    if (ua.length === 0) return GRAY;
    const ca = correctIdsFor(q);
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
          <Text style={solutionViewerStyles.qTypeText}>{currentQ?.type}</Text>
        </View>
        <View style={solutionViewerStyles.marksBadges}>
          <View style={solutionViewerStyles.markBadgeGreen}>
            <Text style={solutionViewerStyles.markText}>+{currentQ?.marks_correct}</Text>
          </View>
          <View style={solutionViewerStyles.markBadgeRed}>
            <Text style={solutionViewerStyles.markText}>{currentQ?.marks_incorrect}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={solutionViewerStyles.scroll}
        contentContainerStyle={solutionViewerStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={solutionViewerStyles.questionText}>{stripHtml(currentQ?.text)}</Text>

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
                {stripHtml(opt.text)}
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
              {explanation?.steps && (
                <View style={solutionViewerStyles.stepsChip}>
                  <Text style={solutionViewerStyles.stepsChipText}>
                    {explanation.steps.length} steps
                  </Text>
                </View>
              )}
            </View>

            {explanation?.steps?.map((step: any, i: number) => (
              <View key={i} style={solutionViewerStyles.explanationStep}>
                <Text style={solutionViewerStyles.stepLabel}>Step {i + 1}. {stripHtml(step.title)}</Text>
                <Text style={solutionViewerStyles.stepBody}>{stripHtml(step.body)}</Text>
              </View>
            ))}

            {explanation?.summary && (
              <Text style={solutionViewerStyles.explanationSummary}>
                {stripHtml(explanation.summary)}
              </Text>
            )}

            {!explanation?.steps && typeof explanation === 'string' && (
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