import {
  askAssessmentTutorService,
  getassessmentReviewService,
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
// the correct choice's `text` (mirrors correctIdsFor's MCQ fallback).
const numericAnswerFor = (q: any): string => {
  const scalar = q?.correct_answer ?? q?.correct_numeric_answer ?? null;
  if (scalar != null && String(scalar).trim() !== '') return String(scalar).trim();

  const flagged = getChoices(q).find(
    (c: any) => c?.is_correct === true || c?.correct === true,
  );
  const fromChoice = flagged?.text ?? flagged?.label;
  return fromChoice != null ? String(fromChoice).trim() : '';
};

export default function SolutionViewer({ attemptId, answers, onBack }: Props) {
  const [reviewData, setReviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tutorQ, setTutorQ] = useState<{ id?: string | number; text: string } | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const { toast, showToast, hideToast } = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadReview(); }, []);

  const toggleExplanation = (key: string) => {
    setExpandedExplanations((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const questions: any[] = useMemo(() => reviewData?.questions ?? [], [reviewData]);

  const loadReview = async () => {
    try {
      setLoading(true);
      const res = await getassessmentReviewService(attemptId);
      const data: any = res?.data ?? null;
      setReviewData(data);
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
          const correctAnswers = correctIdsFor(q);
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
          const numericCorrect = isNumericQ ? numericAnswerFor(q) : '';

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
                <View style={styles.numericAnswerBlock}>
                  {isCorrect ? (
                    // Correct: only show what the user answered
                    <Text style={styles.numericAnswerLine}>
                      <Text style={styles.numericAnswerLabel}>Your answer: </Text>
                      <Text style={styles.numericAnswerValueCorrect}>{numericUser || '—'}</Text>
                    </Text>
                  ) : isSkipped ? (
                    // Skipped: nothing was entered, just show the correct answer
                    <Text style={styles.numericAnswerLine}>
                      <Text style={styles.numericAnswerLabel}>Correct answer: </Text>
                      <Text style={styles.numericAnswerValueCorrect}>{numericCorrect || '—'}</Text>
                    </Text>
                  ) : (
                    // Wrong: show both, so the user can compare
                    <>
                      <Text style={styles.numericAnswerLine}>
                        <Text style={styles.numericAnswerLabel}>Your answer: </Text>
                        <Text style={styles.numericAnswerValueWrong}>{numericUser || '—'}</Text>
                      </Text>
                      <Text style={styles.numericAnswerLine}>
                        <Text style={styles.numericAnswerLabel}>Correct answer: </Text>
                        <Text style={styles.numericAnswerValueCorrect}>{numericCorrect || '—'}</Text>
                      </Text>
                    </>
                  )}
                </View>
              ) : (
                sortedChoices.map((opt: any, idx: number) => {
                  const optId = String(opt?.id ?? opt?.value ?? idx);
                  const state = getOptState(optId);
                  const selected = userAnswer.includes(optId);
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
                      <View style={styles.optTrailing}>
                        {selected && (
                          <View style={styles.youBadge}>
                            <Text style={styles.youBadgeText}>Your answer</Text>
                          </View>
                        )}
                        {state === 'correct' && (
                          <Ionicons name="checkmark" size={16} color="#22C55E" />
                        )}
                        {state === 'wrong' && (
                          <Ionicons name="close" size={16} color="#EF4444" />
                        )}
                      </View>
                    </View>
                  );
                })
              )}

              {/* Why / explanation */}
              {explanation && (() => {
                let exp = explanation;
                if (typeof exp === 'string') {
                  try {
                    const parsed = JSON.parse(exp);
                    if (parsed && typeof parsed === 'object') exp = parsed;
                  } catch {
                    // not JSON — leave as plain string
                  }
                }

                const explKey = String(qid ?? qIdx);
                const isOpen = !!expandedExplanations[explKey];
                const steps = Array.isArray(exp?.steps) ? exp.steps : null;

                return (
                  <View style={styles.whyBox}>
                    <TouchableOpacity
                      style={styles.whyToggleRow}
                      activeOpacity={0.7}
                      onPress={() => toggleExplanation(explKey)}
                    >
                      <Text style={styles.whyToggleLabel}>Explanation</Text>
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#6C63FF"
                      />
                    </TouchableOpacity>

                    {isOpen && (
                      <View style={styles.whyBody}>
                        {steps && steps.length > 0 ? (
                          <>
                            {exp?.summary ? (
                              <Text style={styles.whySummary}>{stripHtml(exp.summary)}</Text>
                            ) : null}
                            {steps.map((s: any, i: number) => (
                              <View key={s?.step_number ?? i} style={styles.whyStepBlock}>
                                <Text style={styles.whyStepHeading}>
                                  Step {s?.step_number ?? i + 1}
                                  {s?.heading ? `. ${stripHtml(s.heading)}` : ''}
                                </Text>
                                {s?.explanation ? (
                                  <Text style={styles.whyStepText}>{stripHtml(s.explanation)}</Text>
                                ) : null}
                              </View>
                            ))}
                            {exp?.conclusion ? (
                              <Text style={styles.whyConclusion}>{stripHtml(exp.conclusion)}</Text>
                            ) : null}
                          </>
                        ) : (
                          <Text style={styles.whyText}>
                            {typeof exp === 'string'
                              ? stripHtml(exp)
                              : exp?.summary
                                ? stripHtml(exp.summary)
                                : 'See explanation above.'}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })()}
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

