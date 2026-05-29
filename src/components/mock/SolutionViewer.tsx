// src/components/mock/MockSolutionViewer.tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockSolutionStyles as styles } from '../../styles/sidebar/mockExams/solutions';
import {
  getMockTestReviewService,
  getQuestionSolutionService,
} from '../../libs/services/mock-library';
import { stripHtml } from '../../libs/utils/html';

interface Props {
  mockId: number | string;
  answers: Record<string, string[]>;
  onBack: () => void;
}

const GREEN = '#22C55E';
const RED   = '#EF4444';
const GRAY  = '#9898B0';
const ACCENT_BORDER = '#6C5CE7';

const getQuestionId = (q: any): string | number | undefined =>
  q?.question_id ?? q?.id;

const getChoices = (q: any): any[] =>
  Array.isArray(q?.choices) ? q.choices
    : Array.isArray(q?.options) ? q.options
    : [];

const correctIdsFor = (q: any): string[] => {
  const topLevel =
    q?.correct_answers ?? q?.correct_options ?? q?.correct_choice_ids ?? null;
  if (Array.isArray(topLevel) && topLevel.length > 0) {
    return topLevel.map((v: any) => String(v?.id ?? v));
  }
  return getChoices(q)
    .filter((o: any) => o?.is_correct === true || o?.correct === true)
    .map((o: any) => String(o.id));
};

const selectedIdsFor = (q: any): string[] => {
  const raw =
    q?.your_answer?.selected_choice_ids ??
    q?.selected_options ??
    q?.selected_choice_ids ??
    q?.response?.selected_choice_ids ??
    [];
  return (Array.isArray(raw) ? raw : []).map((v: any) => String(v?.id ?? v));
};

const getChoiceExplanation = (q: any): string | null => {
  const correct = getChoices(q).find((c: any) => c?.is_correct === true);
  return correct?.explanation ? String(correct.explanation) : null;
};

export default function MockSolutionViewer({ mockId, answers, onBack }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const [reviewData, setReviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [solutionsMap, setSolutionsMap] = useState<Record<string, any>>({});

  useEffect(() => { loadReview(); }, []);

  const questions: any[] = reviewData?.questions ?? [];

  const allQuestions = useMemo(
    () =>
      questions.map((q: any) => ({
        ...q,
        sectionName: q?.section_name ?? q?.subject_name ?? q?.subject ?? '',
      })),
    [questions]
  );

  const totalQ = allQuestions.length;

  const loadReview = async () => {
    try {
      setLoading(true);
      const res = await getMockTestReviewService(mockId);
      console.log('MOCK REVIEW API:', JSON.stringify(res, null, 2));
      const data: any = res?.data ?? null;
      setReviewData(data);

      if (data) {
        const qs = data?.questions ?? [];

        const results = await Promise.allSettled(
          qs.map((q: any) => {
            const qid = getQuestionId(q);
            return qid != null
              ? getQuestionSolutionService(qid)
              : Promise.reject(new Error('no question id'));
          })
        );

        const map: Record<string, any> = {};
        qs.forEach((q: any, i: number) => {
          const r = results[i];
          const qid = getQuestionId(q);
          if (qid != null && r.status === 'fulfilled' && (r.value as any)?.data) {
            map[String(qid)] = (r.value as any).data;
          }
        });
        setSolutionsMap(map);
      }
    } catch (err) {
      console.log('MOCK REVIEW ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={{ marginTop: 12, color: GRAY }}>Loading solutions…</Text>
      </SafeAreaView>
    );
  }

  if (!reviewData || totalQ === 0) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: GRAY, fontSize: 14, textAlign: 'center', paddingHorizontal: 24 }}>
          Solutions are not available for this mock test.
        </Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={{ color: '#6C5CE7', fontWeight: '600' }}>← Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentQ = allQuestions[currentIndex];
  const currentQId = getQuestionId(currentQ);
  const currentChoices = getChoices(currentQ);
  const sortedChoices = [...currentChoices].sort(
    (a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0)
  );

  const correctAnswers = correctIdsFor(currentQ);
  const apiSelected = selectedIdsFor(currentQ);

  // Prefer answers from props (just-submitted exam), fall back to API selected.
  const userAnswer = (currentQId != null && answers[String(currentQId)]?.length)
    ? answers[String(currentQId)]
    : apiSelected;

  const isCorrect = currentQ?.outcome === 'correct' ||
    (currentQ?.outcome == null &&
      userAnswer.length > 0 &&
      correctAnswers.length === userAnswer.length &&
      correctAnswers.every((a: string) => userAnswer.includes(a)));
  const isSkipped = currentQ?.outcome === 'skipped' ||
    currentQ?.outcome === 'unattempted' ||
    (currentQ?.outcome == null && userAnswer.length === 0);

  const currentSolution = currentQId != null ? solutionsMap[String(currentQId)] : null;
  const explanation =
    currentSolution?.explanation ??
    currentSolution?.solution ??
    currentQ?.explanation ??
    getChoiceExplanation(currentQ);

  const questionText = currentQ?.question_text ?? currentQ?.text ?? currentQ?.statement ?? '';
  const questionType = currentQ?.question_type ?? currentQ?.type ?? 'MCQ';
  const marksCorrect = Number(currentQ?.max_score ?? currentQ?.marks_correct ?? 4);
  const marksIncorrect = Number(currentQ?.marks_incorrect ?? -1);

  const getOptionState = (optId: string) => {
    const isCorrectOpt = correctAnswers.includes(optId);
    const isSelected   = userAnswer.includes(optId);
    if (isCorrectOpt) return 'correct';
    if (isSelected && !isCorrectOpt) return 'wrong';
    return 'neutral';
  };

  const getDotColor = (idx: number) => {
    const q = allQuestions[idx];
    if (q?.outcome === 'correct') return GREEN;
    if (q?.outcome === 'wrong')   return RED;
    if (q?.outcome === 'skipped' || q?.outcome === 'unattempted') return GRAY;

    const qid = getQuestionId(q);
    const ua = (qid != null && answers[String(qid)]?.length)
      ? answers[String(qid)]
      : selectedIdsFor(q);
    if (ua.length === 0) return GRAY;
    const ca = correctIdsFor(q);
    const ok = ca.length === ua.length && ca.every((a: string) => ua.includes(a));
    return ok ? GREEN : RED;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Results</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Solution Viewer</Text>
          <Text style={styles.headerSub}>Review answers & explanations</Text>
        </View>
        <Text style={styles.headerCounter}>Q {currentIndex + 1}/{totalQ}</Text>
      </View>

      {/* Top strip navigator (narrow screens only) */}
      {!isWide && (
        <View style={styles.navigator}>
          <View style={styles.navigatorTitleRow}>
            <Text style={styles.navigatorTitle}>QUESTION NAVIGATOR</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: GREEN }]} />
                <Text style={styles.legendText}>Correct</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: RED }]} />
                <Text style={styles.legendText}>Wrong</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#D1D5DB' }]} />
                <Text style={styles.legendText}>Skipped</Text>
              </View>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.numbersScroll}
            contentContainerStyle={styles.numbersRow}
          >
            {allQuestions.map((_: any, idx: number) => {
              const dotColor = getDotColor(idx);
              const isSkippedQ = dotColor === GRAY;
              const fillColor = isSkippedQ ? '#F3F4F6' : dotColor;
              const borderColor = isSkippedQ ? '#E5E7EB' : dotColor;
              const active = idx === currentIndex;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.numberBox,
                    { backgroundColor: fillColor, borderColor },
                    active && styles.numberBoxActive,
                    active && { borderColor: ACCENT_BORDER },
                  ]}
                  onPress={() => setCurrentIndex(idx)}
                >
                  <Text
                    style={[
                      styles.numberText,
                      !isSkippedQ && styles.numberTextOnColor,
                    ]}
                  >
                    {idx + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={isWide ? styles.bodyRow : styles.body}>
        {/* Main column */}
        <View style={styles.mainCol}>
          <View style={styles.qMetaBar}>
            <Text style={styles.qMetaLeft}>Q {currentIndex + 1} of {totalQ}</Text>
            <View style={styles.qTypeBadge}>
              <Text style={styles.qTypeText}>
                {String(questionType).toUpperCase()}
              </Text>
            </View>
            <View style={styles.marksInline}>
              {isSkipped ? (
                <>
                  <Text style={[styles.marksEarned, styles.marksEarnedSkipped]}>0</Text>
                  <Text style={styles.marksTotal}>/{marksCorrect}</Text>
                </>
              ) : isCorrect ? (
                <>
                  <Text style={[styles.marksEarned, styles.marksEarnedCorrect]}>+{marksCorrect}</Text>
                  <Text style={styles.marksTotal}>/{marksCorrect}</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.marksEarned, styles.marksEarnedWrong]}>{marksIncorrect}</Text>
                  <Text style={styles.marksTotal}>/{marksCorrect}</Text>
                </>
              )}
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {currentQ?.sectionName && (
              <View style={styles.sectionChip}>
                <Text style={styles.sectionChipText}>{currentQ.sectionName}</Text>
              </View>
            )}

            <Text style={styles.questionText}>{stripHtml(questionText)}</Text>

            {sortedChoices.map((opt: any, idx: number) => {
              const optId = String(opt?.id ?? opt?.value ?? idx);
              const state = getOptionState(optId);
              const letter = String.fromCharCode(65 + idx);
              return (
                <View
                  key={optId}
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
                      {letter}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      state === 'correct' && { color: '#166534', fontWeight: '600' },
                      state === 'wrong'   && { color: '#991B1B', fontWeight: '600' },
                    ]}
                  >
                    {stripHtml(opt?.text ?? opt?.label)}
                  </Text>
                  {state === 'correct' && <Text style={{ fontSize: 16, color: GREEN }}>✓</Text>}
                  {state === 'wrong'   && <Text style={{ fontSize: 16, color: RED }}>✗</Text>}
                </View>
              );
            })}

            {!isSkipped && (
              <View
                style={[
                  styles.statusBadge,
                  isCorrect ? styles.statusCorrect : styles.statusWrong,
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </Text>
              </View>
            )}
            {isSkipped && (
              <View style={[styles.statusBadge, styles.statusSkipped]}>
                <Text style={styles.statusBadgeText}>— Skipped</Text>
              </View>
            )}

            <View style={styles.explanationCard}>
              <View style={styles.explanationHeader}>
                <View style={styles.explanationBadge}>
                  <Text style={styles.explanationBadgeText}>
                    {(() => {
                      if (!correctAnswers[0] || sortedChoices.length === 0) return '?';
                      const idx = sortedChoices.findIndex((o: any) => String(o?.id) === String(correctAnswers[0]));
                      return idx >= 0 ? String.fromCharCode(65 + idx) : '?';
                    })()}
                  </Text>
                </View>
                <Text style={styles.explanationLabel}>EXPLANATION</Text>
                {typeof explanation === 'object' && explanation?.steps && (
                  <View style={styles.stepsChip}>
                    <Text style={styles.stepsChipText}>{explanation.steps.length} steps</Text>
                  </View>
                )}
              </View>

              {typeof explanation === 'object' && explanation?.steps?.map((step: any, i: number) => (
                <View key={i} style={styles.explanationStep}>
                  <Text style={styles.stepLabel}>Step {i + 1}. {stripHtml(step.title)}</Text>
                  <Text style={styles.stepBody}>{stripHtml(step.body)}</Text>
                </View>
              ))}

              {typeof explanation === 'object' && explanation?.summary && (
                <Text style={styles.explanationSummary}>{stripHtml(explanation.summary)}</Text>
              )}

              {typeof explanation === 'string' && (
                <Text style={styles.stepBody}>{stripHtml(explanation)}</Text>
              )}

              {!explanation && (
                <Text style={[styles.stepBody, { color: GRAY, fontStyle: 'italic' }]}>
                  No explanation available for this question.
                </Text>
              )}
            </View>
          </ScrollView>
        </View>

        {isWide && (
          <View style={styles.rightPanel}>
            <Text style={styles.rightPanelTitle}>QUESTION NAVIGATOR</Text>
            <View style={styles.rightPanelLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: GREEN }]} />
                <Text style={styles.legendText}>Correct</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: RED }]} />
                <Text style={styles.legendText}>Wrong</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#D1D5DB' }]} />
                <Text style={styles.legendText}>Skipped</Text>
              </View>
            </View>
            <Text style={styles.rightPanelSection}>QUESTIONS</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.rightPanelGrid}>
                {allQuestions.map((_: any, idx: number) => {
                  const dotColor = getDotColor(idx);
                  const isSkippedQ = dotColor === GRAY;
                  const fillColor = isSkippedQ ? '#F3F4F6' : dotColor;
                  const borderColor = isSkippedQ ? '#E5E7EB' : dotColor;
                  const active = idx === currentIndex;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.numberBox,
                        { backgroundColor: fillColor, borderColor, width: 40, height: 40 },
                        active && styles.numberBoxActive,
                        active && { borderColor: ACCENT_BORDER },
                      ]}
                      onPress={() => setCurrentIndex(idx)}
                    >
                      <Text
                        style={[
                          styles.numberText,
                          !isSkippedQ && styles.numberTextOnColor,
                        ]}
                      >
                        {idx + 1}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}
      </View>

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
 