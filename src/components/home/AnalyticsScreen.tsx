import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS } from "@/src/styles/styles";
import { useDashboard } from "@/src/libs/hooks/enrollment/useDashboard";
import { getConsistencyService } from "@/src/libs/services/dashboard";
import CircleProgress from "@/src/components/dashboard/CircleProgress";

// DUMMY: still NOT provided by any API (see backend list).
const DUMMY = {
  bestPercentile: "Top 8%",
  examYear: 2027,
  daysToExam: 312,
};

// Consistency heatmap palette: empty → low → high.
const LEVEL_COLORS = ["#E6E8F0", "#F7A86E", "#FBD15E", "#86E0A3", "#22C55E"];
const HEATMAP_DAYS = 35; // 5 weeks × 7 days
const HEAT_COLS = 7;
const HEAT_GAP = 6;
// Cell size derived from screen width: 16px screen padding + 18px card padding,
// both sides, leaving room for 7 cells and 6 gaps per row.
const HEAT_CELL = Math.floor(
  (Dimensions.get("window").width - 32 - 36 - HEAT_GAP * (HEAT_COLS - 1)) /
    HEAT_COLS
);

const readinessLabel = (pct: number) => {
  if (pct >= 80) return "Exam ready";
  if (pct >= 60) return "On track";
  if (pct >= 40) return "Building";
  if (pct >= 20) return "Getting there";
  return "Getting started";
};

const nodeColor = (pct: number) =>
  pct < 35 ? COLORS.orange : pct < 45 ? COLORS.yellow : COLORS.green;

// Map a raw daily value to a 0-4 intensity bucket.
const bucket = (n: number) => {
  if (!n || n <= 0) return 0;
  if (n <= 2) return 1;
  if (n <= 5) return 2;
  if (n <= 9) return 3;
  return 4;
};

interface ConsistencyDay {
  date?: string;
  count: number;
  level: number;
}

interface ConsistencyData {
  days: ConsistencyDay[];
  weeks: number;
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
  totalDays: number;
  consistencyPct: number;
  totalCount: number;
}

const EMPTY_CONSISTENCY: ConsistencyData = {
  days: [],
  weeks: 5,
  currentStreak: 0,
  longestStreak: 0,
  activeDays: 0,
  totalDays: 0,
  consistencyPct: 0,
  totalCount: 0,
};

// Shape of GET /student/consistency/. Falls back gracefully for other shapes.
const normalizeConsistency = (raw: any): ConsistencyData => {
  const data = raw?.data ?? raw ?? {};
  const list: any[] = Array.isArray(data)
    ? data
    : data?.days ?? data?.results ?? data?.consistency ?? data?.history ?? [];

  const days: ConsistencyDay[] = list.map((d: any) => {
    if (typeof d === "number") return { count: d, level: bucket(d) };
    const count = Number(d?.count ?? d?.value ?? d?.attempts ?? d?.questions ?? 0);
    const level = d?.level != null ? Math.max(0, Math.min(4, Number(d.level))) : bucket(count);
    return { date: d?.date ?? d?.day, count, level };
  });

  return {
    days,
    weeks: Number(data?.weeks ?? (Math.ceil(days.length / 7) || 5)),
    currentStreak: Number(data?.current_streak ?? 0),
    longestStreak: Number(data?.longest_streak ?? 0),
    activeDays: Number(data?.active_days ?? days.filter((d) => d.count > 0).length),
    totalDays: Number(data?.total_days ?? 0),
    consistencyPct: Number(data?.consistency_pct ?? 0),
    totalCount: days.reduce((sum, d) => sum + (d.count || 0), 0),
  };
};

const StatCard = ({
  icon,
  iconLib = "ion",
  iconColor,
  value,
  label,
}: {
  icon: string;
  iconLib?: "ion" | "mci";
  iconColor: string;
  value: string;
  label: string;
}) => (
  <View style={styles.statCard}>
    {iconLib === "mci" ? (
      <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
    ) : (
      <Ionicons name={icon as any} size={20} color={iconColor} />
    )}
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const Metric = ({
  icon,
  iconColor,
  value,
  label,
}: {
  icon: string;
  iconColor: string;
  value: string;
  label: string;
}) => (
  <View style={styles.metric}>
    <Ionicons name={icon as any} size={18} color={iconColor} />
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

export default function AnalyticsScreen() {
  const { targetExams, activeExamId, dashboardData, isLoading, refresh } =
    useDashboard();

  const [consistency, setConsistency] = useState<ConsistencyData>(EMPTY_CONSISTENCY);
  const [refreshing, setRefreshing] = useState(false);

  const loadConsistency = useCallback(async () => {
    try {
      const res = await getConsistencyService();
      setConsistency(normalizeConsistency(res));
    } catch {
      setConsistency(EMPTY_CONSISTENCY);
    }
  }, []);

  useEffect(() => {
    loadConsistency();
  }, [loadConsistency]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), loadConsistency()]);
    } finally {
      setRefreshing(false);
    }
  }, [refresh, loadConsistency]);

  // ── Derived (real) values ──────────────────────────────────────────────────
  const subjects = dashboardData?.strength_by_subject ?? [];
  const avgAccuracy = subjects.length
    ? Math.round(
        subjects.reduce((sum, s) => sum + (s.accuracy ?? 0), 0) / subjects.length
      )
    : 0;
  const streakDays = dashboardData?.streak?.current_streak ?? 0;

  const activeExam = targetExams.find(
    (e) => String(e.id) === String(activeExamId)
  );
  const examName = activeExam?.name ?? "Your exam";

  const weakest = (
    dashboardData?.todays_focus?.length
      ? dashboardData.todays_focus.map((t) => ({
          name: t.topic_name,
          pct: Math.max(0, Math.round(t.accuracy ?? 0)),
        }))
      : subjects.map((s) => ({
          name: s.subject_name,
          pct: Math.max(0, Math.round(s.accuracy ?? 0)),
        }))
  )
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 6);

  // Pad/trim the heatmap to a fixed 5×7 grid (oldest → today).
  const recentDays = consistency.days.slice(-HEATMAP_DAYS);
  const heatmap: ConsistencyDay[] = [
    ...Array(Math.max(0, HEATMAP_DAYS - recentDays.length)).fill({ count: 0, level: 0 }),
    ...recentDays,
  ];

  if (isLoading && !dashboardData) {
    return (
      <View style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <Text style={styles.pageTitle}>Stats</Text>

        {/* ── Readiness gauge ── */}
        <View style={styles.gaugeCard}>
          <CircleProgress
            size={120}
            strokeWidth={12}
            progress={avgAccuracy}
            color={COLORS.yellow}
            trackColor="#EAECF4"
            bgColor={COLORS.white}
          >
            <Text style={styles.gaugePct}>{avgAccuracy}%</Text>
          </CircleProgress>
          <Text style={styles.gaugeLabel}>EXAM READINESS</Text>
          <Text style={styles.gaugeSub}>
            {readinessLabel(avgAccuracy)} · {examName} {DUMMY.examYear} in{" "}
            {DUMMY.daysToExam} days
          </Text>
        </View>

        {/* ── Stat grid 2×2 ── */}
        <View style={styles.statGrid}>
          <StatCard
            icon="radio-button-on"
            iconColor={COLORS.primary}
            value={`${avgAccuracy}%`}
            label="Avg accuracy"
          />
          <StatCard
            icon="document-text-outline"
            iconColor={COLORS.green}
            value={String(consistency.totalCount)}
            label="Attempts"
          />
          <StatCard
            icon="flame"
            iconColor={COLORS.orange}
            value={`${streakDays} days`}
            label="Streak"
          />
          <StatCard
            icon="trophy"
            iconLib="mci"
            iconColor="#F5A623"
            value={DUMMY.bestPercentile}
            label="Best percentile"
          />
        </View>

        {/* ── Weakest nodes ── */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="radio-button-on" size={16} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Weakest nodes</Text>
        </View>
        <View style={styles.card}>
          {weakest.length === 0 ? (
            <Text style={styles.emptyText}>No data yet.</Text>
          ) : (
            weakest.map((node, i) => {
              const color = nodeColor(node.pct);
              return (
                <View
                  key={`${node.name}-${i}`}
                  style={[styles.nodeRow, i === weakest.length - 1 && { marginBottom: 0 }]}
                >
                  <View style={styles.nodeTopRow}>
                    <Text style={styles.nodeName} numberOfLines={1}>
                      {node.name}
                    </Text>
                    <Text style={[styles.nodePct, { color }]}>{node.pct}%</Text>
                  </View>
                  <View style={styles.nodeBarBg}>
                    <View
                      style={[
                        styles.nodeBarFill,
                        { width: `${Math.min(100, Math.max(3, node.pct))}%`, backgroundColor: color },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── Consistency ── */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Consistency</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.metricRow}>
            <Metric
              icon="pulse"
              iconColor={COLORS.primary}
              value={`${Math.round(consistency.consistencyPct)}%`}
              label="Consistency"
            />
            <View style={styles.metricDivider} />
            <Metric
              icon="checkmark-circle"
              iconColor={COLORS.green}
              value={String(consistency.activeDays)}
              label="Active days"
            />
            <View style={styles.metricDivider} />
            <Metric
              icon="flame"
              iconColor={COLORS.orange}
              value={String(consistency.currentStreak)}
              label="Day streak"
            />
            <View style={styles.metricDivider} />
            <Metric
              icon="trophy"
              iconColor="#F5A623"
              value={String(consistency.longestStreak)}
              label="Best"
            />
          </View>
          <View style={styles.metricHr} />
          <View style={styles.heatGrid}>
            {heatmap.map((d, i) => (
              <View
                key={i}
                style={[styles.heatCell, { backgroundColor: LEVEL_COLORS[d.level] ?? LEVEL_COLORS[0] }]}
              />
            ))}
          </View>
          <View style={styles.heatLabels}>
            <Text style={styles.heatLabelText}>{consistency.weeks} weeks ago</Text>
            <Text style={styles.heatLabelText}>Today</Text>
          </View>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  centered: { alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  pageTitle: { fontSize: 28, fontWeight: "800", color: COLORS.textDark, marginBottom: 16 },

  gaugeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gaugePct: { fontSize: 30, fontWeight: "800", color: COLORS.textDark },
  gaugeLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    color: COLORS.textLight,
    marginTop: 14,
  },
  gaugeSub: { fontSize: 14, color: COLORS.textMedium, marginTop: 6, textAlign: "center" },

  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: "48.5%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: COLORS.textDark, marginTop: 10 },
  statLabel: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textDark },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: { fontSize: 13, color: COLORS.textLight, textAlign: "center", paddingVertical: 8 },

  nodeRow: { marginBottom: 16 },
  nodeTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  nodeName: { fontSize: 15, fontWeight: "700", color: COLORS.textDark, flex: 1, marginRight: 12 },
  nodePct: { fontSize: 14, fontWeight: "800" },
  nodeBarBg: { height: 7, backgroundColor: "#EEF0F5", borderRadius: 5, overflow: "hidden" },
  nodeBarFill: { height: 7, borderRadius: 5 },

  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metric: { flex: 1, alignItems: "center", gap: 4 },
  metricValue: { fontSize: 18, fontWeight: "800", color: COLORS.textDark },
  metricLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: "600" },
  metricDivider: { width: 1, height: 34, backgroundColor: COLORS.border },
  metricHr: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  heatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: HEAT_GAP,
  },
  heatCell: { width: HEAT_CELL, height: HEAT_CELL, borderRadius: 9 },
  heatLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  heatLabelText: { fontSize: 12, color: COLORS.textLight },
});
