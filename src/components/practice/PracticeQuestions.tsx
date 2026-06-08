import React, { useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AnswerState } from "./PracticeExamFlow";
import {
  askMockTestTutorService,
  submitMockResponseService,
} from "@/src/libs/services/mock-library";
import { stripHtml } from "@/src/libs/utils/html";
import TutorModal from "@/src/components/common/TutorModal";

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
  onEnd: (answers: AnswerState[], totalSeconds: number) => void;
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
}: {
  current: number;
  total: number;
  answers: AnswerState[];
}) => (
  <View style={pbStyles.container}>
    {answers.map((a, i) => {
      let bg = "#E5E7EB";
      if (i === current) bg = "#3B7DF8";
      else if (i < current) {
        if (a.correct === true) bg = "#22C55E";
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

const pbStyles = StyleSheet.create({
  container: { flexDirection: "row", gap: 3, height: 3, flex: 1 },
  segment: { flex: 1, borderRadius: 2 },
  segmentActive: { flex: 1.4 },
});

export default function PracticeQuestions({
  mockId,
  questions,
  chapterName,
  timerMinutes,
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
  const [tutorVisible, setTutorVisible] = useState(false);

  const saveResponse = (qId: number | string, selected: string | null, markedForReview = false) => {
    const ids = selected ? [Number(selected)].filter((n) => Number.isFinite(n)) : [];
    const elapsed = Math.max(0, Math.round((Date.now() - questionStartRef.current) / 1000));
    const promise = submitMockResponseService(mockId, qId, {
      selected_choice_ids: ids,
      is_marked_for_review: markedForReview,
      time_spent_seconds: elapsed,
    }).catch((e) => { console.log("PRACTICE SAVE ERROR:", e); return null; });
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

  const handleCheckAnswer = async () => {
    if (!current.selected || current.answered) return;
    const idx = currentIdx;
    const selected = current.selected;
    setSavingIdx(idx);
    try {
      const res = await saveResponse(question.id, selected, current.markedForReview);
      if (res == null) return;
      const body = unwrap(res);
      const apiCorrectId = extractCorrectChoiceId(body);
      const explanationRaw = extractExplanation(body);
      const structured = parseExplanation(explanationRaw);

      if (apiCorrectId || explanationRaw) {
        setQuestionList((prev) => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            correctChoiceId: apiCorrectId ?? next[idx].correctChoiceId,
            explanation: structured ? "" : (explanationRaw ?? next[idx].explanation),
            explanationStructured: structured ?? next[idx].explanationStructured ?? null,
          };
          return next;
        });
      }

      const effectiveCorrectId = apiCorrectId ?? question.correctChoiceId;
      const finalCorrect: boolean | null =
        typeof body?.is_correct === "boolean"
          ? body.is_correct
          : effectiveCorrectId != null
          ? selected === effectiveCorrectId
          : null;

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

  const finishPractice = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (pendingSaves.current.size > 0) {
      try { await Promise.all(Array.from(pendingSaves.current)); } catch {}
    }
    onEnd(answers, totalSeconds);
  };

  const handleEndPractice = () => finishPractice();

  // Option styling
  const getOptStyle = (optId: string) => {
    if (!current.answered) {
      return [styles.optRow, current.selected === optId && styles.optSelected];
    }
    if (optId === question.correctChoiceId) return [styles.optRow, styles.optCorrect];
    if (optId === current.selected) return [styles.optRow, styles.optWrong];
    return [styles.optRow, styles.optDimmed];
  };

  const getLetterStyle = (optId: string) => {
    if (!current.answered) {
      return [styles.optLetter, current.selected === optId && styles.optLetterSelected];
    }
    if (optId === question.correctChoiceId) return [styles.optLetter, styles.optLetterCorrect];
    if (optId === current.selected) return [styles.optLetter, styles.optLetterWrong];
    return [styles.optLetter];
  };

  const getLetterTextStyle = (optId: string) => {
    if (!current.answered && current.selected === optId) return { color: "#fff" };
    if (current.answered) {
      if (optId === question.correctChoiceId || optId === current.selected) return { color: "#fff" };
    }
    return { color: "#9CA3AF" };
  };

  const getOptTextStyle = (optId: string) => {
    if (!current.answered) {
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
          <Text style={styles.headerMode}>Practice</Text>
          <ProgressBar current={currentIdx} total={questionList.length} answers={answers} />
        </View>
        <TouchableOpacity
          style={styles.tutorBtn}
          activeOpacity={0.8}
          onPress={() => setTutorVisible(true)}
        >
          <Ionicons name="sparkles" size={13} color="#fff" />
          <Text style={styles.tutorText}>Tutor</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Question label */}
        <Text style={styles.qLabel}>
          QUESTION {currentIdx + 1} / {questionList.length}
        </Text>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Question text */}
          <Text style={styles.qText}>{stripHtml(question.text)}</Text>

          {/* Options */}
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
                {current.answered && opt.id === question.correctChoiceId && (
                  <Ionicons name="checkmark" size={18} color="#22C55E" style={{ marginLeft: "auto" }} />
                )}
                {current.answered && opt.id === current.selected && opt.id !== question.correctChoiceId && (
                  <Ionicons name="close" size={18} color="#EF4444" style={{ marginLeft: "auto" }} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Swipe hint */}
          <Text style={styles.swipeHint}>— Swipe to move between questions —</Text>

          {/* Feedback */}
          {current.answered && (
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
        {!current.answered ? (
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

      <TutorModal
        visible={tutorVisible}
        onClose={() => setTutorVisible(false)}
        questionId={question?.id}
        questionText={question?.text}
        ask={(payload) => askMockTestTutorService(mockId, payload)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 10,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, gap: 2 },
  headerChapter: { fontSize: 14, fontWeight: "700", color: "#1A1A2E" },
  headerMode: { fontSize: 11, color: "#9CA3AF" },
  tutorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#3B7DF8",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tutorText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  // Question
  qLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#AAAAAA",
    letterSpacing: 1,
    marginBottom: 12,
  },
  qText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    lineHeight: 26,
    marginBottom: 20,
  },

  // Options
  optionsList: { gap: 10 },
  optRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  optSelected: { borderColor: "#3B7DF8", backgroundColor: "#F0F6FF" },
  optCorrect: { borderColor: "#22C55E", backgroundColor: "#F0FDF4" },
  optWrong: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
  optDimmed: { opacity: 0.45 },
  optLetter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    flexShrink: 0,
  },
  optLetterSelected: { backgroundColor: "#3B7DF8", borderColor: "#3B7DF8" },
  optLetterCorrect: { backgroundColor: "#22C55E", borderColor: "#22C55E" },
  optLetterWrong: { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  optLetterText: { fontSize: 12, fontWeight: "700" },
  optText: { flex: 1, fontSize: 14, fontWeight: "500", color: "#1A1A2E" },

  swipeHint: {
    textAlign: "center",
    fontSize: 12,
    color: "#D1D5DB",
    marginVertical: 14,
  },

  // Feedback
  feedbackBox: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginTop: 4,
  },
  feedbackCorrect: { backgroundColor: "#F0FDF4", borderColor: "#86EFAC" },
  feedbackWrong: { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" },
  feedbackHeader: { marginBottom: 10 },
  feedbackTitle: { fontSize: 16, fontWeight: "800" },
  answerInfo: { marginBottom: 10 },
  answerInfoText: { fontSize: 13, color: "#6B7280" },
  explBox: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 12,
    padding: 12,
  },
  explHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  explTitle: { fontSize: 13, fontWeight: "700", color: "#F59E0B" },
  explText: { fontSize: 13, color: "#555", lineHeight: 20 },
  explStepHead: { fontSize: 13, fontWeight: "700", color: "#3B7DF8", marginBottom: 2 },
  askTutorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: "#3B7DF8",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
  },
  askTutorText: { fontSize: 12, fontWeight: "700", color: "#3B7DF8" },

  // Bottom bar
  bottomBar: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 8 : 16,
  },
  checkBtn: {
    backgroundColor: "#3B7DF8",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBtnDisabled: { backgroundColor: "#D1D5DB" },
  checkBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  navRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  prevBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  prevBtnText: { fontSize: 14, fontWeight: "700", color: "#555" },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#22C55E",
    borderRadius: 16,
    paddingVertical: 15,
  },
  nextBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});