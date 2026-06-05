import React from "react";
import { Text, View } from "react-native";
import { COLORS } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { DashboardData } from "@/src/libs/types/dashboard";

interface DailyGoalProps {
  dashboardData: DashboardData | null;
}

export default function DailyGoal({ dashboardData }: DailyGoalProps) {
  const focus = dashboardData?.todays_focus;
  const session = dashboardData?.in_progress_session;

  // Today's target = today's focus question count (fallback 30).
  const goal = focus?.question_count ?? 30;

  // Questions already attempted in the in-progress session, if any.
  const done = session
    ? Math.round(
        ((session.progress_percentage ?? 0) / 100) *
          (session.total_questions ?? 0)
      )
    : 0;

  const remaining = Math.max(0, goal - done);
  const ratio = goal > 0 ? Math.min(1, done / goal) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="flash" size={15} color={COLORS.orange} />
          <Text style={styles.title}>Daily goal</Text>
        </View>
        <Text style={styles.count}>
          {done}/{goal} Qs
        </Text>
      </View>

      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${ratio * 100}%` }]} />
      </View>

      <Text style={styles.hint}>
        {remaining > 0
          ? `${remaining} more to hit today's goal & +50 XP 🔥`
          : "Today's goal complete — nice work! 🎉"}
      </Text>
    </View>
  );
}

const styles: any = {
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  count: { fontSize: 13, fontWeight: "600", color: COLORS.textLight },
  barBg: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 5,
    marginTop: 12,
    overflow: "hidden",
  },
  barFill: {
    height: 8,
    backgroundColor: COLORS.orange,
    borderRadius: 5,
  },
  hint: { fontSize: 12, color: COLORS.textLight, marginTop: 10 },
};
