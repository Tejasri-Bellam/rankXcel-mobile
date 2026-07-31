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
import { Ionicons } from '@expo/vector-icons';
import { solutionViewerStyles as styles } from '@/src/styles/styles/mock/solutionviewerstyles';
import {
  getConversationMessagesService,
  getMockQuestionConversationService,
  getMockTestReviewService,
  getMockAttemptReviewService,
  getQuestionSolutionService,
  sendConversationMessageService,
  startMockQuestionConversationService,
} from '../../libs/services/mock-library';
import { hasRichContent } from '../../libs/utils/richContent';
import { numericAnswersEqual } from '../../libs/utils/numericAnswer';
import RichContent from '../common/RichContent';
import TutorModal, { ConversationApi } from '@/src/components/common/TutorModal';
import FlagQuestionModal, { FlagChoiceOption } from '@/src/components/common/FlagQuestionModal';
import QuestionReportHistory from '@/src/components/common/QuestionReportHistory';

interface Props {
  mockId: number | string;
  // When set, the attempt-based /review/ endpoint is used; otherwise it falls
  // back to the mock-based one.
  attemptId?: number | string | null;
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

// Numeric correct answer: scalar fields first, then the correct choice's
// `text` (NUMERIC questions can come back as a choices array), then the
// per-question /solutions/ payload if the review response omits it.
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



const selectedIdsFor = (q: any): string[] => {
  const raw =
    q?.your_answer?.selected_choice_ids ??
    q?.selected_options ??
    q?.selected_choice_ids ??
    q?.response?.selected_choice_ids ??
    [];
  return (Array.isArray(raw) ? raw : []).map((v: any) => String(v?.id ?? v));
};

export default function MockSolutionViewer({ mockId, attemptId, answers, onBack }: Props) {
  const [reviewData, setReviewData] = useState<any>(null);
  const [solutionsMap, setSolutionsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [tutorQ, setTutorQ] = useState<{ id?: string | number; text: string } | null>(null);
  // Question being flagged from the review card (null = form closed).
  const [flagQ, setFlagQ] = useState<{
    id?: string | number;
    number: number;
    choices: FlagChoiceOption[];
  } | null>(null);
  const { toast, showToast, hideToast } = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadReview(); }, []);

  // Conversation-based tutor for the selected question. Memoized per question so
  // the modal's init effect doesn't re-run on every render.
  const tutorConversation = useMemo<ConversationApi | undefined>(() => {
    const qid = tutorQ?.id;
    if (qid == null) return undefined;
    return {
      open: async () => {
        // Start (or ensure) the conversation, then read back its id.
        try {
          await startMockQuestionConversationService(mockId, qid);
        } catch (err) {
          console.log('TUTOR START ERROR:', err);
        }
        return getMockQuestionConversationService(mockId, qid);
      },
      loadHistory: (cid) => getConversationMessagesService(cid),
      send: (cid, message) => sendConversationMessageService(cid, message),
    };
  }, [mockId, tutorQ?.id]);

  const questions: any[] = useMemo(() => reviewData?.questions ?? [], [reviewData]);

  const loadReview = async () => {
    try {
      setLoading(true);
      const res =
        attemptId != null
          ? await getMockAttemptReviewService(attemptId)
          : await getMockTestReviewService(mockId);
      const data: any = res?.data ?? null;
      setReviewData(data);
      if (data) {
        const qs = data?.questions ?? [];
        const results = await Promise.allSettled(
          qs.map((q: any) => {
            const qid = getQuestionId(q);
            return qid != null ? getQuestionSolutionService(qid) : Promise.reject();
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
          Solutions are not available for this mock test.
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

      <FlatList
        data={questions}
        keyExtractor={(_item: any, index: number) => String(index)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        // A paper can run to 90 questions and each card can hold several KaTeX
        // WebViews (question + every option). A ScrollView would mount them all
        // at once; FlatList keeps only the cards near the viewport alive.
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        renderItem={({ item: q, index: qIdx }: { item: any; index: number }) => {
          const qid = getQuestionId(q);
          const currentSolution = qid != null ? solutionsMap[String(qid)] : null;
          const correctAnswers = correctIdsWithSolution(q, currentSolution);
          const apiSelected = selectedIdsFor(q);
          const userAnswer =
            qid != null && answers[String(qid)]?.length ? answers[String(qid)] : apiSelected;

          const questionType = q?.question_type ?? q?.type ?? 'MCQ';
          const isNumericQ = String(questionType).toUpperCase().includes('NUMERIC');

          // The server's numeric_answer is what was actually graded, so it wins
          // over the locally-held answer from this session.
          const rawNumericUser =
            q?.your_answer?.numeric_answer ??
            q?.numeric_answer ??
            (qid != null ? answers[String(qid)]?.[0] : undefined);
          const numericUser =
            isNumericQ && rawNumericUser != null ? String(rawNumericUser).trim() : '';
          const numericCorrect = isNumericQ ? numericAnswerWithSolution(q, currentSolution) : '';

          const attempted = isNumericQ ? numericUser !== '' : userAnswer.length > 0;

          // `outcome` is the server's verdict — it already accounts for the
          // grading tolerance on NUMERICAL questions, so trust it whenever it is
          // decisive. It is only re-derived locally when the field is missing or
          // says "skipped" for a question that was in fact answered (a known
          // quirk of /review/ on numeric questions; /result/ totals count them).
          const outcome = String(q?.outcome ?? '').toLowerCase();
          const outcomeIsGraded =
            outcome === 'correct' || outcome === 'wrong' || outcome === 'incorrect';

          const derivedCorrect = isNumericQ
            ? attempted && numericAnswersEqual(numericUser, numericCorrect)
            : userAnswer.length > 0 &&
              correctAnswers.length === userAnswer.length &&
              correctAnswers.every((a: string) => userAnswer.includes(a));

          const isCorrect = outcomeIsGraded ? outcome === 'correct' : derivedCorrect;

          const isSkipped = outcomeIsGraded ? false : !attempted;

          const explanation =
            currentSolution?.explanation ??
            currentSolution?.solution ??
            q?.explanation ??
            null;

          const questionText = q?.question_text ?? q?.text ?? q?.statement ?? '';
          const choices = getChoices(q);
          const sortedChoices = [...choices].sort(
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
                      // NUMERICAL questions have no real options — their single
                      // "choice" just carries the answer, so don't offer it as
                      // something to report.
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

              {/* Question text */}
              <RichContent html={questionText} style={styles.qCardText} />

              {/* Question image */}
              {q?.image ? (
                <Image source={{ uri: q.image }} style={styles.qCardImage} resizeMode="contain" />
              ) : null}

              {/* Options */}
              {isNumericQ ? (
                <View style={styles.numericReview}>
                  {isCorrect ? (
                    // Correct: only show what the user answered
                    <Text style={styles.numericReviewRow}>
                      Your answer:{' '}
                      <Text style={{ fontWeight: '700', color: '#15803D' }}>
                        {numericUser || '—'}
                      </Text>
                    </Text>
                  ) : isSkipped ? (
                    // Skipped: nothing entered, just show the correct answer
                    <Text style={styles.numericReviewRow}>
                      Correct answer:{' '}
                      <Text style={{ fontWeight: '700', color: '#15803D' }}>
                        {numericCorrect || '—'}
                      </Text>
                    </Text>
                  ) : (
                    // Wrong: show both, so the user can compare
                    <>
                      <Text style={styles.numericReviewRow}>
                        Your answer:{' '}
                        <Text style={{ fontWeight: '700', color: '#B91C1C' }}>
                          {numericUser || '—'}
                        </Text>
                      </Text>
                      <Text style={styles.numericReviewRow}>
                        Correct answer:{' '}
                        <Text style={{ fontWeight: '700', color: '#15803D' }}>
                          {numericCorrect || '—'}
                        </Text>
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
              {explanation && (
                <View style={styles.whyBox}>
                  <Text style={styles.whyLabel}>Why:</Text>
                  {typeof explanation === 'string' || explanation?.summary ? (
                    <RichContent
                      html={typeof explanation === 'string' ? explanation : explanation.summary}
                      style={styles.whyText}
                    />
                  ) : (
                    <Text style={styles.whyText}>See explanation above.</Text>
                  )}
                </View>
              )}

              {/* Ask the AI tutor */}
              <TouchableOpacity
                style={styles.askTutorBtn}
                activeOpacity={0.8}
                // Raw HTML: TutorModal renders it through RichContent.
                onPress={() => setTutorQ({ id: qid, text: questionText })}
              >
                <Ionicons name="sparkles" size={13} color='#6C63FF' />
                <Text style={styles.askTutorText}>Ask the AI tutor</Text>
              </TouchableOpacity>

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
        conversation={tutorConversation}
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
