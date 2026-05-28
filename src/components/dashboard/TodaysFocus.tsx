import React from "react";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/src/styles/styles";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DashboardData } from "@/src/libs/types/dashboard";

const { width } = Dimensions.get("window");

interface TodaysFocusProps {
  dashboardData: DashboardData | null;
}

const formatPercent = (n: number | null | undefined) => {
  if (n == null || Number.isNaN(n)) return "0%";
  return `${Number(n).toFixed(1).replace(/\.0$/, "")}%`;
};

export default function TodaysFocus({ dashboardData }: TodaysFocusProps) {
  const overview = dashboardData?.overview;
  const todayFocus = dashboardData?.todays_focus ?? null;

  const stats = overview
    ? [
        {
          id: "mocks_taken",
          icon: "file-document-outline",
          iconType: "MaterialCommunityIcons" as const,
          value: String(overview.mocks_taken ?? 0),
          label: "Mocks Taken",
          delta: `+${overview.mocks_this_week ?? 0} this week`,
          color: COLORS.primary,
          bg: COLORS.primaryLight,
        },
        {
          id: "mock_accuracy",
          icon: "target",
          iconType: "MaterialCommunityIcons" as const,
          value: formatPercent(overview.avg_accuracy),
          label: "Mock Accuracy",
          delta: "",
          color: COLORS.green,
          bg: COLORS.greenLight,
        },
        {
          id: "assessments_taken",
          icon: "clipboard-text-outline",
          iconType: "MaterialCommunityIcons" as const,
          value: String(overview.assessments_taken ?? 0),
          label: "Assessments Taken",
          delta: `+${overview.assessments_this_week ?? 0} this week`,
          color: COLORS.orange,
          bg: COLORS.orangeLight,
        },
        {
          id: "assessment_accuracy",
          icon: "chart-bar",
          iconType: "MaterialCommunityIcons" as const,
          value: formatPercent(overview.assessments_avg_accuracy),
          label: "Assessment Accuracy",
          delta: "",
          color: COLORS.primary,
          bg: "#F3F0FF",
        },
      ]
    : [];

  return (
    <View>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((item) => (
          <View key={item.id} style={styles.statCard}>
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
            {item.delta ? (
              <Text style={[styles.statDelta, { color: item.color }]}>
                {item.delta}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      {/* Today's Focus Card */}
      {todayFocus && (
        <View style={styles.focusCard}>
          <View style={styles.focusTop}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.focusLabel}>TODAY'S FOCUS</Text>
              <Text style={styles.focusTitle}>{todayFocus.chapter_name}</Text>
              <View style={styles.focusSubjectRow}>
                <Ionicons name="flash" size={13} color={COLORS.yellow} />
                <Text style={styles.focusSubject}>{todayFocus.subject_name}</Text>
              </View>
            </View>

            <View style={styles.focusQuestionsBadge}>
              <Text style={styles.focusQuestionsNum}>
                {todayFocus.question_count}
              </Text>
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
              <Text style={styles.focusMetaText}>
                {todayFocus.accuracy_trend}
              </Text>
            </View>
            <View style={styles.focusMetaItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.white} />
              <Text style={styles.focusMetaText}>
                ~{todayFocus.estimated_duration_minutes} min
              </Text>
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
    width: (width - 44) / 2,
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
 