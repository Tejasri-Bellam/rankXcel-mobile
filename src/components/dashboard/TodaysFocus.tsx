import React from "react";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/src/styles/styles";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DashboardData } from "@/src/libs/types/dashboard";

const { width } = Dimensions.get("window");

interface TodaysFocusProps {
  dashboardData: DashboardData | null;
}

export default function TodaysFocus({ dashboardData }: TodaysFocusProps) {
  const stats = dashboardData?.stats ?? [];
  const todayFocus = dashboardData?.today_focus ?? dashboardData?.todayFocus ?? null;

  return (
    <View className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((item: any) => (
          <View key={item.id} style={[styles.statCard, { flex: 1 }]}>
            <View style={[styles.statIconBg, { backgroundColor: item.bg }]}>
              {item.iconType === "MaterialCommunityIcons" ? (
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={18}
                  color={item.color}
                />
              ) : (
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              )}
            </View>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
            <Text style={[styles.statDelta, { color: item.color }]}>
              {item.delta}
            </Text>
          </View>
        ))}
      </View>

      {/* Today's Focus Card */}
      {todayFocus && (
        <View style={styles.focusCard}>
          <View style={styles.focusTop}>
            <View>
              <Text style={styles.focusLabel}>TODAY'S FOCUS</Text>
              <Text style={styles.focusTitle}>{todayFocus.title}</Text>
              <View style={styles.focusSubjectRow}>
                <Ionicons name="flash" size={13} color={COLORS.yellow} />
                <Text style={styles.focusSubject}>{todayFocus.subject}</Text>
              </View>
            </View>

            <View style={styles.focusQuestionsBadge}>
              <Text style={styles.focusQuestionsNum}>{todayFocus.questions}</Text>
              <Text style={styles.focusQuestionsLabel}>questions</Text>
            </View>
          </View>

          <View style={styles.focusMeta}>
            <View style={styles.focusMetaItem}>
              <MaterialCommunityIcons
                name="chart-line-variant"
                size={14}
                color={COLORS.white}
              />
              <Text style={styles.focusMetaText}>{todayFocus.issue}</Text>
            </View>
            <View style={styles.focusMetaItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.white} />
              <Text style={styles.focusMetaText}>{todayFocus.duration}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.startPracticeBtn}>
            <Text style={styles.startPracticeBtnText}>Start Practice →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles: any = {
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingTop: 16,
    gap: 10,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    minWidth: (width - 60) / 2,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 18, fontWeight: "800", color: COLORS.textDark },
  statLabel: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  statDelta: { fontSize: 11, fontWeight: "600", marginTop: 4 },

  focusCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 18,
  },
  focusTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  focusLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.white,
    marginTop: 4,
  },
  focusSubjectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  focusSubject: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  focusQuestionsBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  focusQuestionsNum: { fontSize: 20, fontWeight: "800", color: COLORS.white },
  focusQuestionsLabel: { fontSize: 10, color: "rgba(255,255,255,0.8)" },
  focusMeta: { marginTop: 14, gap: 6 },
  focusMetaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  focusMetaText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    flex: 1,
  },
  startPracticeBtn: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  startPracticeBtnText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
  },
};
