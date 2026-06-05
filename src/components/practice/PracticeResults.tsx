import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { AnswerState } from "./PracticeExamFlow";

interface Props {
  chapterName: string;
  answers: AnswerState[];
  totalSeconds: number;
  submitting?: boolean;
  onTryAgain: () => void;
  onBackToHub: () => void;
}

export default function PracticeResults({
  chapterName,
  answers,
  totalSeconds,
  submitting = false,
  onTryAgain,
  onBackToHub,
}: Props) {
  const correct = answers.filter((a) => a.correct === true).length;
  const wrong = answers.filter((a) => a.correct === false).length;
  const skipped = answers.filter((a) => a.correct === null).length;
  const total = answers.length;
  const score = correct * 4 - wrong * 1;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");

  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const accuracyColor =
    accuracy >= 65 ? "#22C55E" : accuracy >= 40 ? "#F59E0B" : "#EF4444";

  const bannerBg = score >= 0 ? "#3B7DF8" : "#EF4444";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Animated.View style={[styles.container, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>

        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: bannerBg }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onBackToHub} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.bannerLabel}>Practice Complete</Text>
          <Text style={styles.bannerChapter}>{chapterName}</Text>
          <Text style={styles.scoreText}>{score > 0 ? `+${score}` : score}</Text>
          <Text style={styles.timeTaken}>marks · {mm}:{ss} taken</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: "#DCFCE7" }]}>
              <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
            </View>
            <Text style={styles.statValue}>{correct}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </View>
            <Text style={styles.statValue}>{wrong}</Text>
            <Text style={styles.statLabel}>Wrong</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: "#FEF3C7" }]}>
              <MaterialCommunityIcons name="skip-next-circle-outline" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{skipped}</Text>
            <Text style={styles.statLabel}>Skipped</Text>
          </View>
        </View>

        {/* Accuracy bar */}
        <View style={styles.accuracySection}>
          <View style={styles.accRow}>
            <Text style={styles.accLabel}>Accuracy</Text>
            <Text style={[styles.accValue, { color: accuracyColor }]}>{accuracy}%</Text>
          </View>
          <View style={styles.accTrack}>
            <View
              style={[styles.accFill, { width: `${accuracy}%` as any, backgroundColor: accuracyColor }]}
            />
          </View>
        </View>

        {submitting && (
          <View style={styles.submittingRow}>
            <ActivityIndicator size="small" color="#3B7DF8" />
            <Text style={styles.submittingText}>Submitting your session...</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.hubBtn}
            onPress={onBackToHub}
            disabled={submitting}
            activeOpacity={0.75}
          >
            <Text style={styles.hubText}>Back to Hub</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tryBtn}
            onPress={onTryAgain}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.tryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  container: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  banner: {
    padding: 28,
    alignItems: "center",
    gap: 4,
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  bannerChapter: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 56,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 64,
  },
  timeTaken: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
  },
  statsRow: {
    flexDirection: "row",
    paddingVertical: 22,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A2E",
  },
  statLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  divider: {
    width: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 8,
  },
  accuracySection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  accRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  accValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  accTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F3F4F6",
  },
  accFill: {
    height: "100%",
    borderRadius: 4,
  },
  submittingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 12,
  },
  submittingText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  hubBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  hubText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
  },
  tryBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: "#3B7DF8",
    alignItems: "center",
    justifyContent: "center",
  },
  tryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});