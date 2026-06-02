import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/src/styles/styles';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import PracticeProgress from './PracticeProgress';
import { AnswerState } from './PracticeExamFlow';
import { submitMockResponseService } from '@/src/libs/services/mock-library';
import { stripHtml } from '@/src/libs/utils/html';
import { qStyles } from '@/src/styles/sidebar/practice/questions';

export interface ExplanationStep {
  number: number;
  heading: string;
  explanation: string;
}

export interface StructuredExplanation {
  summary?: string;
  steps?: ExplanationStep[];
  conclusion?: string;
}

export interface PracticeApiQuestion {
  id: number | string;
  text: string;
  type: string;
  options: { id: string; text: string }[];
  correctChoiceId: string | null;
  explanation: string;
  explanationStructured?: StructuredExplanation | null;
  marksCorrect: number;
  marksIncorrect: number;
  selectedOptions?: any[] | null;
}

const parseExplanation = (raw: any): StructuredExplanation | null => {
  if (!raw) return null;
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!obj || typeof obj !== 'object') return null;
    const stepsRaw = Array.isArray(obj.steps) ? obj.steps : [];
    const steps: ExplanationStep[] = stepsRaw
      .map((s: any) => ({
        number: Number(s?.step_number ?? 0),
        heading: String(s?.heading ?? ''),
        explanation: String(s?.explanation ?? ''),
      }))
      .filter((s: ExplanationStep) => s.heading || s.explanation);
    return {
      summary: typeof obj.summary === 'string' ? obj.summary : undefined,
      steps: steps.length > 0 ? steps : undefined,
      conclusion: typeof obj.conclusion === 'string' ? obj.conclusion : undefined,
    };
  } catch {
    return null;
  }
};

interface Props {
  mockId: number | string;
  questions: PracticeApiQuestion[];
  chapterName: string;
  timerMinutes: number;
  onEnd: (answers: AnswerState[], totalSeconds: number) => void;
}

const unwrap = (res: any): any =>
  res && typeof res === 'object' && 'data' in res ? (res as any).data : res;

const toIdString = (v: unknown): string | null => {
  if (v == null) return null;
  if (typeof v === 'object') {
    const obj = v as { id?: unknown };
    return obj.id != null ? String(obj.id) : null;
  }
  return String(v);
};

// API response shapes seen in practice:
//   { correct_choices: [{ id, text, explanation }] }
//   { correct_choices: [567] }
//   { correct_choice_id: 567 }
//   { correct_choice_ids: [567] }
//   { correct_options: [...] }
const extractCorrectChoiceId = (body: any): string | null => {
  if (!body || typeof body !== 'object') return null;
  const lists: unknown[] = [
    body.correct_choices,
    body.correct_choice_ids,
    body.correct_options,
    body.correct_answers,
  ];
  for (const list of lists) {
    if (Array.isArray(list) && list.length > 0) {
      const id = toIdString(list[0]);
      if (id != null) return id;
    }
  }
  return toIdString(body.correct_choice_id ?? body.correct_choice ?? body.correct_option_id ?? null);
};

const extractExplanation = (body: any): string | null => {
  if (!body || typeof body !== 'object') return null;
  const list = Array.isArray(body.correct_choices) ? body.correct_choices : null;
  const first = list && list.length > 0 && typeof list[0] === 'object' ? list[0] : null;
  return (
    first?.explanation ??
    body.explanation ??
    body.solution ??
    body.solution_text ??
    null
  );
};

export default function PracticeQuestions({
  mockId,
  questions,
  chapterName,
  timerMinutes,
  onEnd,
}: Props) {
  const timerEnabled = timerMinutes > 0;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>(() =>
    questions.map((q) => {
      const sel = Array.isArray(q.selectedOptions) && q.selectedOptions.length > 0
        ? String(q.selectedOptions[0])
        : null;
      const answered = sel != null;
      const correct = answered && q.correctChoiceId != null ? sel === q.correctChoiceId : null;
      return {
        selected: sel,
        markedForReview: false,
        answered,
        correct,
      };
    }),
  );
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [questionList, setQuestionList] = useState<PracticeApiQuestion[]>(questions);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pendingSaves = useRef<Set<Promise<any>>>(new Set());
  const questionStartRef = useRef<number>(Date.now());

  // Countdown for optional timer
  useEffect(() => {
    intervalRef.current = setInterval(() => setTotalSeconds((s) => s + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Auto-end when timer hits limit
  useEffect(() => {
    if (timerEnabled && totalSeconds >= timerMinutes * 60) {
      handleEndPractice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSeconds, timerEnabled, timerMinutes]);

  const current = answers[currentIdx];
  const question = questionList[currentIdx];
  const isLast = currentIdx === questionList.length - 1;

  const saveResponse = (
    qId: number | string,
    selected: string | null,
    markedForReview = false,
  ) => {
    const ids = selected ? [Number(selected)].filter((n) => Number.isFinite(n)) : [];
    const elapsed = Math.max(0, Math.round((Date.now() - questionStartRef.current) / 1000));
    const promise = submitMockResponseService(mockId, qId, {
      selected_choice_ids: ids,
      is_marked_for_review: markedForReview,
      time_spent_seconds: elapsed,
    })
      .then((r) => r)
      .catch((e) => {
        console.log('PRACTICE SAVE ERROR for question', qId, ':', e);
        return null;
      });
    pendingSaves.current.add(promise);
    promise.finally(() => pendingSaves.current.delete(promise));
    return promise;
  };

  const handleSelectOption = (optId: string) => {
    if (current.answered) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIdx] = { ...next[currentIdx], selected: optId };
      return next;
    });
  };

  const handleSaveNext = async () => {
    if (!current.answered && current.selected) {
      const idx = currentIdx;
      const selected = current.selected;
      setSavingIdx(idx);
      try {
        const res = await saveResponse(question.id, selected, current.markedForReview);
        if (res == null) {
          // saveResponse swallows network errors and returns null; don't mark as answered.
          return;
        }
        const body = unwrap(res);
        console.log('PRACTICE SAVE RESPONSE for q', question.id, ':', JSON.stringify(body, null, 2));

        const apiCorrectId = extractCorrectChoiceId(body);
        const explanationRaw = extractExplanation(body);
        const structured = parseExplanation(explanationRaw);

        if (apiCorrectId || explanationRaw) {
          setQuestionList((prev) => {
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              correctChoiceId: apiCorrectId ?? next[idx].correctChoiceId,
              explanation: structured ? '' : (explanationRaw ?? next[idx].explanation),
              explanationStructured: structured ?? next[idx].explanationStructured ?? null,
            };
            return next;
          });
        }

        const effectiveCorrectId = apiCorrectId ?? question.correctChoiceId;
        const finalCorrect: boolean | null =
          typeof body?.is_correct === 'boolean'
            ? body.is_correct
            : effectiveCorrectId != null
              ? selected === effectiveCorrectId
              : null;

        setAnswers((prev) => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            answered: true,
            correct: finalCorrect,
          };
          return next;
        });
      } finally {
        setSavingIdx(null);
      }
      return;
    }

    if (!isLast) {
      navigateTo(currentIdx + 1);
    } else {
      finishPractice();
    }
  };

  const handleNextQuestion = () => {
    if (!isLast) {
      navigateTo(currentIdx + 1);
    } else {
      finishPractice();
    }
  };

  const navigateTo = (idx: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setCurrentIdx(idx);
    questionStartRef.current = Date.now();
  };

  const handleMarkReview = () => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIdx] = {
        ...next[currentIdx],
        markedForReview: !next[currentIdx].markedForReview,
      };
      return next;
    });
    saveResponse(question.id, current.selected, !current.markedForReview);
  };

  const handleClear = () => {
    if (current.answered) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIdx] = { ...next[currentIdx], selected: null };
      return next;
    });
  };

  const finishPractice = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (pendingSaves.current.size > 0) {
      try {
        await Promise.all(Array.from(pendingSaves.current));
      } catch (e) {
        console.log('Waiting on saves failed:', e);
      }
    }
    onEnd(answers, totalSeconds);
  };

  const handleEndPractice = () => {
    finishPractice();
  };

  const optionStyle = (optId: string) => {
    if (!current.answered) {
      return [
        qStyles.optionRow,
        current.selected === optId && qStyles.optionSelected,
      ];
    }
    if (optId === question.correctChoiceId) return [qStyles.optionRow, qStyles.optionCorrect];
    if (optId === current.selected && optId !== question.correctChoiceId)
      return [qStyles.optionRow, qStyles.optionWrong];
    return [qStyles.optionRow, qStyles.optionDimmed];
  };

  const optionTextStyle = (optId: string) => {
    if (!current.answered) {
      return [qStyles.optionText, current.selected === optId && qStyles.optionTextSelected];
    }
    if (optId === question.correctChoiceId) return [qStyles.optionText, qStyles.optionTextCorrect];
    if (optId === current.selected) return [qStyles.optionText, qStyles.optionTextWrong];
    return [qStyles.optionText, qStyles.optionTextDimmed];
  };

  const timeRemaining = timerEnabled ? Math.max(0, timerMinutes * 60 - totalSeconds) : totalSeconds;
  const mm = String(Math.floor(timeRemaining / 60)).padStart(2, '0');
  const ss = String(timeRemaining % 60).padStart(2, '0');
  const timeLabel = `${mm}:${ss}`;

  const selectedOptObj = question.options.find((o) => o.id === current.selected);
  const correctOptObj = question.options.find((o) => o.id === question.correctChoiceId);

  return (
    <SafeAreaView style={qStyles.safeArea}>
      {/* Header */}
      <View style={qStyles.header}>
        <View style={qStyles.headerLeft}>
          <Text style={qStyles.practiceMode}>Practice Mode</Text>
          <Text style={qStyles.chapterLabel} numberOfLines={1}>
            {chapterName.length > 14 ? `${chapterName.substring(0, 12)}...` : chapterName}
          </Text>
        </View>

        <View style={qStyles.headerCenter}>
          <PracticeProgress
            current={currentIdx}
            total={questionList.length}
            answers={answers}
          />
          <Text style={qStyles.progressText}>
            {currentIdx + 1}/{questionList.length}
          </Text>
        </View>

        <TouchableOpacity style={qStyles.endBtn} onPress={handleEndPractice}>
          <Text style={qStyles.endBtnText}>End Practice</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={qStyles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={qStyles.scrollContent}
      >
        {/* Meta */}
        <View style={qStyles.metaRow}>
          <View style={qStyles.qNumBadge}>
            <Text style={qStyles.qNumText}>
              Q {currentIdx + 1} of {questionList.length}
            </Text>
          </View>
          <View style={qStyles.typeBadge}>
            <Text style={qStyles.typeText}>Single Correct</Text>
          </View>
          <View style={qStyles.marksBadge}>
            <Text style={qStyles.marksGreen}>+{question.marksCorrect} marks</Text>
          </View>
          <View style={qStyles.marksBadge}>
            <Text style={qStyles.marksRed}>{question.marksIncorrect} marks</Text>
          </View>
          <View style={qStyles.timerChip}>
            <Ionicons name="timer-outline" size={14} color={COLORS.primary} />
            <Text style={qStyles.timerChipText}>{timeLabel}</Text>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={qStyles.questionText}>{stripHtml(question.text)}</Text>

          <View style={qStyles.optionsList}>
            {question.options.map((opt, idx) => (
              <TouchableOpacity
                key={opt.id}
                style={optionStyle(opt.id)}
                onPress={() => handleSelectOption(opt.id)}
                activeOpacity={current.answered ? 1 : 0.7}
              >
                <View
                  style={[
                    qStyles.optionBubble,
                    current.selected === opt.id && !current.answered && qStyles.optionBubbleSelected,
                    current.answered && opt.id === question.correctChoiceId && qStyles.optionBubbleCorrect,
                    current.answered &&
                      opt.id === current.selected &&
                      opt.id !== question.correctChoiceId &&
                      qStyles.optionBubbleWrong,
                  ]}
                >
                  <Text
                    style={[
                      qStyles.optionBubbleText,
                      (current.selected === opt.id && !current.answered) ||
                      (current.answered && (opt.id === question.correctChoiceId || opt.id === current.selected))
                        ? { color: COLORS.white }
                        : {},
                    ]}
                  >
                    {String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text style={optionTextStyle(opt.id)}>{stripHtml(opt.text)}</Text>
                {current.answered && opt.id === question.correctChoiceId && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={COLORS.green}
                    style={{ marginLeft: 'auto' }}
                  />
                )}
                {current.answered && opt.id === current.selected && opt.id !== question.correctChoiceId && (
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={COLORS.red}
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {current.answered && (
            <View
              style={[
                qStyles.feedbackBox,
                current.correct ? qStyles.feedbackCorrect : qStyles.feedbackWrong,
              ]}
            >
              <View style={qStyles.feedbackHeader}>
                <Ionicons
                  name={current.correct ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={current.correct ? COLORS.green : COLORS.red}
                />
                <Text
                  style={[
                    qStyles.feedbackTitle,
                    { color: current.correct ? COLORS.green : COLORS.red },
                  ]}
                >
                  {current.correct ? 'Correct!' : 'Incorrect'}
                </Text>
              </View>
              {!current.correct && (
                <View style={qStyles.answerRow}>
                  {selectedOptObj && (
                    <Text style={qStyles.yourAnswer}>
                      Your answer:{' '}
                      <Text style={{ color: COLORS.red, fontWeight: '700' }}>
                        {stripHtml(selectedOptObj.text)}
                      </Text>
                    </Text>
                  )}
                  {correctOptObj && (
                    <Text style={qStyles.correctAnswer}>
                      Correct answer:{' '}
                      <Text style={{ color: COLORS.green, fontWeight: '700' }}>
                        {stripHtml(correctOptObj.text)}
                      </Text>
                    </Text>
                  )}
                </View>
              )}
              {(question.explanationStructured || !!question.explanation) && (
                <View style={qStyles.explanationBox}>
                  <View style={qStyles.explanationHeader}>
                    <Ionicons name="bulb-outline" size={16} color={COLORS.orange} />
                    <Text style={qStyles.explanationTitle}>Explanation</Text>
                  </View>
                  {question.explanationStructured ? (
                    <>
                      {!!question.explanationStructured.summary && (
                        <Text style={qStyles.explanationText}>
                          {stripHtml(question.explanationStructured.summary)}
                        </Text>
                      )}
                      {(question.explanationStructured.steps ?? []).map((step) => (
                        <View key={step.number} style={{ marginTop: 8 }}>
                          <Text style={qStyles.explanationStepHeading}>
                            Step {step.number}. {stripHtml(step.heading)}
                          </Text>
                          <Text style={qStyles.explanationText}>{stripHtml(step.explanation)}</Text>
                        </View>
                      ))}
                      {!!question.explanationStructured.conclusion && (
                        <Text
                          style={[
                            qStyles.explanationText,
                            { marginTop: 10, fontWeight: '700', color: COLORS.textDark },
                          ]}
                        >
                          {stripHtml(question.explanationStructured.conclusion)}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text style={qStyles.explanationText}>{stripHtml(question.explanation)}</Text>
                  )}
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={qStyles.bottomBar}>
        <View style={qStyles.bottomActions}>
          <TouchableOpacity
            style={[
              qStyles.reviewBtn,
              current.markedForReview && qStyles.reviewBtnActive,
            ]}
            onPress={handleMarkReview}
          >
            <MaterialCommunityIcons
              name="bookmark-outline"
              size={16}
              color={current.markedForReview ? COLORS.primary : COLORS.textLight}
            />
            <Text
              style={[
                qStyles.reviewText,
                current.markedForReview && qStyles.reviewTextActive,
              ]}
            >
              Mark for Review
            </Text>
          </TouchableOpacity>

          {current.answered ? (
            <Text style={qStyles.answeredBadge}>Answered</Text>
          ) : current.selected ? (
            <TouchableOpacity style={qStyles.clearBtn} onPress={handleClear}>
              <Ionicons name="trash-outline" size={14} color={COLORS.red} />
              <Text style={qStyles.clearText}>Clear</Text>
            </TouchableOpacity>
          ) : (
            <Text style={qStyles.notVisitedText}>Not Visited</Text>
          )}
        </View>

        <View style={qStyles.navRow}>
          <TouchableOpacity
            style={[qStyles.navBtn, currentIdx === 0 && qStyles.navBtnDisabled]}
            onPress={() => currentIdx > 0 && navigateTo(currentIdx - 1)}
            disabled={currentIdx === 0}
          >
            <Ionicons
              name="chevron-back"
              size={16}
              color={currentIdx === 0 ? COLORS.border : COLORS.textMedium}
            />
            <Text
              style={[qStyles.navBtnText, currentIdx === 0 && { color: COLORS.border }]}
            >
              Prev
            </Text>
          </TouchableOpacity>

          {current.answered ? (
            <TouchableOpacity style={qStyles.nextQuestionBtn} onPress={handleNextQuestion}>
              {isLast ? (
                <>
                  <Ionicons name="eye-outline" size={16} color={COLORS.white} />
                  <Text style={qStyles.nextQuestionText}>View Results</Text>
                </>
              ) : (
                <>
                  <Text style={qStyles.nextQuestionText}>Next Question</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                qStyles.saveNextBtn,
                (!current.selected || savingIdx === currentIdx) && qStyles.saveNextBtnDisabled,
              ]}
              onPress={handleSaveNext}
              disabled={!current.selected || savingIdx === currentIdx}
            >
              {savingIdx === currentIdx ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="content-save-outline"
                    size={16}
                    color={COLORS.white}
                  />
                  <Text style={qStyles.saveNextText}>
                    {isLast ? 'Save' : 'Save & Next'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[qStyles.navBtn, isLast && qStyles.navBtnDisabled]}
            onPress={() => !isLast && navigateTo(currentIdx + 1)}
            disabled={isLast}
          >
            <Text style={[qStyles.navBtnText, isLast && { color: COLORS.border }]}>
              Next
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={isLast ? COLORS.border : COLORS.textMedium}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

