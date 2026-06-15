import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { COLORS } from "@/src/styles/styles";
import { useHeaderScrollHandler } from "@/src/libs/context/HeaderScrollContext";
import { useDashboard } from "@/src/libs/hooks/enrollment/useDashboard";
import {
  getConsistencyService,
  getExamStatsService,
  getExamTrendsService,
} from "@/src/libs/services/dashboard";
import HalfCircleProgress from "@/src/components/dashboard/HalfCircleProgress";
import MiniLineChart from "@/src/components/home/MiniLineChart";

type StatsTab = "overview" | "heatmap" | "trends";

// Weak → Mastered mastery palette (matches the Heatmap legend).
const MASTERY_COLORS = ["#EF4444", "#F97316", "#FBBF24", "#86E0A3", "#22C55E"];
const masteryColor = (pct: number) => {
  if (pct < 35) return MASTERY_COLORS[0];
  if (pct < 50) return MASTERY_COLORS[1];
  if (pct < 65) return MASTERY_COLORS[2];
  if (pct < 80) return MASTERY_COLORS[3];
  return MASTERY_COLORS[4];
};

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

// Shape of GET /v1/exams/{id}/stats/ — the headline Stats numbers.
interface ExamStats {
  examReadiness: number;
  avgAccuracy: number;
  totalAttempts: number;
}

const EMPTY_STATS: ExamStats = {
  examReadiness: 0,
  avgAccuracy: 0,
  totalAttempts: 0,
};

const normalizeExamStats = (raw: any): ExamStats => {
  const d = raw?.data ?? raw ?? {};
  return {
    examReadiness: Number(d?.exam_readiness ?? 0) || 0,
    avgAccuracy: Number(d?.avg_accuracy ?? 0) || 0,
    totalAttempts: Number(d?.total_attempts ?? 0) || 0,
  };
};

// Shape of GET /v1/exams/{id}/trends/ — tolerant of several key spellings since
// the exact response shape is pending confirmation.
interface TrendSeries {
  values: number[];
  delta: number | null;
}
interface TrendsData {
  accuracy: TrendSeries;
  timePerQuestion: TrendSeries;
  percentile: TrendSeries;
}

const EMPTY_TRENDS: TrendsData = {
  accuracy: { values: [], delta: null },
  timePerQuestion: { values: [], delta: null },
  percentile: { values: [], delta: null },
};

const toNums = (v: any): number[] => {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) =>
      typeof x === "number"
        ? x
        : Number(
            x?.value ??
              x?.accuracy ??
              x?.percentage ??
              x?.seconds ??
              x?.time ??
              x?.percentile ??
              x?.y ??
              NaN
          )
    )
    .filter((n) => Number.isFinite(n));
};

const numOrNull = (v: any): number | null =>
  v == null || !Number.isFinite(Number(v)) ? null : Number(v);

const normalizeTrends = (raw: any): TrendsData => {
  const d = raw?.data ?? raw ?? {};
  return {
    accuracy: {
      values: toNums(d.accuracy_trend ?? d.accuracy ?? d.accuracy_series),
      delta: numOrNull(d.accuracy_delta ?? d.accuracy_change),
    },
    timePerQuestion: {
      values: toNums(
        d.time_per_question_trend ?? d.time_per_question ?? d.time_trend ?? d.time
      ),
      delta: numOrNull(d.time_delta ?? d.time_change),
    },
    percentile: {
      values: toNums(
        d.percentile_trend ?? d.percentile ?? d.percentile_vs_peers
      ),
      delta: numOrNull(d.percentile_delta ?? d.percentile_change),
    },
  };
};

// Delta from explicit field, else inferred from first→last of the series.
const seriesDelta = (s: TrendSeries): number | null => {
  if (s.delta != null) return s.delta;
  if (s.values.length < 2) return null;
  return Math.round((s.values[s.values.length - 1] - s.values[0]) * 10) / 10;
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

const TrendCard = ({
  icon,
  title,
  caption,
  captionBottom = false,
  pill,
  data,
  color,
}: {
  icon: string;
  title: string;
  caption: string;
  captionBottom?: boolean;
  pill: { text: string; good: boolean } | null;
  data: number[];
  color: string;
}) => (
  <>
    <View style={styles.sectionHeaderRow}>
      <Ionicons name={icon as any} size={16} color={COLORS.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.card}>
      {!captionBottom ? (
        <View style={styles.trendTopRow}>
          <Text style={styles.trendCaption}>{caption}</Text>
          {pill ? (
            <View
              style={[
                styles.trendPill,
                { backgroundColor: pill.good ? "#DCFCE7" : "#FEE2E2" },
              ]}
            >
              <Text
                style={[
                  styles.trendPillText,
                  { color: pill.good ? "#16A34A" : "#DC2626" },
                ]}
              >
                {pill.text}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {data.length >= 2 ? (
        <MiniLineChart data={data} color={color} height={120} lineWidth={2} />
      ) : (
        <Text style={styles.emptyText}>Not enough data yet.</Text>
      )}
      {captionBottom ? (
        <Text style={[styles.trendCaption, { marginTop: 12 }]}>{caption}</Text>
      ) : null}
    </View>
  </>
);

export default function AnalyticsScreen() {
  const { targetExams, activeExamId, dashboardData, isLoading, refresh } =
    useDashboard();
  const onHeaderScroll = useHeaderScrollHandler();
  const router = useRouter();

  const [tab, setTab] = useState<StatsTab>("overview");
  const [consistency, setConsistency] = useState<ConsistencyData>(EMPTY_CONSISTENCY);
  const [examStats, setExamStats] = useState<ExamStats>(EMPTY_STATS);
  const [trends, setTrends] = useState<TrendsData>(EMPTY_TRENDS);
  const [refreshing, setRefreshing] = useState(false);

  const loadConsistency = useCallback(async () => {
    try {
      const res = await getConsistencyService();
      setConsistency(normalizeConsistency(res));
    } catch {
      setConsistency(EMPTY_CONSISTENCY);
    }
  }, []);

  const loadExamStats = useCallback(async () => {
    if (activeExamId == null) return;
    try {
      const res = await getExamStatsService(activeExamId);
      setExamStats(normalizeExamStats(res));
    } catch {
      setExamStats(EMPTY_STATS);
    }
  }, [activeExamId]);

  const loadTrends = useCallback(async () => {
    if (activeExamId == null) return;
    try {
      const res = await getExamTrendsService(activeExamId);
      setTrends(normalizeTrends(res));
    } catch {
      setTrends(EMPTY_TRENDS);
    }
  }, [activeExamId]);

  useEffect(() => {
    loadConsistency();
  }, [loadConsistency]);

  useEffect(() => {
    loadExamStats();
  }, [loadExamStats]);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refresh(),
        loadConsistency(),
        loadExamStats(),
        loadTrends(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refresh, loadConsistency, loadExamStats, loadTrends]);

  // ── Derived (real) values ──────────────────────────────────────────────────
  // Headline numbers come from GET /v1/exams/{id}/stats/.
  const readiness = Math.round(examStats.examReadiness);
  const avgAccuracy = Math.round(examStats.avgAccuracy);
  const totalAttempts = examStats.totalAttempts;
  const subjects = dashboardData?.strength_by_subject ?? [];
  const streakDays = dashboardData?.streak?.current_streak ?? 0;

  const activeExam = targetExams.find(
    (e) => String(e.id) === String(activeExamId)
  );
  const examName = activeExam?.name ?? "Your exam";

  const weakest = (
    dashboardData?.todays_focus?.length
      ? dashboardData.todays_focus.map((t) => ({
          name: t.topic_name,
          subject: t.subject_name,
          pct: Math.max(0, Math.round(t.accuracy ?? 0)),
        }))
      : subjects.map((s) => ({
          name: s.subject_name,
          subject: s.subject_name,
          pct: Math.max(0, Math.round(s.accuracy ?? 0)),
        }))
  )
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 6);

  // Tapping a weak node jumps into Practice for that topic (same deep-link the
  // dashboard's "Continue practising" uses — opens the practice setup modal).
  const startPracticeForNode = (node: { name: string; subject: string }) => {
    if (activeExamId == null) return;
    router.push({
      pathname: "/practice",
      params: {
        chapterName: node.name,
        subjectName: node.subject,
        questionCount: "20",
        durationMinutes: "30",
        examId: String(activeExamId),
      },
    });
  };

  // Pad/trim the heatmap to a fixed 5×7 grid (oldest → today).
  const recentDays = consistency.days.slice(-HEATMAP_DAYS);
  const heatmap: ConsistencyDay[] = [
    ...Array(Math.max(0, HEATMAP_DAYS - recentDays.length)).fill({ count: 0, level: 0 }),
    ...recentDays,
  ];

  // Subject mastery for the Heatmap tab — each subject with its accuracy plus
  // the topic cells we have (from today's focus), grouped by subject.
  const heatmapSubjects = subjects.map((s) => {
    const subjectPct = Math.max(0, Math.round(s.accuracy ?? 0));
    const topics = (dashboardData?.todays_focus ?? [])
      .filter((t) => t.subject_name === s.subject_name)
      .map((t) => ({
        name: t.topic_name,
        pct: Math.max(0, Math.round(t.accuracy ?? 0)),
      }));
    const cells = topics.length
      ? topics
      : [{ name: s.subject_name, pct: subjectPct }];
    return { name: s.subject_name, pct: subjectPct, cells };
  });

  const renderHeatmap = () => (
    <>
      <View style={styles.legendRow}>
        <Text style={styles.legendText}>Weak</Text>
        {MASTERY_COLORS.map((c) => (
          <View key={c} style={[styles.legendCell, { backgroundColor: c }]} />
        ))}
        <Text style={styles.legendText}>Mastered</Text>
      </View>
      {heatmapSubjects.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.emptyText}>No subject data yet.</Text>
        </View>
      ) : (
        heatmapSubjects.map((s, i) => (
          <View key={`${s.name}-${i}`} style={styles.heatSubjectCard}>
            <View style={styles.heatSubjectHeader}>
              <Text style={styles.heatSubjectName} numberOfLines={1}>
                {s.name}
              </Text>
              <Text style={[styles.heatSubjectPct, { color: masteryColor(s.pct) }]}>
                {s.pct}%
              </Text>
            </View>
            <View style={styles.heatRow}>
              {s.cells.map((c, j) => (
                <View
                  key={`${c.name}-${j}`}
                  style={[styles.heatRowCell, { backgroundColor: masteryColor(c.pct) }]}
                />
              ))}
            </View>
          </View>
        ))
      )}
    </>
  );

  const renderTrends = () => {
    const accDelta = seriesDelta(trends.accuracy);
    const timeDelta = seriesDelta(trends.timePerQuestion);
    return (
      <>
        <TrendCard
          icon="stats-chart"
          title="Accuracy trend"
          caption={`Last ${trends.accuracy.values.length} sessions`}
          pill={
            accDelta != null
              ? { text: `${accDelta > 0 ? "+" : ""}${accDelta}%`, good: accDelta >= 0 }
              : null
          }
          data={trends.accuracy.values}
          color={COLORS.green}
        />
        <TrendCard
          icon="time-outline"
          title="Time per question"
          caption="Seconds · lower is better"
          pill={
            timeDelta != null
              ? { text: `${timeDelta > 0 ? "+" : ""}${timeDelta}s`, good: timeDelta <= 0 }
              : null
          }
          data={trends.timePerQuestion.values}
          color={COLORS.primary}
        />
        <TrendCard
          icon="trophy-outline"
          title="Percentile vs peers"
          caption="Your percentile across mocks & live exams."
          captionBottom
          pill={null}
          data={trends.percentile.values}
          color={COLORS.yellow}
        />
      </>
    );
  };

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
        onScroll={onHeaderScroll}
        scrollEventThrottle={16}
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

        {/* ── Tab switcher ── */}
        <View style={styles.tabBar}>
          {(["overview", "heatmap", "trends"] as StatsTab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "overview" ? "Overview" : t === "heatmap" ? "Heatmap" : "Trends"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === "overview" && (
          <>
        {/* ── Readiness gauge ── */}
        <View style={styles.gaugeCard}>
          <HalfCircleProgress
            size={200}
            strokeWidth={16}
            progress={readiness}
            color={COLORS.yellow}
            trackColor="#EAECF4"
            bgColor={COLORS.white}
          >
            <Text style={styles.gaugePct}>{readiness}%</Text>
          </HalfCircleProgress>
          <Text style={styles.gaugeLabel}>EXAM READINESS</Text>
          <Text style={styles.gaugeSub}>
            {readinessLabel(readiness)} · {examName} {DUMMY.examYear} in{" "}
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
            value={String(totalAttempts)}
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
                <TouchableOpacity
                  key={`${node.name}-${i}`}
                  style={[styles.nodeRow, i === weakest.length - 1 && { marginBottom: 0 }]}
                  activeOpacity={0.7}
                  onPress={() => startPracticeForNode(node)}
                >
                  <View style={styles.nodeTopRow}>
                    <Text style={styles.nodeName} numberOfLines={1}>
                      {node.name}
                    </Text>
                    <View style={styles.nodeRight}>
                      <Text style={[styles.nodePct, { color }]}>{node.pct}%</Text>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
                    </View>
                  </View>
                  <View style={styles.nodeBarBg}>
                    <View
                      style={[
                        styles.nodeBarFill,
                        { width: `${Math.min(100, Math.max(3, node.pct))}%`, backgroundColor: color },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
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
          </>
        )}

        {tab === "heatmap" && renderHeatmap()}

        {tab === "trends" && renderTrends()}

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

  // ── Tab switcher ──
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#E9EBF2",
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  tabText: { fontSize: 14, fontWeight: "700", color: COLORS.textLight },
  tabTextActive: { color: COLORS.textDark },

  // ── Heatmap tab ──
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  legendText: { fontSize: 12, color: COLORS.textLight, fontWeight: "600" },
  legendCell: { width: 18, height: 18, borderRadius: 5 },
  heatSubjectCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heatSubjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  heatSubjectName: { fontSize: 15, fontWeight: "800", color: COLORS.textDark, flex: 1, marginRight: 12 },
  heatSubjectPct: { fontSize: 14, fontWeight: "800" },
  heatRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  heatRowCell: { width: 30, height: 30, borderRadius: 8 },

  // ── Trends tab ──
  trendTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  trendCaption: { fontSize: 13, color: COLORS.textMedium },
  trendPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  trendPillText: { fontSize: 12, fontWeight: "800" },

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
  nodeRight: { flexDirection: "row", alignItems: "center", gap: 4 },
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
