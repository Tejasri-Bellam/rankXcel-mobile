import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { COLORS, getScoreColor } from "@/src/styles/styles";
import { analyticsScreenStyles as styles } from "@/src/styles/styles/home/analyticsscreenstyles";
import { useHeaderScrollHandler } from "@/src/libs/context/HeaderScrollContext";
import { useDashboard } from "@/src/libs/hooks/enrollment/useDashboard";
import {
  getConsistencyService,
  getExamStatsService,
  getExamTrendsService,
  getWeakestNodesService,
} from "@/src/libs/services/dashboard";
import HalfCircleProgress from "@/src/components/dashboard/HalfCircleProgress";
import MiniLineChart from "@/src/components/home/MiniLineChart";

type StatsTab = "overview" | "heatmap" | "trends";

// Weak → Mastered mastery palette (matches the Heatmap legend): the standard
// percentage scale — red <30, orange 30–39, yellow 40–59, green 60–100.
const MASTERY_COLORS = [COLORS.red, COLORS.orange, COLORS.yellow, COLORS.green];
const masteryColor = getScoreColor;

// DUMMY: still NOT provided by any API (see backend list).
const DUMMY = {
  bestPercentile: "Top 8%",
  examYear: 2027,
  daysToExam: 312,
};

// Consistency heatmap palette: empty → low → high.
const LEVEL_COLORS = ["#E6E8F0", "#F7A86E", "#FBD15E", "#86E0A3", "#22C55E"];
const HEATMAP_DAYS = 35; // 5 weeks × 7 days

const readinessLabel = (pct: number) => {
  if (pct >= 80) return "Exam ready";
  if (pct >= 60) return "On track";
  if (pct >= 40) return "Building";
  if (pct >= 20) return "Getting there";
  return "Getting started";
};

// Readiness colour band: <30 red, 30–39 orange, 40–59 yellow, 60–100 green.
const readinessColor = getScoreColor;

// Weakest-node colour band: <30 red, 30–39 orange, 40–59 yellow, 60–100 green.
const nodeColor = getScoreColor;

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

// Shape of GET /v1/exams/{id}/weakest-nodes/ — lowest-accuracy topics. The API
// returns a flat array; accuracy is 0–1 (we render it as a 0–100 percentage).
interface WeakNode {
  topicId: number | null;
  name: string;
  subject: string;
  parent: string;
  pct: number;
  attempted: number;
}

const normalizeWeakestNodes = (raw: any): WeakNode[] => {
  const list: any[] = Array.isArray(raw) ? raw : raw?.data ?? raw?.results ?? [];
  return list.map((n: any) => {
    // accuracy may arrive as a 0–1 fraction or already as a 0–100 percentage.
    const acc = Number(n?.accuracy ?? 0) || 0;
    const pct = acc <= 1 ? acc * 100 : acc;
    return {
      topicId: n?.topic_id ?? null,
      name: n?.topic_name ?? "",
      subject: n?.subject_name ?? "",
      parent: n?.parent_topic_name ?? "",
      pct: Math.max(0, Math.round(pct)),
      attempted: Number(n?.questions_attempted ?? 0) || 0,
    };
  });
};

// Shape of GET /v1/exams/{id}/stats/ — the headline Stats numbers:
//   { exam_readiness: { readiness_percentage, readiness_label },
//     avg_accuracy, total_attempts, streak: { current_streak } }
interface ExamStats {
  examReadiness: number;
  readinessLabel: string;
  avgAccuracy: number;
  totalAttempts: number;
  currentStreak: number;
}

const EMPTY_STATS: ExamStats = {
  examReadiness: 0,
  readinessLabel: "",
  avgAccuracy: 0,
  totalAttempts: 0,
  currentStreak: 0,
};

const normalizeExamStats = (raw: any): ExamStats => {
  const d = raw?.data ?? raw ?? {};
  // Readiness may arrive in several shapes:
  //   • flat top-level keys  { readiness_percentage, readiness_label }  (current)
  //   • a nested object      { exam_readiness: { readiness_percentage, readiness_label } }
  //   • a legacy flat number { exam_readiness: 63.1 }
  const readiness = d?.exam_readiness;
  const isObj = readiness != null && typeof readiness === "object";
  return {
    examReadiness:
      Number(
        d?.readiness_percentage ??
          (isObj ? readiness?.readiness_percentage : readiness) ??
          0
      ) || 0,
    readinessLabel: String(
      d?.readiness_label ?? (isObj ? readiness?.readiness_label : "") ?? ""
    ),
    avgAccuracy: Number(d?.avg_accuracy ?? 0) || 0,
    totalAttempts: Number(d?.total_attempts ?? 0) || 0,
    currentStreak: Number(d?.streak?.current_streak ?? 0) || 0,
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
  const [weakestNodes, setWeakestNodes] = useState<WeakNode[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadConsistency = useCallback(async () => {
    if (activeExamId == null) return;
    try {
      const res = await getConsistencyService(activeExamId);
      setConsistency(normalizeConsistency(res));
    } catch {
      setConsistency(EMPTY_CONSISTENCY);
    }
  }, [activeExamId]);

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

  const loadWeakestNodes = useCallback(async () => {
    if (activeExamId == null) return;
    try {
      const res = await getWeakestNodesService(activeExamId);
      setWeakestNodes(normalizeWeakestNodes(res));
    } catch {
      setWeakestNodes([]);
    }
  }, [activeExamId]);

  useEffect(() => {
    loadConsistency();
  }, [loadConsistency]);

  useEffect(() => {
    loadWeakestNodes();
  }, [loadWeakestNodes]);

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
        loadWeakestNodes(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refresh, loadConsistency, loadExamStats, loadTrends, loadWeakestNodes]);

  // ── Derived (real) values ──────────────────────────────────────────────────
  // Headline numbers come from GET /v1/exams/{id}/stats/, falling back to the
  // dashboard payload which now also carries readiness_percentage/label.
  const readiness = Math.round(
    examStats.examReadiness || dashboardData?.readiness_percentage || 0
  );
  const totalAttempts = examStats.totalAttempts;
  const subjects = dashboardData?.strength_by_subject ?? [];
  // Avg accuracy is the mean of the dashboard's per-subject accuracies; fall
  // back to the stats endpoint's avg_accuracy when no subjects are present.
  const avgAccuracy = Math.round(
    subjects.length
      ? subjects.reduce((sum, s) => sum + (s.accuracy ?? 0), 0) / subjects.length
      : examStats.avgAccuracy
  );
  // Streak now comes from the stats endpoint; fall back to the dashboard payload.
  const streakDays =
    examStats.currentStreak || dashboardData?.streak?.current_streak || 0;
  // Prefer the API-provided readiness label, else derive from the percentage.
  const readinessText =
    examStats.readinessLabel ||
    dashboardData?.readiness_label ||
    readinessLabel(readiness);

  const activeExam = targetExams.find(
    (e) => String(e.id) === String(activeExamId)
  );
  const examName = activeExam?.name ?? "Your exam";

  // Weakest nodes come from GET /v1/exams/{id}/weakest-nodes/. Show only real
  // data — when that endpoint has none, render the empty state rather than
  // falling back to today's focus / subject strengths.
  const weakest = weakestNodes
    .map((n) => ({
      topicId: n.topicId,
      name: n.name,
      subject: n.subject,
      parent: n.parent,
      attempted: n.attempted,
      pct: n.pct,
    }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 6);

  // Tapping a weak node jumps into Practice for that topic (same deep-link the
  // dashboard's "Continue practising" uses — opens the practice setup modal).
  const startPracticeForNode = (node: {
    name: string;
    subject: string;
    topicId?: number | null;
  }) => {
    if (activeExamId == null) return;
    router.push({
      pathname: "/practice",
      params: {
        chapterName: node.name,
        subjectName: node.subject,
        // Pass the real topic id when we have one so practice creation targets
        // this topic instead of a placeholder id of 0 (rejected by the API).
        ...(node.topicId != null ? { topicId: String(node.topicId) } : {}),
        questionCount: "20",
        durationMinutes: "30",
        examId: String(activeExamId),
      },
    });
  };

  // Tapping a weak node opens its sub-topic detail screen (accuracy ring, trend
  // and metrics from GET /v1/exams/{id}/subtopic/{topic_id}/). Fallback nodes
  // without a topic id (today's focus / subjects) still go straight to Practice.
  const openNode = (node: {
    topicId: number | null;
    name: string;
    subject: string;
    parent: string;
    pct: number;
    attempted: number;
  }) => {
    if (activeExamId == null) return;
    if (node.topicId == null) {
      startPracticeForNode(node);
      return;
    }
    router.push({
      pathname: "/subtopic",
      params: {
        examId: String(activeExamId),
        topicId: String(node.topicId),
        topicName: node.name,
        subjectName: node.subject,
        parentName: node.parent,
        accuracy: String(node.pct),
        attempted: String(node.attempted),
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
                <TouchableOpacity
                  key={`${c.name}-${j}`}
                  style={[styles.heatRowCell, { backgroundColor: masteryColor(c.pct) }]}
                  activeOpacity={0.7}
                  onPress={() => startPracticeForNode({ name: c.name, subject: s.name })}
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
        <Text style={styles.pageTitle}>Performance</Text>

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
            color={readinessColor(readiness)}
            trackColor="#EAECF4"
            bgColor={COLORS.white}
          >
            <Text style={styles.gaugePct}>{readiness}%</Text>
          </HalfCircleProgress>
          <Text style={styles.gaugeLabel}>EXAM READINESS</Text>
          <Text style={styles.gaugeSub}>
            {readinessText} · {examName} {DUMMY.examYear} in{" "}
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
            <Text style={styles.emptyText}>No weakest nodes yet.</Text>
          ) : (
            weakest.map((node, i) => {
              const color = nodeColor(node.pct);
              return (
                <TouchableOpacity
                  key={`${node.name}-${i}`}
                  style={[styles.nodeRow, i === weakest.length - 1 && { marginBottom: 0 }]}
                  activeOpacity={0.7}
                  onPress={() => openNode(node)}
                >
                  <View style={styles.nodeTopRow}>
                    <View style={styles.nodeNameCol}>
                      <Text style={styles.nodeName} numberOfLines={1}>
                        {node.name}
                      </Text>
                      {node.parent || node.attempted ? (
                        <Text style={styles.nodeSub} numberOfLines={1}>
                          {[
                            node.parent,
                            node.attempted
                              ? `${node.attempted} attempted`
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </Text>
                      ) : null}
                    </View>
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
