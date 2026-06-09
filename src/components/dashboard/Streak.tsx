import React from "react";
import { Text, View } from "react-native";
import { COLORS } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { DashboardData } from "@/src/libs/types/dashboard";

interface StreakProps {
  dashboardData: DashboardData | null;
}

export default function Streak({ dashboardData }: StreakProps) {
  const streak = dashboardData?.streak;
  const days = streak?.streak_days ?? [];

  if (!days.length) return null;

  const current = streak?.current_streak ?? 0;
  const best = streak?.best_streak ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="flame" size={15} color={COLORS.red} />
          <Text style={styles.title}>Streak</Text>
        </View>
        <Text style={styles.best}>Best {best} 🔥</Text>
      </View>

      <View style={styles.daysRow}>
        {days.map((d, index) => (
          <View key={index} style={styles.day}>
            <View
              style={[styles.dayCircle, d.completed && styles.dayCircleDone]}
            >
              {d.completed ? (
                <Ionicons name="flame" size={14} color={COLORS.white} />
              ) : (
                <Text style={styles.dayCircleText}>{d.day}</Text>
              )}
            </View>
            <Text style={styles.dayLabel}>{d.day}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.hint}>
        {current > 0
          ? `You're on a ${current}-day streak — keep it going! 🔥`
          : "Start a streak today by completing a session."}
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
  best: { fontSize: 13, fontWeight: "600", color: COLORS.textLight },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  day: { alignItems: "center", gap: 6, flex: 1 },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleDone: { backgroundColor: COLORS.red },
  dayCircleText: { fontSize: 12, fontWeight: "700", color: COLORS.textLight },
  dayLabel: { fontSize: 11, fontWeight: "600", color: COLORS.textLight },
  hint: { fontSize: 12, color: COLORS.textLight, marginTop: 12 },
};
