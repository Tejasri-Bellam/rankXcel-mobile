import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Image,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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
  submitMockAttemptResponseService,
} from "@/src/libs/services/mock-library";
import { stripHtml } from "@/src/libs/utils/html";
import {
  idSetsEqual,
  isMultiSelectType,
  isNumericalType,
  questionTypeLabel,
} from "@/src/libs/utils/questionType";
import TutorModal, { ConversationApi } from "@/src/components/common/TutorModal";
import ConfirmModal from "@/src/components/common/ConfirmModal";
import FlagQuestionModal from "@/src/components/common/FlagQuestionModal";

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
  image?: string | null;
  type: string;
  options: { id: string; text: string; image?: string | null }[];
  correctChoiceId: string | null;
  // MCQ_MULTIPLE: every correct option id. Null/absent for single-select.
  correctChoiceIds?: string[] | null;
  // For NUMERICAL questions: the expected typed answer, shown in feedback.
  correctAnswer?: string | null;
  explanation: string;
  explanationStructured?: StructuredExplanation | null;
  marksCorrect: number;
  marksIncorrect: number;
  selectedOptions?: any[] | null;
}

const extractCorrectAnswer = (body: any): string | null => {
  if (!body || typeof body !== "object") return null;
  const v =
    body.correct_answer ??
    body.correct_numeric_answer ??
    body.numeric_answer ??
    body.answer ??
    null;
  if (v != null) return String(v);

  // NUMERICAL questions can come back as a choices array instead, e.g.
  // { correct_choices: [{ id, text: "3.0", is_correct: true }] } — the
  // answer is the correct choice's `text`, not a scalar field.
  const lists: unknown[] = [body.correct_choices, body.correct_options, body.correct_answers];
  for (const list of lists) {
    if (Array.isArray(list) && list.length > 0) {
      const first = list[0] as any;
      const text = first?.text ?? first?.label;
      if (text != null && String(text).trim() !== "") return String(text).trim();
    }
  }
  return null;
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
  // Attempt the answers are saved against (response PUTs are attempt-based);
  // mockId is still used for the per-question tutor/conversation endpoints.
  attemptId: number | string;
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

// MCQ_MULTIPLE: pull the full set of correct ids from a save/response body.
const extractCorrectChoiceIds = (body: any): string[] => {
  if (!body || typeof body !== "object") return [];
  const lists: unknown[] = [
    body.correct_choice_ids,
    body.correct_choices,
    body.correct_options,
    body.correct_answers,
  ];
  for (const list of lists) {
    if (Array.isArray(list) && list.length > 0) {
      const ids = list.map(toIdString).filter((v): v is string => v != null);
      if (ids.length > 0) return ids;
    }
  }
  const single = extractCorrectChoiceId(body);
  return single != null ? [single] : [];
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
      if (i === current) bg = '#6C63FF';
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
  attemptId,
  questions,
  chapterName,
  timerMinutes,
  isTest = false,
  onEnd,
}: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>(() =>
    questions.map((q) => {
      const preSel = Array.isArray(q.selectedOptions)
        ? q.selectedOptions.map((v: any) => String(v?.id ?? v)).filter(Boolean)
        : [];
      if (isMultiSelectType(q.type)) {
        const answered = preSel.length > 0;
        const correctIds = q.correctChoiceIds ?? [];
        const correct =
          answered && correctIds.length > 0 ? idSetsEqual(preSel, correctIds) : null;
        return { selected: null, selectedIds: preSel, markedForReview: false, answered, correct };
      }
      const sel = preSel.length > 0 ? preSel[0] : null;
      const answered = sel != null;
      const correct =
        answered && q.correctChoiceId != null ? sel === q.correctChoiceId : null;
      return { selected: sel, selectedIds: [], markedForReview: false, answered, correct };
    })
  );
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [questionList, setQuestionList] = useState<PracticeApiQuestion[]>(questions);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pendingSaves = useRef<Set<Promise<any>>>(new Set());
  const questionStartRef = useRef<number>(Date.now());
  const [showFlagModal, setShowFlagModal] = useState(false);
  const insets = useSafeAreaInsets();
  const [bottomBarHeight, setBottomBarHeight] = useState(0);
  useEffect(() => {
    intervalRef.current = setInterval(() => setTotalSeconds((s) => s + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    // Time's up — auto-submit directly (no confirmation prompt).
    if (timerMinutes > 0 && totalSeconds >= timerMinutes * 60) finishPractice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSeconds, timerMinutes]);

  const current = answers[currentIdx];
  const question = questionList[currentIdx];
  const isLast = currentIdx === questionList.length - 1;
  // Whether to reveal the answer key for the current question. Practice reveals
  // it once "Check answer" marks the question answered; test defers all feedback
  // to the results screen, so it never reveals mid-session.
  const reveal = !isTest && current.answered;
  const [tutorVisible, setTutorVisible] = useState(false);
  // Submit / exit confirmation dialog (replaces the old Alert.alert prompts).
  const [confirm, setConfirm] = useState<{
    kind: "submit" | "exit";
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    destructive: boolean;
  } | null>(null);
  const [finishing, setFinishing] = useState(false);

  // Android hardware back: close the tutor if open, otherwise surface the
  // submit/exit confirmation instead of silently leaving the session.
  useEffect(() => {
    const onBackPress = () => {
      if (tutorVisible) { setTutorVisible(false); return true; }
      // If a confirmation is already showing, back dismisses it rather than
      // re-opening it (unless a submit is already in flight).
      if (confirm) { if (!finishing) setConfirm(null); return true; }
      handleEndPractice();
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorVisible, confirm, finishing]);

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
    opts: {
      choiceIds?: string[];
      numericValue?: string | null;
      numeric?: boolean;
      markedForReview?: boolean;
    },
  ) => {
    const { choiceIds = [], numericValue = null, numeric = false, markedForReview = false } = opts;
    const elapsed = Math.max(0, Math.round((Date.now() - questionStartRef.current) / 1000));
    const payload = numeric
      ? {
          numeric_answer: numericValue && numericValue.trim() !== "" ? numericValue.trim() : null,
          selected_choice_ids: [],
          is_marked_for_review: markedForReview,
          time_spent_seconds: elapsed,
        }
      : {
          selected_choice_ids: choiceIds
            .map((c) => Number(c))
            .filter((n) => Number.isFinite(n)),
          is_marked_for_review: markedForReview,
          time_spent_seconds: elapsed,
        };
    const promise = submitMockAttemptResponseService(attemptId, qId, payload).catch((e) => {
      console.log("PRACTICE SAVE ERROR:", e);
      return null;
    });
    pendingSaves.current.add(promise);
    promise.finally(() => pendingSaves.current.delete(promise));
    return promise;
  };

  const isNumeric = isNumericalType(question.type);
  const isMulti = isMultiSelectType(question.type);
  const currentSelectedIds = current.selectedIds ?? [];

  // Whether the current question has any answer entered (used to gate Check /
  // Next / Submit). Numeric checks the typed value; multi checks the tick set.
  const hasCurrentAnswer = isNumeric
    ? !!current.selected && current.selected.trim() !== ""
    : isMulti
      ? currentSelectedIds.length > 0
      : !!current.selected;

  // The choice ids to persist for the current selection (empty for numeric).
  const currentChoiceIds = isMulti
    ? currentSelectedIds
    : current.selected != null && String(current.selected).trim() !== ""
      ? [String(current.selected)]
      : [];

  const handleSelectOption = (optId: string) => {
    if (current.answered) return;
    setAnswers((prev) => {
      const next = [...prev];
      const cur = next[currentIdx];
      if (isMulti) {
        const existing = cur.selectedIds ?? [];
        const updated = existing.includes(optId)
          ? existing.filter((o) => o !== optId)
          : [...existing, optId];
        next[currentIdx] = { ...cur, selectedIds: updated };
      } else {
        next[currentIdx] = { ...cur, selected: optId };
      }
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
    if (!hasCurrentAnswer || current.answered) return;
    const idx = currentIdx;
    const selected = current.selected as string;
    const selectedIds = currentChoiceIds;
    setSavingIdx(idx);
    try {
      const res = await saveResponse(
        question.id,
        isNumeric
          ? { numeric: true, numericValue: selected, markedForReview: current.markedForReview }
          : { choiceIds: selectedIds, markedForReview: current.markedForReview },
      );
      if (res == null) return;
      const body = unwrap(res);
      const apiCorrectId = extractCorrectChoiceId(body);
      const apiCorrectIds = extractCorrectChoiceIds(body);
      const apiCorrectAnswer = extractCorrectAnswer(body);
      const explanationRaw = extractExplanation(body);
      const structured = parseExplanation(explanationRaw);

      if (apiCorrectId || apiCorrectIds.length > 0 || apiCorrectAnswer || explanationRaw) {
        setQuestionList((prev) => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            correctChoiceId: apiCorrectId ?? next[idx].correctChoiceId,
            correctChoiceIds:
              apiCorrectIds.length > 0 ? apiCorrectIds : next[idx].correctChoiceIds ?? null,
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
      } else if (isMulti) {
        const effectiveCorrectIds =
          apiCorrectIds.length > 0 ? apiCorrectIds : question.correctChoiceIds ?? [];
        finalCorrect =
          effectiveCorrectIds.length > 0 ? idSetsEqual(selectedIds, effectiveCorrectIds) : null;
      } else {
        const effectiveCorrectId = apiCorrectId ?? question.correctChoiceId;
        finalCorrect =
          effectiveCorrectId != null ? selectedIds[0] === effectiveCorrectId : null;
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
    else confirmFinish();
  };

  // Test mode: save the (optional) answer without revealing it and advance —
  // or finish the whole test on the last question. Re-answering a locked
  // question is skipped; an unanswered question can still be skipped past.
  const handleTestNext = async () => {
    // The last question submits the whole test — confirm first (the save/lock
    // happens only once the user confirms, in finalizeSubmit).
    if (isLast) {
      confirmFinish();
      return;
    }
    if (!current.answered && hasCurrentAnswer) {
      const idx = currentIdx;
      const selected = current.selected as string;
      const selectedIds = currentChoiceIds;
      setSavingIdx(idx);
      try {
        await saveResponse(
          question.id,
          isNumeric
            ? { numeric: true, numericValue: selected, markedForReview: current.markedForReview }
            : { choiceIds: selectedIds, markedForReview: current.markedForReview },
        );
      } finally {
        setSavingIdx(null);
      }
      setAnswers((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], answered: true, correct: null };
        return next;
      });
    }
    navigateTo(currentIdx + 1);
  };

  // Final submit needs an explicit confirmation — mirrors the mock exam's submit
  // sheet. The timer-expiry path calls finishPractice() directly (no prompt).
  const confirmFinish = () => {
    const answered =
      answers.filter((a) => a.answered).length +
      (hasCurrentAnswer && !current.answered ? 1 : 0);
    const allAnswered = answered >= questionList.length;
    setConfirm({
      kind: "submit",
      title: isTest ? "Submit test?" : "Submit practice?",
      message: `You've answered ${answered} of ${questionList.length}. You can't change answers after submitting.`,
      confirmLabel: "Submit now",
      // "Keep going" only makes sense while questions remain; once everything is
      // answered the dismiss action is just "Cancel".
      cancelLabel: allAnswered ? "Cancel" : "Keep going",
      destructive: isTest,
    });
  };

  // Persist the on-screen answer (test mode saves on submit, not per-question)
  // then end the session.
  const finalizeSubmit = async () => {
    if (isTest && !current.answered && hasCurrentAnswer) {
      setSavingIdx(currentIdx);
      try {
        await saveResponse(
          question.id,
          isNumeric
            ? {
                numeric: true,
                numericValue: current.selected,
                markedForReview: current.markedForReview,
              }
            : { choiceIds: currentChoiceIds, markedForReview: current.markedForReview },
        );
      } finally {
        setSavingIdx(null);
      }
    }
    finishPractice();
  };

  const finishPractice = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (pendingSaves.current.size > 0) {
      try { await Promise.all(Array.from(pendingSaves.current)); } catch {}
    }
    onEnd(answers, totalSeconds, questionList);
  };

  // X (close) in the header: confirm, then submit the attempt — mirrors the
  // mock exam screen. Once submitted, answers can't be changed.
  const handleEndPractice = () => {
    setConfirm({
      kind: "exit",
      title: isTest ? "Exit test?" : "Exit practice?",
      message: "Your answers will be submitted and you won't be able to change them.",
      confirmLabel: "Submit & Exit",
      cancelLabel: "Cancel",
      destructive: true,
    });
  };

  // Run the pending confirmation (submit or exit). Both paths end the session
  // and navigate away, so the modal unmounts with the screen on success.
  const runConfirm = async () => {
    if (!confirm || finishing) return;
    setFinishing(true);
    try {
      if (confirm.kind === "submit") {
        await finalizeSubmit();
      } else {
        await finishPractice();
      }
    } finally {
      setFinishing(false);
      setConfirm(null);
    }
  };

  // Per-option predicates — unified across single- and multi-select. For multi,
  // an option is "selected" if it's in the tick set and "correct" if it's in the
  // correct set; single-select collapses each set to its one id.
  const correctIdSet = isMulti
    ? question.correctChoiceIds ?? []
    : question.correctChoiceId != null
      ? [question.correctChoiceId]
      : [];
  const isOptSelected = (optId: string) =>
    isMulti ? currentSelectedIds.includes(optId) : current.selected === optId;
  const isOptCorrect = (optId: string) => correctIdSet.includes(optId);

  // Option styling
  const getOptStyle = (optId: string) => {
    if (!reveal) {
      return [styles.optRow, isOptSelected(optId) && styles.optSelected];
    }
    if (isOptCorrect(optId)) return [styles.optRow, styles.optCorrect];
    if (isOptSelected(optId)) return [styles.optRow, styles.optWrong];
    return [styles.optRow, styles.optDimmed];
  };

  const getLetterStyle = (optId: string) => {
    if (!reveal) {
      return [styles.optLetter, isOptSelected(optId) && styles.optLetterSelected];
    }
    if (isOptCorrect(optId)) return [styles.optLetter, styles.optLetterCorrect];
    if (isOptSelected(optId)) return [styles.optLetter, styles.optLetterWrong];
    return [styles.optLetter];
  };

  const getLetterTextStyle = (optId: string) => {
    if (!reveal && isOptSelected(optId)) return { color: "#fff" };
    if (reveal) {
      if (isOptCorrect(optId) || isOptSelected(optId)) return { color: "#fff" };
    }
    return { color: "#9CA3AF" };
  };

  const getOptTextStyle = (optId: string) => {
    if (!reveal) {
      return [styles.optText, isOptSelected(optId) && { color: '#6C63FF', fontWeight: "600" as const }];
    }
    if (isOptCorrect(optId)) return [styles.optText, { color: "#16A34A", fontWeight: "600" as const }];
    if (isOptSelected(optId)) return [styles.optText, { color: "#EF4444", fontWeight: "600" as const }];
    return [styles.optText, { color: "#9CA3AF" }];
  };

  // Correct option object(s), for the feedback box's "Correct answer:" line.
  const correctOptObjs = question.options.filter((o) => correctIdSet.includes(o.id));

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
      </View>

      {/* Body */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 20}
      >
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomBarHeight > 0 ? bottomBarHeight + insets.bottom + 12 : 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
        {/* Question label + marks */}
        <View style={styles.qMetaRow}>
          <View>
            <Text style={styles.qLabel}>
              QUESTION {currentIdx + 1} / {questionList.length}
            </Text>
            <View style={styles.qTypeBadge}>
              <Text style={styles.qTypeText}>{questionTypeLabel(question.type)}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {/* Marks chips only apply to test mode — practice isn't scored
                with +/- marks, so hide them there. */}
            {isTest && (
              <View style={styles.marksRow}>
                <View style={[styles.marksChip, styles.marksChipPositive]}>
                  <Text style={[styles.marksChipText, styles.marksChipTextPositive]}>
                    +{question.marksCorrect ?? 4}
                  </Text>
                </View>
                <View style={[styles.marksChip, styles.marksChipNegative]}>
                  <Text style={[styles.marksChipText, styles.marksChipTextNegative]}>
                    {Number(question.marksIncorrect ?? -1) > 0
                      ? `-${question.marksIncorrect}`
                      : (question.marksIncorrect ?? -1)}
                  </Text>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={styles.flagBtn}
              onPress={() => setShowFlagModal(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="flag-outline" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Question text */}
          <Text style={styles.qText}>{stripHtml(question.text)}</Text>

          {/* Question image */}
          {question.image ? (
            <Image
              source={{ uri: question.image }}
              style={styles.qImage}
              resizeMode="contain"
            />
          ) : null}

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
            {isMulti && (
              <Text style={styles.multiHint}>Select all that apply</Text>
            )}
            {question.options.map((opt, idx) => (
              <TouchableOpacity
                key={opt.id}
                style={getOptStyle(opt.id)}
                onPress={() => handleSelectOption(opt.id)}
                activeOpacity={current.answered ? 1 : 0.7}
              >
                <View
                  style={[
                    getLetterStyle(opt.id),
                    // Multi-select uses a rounded-square (checkbox) affordance.
                    isMulti && { borderRadius: 8 },
                  ]}
                >
                  <Text style={[styles.optLetterText, getLetterTextStyle(opt.id)]}>
                    {isMulti && !reveal && isOptSelected(opt.id)
                      ? "✓"
                      : String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <View style={styles.optBody}>
                  {stripHtml(opt.text) ? (
                    <Text style={getOptTextStyle(opt.id)}>{stripHtml(opt.text)}</Text>
                  ) : null}
                  {opt.image ? (
                    <Image
                      source={{ uri: opt.image }}
                      style={styles.optImage}
                      resizeMode="contain"
                    />
                  ) : null}
                </View>
                {reveal && isOptCorrect(opt.id) && (
                  <Ionicons name="checkmark" size={18} color="#22C55E" style={{ marginLeft: "auto" }} />
                )}
                {reveal && isOptSelected(opt.id) && !isOptCorrect(opt.id) && (
                  <Ionicons name="close" size={18} color="#EF4444" style={{ marginLeft: "auto" }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          )}

          {/* Feedback */}
          {reveal && (
            <View style={[styles.feedbackBox, current.correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
              <View style={styles.feedbackHeader}>
                <Text style={[styles.feedbackTitle, { color: current.correct ? "#22C55E" : "#EF4444" }]}>
                  {current.correct ? "✓  Correct!" : "✗  Incorrect"}
                </Text>
              </View>
              {!current.correct && correctOptObjs.length > 0 && (
                <View style={styles.answerInfo}>
                  <Text style={styles.answerInfoText}>
                    {correctOptObjs.length > 1 ? "Correct answers:" : "Correct answer:"}{" "}
                    <Text style={{ fontWeight: "700", color: "#16A34A" }}>
                      {correctOptObjs.map((o) => stripHtml(o.text)).join(", ")}
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
                    <Ionicons name="sparkles" size={13} color="#6C63FF" />
                    <Text style={styles.askTutorText}>Ask the AI tutor</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom bar */}
      <View
        style={[
          styles.bottomBar,
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            // Clear the Android nav bar / iOS home indicator so the button
            // isn't drawn underneath it.
            paddingBottom: Math.max(insets.bottom, Platform.OS === "ios" ? 8 : 16),
          },
        ]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          setBottomBarHeight((prev) => Math.max(prev, h));
        }}
      >
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
              style={styles.nextBtn}
              onPress={handleTestNext}
              disabled={savingIdx === currentIdx}
              activeOpacity={0.85}
            >
              {savingIdx === currentIdx ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.nextBtnText} numberOfLines={1}>
                    {isLast ? "Submit test" : "Next question"}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : !current.answered ? (
          <TouchableOpacity
            style={[styles.checkBtn, (!hasCurrentAnswer || savingIdx === currentIdx) && styles.checkBtnDisabled]}
            onPress={handleCheckAnswer}
            disabled={!hasCurrentAnswer || savingIdx === currentIdx}
            activeOpacity={0.85}
          >
            {savingIdx === currentIdx ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.checkBtnText}>Check Answer</Text>
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
              style={styles.nextBtn}
              onPress={handleNextQuestion}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText} numberOfLines={1}>
                {isLast ? "Submit" : "Next question"}
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

      <ConfirmModal
        visible={confirm !== null}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        cancelLabel={confirm?.cancelLabel ?? "Cancel"}
        confirmLabel={confirm?.confirmLabel ?? "Confirm"}
        confirmIcon="checkmark"
        destructive={confirm?.destructive ?? false}
        loading={finishing}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
      <FlagQuestionModal
        visible={showFlagModal}
        onClose={() => setShowFlagModal(false)}
        questionId={question?.id}
        questionNumber={currentIdx + 1}
        choices={
          isNumeric
            ? []
            : question.options.map((o, idx) => ({
                id: o.id,
                label: String.fromCharCode(65 + idx),
                text: stripHtml(o.text),
              }))
        }
      />
    </SafeAreaView>
  );
}
