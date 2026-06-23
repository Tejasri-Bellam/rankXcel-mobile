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
import { Difficulty } from "./PracticeExamFlow";
import { practiceSettingsModalStyles as styles } from "@/src/styles/styles/practice/practicesettingsmodalstyles";

interface Props {
  chapterName: string;
  accuracy: number | null;
  loading?: boolean;
  errorText?: string | null;
  initialQuestionCount?: number;
  initialTimerMinutes?: number;
  // Test mode — same setup screen, but the copy/CTA describe an end-of-test
  // review rather than per-question instant feedback.
  isTest?: boolean;
  onBegin: (questions: number, difficulty: Difficulty, timerMinutes: number) => void;
  onCancel: () => void;
}

const QUESTION_OPTIONS = [5, 10, 20];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Med" },
  { value: "hard", label: "Hard" },
  { value: "mixed" as Difficulty, label: "Mixed" },
];

export default function PracticeSettingsModal({
  chapterName,
  accuracy,
  loading = false,
  errorText,
  initialQuestionCount,
  initialTimerMinutes,
  isTest = false,
  onBegin,
  onCancel,
}: Props) {
  const [questionCount, setQuestionCount] = useState<number>(
    initialQuestionCount && QUESTION_OPTIONS.includes(initialQuestionCount)
      ? initialQuestionCount
      : QUESTION_OPTIONS[0]
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed" as Difficulty);

  const canStart = questionCount >= 1 && !loading;

  const handleBegin = () => {
    if (!canStart) return;
    onBegin(questionCount, difficulty, 0);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Back button */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onCancel} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color="#3B7DF8" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Page Title */}
        <Text style={styles.pageTitle}>{chapterName}</Text>

        {/* Mode icon box */}
        <View style={styles.playBox}>
          <Ionicons
            name={isTest ? "document-text-outline" : "play"}
            size={22}
            color="#3B7DF8"
          />
        </View>

        {/* Description */}
        {isTest ? (
          <Text style={styles.description}>
            Exam-style test — answer every question first, then see your{" "}
            <Text style={styles.bold}>results and answers</Text> at the end.
            Review explanations and the <Text style={styles.bold}>AI tutor</Text>{" "}
            once you finish.
          </Text>
        ) : (
          <Text style={styles.description}>
            Low-pressure practice with{" "}
            <Text style={styles.bold}>instant feedback</Text>, explanations and an{" "}
            <Text style={styles.bold}>AI tutor</Text> on every question. Retry freely — this builds mastery.
          </Text>
        )}

        {/* Feature badges */}
        <View style={styles.badgesRow}>
          <View style={[styles.badge, styles.badgeGreen]}>
            <Ionicons name="checkmark" size={13} color="#16A34A" />
            <Text style={[styles.badgeText, { color: "#16A34A" }]}>
              {isTest ? "Review at end" : "Instant feedback"}
            </Text>
          </View>
          <View style={[styles.badge, styles.badgeBlue]}>
            <Ionicons name="sparkles" size={13} color="#1D4ED8" />
            <Text style={[styles.badgeText, { color: "#1D4ED8" }]}>AI tutor</Text>
          </View>
          <View style={[styles.badge, styles.badgeGray]}>
            <Ionicons name="time-outline" size={13} color="#6B7280" />
            <Text style={[styles.badgeText, { color: "#6B7280" }]}>No timer</Text>
          </View>
        </View>

        {/* Questions section */}
        <Text style={styles.sectionLabel}>QUESTIONS</Text>
        <View style={styles.qCountRow}>
          {QUESTION_OPTIONS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.qBtn, questionCount === n && styles.qBtnActive]}
              onPress={() => setQuestionCount(n)}
              activeOpacity={0.75}
            >
              <Text style={[styles.qBtnText, questionCount === n && styles.qBtnTextActive]}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Difficulty section */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>DIFFICULTY</Text>
        <View style={styles.diffRow}>
          {DIFFICULTY_OPTIONS.map((d) => (
            <TouchableOpacity
              key={d.value}
              style={[styles.diffBtn, difficulty === d.value && styles.diffBtnActive]}
              onPress={() => setDifficulty(d.value)}
              activeOpacity={0.75}
            >
              <Text style={[styles.diffText, difficulty === d.value && styles.diffTextActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      </ScrollView>

      {/* Actions pinned to bottom */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.prevBtn}
          onPress={onCancel}
          disabled={loading}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back" size={18} color="#3B7DF8" />
          <Text style={styles.prevBtnText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
          onPress={handleBegin}
          disabled={!canStart}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.startBtnText}>
                {isTest ? "Start test" : "Start practice"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
