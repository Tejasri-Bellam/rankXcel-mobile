import Toast, { useToast } from "@/src/components/common/Toast";
import { getErrorMessage } from "@/src/libs/utils/apiError";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import HalfCircleProgress from "@/src/components/dashboard/HalfCircleProgress";
import MiniLineChart from "@/src/components/home/MiniLineChart";
import { useHeaderScrollHandler } from "@/src/libs/context/HeaderScrollContext";
import { useTargetExam } from "@/src/libs/context/TagretExamContext";
import { useDashboard } from "@/src/libs/hooks/enrollment/useDashboard";
import {
  getConsistencyService,
  getExamStatsService,
  getExamTrendsService,
  getWeakestNodesService,
  TrendsFilter,
} from "@/src/libs/services/dashboard";
import { COLORS, getScoreColor } from "@/src/styles/styles";
import { analyticsScreenStyles as styles } from "@/src/styles/styles/home/analyticsscreenstyles";

type StatsTab = "overview" | "heatmap" | "trends";



const TRENDS_FILTERS: { key: TrendsFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'mock', label: 'Mocks' },
  { key: 'assessment', label: 'Assessments' },
];

// Weak → Mastered mastery palette (matches the Heatmap legend): the standard
// percentage scale — red <30, orange 30–39, yellow 40–59, green 60–100.
const MASTERY_COLORS = [COLORS.red, COLORS.orange, COLORS.yellow, COLORS.green];
const masteryColor = getScoreColor;

// DUMMY: still NOT provided by any API (see backend list).
const DUMMY = {
  bestPercentile: "Top 8%",
  examYear: 2027,
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
interface TrendPoint {
  value: number;
  /** "Mock" | "Assessment" — the session this point came from. */
  type: string;
  /** ISO submitted_at, used for the x-axis captions. */
  date: string;
  name: string;
}
interface TrendSeries {
  values: number[];
  points: TrendPoint[];
}
interface TrendsData {
  accuracy: TrendSeries;
  timePerQuestion: TrendSeries;
  percentile: TrendSeries;
}

const EMPTY_SERIES: TrendSeries = { values: [], points: [] };
const EMPTY_TRENDS: TrendsData = {
  accuracy: EMPTY_SERIES,
  timePerQuestion: EMPTY_SERIES,
  percentile: EMPTY_SERIES,
};

// Each trend entry is { index, <metric>, type, submitted_at, name? } — keep the
// metadata alongside the number so the chart can caption its points.
const toPoints = (v: any): TrendPoint[] => {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      const value =
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
            );
      return {
        value,
        type: String(x?.type ?? ""),
        date: String(x?.submitted_at ?? x?.date ?? ""),
        name: String(x?.name ?? ""),
      };
    })
    .filter((p) => Number.isFinite(p.value));
};

const toSeries = (raw: any): TrendSeries => {
  const points = toPoints(raw);
  return { points, values: points.map((p) => p.value) };
};

const normalizeTrends = (raw: any): TrendsData => {
  const d = raw?.data ?? raw ?? {};
  return {
    accuracy: toSeries(d.accuracy_trend ?? d.accuracy ?? d.accuracy_series),
    timePerQuestion: toSeries(
      d.time_per_question_trend ?? d.time_per_question ?? d.time_trend ?? d.time
    ),
    percentile: toSeries(
      d.percentile_trend ?? d.percentile ?? d.percentile_vs_peers
    ),
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-08-03T05:15:03Z" → "3 Aug". Empty when the date is missing/unparseable.
const shortDate = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

const TrendCard = ({
  icon,
  title,
  caption,
  captionBottom = false,
  points,
  color,
  formatValue,
}: {
  icon: string;
  title: string;
  caption: string;
  captionBottom?: boolean;
  points: TrendPoint[];
  color: string;
  formatValue: (v: number) => string;
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
        </View>
      ) : null}
      {/* A single session still plots — one dot with its value and date reads
          better than an empty-state on a filter that genuinely has one entry. */}
      {points.length >= 1 ? (
        <MiniLineChart
          data={points.map((p) => p.value)}
          color={color}
          height={120}
          lineWidth={2}
          showValues
          formatValue={(v) => formatValue(v)}
          labels={points.map((p) => shortDate(p.date))}
        />
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
  // PASS_FAIL exams aren't ranked — percentile-based cards are hidden for them.
  const { scoring } = useTargetExam();
  const { isPassFail, passMarks } = scoring;
  const onHeaderScroll = useHeaderScrollHandler();
  const router = useRouter();

  const [tab, setTab] = useState<StatsTab>("overview");
  const [consistency, setConsistency] = useState<ConsistencyData>(EMPTY_CONSISTENCY);
  const [examStats, setExamStats] = useState<ExamStats>(EMPTY_STATS);
  const [trends, setTrends] = useState<TrendsData>(EMPTY_TRENDS);
  const [weakestNodes, setWeakestNodes] = useState<WeakNode[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [trendsFilter, setTrendsFilter] = useState<TrendsFilter>('all');
  const { toast, showToast, hideToast } = useToast();

  // No active exam (e.g. the student switched to a country they have no target
  // exam in) — clear out the previous exam's stats rather than leaving them up.
  const loadConsistency = useCallback(async () => {
    if (activeExamId == null) {
      setConsistency(EMPTY_CONSISTENCY);
      return;
    }
    try {
      const res = await getConsistencyService(activeExamId);
      setConsistency(normalizeConsistency(res));
    } catch (err) {
      setConsistency(EMPTY_CONSISTENCY);
      showToast(getErrorMessage(err, "Couldn't load your stats."), "error");
    }
  }, [activeExamId, showToast]);

  const loadExamStats = useCallback(async () => {
    if (activeExamId == null) {
      setExamStats(EMPTY_STATS);
      return;
    }
    try {
      const res = await getExamStatsService(activeExamId);
      setExamStats(normalizeExamStats(res));
    } catch (err) {
      setExamStats(EMPTY_STATS);
      showToast(getErrorMessage(err, "Couldn't load your stats."), "error");
    }
  }, [activeExamId, showToast]);

  const loadTrends = useCallback(async () => {
    if (activeExamId == null) {
      setTrends(EMPTY_TRENDS);
      return;
    }
    try {
      const res = await getExamTrendsService(activeExamId, trendsFilter);
      setTrends(normalizeTrends(res));
    } catch (err) {
      setTrends(EMPTY_TRENDS);
      showToast(getErrorMessage(err, "Couldn't load your stats."), "error");
    }
  }, [activeExamId, trendsFilter, showToast]);

  const loadWeakestNodes = useCallback(async () => {
    if (activeExamId == null) {
      setWeakestNodes([]);
      return;
    }
    try {
      const res = await getWeakestNodesService(activeExamId);
      setWeakestNodes(normalizeWeakestNodes(res));
    } catch (err) {
      setWeakestNodes([]);
      showToast(getErrorMessage(err, "Couldn't load your stats."), "error");
    }
  }, [activeExamId, showToast]);

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
  // dashboard's "Recommended for you" uses — opens the practice setup modal).
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
  return (
    <>
      {/* Trends filter: All / Mocks / Assessments */}
      <View style={styles.trendsFilterRow}>
        {TRENDS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.trendsFilterChip,
              trendsFilter === f.key && styles.trendsFilterChipActive,
            ]}
            onPress={() => setTrendsFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.trendsFilterText,
                trendsFilter === f.key && styles.trendsFilterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TrendCard
        icon="stats-chart"
        title="Accuracy trend"
        caption={`Last ${trends.accuracy.values.length} sessions`}
        points={trends.accuracy.points}
        formatValue={(v) => `${Math.round(v * 10) / 10}%`}
        color={COLORS.green}
      />
      <TrendCard
        icon="time-outline"
        title="Time per question"
        caption="Seconds · lower is better"
        points={trends.timePerQuestion.points}
        formatValue={(v) => `${Math.round(v * 10) / 10}s`}
        color={COLORS.primary}
      />
      {/* Percentile is a ranking metric — hidden for PASS_FAIL exams. */}
      {!isPassFail && (
        <TrendCard
          icon="trophy-outline"
          title="Percentile vs Peers"
          caption="Your percentile across live exams."
          points={trends.percentile.points}
          formatValue={(v) => `${Math.round(v * 10) / 10}`}
          color={COLORS.yellow}
        />
      )}
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
console.log('consistency', consistency);

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
            {readinessText} · {examName} {DUMMY.examYear}
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
          {/* Ranked exams show best percentile; PASS_FAIL ones show the bar to
              clear instead (and nothing at all when pass_marks is missing). */}
          {!isPassFail ? (
            <StatCard
              icon="trophy"
              iconLib="mci"
              iconColor="#F5A623"
              value={DUMMY.bestPercentile}
              label="Best percentile"
            />
          ) : passMarks != null ? (
            <StatCard
              icon="flag-checkered"
              iconLib="mci"
              iconColor="#F5A623"
              value={String(passMarks)}
              label="Pass marks"
            />
          ) : null}
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
            <Text style={styles.heatLabelText}>{consistency.weeks} weeks </Text>
            <Text style={styles.heatLabelText}>Today</Text>
          </View>
        </View>
          </>
        )}

        {tab === "heatmap" && renderHeatmap()}

        {tab === "trends" && renderTrends()}

        <View style={{ height: 28 }} />
      </ScrollView>
      <Toast {...toast} onHide={hideToast} />
    </View>
  );
}
