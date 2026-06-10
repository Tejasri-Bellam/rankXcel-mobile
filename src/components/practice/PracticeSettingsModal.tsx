import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Difficulty } from "./PracticeExamFlow";

interface Props {
  chapterName: string;
  accuracy: number | null;
  loading?: boolean;
  errorText?: string | null;
  initialQuestionCount?: number;
  initialTimerMinutes?: number;
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
  onBegin,
  onCancel,
}: Props) {
  const [questionCount, setQuestionCount] = useState<number>(
    initialQuestionCount && QUESTION_OPTIONS.includes(initialQuestionCount)
      ? initialQuestionCount
      : 5
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed" as Difficulty);

  const handleBegin = () => {
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
      >
        {/* Page Title */}
        <Text style={styles.pageTitle}>{chapterName}</Text>

        {/* Play icon box */}
        <View style={styles.playBox}>
          <Ionicons name="play" size={22} color="#3B7DF8" />
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Low-pressure practice with{" "}
          <Text style={styles.bold}>instant feedback</Text>, explanations and an{" "}
          <Text style={styles.bold}>AI tutor</Text> on every question. Retry freely — this builds mastery.
        </Text>

        {/* Feature badges */}
        <View style={styles.badgesRow}>
          <View style={[styles.badge, styles.badgeGreen]}>
            <Ionicons name="checkmark" size={13} color="#16A34A" />
            <Text style={[styles.badgeText, { color: "#16A34A" }]}>Instant feedback</Text>
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

      {/* Start button pinned to bottom */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.startBtn, loading && styles.startBtnDisabled]}
          onPress={handleBegin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.startBtnText}>Start practice</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },

  topBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 0,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3B7DF8",
  },

  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A1A2E",
    marginTop: 10,
    marginBottom: 20,
  },

  playBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  description: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    marginBottom: 18,
  },
  bold: {
    fontWeight: "700",
    color: "#1A1A2E",
  },

  badgesRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 28,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  badgeGreen: { backgroundColor: "#DCFCE7" },
  badgeBlue: { backgroundColor: "#DBEAFE" },
  badgeGray: { backgroundColor: "#F3F4F6" },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#AAAAAA",
    letterSpacing: 1,
    marginBottom: 10,
  },

  qCountRow: {
    flexDirection: "row",
    gap: 12,
  },
  qBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  qBtnActive: {
    borderColor: "#3B7DF8",
    backgroundColor: "#EEF4FF",
  },
  qBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  qBtnTextActive: {
    color: "#3B7DF8",
  },

  diffRow: {
    flexDirection: "row",
    gap: 8,
  },
  diffBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  diffBtnActive: {
    backgroundColor: "#1A1A2E",
    borderColor: "#1A1A2E",
  },
  diffText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  diffTextActive: {
    color: "#FFFFFF",
  },

  errorText: {
    marginTop: 16,
    fontSize: 13,
    color: "#EF4444",
    textAlign: "center",
  },

  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#3B7DF8",
    borderRadius: 16,
    paddingVertical: 16,
  },
  startBtnDisabled: {
    opacity: 0.6,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});