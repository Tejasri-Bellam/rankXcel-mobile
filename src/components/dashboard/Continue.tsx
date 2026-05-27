import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DashboardData } from "@/src/libs/types/dashboard";

interface ContinueProps {
  dashboardData: DashboardData | null;
}

export default function Continue({ dashboardData }: ContinueProps) {
  const router = useRouter();

  const continueTest =
    dashboardData?.continue_test ?? dashboardData?.continueTest ?? null;
  const streak = dashboardData?.streak ?? null;

  return (
    <View className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Continue Card */}
      {continueTest && (
        <View style={styles.card}>
          <Text style={styles.continueLabel}>Continue where you left off</Text>

          <View style={styles.continueRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.continueTitle}>{continueTest.title}</Text>
              <Text style={styles.continueSub}>{continueTest.subtitle}</Text>

              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${continueTest.progress}%` },
                  ]}
                />
              </View>

              <Text style={styles.progressText}>{continueTest.attempted}</Text>
            </View>

            <TouchableOpacity
              style={styles.resumeBtn}
              onPress={() => router.push("./mock-library")}
            >
              <Text style={styles.resumeBtnText}>Resume</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Streak Card */}
      {streak && (
        <View style={styles.card}>
          <View style={styles.streakHeader}>
            <View>
              <Text style={styles.streakTitle}>
                🔥 {streak.current} Day Streak
              </Text>
              <Text style={styles.streakSub}>Keep it going!</Text>
            </View>
          </View>

          <View style={styles.streakDays}>
            {(streak.days ?? []).map((item: any, index: number) => (
              <View key={index} style={styles.streakDayCol}>
                <View
                  style={[
                    styles.streakDayBubble,
                    item.completed && styles.streakDayBubbleActive,
                  ]}
                >
                  {item.completed ? (
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  ) : (
                    <Text style={styles.streakDayText}>{item.day}</Text>
                  )}
                </View>
                <Text style={styles.streakDayLabel}>{item.day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.bestStreakRow}>
            <Text style={styles.bestStreakText}>
              🏆 Best streak: {streak.best} days
            </Text>
          </View>
        </View>
      )}
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
  continueLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: 8 },
  continueRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  continueTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textDark },
  continueSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginTop: 10,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
  resumeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  resumeBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },

  streakHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  streakTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  streakSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  streakDays: { flexDirection: "row", justifyContent: "space-between" },
  streakDayCol: { alignItems: "center", gap: 4 },
  streakDayBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  streakDayBubbleActive: { backgroundColor: COLORS.primary },
  streakDayText: { fontSize: 12, color: COLORS.textMedium, fontWeight: "600" },
  streakDayLabel: { fontSize: 11, color: COLORS.textLight },
  bestStreakRow: {
    marginTop: 14,
    backgroundColor: COLORS.streakBg,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  bestStreakText: { fontSize: 13, fontWeight: "600", color: COLORS.orange },
};
