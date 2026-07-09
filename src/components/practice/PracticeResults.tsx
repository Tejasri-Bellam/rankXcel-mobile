import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CircleProgress from "@/src/components/dashboard/CircleProgress";
import { AnswerState } from "./PracticeExamFlow";
import { PracticeApiQuestion } from "./PracticeQuestions";
import { getScoreColor } from "@/src/styles/styles";
import {
  getMockAttemptResultService,
  getMockAttemptReviewService,
  MockTestResult,
} from "@/src/libs/services/mock-library";
import { practiceResultsStyles as styles } from "@/src/styles/styles/practice/practiceresultsstyles";
import { OPTION_LETTERS } from "@/src/libs/constants";

interface Props {
  chapterName: string;
  // Attempt to pull the authoritative result + review from. When set, the
  // /result/ and /review/ endpoints drive the screen; otherwise it falls back
  // to the questions/answers computed locally during the session.
  attemptId?: number | string | null;
  questions: PracticeApiQuestion[];
  answers: AnswerState[];
  totalSeconds: number;
  submitting?: boolean;
  isTest?: boolean;
  onTryAgain: () => void;
  onBackToHub: () => void;
}

const unwrap = (res: any): any =>
  res && typeof res === "object" && "data" in res ? (res as any).data : res;

// First id from an array (of ids or {id} objects) or a scalar.
const firstId = (raw: any): string | null => {
  const arr = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
  if (!arr.length) return null;
  const v = arr[0];
  return v == null ? null : String(v?.id ?? v);
};

// Parse the /review/ response into the screen's existing view models so the
// render code below works unchanged. Returns null if no questions are found.
const parseReview = (
  raw: any,
): { questions: PracticeApiQuestion[]; answers: AnswerState[] } | null => {
  const list: any[] = Array.isArray(raw?.questions)
    ? raw.questions
    : Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data?.questions)
    ? raw.data.questions
    : [];
  if (!list.length) return null;

  const questions: PracticeApiQuestion[] = [];
  const answers: AnswerState[] = [];

  for (const q of list) {
    const id = q.question_id ?? q.id ?? q.question?.id;
    if (id == null) continue;

    const choicesRaw =
      q.choices ?? q.options ?? q.question?.choices ?? q.question?.options ?? [];
    const options = (Array.isArray(choicesRaw) ? choicesRaw : []).map((c: any) => ({
      id: String(c?.id ?? c?.value ?? ""),
      text: c?.text ?? c?.label ?? String(c ?? ""),
      image: c?.image ?? null,
    }));

    const type = q.question_type ?? q.type ?? q.question?.question_type ?? "MCQ";
    const numeric = !!type && String(type).toUpperCase().includes("NUMERIC");

    // Correct answer — top-level arrays/flags or per-choice is_correct.
    let correctChoiceId =
      firstId(
        q.correct_answers ??
          q.correct_options ??
          q.correct_choice_ids ??
          q.correct_choice_id,
      ) ?? null;
    if (!correctChoiceId) {
      const flagged = (Array.isArray(choicesRaw) ? choicesRaw : []).find(
        (c: any) => c?.is_correct === true || c?.correct === true,
      );
      if (flagged) correctChoiceId = String(flagged.id);
    }
    const correctAnswer =
      q.correct_answer ?? q.correct_numeric_answer ?? q.question?.correct_answer ?? null;

    // Student's answer.
    const ya = q.your_answer ?? q.response ?? q;
    const selectedId = firstId(ya?.selected_choice_ids ?? ya?.selected_options);
    const numericAns = ya?.numeric_answer ?? q.numeric_answer ?? null;
    const selected = numeric
      ? numericAns != null
        ? String(numericAns)
        : null
      : selectedId;
    const answered = selected != null && String(selected).trim() !== "";

    // Correctness — prefer the server's flag, else derive from the key.
    let correct: boolean | null =
      typeof (q.is_correct ?? ya?.is_correct) === "boolean"
        ? (q.is_correct ?? ya?.is_correct)
        : null;
    if (correct == null && answered) {
      if (numeric && correctAnswer != null)
        correct = String(selected).trim() === String(correctAnswer).trim();
      else if (!numeric && correctChoiceId != null)
        correct = String(selected) === String(correctChoiceId);
    }

    questions.push({
      id,
      text: q.question_text ?? q.text ?? q.question?.question_text ?? "",
      image: q.image ?? q.question?.image ?? null,
      type,
      options,
      correctChoiceId,
      correctAnswer: correctAnswer != null ? String(correctAnswer) : null,
      explanation:
        q.explanation ?? q.solution ?? q.solution_text ?? q.question?.explanation ?? "",
      marksCorrect: Number(q.marks_correct ?? q.question?.marks_correct ?? 4),
      marksIncorrect: Number(q.marks_incorrect ?? q.question?.marks_incorrect ?? -1),
    });
    answers.push({
      selected: answered ? String(selected) : null,
      markedForReview: !!(q.is_marked_for_review ?? ya?.is_marked_for_review),
      answered,
      correct,
    });
  }

  return questions.length ? { questions, answers } : null;
};

const SCREEN_BG = "#EEEFF5";

const accColor = getScoreColor;

const heading = (pct: number) => {
  if (pct >= 80) return "Great job 🎉";
  if (pct >= 50) return "Nice work 👏";
  return "Keep going 🌱";
};

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

const isNumericType = (t?: string): boolean =>
  !!t && t.toUpperCase().includes("NUMERIC");

type QStatus = "correct" | "wrong" | "skipped";

// Resolve each question's outcome from the answer key carried back from the
// session. Falls back to recomputing when correctness was left undetermined
// during play (e.g. an API check that didn't return `is_correct`).
const computeStatus = (q: PracticeApiQuestion, a?: AnswerState): QStatus => {
  const sel = a?.selected ?? null;
  const answered = sel != null && !(typeof sel === "string" && sel.trim() === "");
  if (!answered) return "skipped";
  if (a?.correct === true) return "correct";
  if (a?.correct === false) return "wrong";
  if (isNumericType(q.type)) {
    if (q.correctAnswer != null)
      return String(sel).trim() === String(q.correctAnswer).trim() ? "correct" : "wrong";
  } else if (q.correctChoiceId != null) {
    return String(sel) === String(q.correctChoiceId) ? "correct" : "wrong";
  }
  // Attempted but no answer key available — still count it as attempted.
  return "wrong";
};

export default function PracticeResults({
  chapterName,
  attemptId,
  questions,
  answers,
  totalSeconds,
  submitting = false,
  isTest = false,
  onTryAgain,
  onBackToHub,
}: Props) {
  const [view, setView] = useState<"results" | "review">("results");

  // Android hardware back mirrors the in-screen back buttons: the review screen
  // returns to results, and the results screen leaves the flow.
  useEffect(() => {
    const onBack = () => {
      if (view === "review") { setView("results"); return true; }
      onBackToHub();
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => sub.remove();
  }, [view, onBackToHub]);

  // Server-authoritative result + review, fetched once the attempt is submitted.
  const [apiResult, setApiResult] = useState<MockTestResult | null>(null);
  const [apiQuestions, setApiQuestions] = useState<PracticeApiQuestion[] | null>(null);
  const [apiAnswers, setApiAnswers] = useState<AnswerState[] | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // The /result/ and /review/ endpoints are only valid after submit, so wait
    // for `submitting` to clear; fetch once.
    if (attemptId == null || submitting || fetchedRef.current) return;
    fetchedRef.current = true;
    (async () => {
      setApiLoading(true);
      try {
        const [rRes, vRes] = await Promise.allSettled([
          getMockAttemptResultService(attemptId),
          getMockAttemptReviewService(attemptId),
        ]);
        if (rRes.status === "fulfilled") setApiResult(unwrap(rRes.value) ?? null);
        if (vRes.status === "fulfilled") {
          const parsed = parseReview(unwrap(vRes.value));
          if (parsed) {
            setApiQuestions(parsed.questions);
            setApiAnswers(parsed.answers);
          }
        }
      } catch (e) {
        console.log("Practice result/review fetch error:", e);
      } finally {
        setApiLoading(false);
      }
    })();
  }, [attemptId, submitting]);

  // Prefer the server's review/result; fall back to the locally-played data.
  const effQuestions = apiQuestions ?? questions;
  const effAnswers = apiAnswers ?? answers;
  const timeSeconds = apiResult?.time_taken_seconds ?? totalSeconds;

  const statuses = effQuestions.map((q, i) => computeStatus(q, effAnswers[i]));
  const correct = statuses.filter((s) => s === "correct").length;
  const wrong = statuses.filter((s) => s === "wrong").length;
  const total = effQuestions.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const color = accColor(accuracy);

  // DUMMY: no XP API yet — playful value derived from correct answers.
  const xp = correct * 10;

  if (view === "review") {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setView("results")}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#6C63FF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.pageTitle}>Review</Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.reviewContent}
          showsVerticalScrollIndicator={false}
        >
          {effQuestions.map((q, i) => {
            const ans = effAnswers[i];
            const userSel = ans?.selected ?? null;
            const qStatus = statuses[i];
            const status =
              qStatus === "correct"
                ? { label: "Correct", color: "#16A34A", bg: "#DCFCE7", icon: "checkmark" as const }
                : qStatus === "wrong"
                ? { label: "Wrong", color: "#DC2626", bg: "#FEE2E2", icon: "close" as const }
                : { label: "Skipped", color: "#9CA3AF", bg: "#F3F4F6", icon: "remove" as const };
            const numeric = isNumericType(q.type);

            return (
              <View key={q.id} style={styles.reviewCard}>
                <View style={styles.reviewHeadRow}>
                  <Text style={styles.qTag}>Q{i + 1}</Text>
                  <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                    <Ionicons name={status.icon} size={12} color={status.color} />
                    <Text style={[styles.statusPillText, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.reviewQText}>{q.text}</Text>

                {q.image ? (
                  <Image source={{ uri: q.image }} style={styles.reviewQImage} resizeMode="contain" />
                ) : null}

                {numeric ? (
                  <View style={styles.numericReview}>
                    <Text style={styles.numericReviewRow}>
                      Your answer:{" "}
                      <Text
                        style={{
                          fontWeight: "700",
                          color: qStatus === "correct" ? "#15803D" : "#B91C1C",
                        }}
                      >
                        {userSel != null && String(userSel).trim() !== ""
                          ? String(userSel)
                          : "—"}
                      </Text>
                    </Text>
                    {qStatus !== "correct" && q.correctAnswer != null && (
                      <Text style={styles.numericReviewRow}>
                        Correct answer:{" "}
                        <Text style={{ fontWeight: "700", color: "#15803D" }}>
                          {String(q.correctAnswer)}
                        </Text>
                      </Text>
                    )}
                  </View>
                ) : (
                  q.options.map((opt, oi) => {
                  const isCorrect = String(opt.id) === String(q.correctChoiceId);
                  const isUserWrong =
                    String(opt.id) === String(userSel) && !isCorrect;
                  const rowStyle = isCorrect
                    ? styles.optCorrect
                    : isUserWrong
                    ? styles.optWrong
                    : styles.optNeutral;
                  const textStyle = isCorrect
                    ? { color: "#15803D" }
                    : isUserWrong
                    ? { color: "#B91C1C" }
                    : { color: "#1A1A2E" };
                  return (
                    <View key={opt.id} style={[styles.optRow, rowStyle]}>
                      <Text style={[styles.optLetter, textStyle]}>
                        {OPTION_LETTERS[oi] ?? oi + 1}
                      </Text>
                      <View style={styles.optBody}>
                        {opt.text ? (
                          <Text style={[styles.optText, textStyle]} numberOfLines={3}>
                            {opt.text}
                          </Text>
                        ) : null}
                        {opt.image ? (
                          <Image source={{ uri: opt.image }} style={styles.optImage} resizeMode="contain" />
                        ) : null}
                      </View>
                      {isCorrect ? (
                        <Ionicons name="checkmark" size={16} color="#16A34A" />
                      ) : isUserWrong ? (
                        <Ionicons name="close" size={16} color="#DC2626" />
                      ) : null}
                    </View>
                  );
                  })
                )}

                {q.explanation ? (
                  <View style={styles.whyBox}>
                    <Text style={styles.whyText}>
                      <Text style={styles.whyLabel}>Why: </Text>
                      {q.explanation}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Results view ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBackToHub} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color="#6C63FF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.resultsTitle}>Results</Text>

        <View style={styles.ringWrap}>
          <CircleProgress
            size={150}
            strokeWidth={13}
            progress={accuracy}
            color={color}
            trackColor="#E3E5EE"
            bgColor={SCREEN_BG}
          >
            <Text style={styles.ringPct}>{accuracy}%</Text>
            <Text style={styles.ringSub}>
              {correct}/{total} correct
            </Text>
          </CircleProgress>
        </View>

        <Text style={styles.heading}>{heading(accuracy)}</Text>
        <Text style={styles.subheading}>{chapterName} · {isTest ? "test" : "practice"}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark" size={18} color="#22C55E" />
            <Text style={styles.statValue}>{correct}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="close" size={18} color="#EF4444" />
            <Text style={styles.statValue}>{wrong}</Text>
            <Text style={styles.statLabel}>Wrong</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={18} color="#6C63FF" />
            <Text style={styles.statValue}>{formatTime(timeSeconds)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>

        <View style={styles.xpBanner}>
          <Ionicons name="flash" size={18} color="#F5A623" />
          <View style={{ flex: 1 }}>
            <Text style={styles.xpTitle}>+{xp} XP earned</Text>
            <Text style={styles.xpSub}>Streak extended · keep it up!</Text>
          </View>
        </View>

        {submitting || apiLoading ? (
          <View style={styles.submittingRow}>
            <ActivityIndicator size="small" color="#6C63FF" />
            <Text style={styles.submittingText}>
              {submitting ? "Saving your session…" : "Loading your results…"}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => setView("review")}
          activeOpacity={0.85}
        >
          <Ionicons name="eye-outline" size={17} color="#fff" />
          <Text style={styles.reviewBtnText}>Review Answers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={onBackToHub}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onTryAgain} style={styles.tryAgain} activeOpacity={0.7}>
          <Text style={styles.tryAgainText}>Try again</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
