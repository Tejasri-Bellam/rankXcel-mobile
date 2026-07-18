import {
  askAssessmentTutorService,
  getassessmentReviewService,
  getassessmentSolutionsService,
} from '@/src/libs/services/assessments-attempts';
import { stripHtml } from '@/src/libs/utils/html';
import TutorModal from '@/src/components/common/TutorModal';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import Toast, { useToast } from '@/src/components/common/Toast';
import { getErrorMessage } from '@/src/libs/utils/apiError';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { solutionViewerStyles as styles } from '@/src/styles/styles/assessments/solutionviewerstyles';

interface Props {
  attemptId: number;
  answers: Record<string, string[]>;
  onBack: () => void;
}

const getQuestionId = (q: any): string | number | undefined =>
  q?.question_id ?? q?.id;

const getChoices = (q: any): any[] =>
  Array.isArray(q?.choices) ? q.choices : Array.isArray(q?.options) ? q.options : [];

const correctIdsFor = (q: any): string[] => {
  const topLevel = q?.correct_answers ?? q?.correct_options ?? q?.correct_choice_ids ?? null;
  if (Array.isArray(topLevel) && topLevel.length > 0)
    return topLevel.map((v: any) => String(v?.id ?? v));
  return getChoices(q)
    .filter((o: any) => o?.is_correct === true || o?.correct === true)
    .map((o: any) => String(o.id));
};

// Correct option ids, falling back to the per-question solution payload —
// the review response often omits the correct flags for skipped questions.
const correctIdsWithSolution = (q: any, sol: any): string[] => {
  const fromQ = correctIdsFor(q);
  if (fromQ.length > 0) return fromQ;
  if (!sol) return [];
  const top =
    sol?.correct_answers ?? sol?.correct_options ?? sol?.correct_choice_ids ?? null;
  if (Array.isArray(top) && top.length > 0)
    return top.map((v: any) => String(v?.id ?? v));
  return correctIdsFor(sol);
};

const selectedIdsFor = (q: any): string[] => {
  const raw =
    q?.your_answer?.selected_choice_ids ??
    q?.selected_choice_ids ??
    q?.selected_options ??
    [];
  return (Array.isArray(raw) ? raw : []).map((v: any) => String(v?.id ?? v));
};

const choiceExplanationFor = (q: any): string | null => {
  const correct = getChoices(q).find((c: any) => c?.is_correct === true);
  return correct?.explanation ? String(correct.explanation) : null;
};

// Numeric correct answer, checking scalar fields first, then falling back to
// the correct choice's `text` (mirrors correctIdsWithSolution's MCQ fallback),
// then the per-question /solutions/ payload if the review response omits it.
const numericAnswerWithSolution = (q: any, sol: any): string => {
  const scalar = q?.correct_answer ?? q?.correct_numeric_answer ?? null;
  if (scalar != null && String(scalar).trim() !== '') return String(scalar).trim();

  const flagged = getChoices(q).find(
    (c: any) => c?.is_correct === true || c?.correct === true,
  );
  const fromChoice = flagged?.text ?? flagged?.label;
  if (fromChoice != null && String(fromChoice).trim() !== '') return String(fromChoice).trim();

  if (!sol) return '';
  const solScalar = sol?.correct_answer ?? sol?.correct_numeric_answer ?? null;
  if (solScalar != null && String(solScalar).trim() !== '') return String(solScalar).trim();
  const solFlagged = getChoices(sol).find(
    (c: any) => c?.is_correct === true || c?.correct === true,
  );
  const solText = solFlagged?.text ?? solFlagged?.label;
  return solText != null ? String(solText).trim() : '';
};

export default function SolutionViewer({ attemptId, answers, onBack }: Props) {
  const [reviewData, setReviewData] = useState<any>(null);
  const [solutionsMap, setSolutionsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [tutorQ, setTutorQ] = useState<{ id?: string | number; text: string } | null>(null);
  const { toast, showToast, hideToast } = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadReview(); }, []);

  const questions: any[] = useMemo(() => reviewData?.questions ?? [], [reviewData]);

  const loadReview = async () => {
    try {
      setLoading(true);
      const res = await getassessmentReviewService(attemptId);
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
          if (qid != null && r.status === 'fulfilled' && (r.value as any)?.data)
            map[String(qid)] = (r.value as any).data;
        });
        setSolutionsMap(map);
      }
    } catch (err) {
      console.log('REVIEW ERROR:', err);
      showToast(getErrorMessage(err, "Couldn't load solutions."), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEEFF5' }}>
        <ActivityIndicator size="large" color='#6C63FF' />
        <Text style={{ marginTop: 12, color: '#9CA3AF' }}>Loading solutions…</Text>
      </SafeAreaView>
    );
  }

  if (!reviewData || questions.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEEFF5' }}>
        <Text style={{ color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 24 }}>
          Solutions are not available for this assessment.
        </Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={{ color: '#6C63FF', fontWeight: '600' }}>← Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color='#6C63FF' />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {questions.map((q: any, qIdx: number) => {
          const qid = getQuestionId(q);
          const currentSolution = qid != null ? solutionsMap[String(qid)] : null;
          const correctAnswers = correctIdsWithSolution(q, currentSolution);
          const apiSelected = selectedIdsFor(q);
          const userAnswer =
            qid != null && answers[String(qid)]?.length ? answers[String(qid)] : apiSelected;

          const questionType = q?.question_type ?? q?.type ?? 'MCQ';
          const isNumericQ = String(questionType).toUpperCase().includes('NUMERIC');

          const numericUser = isNumericQ
            ? String(
              (qid != null && answers[String(qid)]?.[0]) ??
              q?.your_answer?.numeric_answer ??
              q?.numeric_answer ??
              '',
            ).trim()
            : '';
          const numericCorrect = isNumericQ
            ? numericAnswerWithSolution(q, currentSolution)
            : '';

          const attempted = isNumericQ ? numericUser !== '' : userAnswer.length > 0;

          const isCorrect =
            q?.outcome === 'correct' ||
            (q?.outcome == null &&
              (isNumericQ
                ? attempted && numericCorrect !== '' && numericUser === numericCorrect
                : userAnswer.length > 0 &&
                correctAnswers.length === userAnswer.length &&
                correctAnswers.every((a: string) => userAnswer.includes(a))));

          const isSkipped =
            q?.outcome === 'skipped' ||
            q?.outcome === 'unattempted' ||
            (q?.outcome == null && !attempted);

          const explanation =
            currentSolution?.explanation ??
            currentSolution?.solution ??
            q?.explanation ??
            choiceExplanationFor(q);

          const questionText = q?.question_text ?? q?.text ?? q?.statement ?? '';
          const sortedChoices = [...getChoices(q)].sort(
            (a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0)
          );

          const getOptState = (optId: string) => {
            if (correctAnswers.includes(optId)) return 'correct';
            if (userAnswer.includes(optId)) return 'wrong';
            return 'neutral';
          };

          return (
            <View key={qIdx} style={styles.questionCard}>
              {/* Q label + outcome */}
              <View style={styles.qCardHeader}>
                <Text style={styles.qCardNum}>Q{qIdx + 1}</Text>
                {isSkipped ? (
                  <View style={styles.outcomeBadge}>
                    <Text style={styles.outcomeBadgeText}>— Skipped</Text>
                  </View>
                ) : isCorrect ? (
                  <View style={[styles.outcomeBadge, styles.outcomeBadgeCorrect]}>
                    <Ionicons name="checkmark" size={12} color="#22C55E" />
                    <Text style={[styles.outcomeBadgeText, { color: '#22C55E' }]}>Correct</Text>
                  </View>
                ) : (
                  <View style={[styles.outcomeBadge, styles.outcomeBadgeWrong]}>
                    <Ionicons name="close" size={12} color="#EF4444" />
                    <Text style={[styles.outcomeBadgeText, { color: '#EF4444' }]}>Wrong</Text>
                  </View>
                )}
              </View>

              {/* Assertion-Reason statements */}
              {!!q?.assertion_text && (
                <View style={styles.arCard}>
                  <Text style={styles.arLabel}>Assertion (A)</Text>
                  <Text style={styles.arText}>{stripHtml(q.assertion_text)}</Text>
                </View>
              )}
              {!!q?.reason_text && (
                <View style={styles.arCard}>
                  <Text style={styles.arLabel}>Reason (R)</Text>
                  <Text style={styles.arText}>{stripHtml(q.reason_text)}</Text>
                </View>
              )}

              {/* Question text */}
              <Text style={styles.qCardText}>{stripHtml(questionText)}</Text>

              {/* Question image */}
              {q?.image ? (
                <Image source={{ uri: q.image }} style={styles.qCardImage} resizeMode="contain" />
              ) : null}

              {/* Numeric answer comparison */}
              {isNumericQ ? (
                <View style={styles.numericRow}>
                  <View style={[styles.numericBox, styles.numericBoxUser]}>
                    <Text style={styles.numericBoxLabel}>Your answer</Text>
                    <Text style={styles.numericBoxValue}>{numericUser || '—'}</Text>
                  </View>
                  <View style={[styles.numericBox, styles.numericBoxCorrect]}>
                    <Text style={styles.numericBoxLabel}>Correct answer</Text>
                    <Text style={[styles.numericBoxValue, { color: '#166534' }]}>
                      {numericCorrect || '—'}
                    </Text>
                  </View>
                </View>
              ) : (
                sortedChoices.map((opt: any, idx: number) => {
                  const optId = String(opt?.id ?? opt?.value ?? idx);
                  const state = getOptState(optId);
                  const letter = String.fromCharCode(65 + idx);
                  const optLabel = stripHtml(opt?.text ?? opt?.label ?? '');
                  return (
                    <View
                      key={optId}
                      style={[
                        styles.optRow,
                        state === 'correct' && styles.optRowCorrect,
                        state === 'wrong' && styles.optRowWrong,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optLetter,
                          state === 'correct' && styles.optLetterCorrect,
                          state === 'wrong' && styles.optLetterWrong,
                        ]}
                      >
                        {letter}
                      </Text>
                      <View style={styles.optBody}>
                        {optLabel ? (
                          <Text
                            style={[
                              styles.optText,
                              state === 'correct' && { color: '#166534', fontWeight: '600' },
                              state === 'wrong' && { color: '#991B1B', fontWeight: '600' },
                            ]}
                          >
                            {optLabel}
                          </Text>
                        ) : null}
                        {opt?.image ? (
                          <Image source={{ uri: opt.image }} style={styles.optImage} resizeMode="contain" />
                        ) : null}
                      </View>
                      {state === 'correct' && (
                        <Ionicons name="checkmark" size={16} color="#22C55E" style={{ marginLeft: 'auto' }} />
                      )}
                      {state === 'wrong' && (
                        <Ionicons name="close" size={16} color="#EF4444" style={{ marginLeft: 'auto' }} />
                      )}
                    </View>
                  );
                })
              )}

              {/* Why / explanation */}
              {explanation && (
                <View style={styles.whyBox}>
                  <Text style={styles.whyText}>
                    <Text style={styles.whyLabel}>Why: </Text>
                    {typeof explanation === 'string'
                      ? stripHtml(explanation)
                      : explanation?.summary
                        ? stripHtml(explanation.summary)
                        : 'See explanation above.'}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <TutorModal
        visible={tutorQ !== null}
        onClose={() => setTutorQ(null)}
        questionId={tutorQ?.id}
        questionText={tutorQ?.text}
        ask={(payload) => askAssessmentTutorService(attemptId, payload)}
      />
      <Toast {...toast} onHide={hideToast} />
    </SafeAreaView>
  );
}

