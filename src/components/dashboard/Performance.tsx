import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DashboardData, SubjectHealth } from "@/src/libs/types/dashboard";

const CHART_H = 80;

interface PerformanceProps {
  dashboardData: DashboardData | null;
}

const statusColor = (status: string | undefined) => {
  const s = (status ?? "").toLowerCase();
  if (s === "strong") return COLORS.green;
  if (s === "average" || s === "moderate") return COLORS.orange;
  if (s === "weak") return COLORS.red;
  return COLORS.primary;
};

export default function Performance({ dashboardData }: PerformanceProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"mocks" | "assessments">("mocks");

  const recent = dashboardData?.recent_performance;
  const scores = recent?.scores ?? [];
  const trend = recent?.trend ?? "";

  const fromMocks = dashboardData?.subject_health?.from_mocks ?? [];
  const fromAssessments = dashboardData?.subject_health?.from_assessments ?? [];
  const activeSubjects: SubjectHealth[] =
    tab === "mocks" ? fromMocks : fromAssessments;

  const isImproving = trend === "improving";
  const trendBg = isImproving ? COLORS.greenLight : COLORS.redLight;
  const trendColor = isImproving ? COLORS.green : COLORS.red;
  const trendLabel = isImproving ? "Improving" : "Needs work";
  const trendIcon = isImproving ? "trending-up" : "trending-down";

  const maxPct = Math.max(
    1,
    ...scores.map((s) => Math.abs(s.percentage ?? 0))
  );

  return (
  <View>
    {/* Recent Performance */}
    {scores.length > 0 && (
      <View style={styles.card}>
        <View style={styles.perfHeader}>
          <View>
            <Text style={styles.cardTitle}>
              Recent Performance
            </Text>

            <Text style={styles.cardSubtitle}>
              Last {scores.length} mock scores
            </Text>
          </View>

          <View
            style={[
              styles.trendBadge,
              { backgroundColor: trendBg },
            ]}
          >
            <Ionicons
              name={trendIcon as any}
              size={13}
              color={trendColor}
            />

            <Text
              style={[
                styles.trendBadgeText,
                { color: trendColor },
              ]}
            >
              {trendLabel}
            </Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          {scores.map((item, index) => {
            const h = Math.max(
              4,
              (Math.abs(item.percentage ?? 0) / maxPct) *
                CHART_H
            );

            return (
              <View
                key={index}
                style={styles.chartBarCol}
              >
                <Text style={styles.chartBarValue}>
                  {item.score}
                </Text>

                <View
                  style={[
                    styles.chartBar,
                    { height: h },
                  ]}
                />

                <Text style={styles.chartBarLabel}>
                  {item.date}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    )}

    {/* Subject Health */}
    {(fromMocks.length > 0 ||
      fromAssessments.length > 0) && (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>
              Subject Health
            </Text>

            <Text style={styles.cardSubtitle}>
              Accuracy across all{" "}
              {tab === "mocks"
                ? "mocks"
                : "assignments"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/analytics")}
          >
            <Text style={styles.detailsLink}>
              Details →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabsRow}>
          <TouchableOpacity
            onPress={() => setTab("mocks")}
            style={[
              styles.tabBtn,
              tab === "mocks" &&
                styles.tabBtnActive,
            ]}
          >
            <Text
              style={[
                styles.tabBtnText,
                tab === "mocks" &&
                  styles.tabBtnTextActive,
              ]}
            >
              Mocks {fromMocks.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTab("assessments")}
            style={[
              styles.tabBtn,
              tab === "assessments" &&
                styles.tabBtnActive,
            ]}
          >
            <Text
              style={[
                styles.tabBtnText,
                tab === "assessments" &&
                  styles.tabBtnTextActive,
              ]}
            >
              Assessments {fromAssessments.length}
            </Text>
          </TouchableOpacity>
        </View>

        {activeSubjects.length === 0 ? (
          <Text style={styles.emptyText}>
            No data yet.
          </Text>
        ) : (
          activeSubjects.map((item, index) => {
            const color = statusColor(item.status);
            const pct = Math.round(
              item.accuracy ?? 0
            );

            return (
              <View
                key={index}
                style={styles.subjectRow}
              >
                <View
                  style={[
                    styles.subjectCircle,
                    { borderColor: color },
                  ]}
                >
                  <Text
                    style={[
                      styles.subjectPct,
                      { color },
                    ]}
                  >
                    {pct}%
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    marginLeft: 12,
                  }}
                >
                  <View
                    style={styles.subjectNameRow}
                  >
                    <Text
                      style={styles.subjectName}
                    >
                      {item.subject_name}
                    </Text>

                    <Text
                      style={[
                        styles.subjectLevel,
                        { color },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>

                  <View
                    style={styles.subjectBarBg}
                  >
                    <View
                      style={[
                        styles.subjectBarFill,
                        {
                          width: `${Math.min(
                            100,
                            Math.max(0, pct)
                          )}%`,
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })
        )}
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
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  detailsLink: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  cardSubtitle: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  perfHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  trendBadgeText: { fontSize: 12, fontWeight: "600" },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 110,
  },
  chartBarCol: { alignItems: "center", flex: 1, gap: 4 },
  chartBarValue: {
    fontSize: 10,
    color: COLORS.textMedium,
    fontWeight: "600",
  },
  chartBar: {
    width: 28,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    opacity: 0.85,
  },
  chartBarLabel: { fontSize: 9, color: COLORS.textLight },

  tabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tabBtnText: { fontSize: 12, fontWeight: "600", color: COLORS.textMedium },
  tabBtnTextActive: { color: COLORS.primary },

  emptyText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: "italic",
    paddingVertical: 8,
  },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  subjectCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  subjectPct: { fontSize: 13, fontWeight: "800" },
  subjectNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
    flex: 1,
  },
  subjectLevel: { fontSize: 12, fontWeight: "600" },
  subjectBarBg: {
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 4,
  },
  subjectBarFill: { height: 5, borderRadius: 4 },
};
 