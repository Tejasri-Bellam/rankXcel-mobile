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

const normalizeQuestion = (q: any, sectionName?: string): any | null => {
  const id = q?.id ?? q?.question_id;
  if (id == null) return null;

  const rawChoices: any[] = Array.isArray(q.choices)
    ? q.choices
    : Array.isArray(q.options)
      ? q.options
      : Array.isArray(q.answer_options)
        ? q.answer_options
        : [];

  // Sort by sort_order if present, so A/B/C/D stays consistent with admin order.
  const sortedChoices = [...rawChoices].sort(
    (a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0),
  );

  // correct_answers can come from either a top-level array or be derived
  // from each choice's is_correct flag (the shape /review/ actually returns).
  const correctFromChoices = sortedChoices
    .filter((c: any) => c?.is_correct === true)
    .map((c: any) => String(c.id));
  const correctTopLevel =
    q.correct_answers ?? q.correct_options ?? q.correct_choice_ids ?? null;
  const correct = Array.isArray(correctTopLevel) && correctTopLevel.length > 0
    ? correctTopLevel
    : correctFromChoices;

  // selected_options: prefer top-level fields, fall back to your_answer.selected_choice_ids.
  const selectedRaw =
    q.selected_options ??
    q.selected_choice_ids ??
    q.response?.selected_choice_ids ??
    q.your_answer?.selected_choice_ids ??
    [];

  // Explanation: top-level, or pull from the correct choice's explanation.
  const correctChoice = sortedChoices.find((c: any) => c?.is_correct === true);
  const choiceExplanation = correctChoice?.explanation
    ? stripHtml(correctChoice.explanation)
    : null;

  return {
    id,
    text: stripHtml(q.question_text ?? q.text ?? q.statement ?? ''),
    type: q.question_type ?? q.type ?? 'MCQ',
    options: sortedChoices.map((c: any) => ({
      id: String(c?.id ?? c?.value ?? ''),
      text: stripHtml(c?.text ?? c?.label ?? String(c ?? '')),
    })),
    marks_correct: Number(q.max_score ?? q.marks_correct ?? 4),
    marks_incorrect: Number(
      q.marks_incorrect ?? q.marks_wrong ?? q.negative_marks ?? -1,
    ),
    correct_answers: correct.map((v: any) => String(v)),
    selected_options: (Array.isArray(selectedRaw) ? selectedRaw : []).map((v: any) => String(v)),
    explanation: q.explanation || choiceExplanation || null,
    sectionName: sectionName ?? q.subject_name ?? q.subject ?? null,
    outcome: q.outcome ?? null,
    score_earned: q.score_earned ?? null,
  };
};

const looksLikeQuestion = (o: any): boolean =>
  !!o && typeof o === 'object' && (o.id != null || o.question_id != null) &&
  (typeof o.question_text === 'string' ||
    typeof o.text === 'string' ||
    typeof o.statement === 'string' ||
    Array.isArray(o.choices) ||
    Array.isArray(o.options));

const findQuestionsArray = (node: any, depth = 0): any[] | null => {
  if (!node || depth > 6) return null;
  if (Array.isArray(node) && node.length > 0 && node.every(looksLikeQuestion)) return node;
  if (typeof node === 'object') {
    for (const key of Object.keys(node)) {
      const found = findQuestionsArray(node[key], depth + 1);
      if (found) return found;
    }
  }
  return null;
};

const extractQuestionsFromReview = (raw: any): any[] => {
  if (!raw) return [];
  // 1) Pre-grouped sections (assessments shape).
  if (Array.isArray(raw?.sections) && raw.sections.length > 0) {
    return raw.sections.flatMap((s: any) =>
      (s.questions ?? s.question ?? [])
        .map((q: any) => normalizeQuestion(q, s?.name ?? s?.subject_name))
        .filter(Boolean),
    );
  }
  // 2) Flat list at common keys.
  for (const key of ['questions', 'results', 'question_breakdown', 'data']) {
    const arr = raw?.[key];
    if (Array.isArray(arr) && arr.length > 0 && arr.every(looksLikeQuestion)) {
      return arr.map((q: any) => normalizeQuestion(q)).filter(Boolean);
    }
  }
  // 3) Anywhere nested.
  const found = findQuestionsArray(raw);
  if (found) return found.map((q) => normalizeQuestion(q)).filter(Boolean);
  return [];
};

export default function MockSolutionViewer({ mockId, answers, onBack }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const [reviewData, setReviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [solutionsMap, setSolutionsMap] = useState<Record<string, any>>({});

  useEffect(() => { loadReview(); }, []);

  const allQuestions = useMemo(
    () => extractQuestionsFromReview(reviewData),
    [reviewData]
  );

  const totalQ = allQuestions.length;

  const loadReview = async () => {
    try {
      setLoading(true);
      const res = await getMockTestReviewService(mockId);
      console.log('MOCK REVIEW API:', JSON.stringify(res, null, 2));
      // The API wrapper may return { data: ... } or the payload directly.
      const data: any = (res as any)?.data ?? res ?? null;
      setReviewData(data);

      const qs = extractQuestionsFromReview(data);
      console.log(
        'MOCK NORMALIZED QUESTIONS:',
        qs.length,
        qs[0] ? {
          id: qs[0].id,
          textPreview: qs[0].text?.slice(0, 60),
          options: qs[0].options?.length,
          correct: qs[0].correct_answers,
          selected: qs[0].selected_options,
          outcome: qs[0].outcome,
        } : 'no questions',
      );
      if (qs.length > 0) {
        const results = await Promise.allSettled(
          qs.map((q: any) => getQuestionSolutionService(q.id))
        );
        const map: Record<string, any> = {};
        qs.forEach((q: any, i: number) => {
          const r = results[i];
          if (r.status === 'fulfilled' && (r.value as any)?.data) {
            map[String(q.id)] = (r.value as any).data;
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

  // Prefer answers from props (just-submitted exam), fall back to API selected_options.
  const userAnswer = (answers[currentQ?.id] && answers[currentQ.id].length > 0)
    ? answers[currentQ.id]
    : currentQ?.selected_options ?? [];

  const correctAnswers: string[] = currentQ?.correct_answers ?? [];

  // Prefer the API's outcome — authoritative.
  const isCorrect = currentQ?.outcome === 'correct' ||
    (currentQ?.outcome == null &&
      correctAnswers.length === userAnswer.length &&
      correctAnswers.every((a: string) => userAnswer.includes(a)));
  const isSkipped = currentQ?.outcome === 'skipped' ||
    currentQ?.outcome === 'unattempted' ||
    (currentQ?.outcome == null && userAnswer.length === 0);

  const currentSolution = solutionsMap[String(currentQ?.id)];
  const explanation = currentSolution?.explanation ?? currentSolution?.solution ?? currentQ?.explanation ?? null;

  const getOptionState = (optId: string) => {
    const isCorrectOpt = correctAnswers.includes(optId);
    const isSelected   = userAnswer.includes(optId);
    if (isCorrectOpt) return 'correct';
    if (isSelected && !isCorrectOpt) return 'wrong';
    return 'neutral';
  };

  const getDotColor = (idx: number) => {
    const q = allQuestions[idx];
    // Prefer the API's outcome field if present — authoritative.
    if (q?.outcome === 'correct') return GREEN;
    if (q?.outcome === 'wrong')   return RED;
    if (q?.outcome === 'skipped' || q?.outcome === 'unattempted') return GRAY;

    const ua = (answers[q.id]?.length ? answers[q.id] : q.selected_options) ?? [];
    if (ua.length === 0) return GRAY;
    const ca = q.correct_answers ?? [];
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
                {String(currentQ?.type ?? 'MCQ').toUpperCase()}
              </Text>
            </View>
            <View style={styles.marksInline}>
              {(() => {
                const mc = Number(currentQ?.marks_correct ?? 4);
                const mi = Number(currentQ?.marks_incorrect ?? -1);
                if (isSkipped) {
                  return (
                    <>
                      <Text style={[styles.marksEarned, styles.marksEarnedSkipped]}>0</Text>
                      <Text style={styles.marksTotal}>/{mc}</Text>
                    </>
                  );
                }
                if (isCorrect) {
                  return (
                    <>
                      <Text style={[styles.marksEarned, styles.marksEarnedCorrect]}>+{mc}</Text>
                      <Text style={styles.marksTotal}>/{mc}</Text>
                    </>
                  );
                }
                return (
                  <>
                    <Text style={[styles.marksEarned, styles.marksEarnedWrong]}>{mi}</Text>
                    <Text style={styles.marksTotal}>/{mc}</Text>
                  </>
                );
              })()}
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

            <Text style={styles.questionText}>{stripHtml(currentQ?.text)}</Text>

            {currentQ?.options?.map((opt: any, idx: number) => {
              const state = getOptionState(String(opt.id));
              const letter = String.fromCharCode(65 + idx);
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
                    {stripHtml(opt.text)}
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
                      if (!correctAnswers[0] || !Array.isArray(currentQ?.options)) return '?';
                      const idx = currentQ.options.findIndex((o: any) => String(o.id) === String(correctAnswers[0]));
                      return idx >= 0 ? String.fromCharCode(65 + idx) : '?';
                    })()}
                  </Text>
                </View>
                <Text style={styles.explanationLabel}>EXPLANATION</Text>
                {explanation?.steps && (
                  <View style={styles.stepsChip}>
                    <Text style={styles.stepsChipText}>{explanation.steps.length} steps</Text>
                  </View>
                )}
              </View>

              {explanation?.steps?.map((step: any, i: number) => (
                <View key={i} style={styles.explanationStep}>
                  <Text style={styles.stepLabel}>Step {i + 1}. {stripHtml(step.title)}</Text>
                  <Text style={styles.stepBody}>{stripHtml(step.body)}</Text>
                </View>
              ))}

              {explanation?.summary && (
                <Text style={styles.explanationSummary}>{stripHtml(explanation.summary)}</Text>
              )}

              {!explanation?.steps && typeof explanation === 'string' && (
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
