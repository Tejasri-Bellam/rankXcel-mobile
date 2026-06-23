import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AnswerState } from "./PracticeExamFlow";
import {
  practiceQuestionsStyles as styles,
  practiceQuestionsProgressBarStyles as pbStyles,
} from "@/src/styles/styles/practice/practicequestionsstyles";
import {
  getConversationMessagesService,
  getMockQuestionConversationService,
  sendConversationMessageService,
  startMockQuestionConversationService,
  submitMockResponseService,
} from "@/src/libs/services/mock-library";
import { stripHtml } from "@/src/libs/utils/html";
import TutorModal, { ConversationApi } from "@/src/components/common/TutorModal";

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
  // For NUMERICAL questions: the expected typed answer, shown in feedback.
  correctAnswer?: string | null;
  explanation: string;
  explanationStructured?: StructuredExplanation | null;
  marksCorrect: number;
  marksIncorrect: number;
  selectedOptions?: any[] | null;
}

// NUMERICAL questions (QuestionTypeEnum) carry no choices — the student types
// a value instead of picking an option.
const isNumericalType = (type: string | undefined): boolean =>
  !!type && type.toUpperCase().includes("NUMERIC");

const extractCorrectAnswer = (body: any): string | null => {
  if (!body || typeof body !== "object") return null;
  const v =
    body.correct_answer ??
    body.correct_numeric_answer ??
    body.numeric_answer ??
    body.answer ??
    null;
  return v == null ? null : String(v);
};

const parseExplanation = (raw: any): StructuredExplanation | null => {
  if (!raw) return null;
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!obj || typeof obj !== "object") return null;
    const stepsRaw = Array.isArray(obj.steps) ? obj.steps : [];
    const steps: ExplanationStep[] = stepsRaw
      .map((s: any) => ({
        number: Number(s?.step_number ?? 0),
        heading: String(s?.heading ?? ""),
        explanation: String(s?.explanation ?? ""),
      }))
      .filter((s: ExplanationStep) => s.heading || s.explanation);
    return {
      summary: typeof obj.summary === "string" ? obj.summary : undefined,
      steps: steps.length > 0 ? steps : undefined,
      conclusion: typeof obj.conclusion === "string" ? obj.conclusion : undefined,
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
  // Test mode: answers are saved but never revealed per-question; feedback is
  // deferred to the results/review screens once the whole test is finished.
  isTest?: boolean;
  // `finalQuestions` carries the per-question correct answers / explanations
  // fetched during the session so the results & review screens can use them.
  onEnd: (
    answers: AnswerState[],
    totalSeconds: number,
    finalQuestions: PracticeApiQuestion[],
  ) => void;
}

const unwrap = (res: any): any =>
  res && typeof res === "object" && "data" in res ? (res as any).data : res;

const toIdString = (v: unknown): string | null => {
  if (v == null) return null;
  if (typeof v === "object") {
    const obj = v as { id?: unknown };
    return obj.id != null ? String(obj.id) : null;
  }
  return String(v);
};

const extractCorrectChoiceId = (body: any): string | null => {
  if (!body || typeof body !== "object") return null;
  const lists: unknown[] = [body.correct_choices, body.correct_choice_ids, body.correct_options, body.correct_answers];
  for (const list of lists) {
    if (Array.isArray(list) && list.length > 0) {
      const id = toIdString(list[0]);
      if (id != null) return id;
    }
  }
  return toIdString(body.correct_choice_id ?? body.correct_choice ?? body.correct_option_id ?? null);
};

const extractExplanation = (body: any): string | null => {
  if (!body || typeof body !== "object") return null;
  const list = Array.isArray(body.correct_choices) ? body.correct_choices : null;
  const first = list && list.length > 0 && typeof list[0] === "object" ? list[0] : null;
  return first?.explanation ?? body.explanation ?? body.solution ?? body.solution_text ?? null;
};

// Progress bar segments
const ProgressBar = ({
  current,
  total,
  answers,
  isTest = false,
}: {
  current: number;
  total: number;
  answers: AnswerState[];
  isTest?: boolean;
}) => (
  <View style={pbStyles.container}>
    {answers.map((a, i) => {
      let bg = "#E5E7EB";
      if (i === current) bg = "#3B7DF8";
      else if (i < current) {
        // Test mode never reveals correctness mid-test — answered segments
        // show a neutral filled state instead of green/red.
        if (isTest) bg = a.answered ? "#BFD3FB" : "#E5E7EB";
        else if (a.correct === true) bg = "#22C55E";
        else if (a.correct === false) bg = "#EF4444";
      }
      return (
        <View
          key={i}
          style={[
            pbStyles.segment,
            { backgroundColor: bg },
            i === current && pbStyles.segmentActive,
          ]}
        />
      );
    })}
  </View>
);

export default function PracticeQuestions({
  mockId,
  questions,
  chapterName,
  timerMinutes,
  isTest = false,
  onEnd,
}: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>(() =>
    questions.map((q) => {
      const sel =
        Array.isArray(q.selectedOptions) && q.selectedOptions.length > 0
          ? String(q.selectedOptions[0])
          : null;
      const answered = sel != null;
      const correct =
        answered && q.correctChoiceId != null ? sel === q.correctChoiceId : null;
      return { selected: sel, markedForReview: false, answered, correct };
    })
  );
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [questionList, setQuestionList] = useState<PracticeApiQuestion[]>(questions);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pendingSaves = useRef<Set<Promise<any>>>(new Set());
  const questionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    intervalRef.current = setInterval(() => setTotalSeconds((s) => s + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (timerMinutes > 0 && totalSeconds >= timerMinutes * 60) handleEndPractice();
  }, [totalSeconds, timerMinutes]);

  const current = answers[currentIdx];
  const question = questionList[currentIdx];
  const isLast = currentIdx === questionList.length - 1;
  // Whether to reveal the answer key for the current question. Practice reveals
  // it once "Check answer" marks the question answered; test defers all feedback
  // to the results screen, so it never reveals mid-session.
  const reveal = !isTest && current.answered;
  const [tutorVisible, setTutorVisible] = useState(false);

  // Conversation-based tutor for the current question. Memoized per question so
  // the modal's init effect doesn't re-run on every render.
  const tutorConversation = useMemo<ConversationApi | undefined>(() => {
    const qid = question?.id;
    if (qid == null) return undefined;
    return {
      open: async () => {
        try {
          await startMockQuestionConversationService(mockId, qid);
        } catch (err) {
          console.log("TUTOR START ERROR:", err);
        }
        return getMockQuestionConversationService(mockId, qid);
      },
      loadHistory: (cid) => getConversationMessagesService(cid),
      send: (cid, message) => sendConversationMessageService(cid, message),
    };
  }, [mockId, question?.id]);

  const saveResponse = (
    qId: number | string,
    selected: string | null,
    markedForReview = false,
    numeric = false,
  ) => {
    const elapsed = Math.max(0, Math.round((Date.now() - questionStartRef.current) / 1000));
    const payload = numeric
      ? {
          numeric_answer: selected && selected.trim() !== "" ? selected.trim() : null,
          selected_choice_ids: [],
          is_marked_for_review: markedForReview,
          time_spent_seconds: elapsed,
        }
      : {
          selected_choice_ids: selected
            ? [Number(selected)].filter((n) => Number.isFinite(n))
            : [],
          is_marked_for_review: markedForReview,
          time_spent_seconds: elapsed,
        };
    const promise = submitMockResponseService(mockId, qId, payload).catch((e) => {
      console.log("PRACTICE SAVE ERROR:", e);
      return null;
    });
    pendingSaves.current.add(promise);
    promise.finally(() => pendingSaves.current.delete(promise));
    return promise;
  };

  const isNumeric = isNumericalType(question.type);

  const handleSelectOption = (optId: string) => {
    if (current.answered) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIdx] = { ...next[currentIdx], selected: optId };
      return next;
    });
  };

  // NUMERICAL: keep only the typed value, stored in `selected` like a choice.
  const handleNumericChange = (txt: string) => {
    if (current.answered) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIdx] = { ...next[currentIdx], selected: txt };
      return next;
    });
  };

  const handleCheckAnswer = async () => {
    const hasAnswer = isNumeric
      ? !!current.selected && current.selected.trim() !== ""
      : !!current.selected;
    if (!hasAnswer || current.answered) return;
    const idx = currentIdx;
    const selected = current.selected as string;
    setSavingIdx(idx);
    try {
      const res = await saveResponse(question.id, selected, current.markedForReview, isNumeric);
      if (res == null) return;
      const body = unwrap(res);
      const apiCorrectId = extractCorrectChoiceId(body);
      const apiCorrectAnswer = extractCorrectAnswer(body);
      const explanationRaw = extractExplanation(body);
      const structured = parseExplanation(explanationRaw);

      if (apiCorrectId || apiCorrectAnswer || explanationRaw) {
        setQuestionList((prev) => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            correctChoiceId: apiCorrectId ?? next[idx].correctChoiceId,
            correctAnswer: apiCorrectAnswer ?? next[idx].correctAnswer ?? null,
            explanation: structured ? "" : (explanationRaw ?? next[idx].explanation),
            explanationStructured: structured ?? next[idx].explanationStructured ?? null,
          };
          return next;
        });
      }

      let finalCorrect: boolean | null;
      if (typeof body?.is_correct === "boolean") {
        finalCorrect = body.is_correct;
      } else if (isNumeric) {
        const correct = apiCorrectAnswer ?? question.correctAnswer ?? null;
        finalCorrect =
          correct != null ? selected.trim() === String(correct).trim() : null;
      } else {
        const effectiveCorrectId = apiCorrectId ?? question.correctChoiceId;
        finalCorrect = effectiveCorrectId != null ? selected === effectiveCorrectId : null;
      }

      setAnswers((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], answered: true, correct: finalCorrect };
        return next;
      });
    } finally {
      setSavingIdx(null);
    }
  };

  const navigateTo = (idx: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setCurrentIdx(idx);
    questionStartRef.current = Date.now();
  };

  const handleNextQuestion = () => {
    if (!isLast) navigateTo(currentIdx + 1);
    else finishPractice();
  };

  // Test mode: save the (optional) answer without revealing it and advance —
  // or finish the whole test on the last question. Re-answering a locked
  // question is skipped; an unanswered question can still be skipped past.
  const handleTestNext = async () => {
    const hasAnswer = isNumeric
      ? !!current.selected && current.selected.trim() !== ""
      : !!current.selected;
    if (!current.answered && hasAnswer) {
      const idx = currentIdx;
      const selected = current.selected as string;
      setSavingIdx(idx);
      try {
        await saveResponse(question.id, selected, current.markedForReview, isNumeric);
      } finally {
        setSavingIdx(null);
      }
      setAnswers((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], answered: true, correct: null };
        return next;
      });
    }
    if (!isLast) navigateTo(currentIdx + 1);
    else finishPractice();
  };

  const finishPractice = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (pendingSaves.current.size > 0) {
      try { await Promise.all(Array.from(pendingSaves.current)); } catch {}
    }
    onEnd(answers, totalSeconds, questionList);
  };

  const handleEndPractice = () => finishPractice();

  // Option styling
  const getOptStyle = (optId: string) => {
    if (!reveal) {
      return [styles.optRow, current.selected === optId && styles.optSelected];
    }
    if (optId === question.correctChoiceId) return [styles.optRow, styles.optCorrect];
    if (optId === current.selected) return [styles.optRow, styles.optWrong];
    return [styles.optRow, styles.optDimmed];
  };

  const getLetterStyle = (optId: string) => {
    if (!reveal) {
      return [styles.optLetter, current.selected === optId && styles.optLetterSelected];
    }
    if (optId === question.correctChoiceId) return [styles.optLetter, styles.optLetterCorrect];
    if (optId === current.selected) return [styles.optLetter, styles.optLetterWrong];
    return [styles.optLetter];
  };

  const getLetterTextStyle = (optId: string) => {
    if (!reveal && current.selected === optId) return { color: "#fff" };
    if (reveal) {
      if (optId === question.correctChoiceId || optId === current.selected) return { color: "#fff" };
    }
    return { color: "#9CA3AF" };
  };

  const getOptTextStyle = (optId: string) => {
    if (!reveal) {
      return [styles.optText, current.selected === optId && { color: "#3B7DF8", fontWeight: "600" as const }];
    }
    if (optId === question.correctChoiceId) return [styles.optText, { color: "#16A34A", fontWeight: "600" as const }];
    if (optId === current.selected) return [styles.optText, { color: "#EF4444", fontWeight: "600" as const }];
    return [styles.optText, { color: "#9CA3AF" }];
  };

  const selectedOptObj = question.options.find((o) => o.id === current.selected);
  const correctOptObj = question.options.find((o) => o.id === question.correctChoiceId);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleEndPractice} activeOpacity={0.7}>
          <Ionicons name="close" size={18} color="#555" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerChapter} numberOfLines={1}>
            {chapterName}
          </Text>
          <Text style={styles.headerMode}>{isTest ? "Test" : "Practice"}</Text>
          <ProgressBar
            current={currentIdx}
            total={questionList.length}
            answers={answers}
            isTest={isTest}
          />
        </View>
        {/* No AI tutor during a test — feedback (and the tutor) are deferred to
            the review after the whole test. */}
        {!isTest && (
          <TouchableOpacity
            style={styles.tutorBtn}
            activeOpacity={0.8}
            onPress={() => setTutorVisible(true)}
          >
            <Ionicons name="sparkles" size={13} color="#fff" />
            <Text style={styles.tutorText}>Tutor</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Body */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Question label */}
        <Text style={styles.qLabel}>
          QUESTION {currentIdx + 1} / {questionList.length}
        </Text>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Question text */}
          <Text style={styles.qText}>{stripHtml(question.text)}</Text>

          {/* Numerical answer — free-text numeric input */}
          {isNumeric ? (
            <View>
              <Text style={styles.numericLabel}>Enter your answer</Text>
              <TextInput
                style={[
                  styles.numericInput,
                  reveal &&
                    (current.correct ? styles.numericCorrect : styles.numericWrong),
                ]}
                value={current.selected ?? ""}
                onChangeText={handleNumericChange}
                editable={!current.answered}
                keyboardType={
                  Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"
                }
                placeholder="Type a numeric value"
                placeholderTextColor="#B6B6C8"
                returnKeyType="done"
              />
              <Text style={styles.numericHint}>
                Decimals and negative values are allowed.
              </Text>
            </View>
          ) : (
          /* Options */
          <View style={styles.optionsList}>
            {question.options.map((opt, idx) => (
              <TouchableOpacity
                key={opt.id}
                style={getOptStyle(opt.id)}
                onPress={() => handleSelectOption(opt.id)}
                activeOpacity={current.answered ? 1 : 0.7}
              >
                <View style={getLetterStyle(opt.id)}>
                  <Text style={[styles.optLetterText, getLetterTextStyle(opt.id)]}>
                    {String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text style={getOptTextStyle(opt.id)}>{stripHtml(opt.text)}</Text>
                {reveal && opt.id === question.correctChoiceId && (
                  <Ionicons name="checkmark" size={18} color="#22C55E" style={{ marginLeft: "auto" }} />
                )}
                {reveal && opt.id === current.selected && opt.id !== question.correctChoiceId && (
                  <Ionicons name="close" size={18} color="#EF4444" style={{ marginLeft: "auto" }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          )}

          {/* Swipe hint */}
          <Text style={styles.swipeHint}>— Swipe to move between questions —</Text>

          {/* Feedback */}
          {reveal && (
            <View style={[styles.feedbackBox, current.correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
              <View style={styles.feedbackHeader}>
                <Text style={[styles.feedbackTitle, { color: current.correct ? "#22C55E" : "#EF4444" }]}>
                  {current.correct ? "✓  Correct!" : "✗  Incorrect"}
                </Text>
              </View>
              {!current.correct && selectedOptObj && correctOptObj && (
                <View style={styles.answerInfo}>
                  <Text style={styles.answerInfoText}>
                    Correct answer:{" "}
                    <Text style={{ fontWeight: "700", color: "#16A34A" }}>
                      {stripHtml(correctOptObj.text)}
                    </Text>
                  </Text>
                </View>
              )}
              {!current.correct && isNumeric && !!question.correctAnswer && (
                <View style={styles.answerInfo}>
                  <Text style={styles.answerInfoText}>
                    Correct answer:{" "}
                    <Text style={{ fontWeight: "700", color: "#16A34A" }}>
                      {question.correctAnswer}
                    </Text>
                  </Text>
                </View>
              )}
              {(question.explanationStructured || !!question.explanation) && (
                <View style={styles.explBox}>
                  <View style={styles.explHeader}>
                    <Ionicons name="sparkles" size={14} color="#F59E0B" />
                    <Text style={styles.explTitle}>Explanation</Text>
                  </View>
                  {question.explanationStructured ? (
                    <>
                      {!!question.explanationStructured.summary && (
                        <Text style={styles.explText}>{stripHtml(question.explanationStructured.summary)}</Text>
                      )}
                      {(question.explanationStructured.steps ?? []).map((step) => (
                        <View key={step.number} style={{ marginTop: 6 }}>
                          <Text style={styles.explStepHead}>Step {step.number}. {stripHtml(step.heading)}</Text>
                          <Text style={styles.explText}>{stripHtml(step.explanation)}</Text>
                        </View>
                      ))}
                      {!!question.explanationStructured.conclusion && (
                        <Text style={[styles.explText, { marginTop: 8, fontWeight: "700", color: "#1A1A2E" }]}>
                          {stripHtml(question.explanationStructured.conclusion)}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text style={styles.explText}>{stripHtml(question.explanation)}</Text>
                  )}
                  <TouchableOpacity
                    style={styles.askTutorBtn}
                    activeOpacity={0.8}
                    onPress={() => setTutorVisible(true)}
                  >
                    <Ionicons name="sparkles" size={13} color="#3B7DF8" />
                    <Text style={styles.askTutorText}>Ask the AI tutor</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        {isTest ? (
          <View style={styles.navRow}>
            {currentIdx > 0 && (
              <TouchableOpacity
                style={styles.prevBtn}
                onPress={() => navigateTo(currentIdx - 1)}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={16} color="#555" />
                <Text style={styles.prevBtnText}>Prev</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextBtn, { flex: currentIdx > 0 ? 1 : undefined, width: currentIdx === 0 ? "100%" : undefined }]}
              onPress={handleTestNext}
              disabled={savingIdx === currentIdx}
              activeOpacity={0.85}
            >
              {savingIdx === currentIdx ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>
                    {isLast ? "Submit test" : "Next question"}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : !current.answered ? (
          <TouchableOpacity
            style={[styles.checkBtn, (!current.selected || savingIdx === currentIdx) && styles.checkBtnDisabled]}
            onPress={handleCheckAnswer}
            disabled={!current.selected || savingIdx === currentIdx}
            activeOpacity={0.85}
          >
            {savingIdx === currentIdx ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.checkBtnText}>Check answer</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.navRow}>
            {currentIdx > 0 && (
              <TouchableOpacity
                style={styles.prevBtn}
                onPress={() => navigateTo(currentIdx - 1)}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={16} color="#555" />
                <Text style={styles.prevBtnText}>Prev</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextBtn, { flex: currentIdx > 0 ? 1 : undefined, width: currentIdx === 0 ? "100%" : undefined }]}
              onPress={handleNextQuestion}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>
                {isLast ? "View Results" : "Next question"}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {!isTest && (
        <TutorModal
          visible={tutorVisible}
          onClose={() => setTutorVisible(false)}
          questionId={question?.id}
          questionText={question?.text}
          conversation={tutorConversation}
        />
      )}
    </SafeAreaView>
  );
}
