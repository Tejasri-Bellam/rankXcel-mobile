import {
  askAssessmentTutorService,
  getassessmentReviewService,
} from '@/src/libs/services/assessments-attempts';
import { hasRichContent } from '@/src/libs/utils/richContent';
import { numericAnswersEqual } from '@/src/libs/utils/numericAnswer';
import RichContent from '@/src/components/common/RichContent';
import TutorModal from '@/src/components/common/TutorModal';
import FlagQuestionModal, { FlagChoiceOption } from '@/src/components/common/FlagQuestionModal';
import QuestionReportHistory from '@/src/components/common/QuestionReportHistory';
import ReviewFilterTabs, {
  ReviewFilter,
  ReviewFilterEmpty,
} from '@/src/components/common/ReviewFilterTabs';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import Toast, { useToast } from '@/src/components/common/Toast';
import { getErrorMessage } from '@/src/libs/utils/apiError';
import {
  ActivityIndicator,
  FlatList,
  Image,
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

// Everything the review card needs to know about a question's outcome. Derived
// once per question so the filter tabs and the card agree on the verdict.
const deriveOutcome = (q: any, answers: Record<string, string[]>) => {
  const qid = getQuestionId(q);
  const correctAnswers = correctIdsFor(q);
  const apiSelected = selectedIdsFor(q);
  const userAnswer =
    qid != null && answers[String(qid)]?.length ? answers[String(qid)] : apiSelected;

  const questionType = q?.question_type ?? q?.type ?? 'MCQ';
  const isNumericQ = String(questionType).toUpperCase().includes('NUMERIC');

  // The server's numeric_answer is what was actually graded, so it wins over
  // the locally-held answer from this session.
  const rawNumericUser =
    q?.your_answer?.numeric_answer ??
    q?.numeric_answer ??
    (qid != null ? answers[String(qid)]?.[0] : undefined);
  const numericUser =
    isNumericQ && rawNumericUser != null ? String(rawNumericUser).trim() : '';
  const numericCorrect = isNumericQ ? numericAnswerFor(q) : '';

  const attempted = isNumericQ ? numericUser !== '' : userAnswer.length > 0;

  // `outcome` is the server's verdict — it already accounts for the grading
  // tolerance on NUMERICAL questions, so trust it whenever it is decisive. It is
  // only re-derived locally when the field is missing or says "skipped" for a
  // question that was in fact answered (a known quirk of /review/ on numeric
  // questions).
  const outcome = String(q?.outcome ?? '').toLowerCase();
  const outcomeIsGraded =
    outcome === 'correct' || outcome === 'wrong' || outcome === 'incorrect';

  const derivedCorrect = isNumericQ
    ? attempted && numericAnswersEqual(numericUser, numericCorrect)
    : userAnswer.length > 0 &&
      correctAnswers.length === userAnswer.length &&
      correctAnswers.every((a: string) => userAnswer.includes(a));

  return {
    correctAnswers,
    userAnswer,
    isNumericQ,
    numericUser,
    numericCorrect,
    isCorrect: outcomeIsGraded ? outcome === 'correct' : derivedCorrect,
    isSkipped: outcomeIsGraded ? false : !attempted,
  };
};

export default function SolutionViewer({ attemptId, answers, onBack }: Props) {
  const [reviewData, setReviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tutorQ, setTutorQ] = useState<{ id?: string | number; text: string } | null>(null);
  // Question being flagged from the review card (null = form closed).
  const [flagQ, setFlagQ] = useState<{
    id?: string | number;
    number: number;
    choices: FlagChoiceOption[];
  } | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const { toast, showToast, hideToast } = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadReview(); }, []);

  const toggleExplanation = (key: string) => {
    setExpandedExplanations((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const questions: any[] = useMemo(() => reviewData?.questions ?? [], [reviewData]);

  // One row per question, carrying its original position so the card keeps its
  // "Q7" label once the list is filtered.
  const rows = useMemo(
    () =>
      questions.map((q: any, index: number) => ({
        q,
        index,
        outcome: deriveOutcome(q, answers),
      })),
    [questions, answers],
  );

  const counts = useMemo(
    () => ({
      all: rows.length,
      correct: rows.filter((r) => !r.outcome.isSkipped && r.outcome.isCorrect).length,
      incorrect: rows.filter((r) => !r.outcome.isSkipped && !r.outcome.isCorrect).length,
      skipped: rows.filter((r) => r.outcome.isSkipped).length,
    }),
    [rows],
  );

  const visibleRows = useMemo(() => {
    if (filter === 'all') return rows;
    if (filter === 'skipped') return rows.filter((r) => r.outcome.isSkipped);
    if (filter === 'correct')
      return rows.filter((r) => !r.outcome.isSkipped && r.outcome.isCorrect);
    return rows.filter((r) => !r.outcome.isSkipped && !r.outcome.isCorrect);
  }, [rows, filter]);

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

      <ReviewFilterTabs value={filter} onChange={setFilter} counts={counts} />

      <FlatList
        data={visibleRows}
        keyExtractor={(item) => String(item.index)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ListEmptyComponent={<ReviewFilterEmpty filter={filter} />}
        // A paper can run to 90 questions and each card can hold several KaTeX
        // WebViews (question + every option). A ScrollView would mount them all
        // at once; FlatList keeps only the cards near the viewport alive.
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        renderItem={({ item: row }) => {
          const { q, index: qIdx } = row;
          const qid = getQuestionId(q);
          const {
            correctAnswers,
            userAnswer,
            isNumericQ,
            numericUser,
            numericCorrect,
            isCorrect,
            isSkipped,
          } = row.outcome;

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
                <View style={styles.qCardHeaderRight}>
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
                  {/* Flag this question — same form as the exam screen's flag. */}
                  <TouchableOpacity
                    style={styles.flagBtn}
                    onPress={() =>
                      setFlagQ({
                        id: qid,
                        number: qIdx + 1,
                        // NUMERICAL questions have no real options — their
                        // single "choice" just carries the answer, so don't
                        // offer it as something to report.
                        choices: isNumericQ
                          ? []
                          : sortedChoices.map((o: any, idx: number) => ({
                              id: String(o?.id ?? idx),
                              label: String.fromCharCode(65 + idx),
                              text: o?.text ?? o?.label ?? '',
                            })),
                      })
                    }
                    activeOpacity={0.7}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons
                      name={q?.is_flagged ? 'flag' : 'flag-outline'}
                      size={15}
                      color={q?.is_flagged ? '#F59E0B' : '#9CA3AF'}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Assertion-Reason statements */}
              {!!q?.assertion_text && (
                <View style={styles.arCard}>
                  <Text style={styles.arLabel}>Assertion (A)</Text>
                  <RichContent html={q.assertion_text} style={styles.arText} />
                </View>
              )}
              {!!q?.reason_text && (
                <View style={styles.arCard}>
                  <Text style={styles.arLabel}>Reason (R)</Text>
                  <RichContent html={q.reason_text} style={styles.arText} />
                </View>
              )}

              {/* Question text */}
              <RichContent html={questionText} style={styles.qCardText} />

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
                  const optHtml = opt?.text ?? opt?.label ?? '';
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
                        {hasRichContent(optHtml) ? (
                          <RichContent
                            html={optHtml}
                            style={[
                              styles.optText,
                              state === 'correct' && { color: '#166534', fontWeight: '600' },
                              state === 'wrong' && { color: '#991B1B', fontWeight: '600' },
                            ]}
                          />
                        ) : null}
                        {opt?.image ? (
                          <Image source={{ uri: opt.image }} style={styles.optImage} resizeMode="contain" />
                        ) : null}
                      </View>
                      {/* Pinned to the option's top-right corner so it never
                          eats into the width available to the option text. */}
                      {selected && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>Your answer</Text>
                        </View>
                      )}
                      <View style={styles.optTrailing}>
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
                              <RichContent html={exp.summary} style={styles.whySummary} />
                            ) : null}
                            {steps.map((s: any, i: number) => (
                              <View key={s?.step_number ?? i} style={styles.whyStepBlock}>
                                {/* The step number and its heading read as one
                                    line; the heading is HTML and can hold math. */}
                                <View style={styles.whyStepHeadingRow}>
                                  <Text style={styles.whyStepHeading}>
                                    Step {s?.step_number ?? i + 1}
                                    {s?.heading ? '. ' : ''}
                                  </Text>
                                  {s?.heading ? (
                                    <RichContent
                                      html={s.heading}
                                      style={styles.whyStepHeading}
                                      containerStyle={styles.whyStepHeadingText}
                                    />
                                  ) : null}
                                </View>
                                {s?.explanation ? (
                                  <RichContent html={s.explanation} style={styles.whyStepText} />
                                ) : null}
                              </View>
                            ))}
                            {exp?.conclusion ? (
                              <RichContent html={exp.conclusion} style={styles.whyConclusion} />
                            ) : null}
                          </>
                        ) : typeof exp === 'string' || exp?.summary ? (
                          <RichContent
                            html={typeof exp === 'string' ? exp : exp.summary}
                            style={styles.whyText}
                          />
                        ) : (
                          <Text style={styles.whyText}>See explanation above.</Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })()}

              {/* Anything this student already flagged on this question, with
                  the team's resolution. Renders nothing when there's none. */}
              <QuestionReportHistory reports={q?.reports} />
            </View>
          );
        }}
      />

      <TutorModal
        visible={tutorQ !== null}
        onClose={() => setTutorQ(null)}
        questionId={tutorQ?.id}
        questionText={tutorQ?.text}
        ask={(payload) => askAssessmentTutorService(attemptId, payload)}
      />
      <FlagQuestionModal
        visible={flagQ !== null}
        onClose={() => setFlagQ(null)}
        questionId={flagQ?.id}
        questionNumber={flagQ?.number}
        choices={flagQ?.choices}
        // Pull the review again so the new report shows up in the history below
        // the question straight away.
        onSubmitted={() => loadReview()}
      />
      <Toast {...toast} onHide={hideToast} />
    </SafeAreaView>
  );
}

