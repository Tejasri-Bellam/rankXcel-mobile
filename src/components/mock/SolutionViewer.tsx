// src/components/mock/MockSolutionViewer.tsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockSolutionStyles as styles } from '../../styles/sidebar/mockExams/solutions';
import { getMockTestReviewService } from '../../libs/services/mock-library';

interface Props {
  mockId: number | string;
  answers: Record<string, string[]>;
  onBack: () => void;
}

const GREEN = '#22C55E';
const RED   = '#EF4444';
const GRAY  = '#9898B0';

export default function MockSolutionViewer({ mockId, answers, onBack }: Props) {
  const [reviewData, setReviewData] = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => { loadReview(); }, []);

  const loadReview = async () => {
    try {
      setLoading(true);
      const res = await getMockTestReviewService(mockId);
      console.log('MOCK REVIEW API:', res);
      setReviewData(res?.data ?? null);
    } catch (err) {
      console.log('MOCK REVIEW ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  const sections: any[] = reviewData?.sections ?? reviewData?.results ?? [];

  const allQuestions = useMemo(
    () =>
      sections.flatMap((s: any) =>
        (s.questions ?? s.question ?? []).map((q: any) => ({
          ...q,
          sectionName: s.name,
        }))
      ),
    [reviewData]
  );

  const totalQ = allQuestions.length;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={{ marginTop: 12, color: GRAY }}>Loading solutions…</Text>
      </SafeAreaView>
    );
  }

  if (!reviewData) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: GRAY, fontSize: 14, textAlign: 'center', paddingHorizontal: 24 }}>
          Solutions are not available yet.
        </Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={{ color: '#6C5CE7', fontWeight: '600' }}>← Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (totalQ === 0) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: GRAY }}>No questions found in solutions.</Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={{ color: '#6C5CE7', fontWeight: '600' }}>← Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentQ      = allQuestions[currentIndex];
  const userAnswer    = answers[currentQ?.id] || [];
  const correctAnswers = currentQ?.correct_answers || [];
  const explanation   = currentQ?.explanation ?? null;

  const isCorrect = correctAnswers.length === userAnswer.length &&
    correctAnswers.every((a: string) => userAnswer.includes(a));
  const isSkipped = userAnswer.length === 0;

  const getOptionState = (optId: string) => {
    const isCorrectOpt = correctAnswers.includes(optId);
    const isSelected   = userAnswer.includes(optId);
    if (isCorrectOpt)              return 'correct';
    if (isSelected && !isCorrectOpt) return 'wrong';
    return 'neutral';
  };

  const getDotColor = (idx: number) => {
    const q  = allQuestions[idx];
    const ua = answers[q.id] || [];
    if (ua.length === 0) return GRAY;
    const ca = q.correct_answers || [];
    const ok = ca.length === ua.length && ca.every((a: string) => ua.includes(a));
    return ok ? GREEN : RED;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Solution Viewer</Text>
          <Text style={styles.headerSub}>Review answers & explanations</Text>
        </View>
        <Text style={styles.headerCounter}>Q {currentIndex + 1}/{totalQ}</Text>
      </View>

      {/* Question number strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
        style={styles.pillsScroll}
      >
        {allQuestions.map((_: any, idx: number) => {
          const active    = idx === currentIndex;
          const dotColor  = getDotColor(idx);
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.pill,
                active && { backgroundColor: dotColor, borderColor: dotColor },
                !active && { borderColor: dotColor },
              ]}
              onPress={() => setCurrentIndex(idx)}
            >
              <Text style={[styles.pillText, active && { color: '#fff' }]}>
                {idx + 1}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Q meta bar */}
      <View style={styles.qMetaBar}>
        <Text style={styles.qMetaLeft}>{currentIndex + 1} of {totalQ}</Text>
        <View style={styles.qTypeBadge}>
          <Text style={styles.qTypeText}>{currentQ?.type ?? 'MCQ'}</Text>
        </View>
        <View style={styles.marksBadges}>
          <View style={styles.markBadgeGreen}>
            <Text style={styles.markText}>+{currentQ?.marks_correct ?? 4}</Text>
          </View>
          <View style={styles.markBadgeRed}>
            <Text style={styles.markText}>{currentQ?.marks_incorrect ?? -1}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section label */}
        {currentQ?.sectionName && (
          <View style={styles.sectionChip}>
            <Text style={styles.sectionChipText}>{currentQ.sectionName}</Text>
          </View>
        )}

        <Text style={styles.questionText}>{currentQ?.text}</Text>

        {/* Options */}
        {currentQ?.options?.map((opt: any) => {
          const state = getOptionState(String(opt.id));
          return (
            <View
              key={opt.id}
              style={[
                styles.optionRow,
                state === 'correct' && styles.optionCorrect,
                state === 'wrong'   && styles.optionWrong,
              ]}
            >
              <View
                style={[
                  styles.optionBubble,
                  state === 'correct' && styles.bubbleCorrect,
                  state === 'wrong'   && styles.bubbleWrong,
                ]}
              >
                <Text
                  style={[
                    styles.optionBubbleText,
                    (state === 'correct' || state === 'wrong') && { color: '#fff' },
                  ]}
                >
                  {opt.id}
                </Text>
              </View>
              <Text
                style={[
                  styles.optionText,
                  state === 'correct' && { color: '#166534', fontWeight: '600' },
                  state === 'wrong'   && { color: '#991B1B', fontWeight: '600' },
                ]}
              >
                {opt.text}
              </Text>
              {state === 'correct' && <Text style={{ fontSize: 16, color: GREEN }}>✓</Text>}
              {state === 'wrong'   && <Text style={{ fontSize: 16, color: RED }}>✗</Text>}
            </View>
          );
        })}

        {/* Status badge */}
        <View
          style={[
            styles.statusBadge,
            isSkipped  && styles.statusSkipped,
            !isSkipped && isCorrect && styles.statusCorrect,
            !isSkipped && !isCorrect && styles.statusWrong,
          ]}
        >
          <Text style={styles.statusBadgeText}>
            {isSkipped ? '— Skipped' : isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </Text>
        </View>

        {/* Explanation */}
        {explanation && (
          <View style={styles.explanationCard}>
            <View style={styles.explanationHeader}>
              <Text style={styles.explanationLabel}>💡 EXPLANATION</Text>
              {explanation?.steps && (
                <View style={styles.stepsChip}>
                  <Text style={styles.stepsChipText}>{explanation.steps.length} steps</Text>
                </View>
              )}
            </View>

            {explanation?.steps?.map((step: any, i: number) => (
              <View key={i} style={styles.explanationStep}>
                <Text style={styles.stepLabel}>Step {i + 1}. {step.title}</Text>
                <Text style={styles.stepBody}>{step.body}</Text>
              </View>
            ))}

            {explanation?.summary && (
              <Text style={styles.explanationSummary}>{explanation.summary}</Text>
            )}

            {!explanation?.steps && typeof explanation === 'string' && (
              <Text style={styles.stepBody}>{explanation}</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
          onPress={() => setCurrentIndex((p) => Math.max(0, p - 1))}
          disabled={currentIndex === 0}
        >
          <Text style={[styles.navBtnText, currentIndex === 0 && { color: GRAY }]}>‹ Prev</Text>
        </TouchableOpacity>

        <Text style={styles.navCounter}>{currentIndex + 1} / {totalQ}</Text>

        <TouchableOpacity
          style={[styles.navBtn, currentIndex === totalQ - 1 && styles.navBtnDisabled]}
          onPress={() => setCurrentIndex((p) => Math.min(totalQ - 1, p + 1))}
          disabled={currentIndex === totalQ - 1}
        >
          <Text style={[styles.navBtnText, currentIndex === totalQ - 1 && { color: GRAY }]}>Next ›</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}