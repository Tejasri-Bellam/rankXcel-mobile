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
import {
  idSetsEqual,
  isMultiSelectType,
  isNumericalType,
} from "@/src/libs/utils/questionType";

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

// All ids from an array (of ids or {id} objects) or a scalar — used for the
// MCQ_MULTIPLE correct set and the student's multi-selection.
const allIds = (raw: any): string[] => {
  const arr = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
  return arr.map((v: any) => String(v?.id ?? v)).filter(Boolean);
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
    const numeric = isNumericalType(type);
    const multi = isMultiSelectType(type);

    // Correct answer — top-level arrays/flags or per-choice is_correct.
    let correctChoiceId =
      firstId(
        q.correct_answers ??
          q.correct_options ??
          q.correct_choice_ids ??
          q.correct_choice_id,
      ) ?? null;
    // Full correct set for MCQ_MULTIPLE (falls back to the flagged choices, then
    // the single id above).
    let correctChoiceIds = allIds(
      q.correct_choice_ids ?? q.correct_answers ?? q.correct_options,
    );
    if (correctChoiceIds.length === 0) {
      correctChoiceIds = (Array.isArray(choicesRaw) ? choicesRaw : [])
        .filter((c: any) => c?.is_correct === true || c?.correct === true)
        .map((c: any) => String(c.id));
    }
    if (!correctChoiceId) {
      correctChoiceId = correctChoiceIds[0] ?? null;
      if (!correctChoiceId) {
        const flagged = (Array.isArray(choicesRaw) ? choicesRaw : []).find(
          (c: any) => c?.is_correct === true || c?.correct === true,
        );
        if (flagged) correctChoiceId = String(flagged.id);
      }
    }
    if (correctChoiceIds.length === 0 && correctChoiceId != null)
      correctChoiceIds = [correctChoiceId];
    // change `const correctAnswer = ...` to `let`, then add the fallback:
    let correctAnswer =
      q.correct_answer ?? q.correct_numeric_answer ?? q.question?.correct_answer ?? null;
    if (correctAnswer == null && numeric) {
      const flagged = (Array.isArray(choicesRaw) ? choicesRaw : []).find(
        (c: any) =>
          c?.is_correct === true ||
          c?.correct === true ||
          String(c?.id) === String(correctChoiceId),
      );
      const text = flagged?.text ?? flagged?.label;
      if (text != null && String(text).trim() !== "") correctAnswer = String(text).trim();
    }

    // Student's answer.
    const ya = q.your_answer ?? q.response ?? q;
    const selectedIds = allIds(ya?.selected_choice_ids ?? ya?.selected_options);
    const selectedId = selectedIds[0] ?? null;
    const numericAns = ya?.numeric_answer ?? q.numeric_answer ?? null;
    const selected = numeric
      ? numericAns != null
        ? String(numericAns)
        : null
      : selectedId;
    const answered = multi
      ? selectedIds.length > 0
      : selected != null && String(selected).trim() !== "";

    // Correctness — prefer the server's flag, else derive from the key.
    let correct: boolean | null =
      typeof (q.is_correct ?? ya?.is_correct) === "boolean"
        ? (q.is_correct ?? ya?.is_correct)
        : null;
    if (correct == null && answered) {
      if (numeric && correctAnswer != null)
        correct = String(selected).trim() === String(correctAnswer).trim();
      else if (multi && correctChoiceIds.length > 0)
        correct = idSetsEqual(selectedIds, correctChoiceIds);
      else if (!numeric && !multi && correctChoiceId != null)
        correct = String(selected) === String(correctChoiceId);
    }

    questions.push({
      id,
      text: q.question_text ?? q.text ?? q.question?.question_text ?? "",
      image: q.image ?? q.question?.image ?? null,
      type,
      options,
      correctChoiceId,
      correctChoiceIds: correctChoiceIds.length > 0 ? correctChoiceIds : null,
      correctAnswer: correctAnswer != null ? String(correctAnswer) : null,
      explanation:
        q.explanation ?? q.solution ?? q.solution_text ?? q.question?.explanation ?? "",
      marksCorrect: Number(q.marks_correct ?? q.question?.marks_correct ?? 4),
      marksIncorrect: Number(q.marks_incorrect ?? q.question?.marks_incorrect ?? -1),
    });
    answers.push({
      selected: answered && !multi ? String(selected) : null,
      selectedIds: multi ? selectedIds : [],
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

type QStatus = "correct" | "wrong" | "skipped";

// Resolve each question's outcome from the answer key carried back from the
// session. Falls back to recomputing when correctness was left undetermined
// during play (e.g. an API check that didn't return `is_correct`).
const computeStatus = (q: PracticeApiQuestion, a?: AnswerState): QStatus => {
  // MCQ_MULTIPLE: keyed on the tick set, not the single `selected` value.
  if (isMultiSelectType(q.type)) {
    const selIds = a?.selectedIds ?? [];
    if (selIds.length === 0) return "skipped";
    if (a?.correct === true) return "correct";
    if (a?.correct === false) return "wrong";
    const correctIds = q.correctChoiceIds ?? [];
    return correctIds.length > 0 && idSetsEqual(selIds, correctIds) ? "correct" : "wrong";
  }
  const sel = a?.selected ?? null;
  const answered = sel != null && !(typeof sel === "string" && sel.trim() === "");
  if (!answered) return "skipped";
  if (a?.correct === true) return "correct";
  if (a?.correct === false) return "wrong";
  if (isNumericalType(q.type)) {
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
  // Tracks which question's explanation panel is open on the review screen
  // (keyed by question id), mirroring SolutionViewer's collapsible "Why" box.
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});

  const toggleExplanation = (key: string) => {
    setExpandedExplanations((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
  // Prefer the top-level counts the API now returns; fall back to the
  // per-question statuses computed from the review/local data.
  const correct = statuses.filter((s) => s === "correct").length;
const wrong = statuses.filter((s) => s === "wrong").length;
  const total = effQuestions.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const color = accColor(accuracy);

  // Raw marks from the server result (reflects negative marking, unlike the
  // accuracy above). Only shown when the /result/ payload carries a maximum.
  const totalScore = Number(apiResult?.total_score ?? 0);
  const maxScore = Number(apiResult?.max_score ?? 0);
  const hasScore = maxScore > 0;

  if (view === "review") {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.reviewHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setView("results")}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color="#6C63FF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.reviewHeaderTitle}>Review</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.reviewScrollContent}
        >
          {effQuestions.map((q, i) => {
            const ans = effAnswers[i];
            const userSel = ans?.selected ?? null;
            const multi = isMultiSelectType(q.type);
            // Sets driving the per-option highlight (single-select collapses to
            // one id each).
            const userSelIds = multi
              ? ans?.selectedIds ?? []
              : userSel != null
              ? [String(userSel)]
              : [];
            const correctIds = multi
              ? q.correctChoiceIds ?? []
              : q.correctChoiceId != null
              ? [String(q.correctChoiceId)]
              : [];
            const qStatus = statuses[i];
            const numeric = isNumericalType(q.type);
            const explKey = String(q.id ?? i);
            const isOpen = !!expandedExplanations[explKey];

            return (
              <View key={q.id} style={styles.questionCard}>
                {/* Q label + outcome */}
                <View style={styles.qCardHeader}>
                  <Text style={styles.qCardNum}>Q{i + 1}</Text>
                  {qStatus === "skipped" ? (
                    <View style={styles.outcomeBadge}>
                      <Text style={styles.outcomeBadgeText}>— Skipped</Text>
                    </View>
                  ) : qStatus === "correct" ? (
                    <View style={[styles.outcomeBadge, styles.outcomeBadgeCorrect]}>
                      <Ionicons name="checkmark" size={12} color="#22C55E" />
                      <Text style={[styles.outcomeBadgeText, { color: "#22C55E" }]}>
                        Correct
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.outcomeBadge, styles.outcomeBadgeWrong]}>
                      <Ionicons name="close" size={12} color="#EF4444" />
                      <Text style={[styles.outcomeBadgeText, { color: "#EF4444" }]}>
                        Wrong
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.qCardText}>{q.text}</Text>

                {q.image ? (
                  <Image source={{ uri: q.image }} style={styles.qCardImage} resizeMode="contain" />
                ) : null}

                {numeric ? (
                  <View style={styles.numericAnswerBlock}>
                    {qStatus === "correct" ? (
                      <Text style={styles.numericAnswerLine}>
                        <Text style={styles.numericAnswerLabel}>Your answer: </Text>
                        <Text style={styles.numericAnswerValueCorrect}>
                          {userSel != null && String(userSel).trim() !== ""
                            ? String(userSel)
                            : "—"}
                        </Text>
                      </Text>
                    ) : qStatus === "skipped" ? (
                      <Text style={styles.numericAnswerLine}>
                        <Text style={styles.numericAnswerLabel}>Correct answer: </Text>
                        <Text style={styles.numericAnswerValueCorrect}>
                          {q.correctAnswer != null ? String(q.correctAnswer) : "—"}
                        </Text>
                      </Text>
                    ) : (
                      <>
                        <Text style={styles.numericAnswerLine}>
                          <Text style={styles.numericAnswerLabel}>Your answer: </Text>
                          <Text style={styles.numericAnswerValueWrong}>
                            {userSel != null && String(userSel).trim() !== ""
                              ? String(userSel)
                              : "—"}
                          </Text>
                        </Text>
                        {q.correctAnswer != null && (
                          <Text style={styles.numericAnswerLine}>
                            <Text style={styles.numericAnswerLabel}>Correct answer: </Text>
                            <Text style={styles.numericAnswerValueCorrect}>
                              {String(q.correctAnswer)}
                            </Text>
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                ) : (
                  q.options.map((opt, oi) => {
                    const isCorrect = correctIds.includes(String(opt.id));
                    const isSelected = userSelIds.includes(String(opt.id));
                    const isUserWrong = isSelected && !isCorrect;
                    return (
                      <View
                        key={opt.id}
                        style={[
                          styles.optRow,
                          isCorrect && styles.optRowCorrect,
                          isUserWrong && styles.optRowWrong,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optLetter,
                            isCorrect && styles.optLetterCorrect,
                            isUserWrong && styles.optLetterWrong,
                          ]}
                        >
                          {OPTION_LETTERS[oi] ?? oi + 1}
                        </Text>
                        <View style={styles.optBody}>
                          {opt.text ? (
                            <Text
                              style={[
                                styles.optText,
                                isCorrect && { color: "#166534", fontWeight: "600" },
                                isUserWrong && { color: "#991B1B", fontWeight: "600" },
                              ]}
                              numberOfLines={3}
                            >
                              {opt.text}
                            </Text>
                          ) : null}
                          {opt.image ? (
                            <Image source={{ uri: opt.image }} style={styles.optImage} resizeMode="contain" />
                          ) : null}
                        </View>
                        <View style={styles.optTrailing}>
                          {isSelected && (
                            <View style={styles.youBadge}>
                              <Text style={styles.youBadgeText}>Your answer</Text>
                            </View>
                          )}
                          {isCorrect ? (
                            <Ionicons name="checkmark" size={16} color="#22C55E" />
                          ) : isUserWrong ? (
                            <Ionicons name="close" size={16} color="#EF4444" />
                          ) : null}
                        </View>
                      </View>
                    );
                  })
                )}

                {q.explanation ? (
                  <View style={styles.whyBox}>
                    <TouchableOpacity
                      style={styles.whyToggleRow}
                      activeOpacity={0.7}
                      onPress={() => toggleExplanation(explKey)}
                    >
                      <Text style={styles.whyToggleLabel}>Explanation</Text>
                      <Ionicons
                        name={isOpen ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#6C63FF"
                      />
                    </TouchableOpacity>
                    {isOpen && (
                      <View style={styles.whyBody}>
                        <Text style={styles.whyText}>{q.explanation}</Text>
                      </View>
                    )}
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

        {hasScore && (
          <View style={styles.scoreBanner}>
            <Ionicons name="ribbon-outline" size={18} color="#6C63FF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.scoreBannerTitle}>{totalScore} / {maxScore} marks</Text>
              <Text style={styles.scoreBannerSub}>
                Your score on this {isTest ? "test" : "set"}
              </Text>
            </View>
          </View>
        )}

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