import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { COLORS, getScoreColor } from "@/src/styles/styles";
import { getSubtopicDetailService } from "@/src/libs/services/dashboard";
import CircleProgress from "@/src/components/dashboard/CircleProgress";
import MiniLineChart from "@/src/components/home/MiniLineChart";

// Weakest-node colour band: <30 red, 30–39 orange, 40–59 yellow, 60–100 green.
const nodeColor = getScoreColor;

// Shape of GET /v1/exams/{id}/subtopic/{topic_id}/.
interface SubtopicDetail {
  topicId: number | null;
  topicName: string;
  parentName: string;
  subjectName: string;
  examName: string;
  label: string;
  accuracyPct: number;
  questionsAttempted: number;
  avgTimeSeconds: number;
  attempts: number;
  thirtyDayGain: number | null;
  trend: number[];
}

// accuracy fields may arrive as a 0–1 fraction or already as a 0–100 percentage.
const toPct = (acc: any): number => {
  const n = Number(acc ?? 0) || 0;
  return Math.max(0, Math.round(n <= 1 ? n * 100 : n));
};

const normalize = (raw: any): SubtopicDetail => {
  const d = raw?.data ?? raw ?? {};
  const trend: number[] = Array.isArray(d?.accuracy_trend)
    ? d.accuracy_trend.map((p: any) => toPct(p?.accuracy ?? p))
    : [];
  return {
    topicId: d?.topic_id ?? null,
    topicName: d?.topic_name ?? "",
    parentName: d?.parent_topic_name ?? "",
    subjectName: d?.subject_name ?? "",
    examName: d?.exam_name ?? "",
    label: d?.label ?? "",
    accuracyPct: toPct(d?.accuracy),
    questionsAttempted: Number(d?.questions_attempted ?? 0) || 0,
    avgTimeSeconds: Number(d?.avg_time_seconds ?? 0) || 0,
    attempts: Number(d?.attempts ?? 0) || 0,
    thirtyDayGain:
      d?.thirty_day_gain == null || !Number.isFinite(Number(d.thirty_day_gain))
        ? null
        : Number(d.thirty_day_gain),
    trend,
  };
};

const Metric = ({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) => (
  <View style={styles.metricCard}>
    <Ionicons name={icon as any} size={18} color={COLORS.primary} />
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

export default function SubtopicScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    examId?: string;
    topicId?: string;
    // Fallback display values passed from the Weakest nodes card so the screen
    // can paint instantly while the detail request is in flight.
    topicName?: string;
    subjectName?: string;
    parentName?: string;
    accuracy?: string;
    attempted?: string;
  }>();

  const examId = params.examId ? String(params.examId) : null;
  const topicId = params.topicId ? String(params.topicId) : null;

  const fallback: SubtopicDetail = {
    topicId: topicId ? Number(topicId) : null,
    topicName: params.topicName ? String(params.topicName) : "",
    parentName: params.parentName ? String(params.parentName) : "",
    subjectName: params.subjectName ? String(params.subjectName) : "",
    examName: "",
    label: "",
    accuracyPct: params.accuracy ? Math.max(0, Math.round(Number(params.accuracy))) : 0,
    questionsAttempted: params.attempted ? Number(params.attempted) || 0 : 0,
    avgTimeSeconds: 0,
    attempts: 0,
    thirtyDayGain: null,
    trend: [],
  };

  const [detail, setDetail] = useState<SubtopicDetail>(fallback);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (examId == null || topicId == null) {
      setLoading(false);
      return;
    }
    try {
      const res = await getSubtopicDetailService(examId, topicId);
      setDetail(normalize(res));
    } catch {
      // Keep whatever fallback values we were handed.
    } finally {
      setLoading(false);
    }
  }, [examId, topicId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const startPractice = () => {
    if (examId == null) return;
    router.push({
      pathname: "/practice",
      params: {
        chapterName: detail.topicName,
        subjectName: detail.subjectName,
        // Pass the real topic id so practice creation targets this sub-topic
        // instead of falling back to a placeholder id of 0 (rejected by the API).
        ...(detail.topicId != null ? { topicId: String(detail.topicId) } : {}),
        questionCount: "20",
        durationMinutes: "30",
        examId: String(examId),
      },
    });
  };

  const color = nodeColor(detail.accuracyPct);

  // exam > subject > parent > topic — only the segments we actually have.
  const crumbs = [
    detail.examName,
    detail.subjectName,
    detail.parentName,
    detail.topicName,
  ].filter(Boolean);

  const gain = detail.thirtyDayGain;
  const gainText =
    gain == null ? "—" : `${gain > 0 ? "+" : ""}${Math.round(gain)}%`;

  return (
    <View style={styles.safeArea}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {detail.topicName || "Sub-topic"}
        </Text>
      </View>

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
        {/* ── Breadcrumb ── */}
        {crumbs.length > 0 ? (
          <View style={styles.breadcrumb}>
            {crumbs.map((c, i) => (
              <React.Fragment key={`${c}-${i}`}>
                <Text
                  style={[
                    styles.crumb,
                    i === crumbs.length - 1 && styles.crumbActive,
                  ]}
                  numberOfLines={1}
                >
                  {c}
                </Text>
                {i < crumbs.length - 1 ? (
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={COLORS.textLight}
                  />
                ) : null}
              </React.Fragment>
            ))}
          </View>
        ) : null}

        {/* ── Accuracy ring ── */}
        <View style={styles.ringCard}>
          <CircleProgress
            size={80}
            strokeWidth={9}
            progress={detail.accuracyPct}
            color={color}
            trackColor="#EAECF4"
            bgColor={COLORS.white}
          >
            <Text style={styles.ringPct}>{detail.accuracyPct}%</Text>
          </CircleProgress>
          <View style={styles.ringTextCol}>
            <Text style={[styles.ringLabel, { color }]}>
              {detail.label || "—"}
            </Text>
            <Text style={styles.ringSub}>
              {detail.questionsAttempted} questions attempted
            </Text>
          </View>
        </View>

        {/* ── Metric grid 2×2 ── */}
        <View style={styles.metricGrid}>
          <Metric
            icon="radio-button-on"
            value={`${detail.accuracyPct}%`}
            label="Accuracy"
          />
          <Metric
            icon="time-outline"
            value={`${detail.avgTimeSeconds}s`}
            label="Avg time"
          />
          <Metric
            icon="refresh"
            value={String(detail.attempts)}
            label="Attempts"
          />
          <Metric
            icon="stats-chart"
            value={gainText}
            label="30-day gain"
          />
        </View>

        {/* ── Accuracy trend ── */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="stats-chart" size={16} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Accuracy trend</Text>
        </View>
        <View style={styles.card}>
          {detail.trend.length >= 2 ? (
            <MiniLineChart
              data={detail.trend}
              color={COLORS.orange}
              fillColor={COLORS.orangeLight}
              height={120}
              lineWidth={2}
            />
          ) : (
            <Text style={styles.emptyText}>Not enough data yet.</Text>
          )}
        </View>

        {/* ── Practice CTA ── */}
        <TouchableOpacity
          style={styles.practiceBtn}
          onPress={startPractice}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={18} color={COLORS.white} />
          <Text style={styles.practiceText}>Practice this sub-topic</Text>
        </TouchableOpacity>

        <View style={{ height: 28 }} />
      </ScrollView>

      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textDark,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },

  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 12,
  },
  crumb: { fontSize: 11, color: COLORS.textLight, fontWeight: "600" },
  crumbActive: { color: COLORS.primary },

  ringCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ringPct: { fontSize: 18, fontWeight: "800", color: COLORS.textDark },
  ringTextCol: { flex: 1 },
  ringLabel: { fontSize: 17, fontWeight: "800" },
  ringSub: { fontSize: 12, color: COLORS.textLight, marginTop: 3 },

  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginBottom: 14,
  },
  metricCard: {
    width: "48.5%",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textDark,
    marginTop: 6,
  },
  metricLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textDark },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: "center",
    paddingVertical: 8,
  },

  practiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  practiceText: { fontSize: 15, fontWeight: "800", color: COLORS.white },

  loadingOverlay: {
    position: "absolute",
    top: 16,
    right: 16,
  },
});
