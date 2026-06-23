import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { practiceResultsStyles as styles } from "@/src/styles/styles/practice/practiceresultsstyles";

interface Props {
  chapterName: string;
  questions: PracticeApiQuestion[];
  answers: AnswerState[];
  totalSeconds: number;
  submitting?: boolean;
  isTest?: boolean;
  onTryAgain: () => void;
  onBackToHub: () => void;
}

const SCREEN_BG = "#EEEFF5";
const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

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
  questions,
  answers,
  totalSeconds,
  submitting = false,
  isTest = false,
  onTryAgain,
  onBackToHub,
}: Props) {
  const [view, setView] = useState<"results" | "review">("results");

  const statuses = questions.map((q, i) => computeStatus(q, answers[i]));
  const correct = statuses.filter((s) => s === "correct").length;
  const wrong = statuses.filter((s) => s === "wrong").length;
  const total = questions.length;
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
            <Ionicons name="chevron-back" size={20} color="#3B82F6" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.pageTitle}>Review</Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.reviewContent}
          showsVerticalScrollIndicator={false}
        >
          {questions.map((q, i) => {
            const ans = answers[i];
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
                      <Text style={[styles.optText, textStyle]} numberOfLines={3}>
                        {opt.text}
                      </Text>
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
          <Ionicons name="chevron-back" size={20} color="#3B82F6" />
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
            <Ionicons name="time-outline" size={18} color="#3B82F6" />
            <Text style={styles.statValue}>{formatTime(totalSeconds)}</Text>
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

        {submitting ? (
          <View style={styles.submittingRow}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.submittingText}>Saving your session…</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => setView("review")}
          activeOpacity={0.85}
        >
          <Ionicons name="eye-outline" size={17} color="#fff" />
          <Text style={styles.reviewBtnText}>Review answers</Text>
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
