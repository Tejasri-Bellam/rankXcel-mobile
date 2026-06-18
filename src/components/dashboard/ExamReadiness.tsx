import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { COLORS, getScoreColor } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { DashboardData } from "@/src/libs/types/dashboard";
import CircleProgress from "./CircleProgress";

const CARD_BG = "#1E1E32";

interface ExamReadinessProps {
  dashboardData: DashboardData | null;
  examName?: string | null;
}

const readinessLabel = (pct: number) => {
  if (pct >= 80) return "Exam ready";
  if (pct >= 60) return "On track";
  if (pct >= 40) return "Building";
  if (pct >= 20) return "Getting there";
  return "Getting started";
};

// Readiness colour band: <30 red, 30–39 orange, 40–59 yellow, 60–100 green.
const readinessColor = getScoreColor;

export default function ExamReadiness({
  dashboardData,
  examName,
}: ExamReadinessProps) {
  const router = useRouter();
  const subjects = dashboardData?.strength_by_subject ?? [];

  if (!dashboardData) return null;

  // Readiness comes straight from the dashboard payload (readiness_percentage);
  // fall back to the average accuracy across tracked subjects.
  const pct =
    dashboardData.readiness_percentage != null
      ? Math.round(dashboardData.readiness_percentage)
      : subjects.length
      ? Math.round(
          subjects.reduce((sum, s) => sum + (s.accuracy ?? 0), 0) /
            subjects.length
        )
      : 0;
  const label = dashboardData.readiness_label || readinessLabel(pct);
  const subjectCount = subjects.length;
  const subtitle = [
    examName || "Your exam",
    `${subjectCount} subject${subjectCount === 1 ? "" : "s"} tracked`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => router.push("/analytics")}
    >
      <CircleProgress
        size={104}
        strokeWidth={11}
        progress={pct}
        color={readinessColor(pct)}
        trackColor="rgba(255,255,255,0.12)"
        bgColor={CARD_BG}
      >
        <Text style={styles.pct}>{pct}%</Text>
      </CircleProgress>

      <View style={styles.info}>
        <Text style={styles.label}>EXAM READINESS</Text>
        <Text style={styles.status}>{label}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
    </TouchableOpacity>
  );
}

const styles: any = {
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    gap: 16,
  },
  pct: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.white,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.6)",
  },
  status: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.white,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
};
