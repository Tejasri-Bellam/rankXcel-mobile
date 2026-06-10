import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getassessmentsService } from "@/src/libs/services/assessments";
import { useTargetExam } from "@/src/libs/context/TagretExamContext";
import LiveTestDetail, { LiveStatus } from "./LiveTestDetail";
import { liveTestsStyles as styles } from "@/src/styles/sidebar/assessments/liveTests";

const STATUS_META: Record<
  LiveStatus,
  { label: string; color: string; bg: string; live?: boolean }
> = {
  upcoming: { label: "Upcoming", color: "#3B82F6", bg: "#EAF1FF" },
  live: { label: "Live now", color: "#EF4444", bg: "#FFECEC", live: true },
  results: { label: "Results out", color: "#6B7280", bg: "#F1F2F5" },
};

type FilterValue = "all" | "live" | "upcoming" | "completed";

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Live", value: "live" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
];

// "Completed" maps to the results-out status.
const FILTER_STATUS: Record<Exclude<FilterValue, "all">, LiveStatus> = {
  live: "live",
  upcoming: "upcoming",
  completed: "results",
};

// Map the backend's student_status to one of the three card states.
const mapStudentStatus = (s?: string): LiveStatus | null => {
  switch ((s ?? "").toLowerCase()) {
    case "live":
    case "active":
    case "ongoing":
    case "in_progress":
      return "live";
    case "upcoming":
    case "scheduled":
      return "upcoming";
    case "completed":
    case "submitted":
    case "missed":
    case "expired":
    case "closed":
      return "results";
    default:
      return null;
  }
};

const deriveStatus = (item: any): LiveStatus => {
  // Prefer the authoritative server status; fall back to schedule-based timing.
  const mapped = mapStudentStatus(item?.student_status);
  if (mapped) return mapped;

  const scheduled = new Date(item?.scheduled_at).getTime();
  const end = scheduled + (item?.total_duration_minutes ?? 0) * 60 * 1000;
  const now = Date.now();
  if (isNaN(scheduled)) return "upcoming";
  if (now < scheduled) return "upcoming";
  if (now <= end) return "live";
  return "results";
};

// upcoming → "Sun 14 Jun, 7:00 PM" · live → "Live now" · results → "Sat 6 Jun (closed)"
const whenLabel = (item: any, status: LiveStatus): string => {
  if (status === "live") return "Live now";
  const d = new Date(item?.scheduled_at);
  if (isNaN(d.getTime())) return status === "results" ? "Closed" : "—";
  if (status === "results") {
    return `${d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })} (closed)`;
  }
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Real field if provided; otherwise a stable placeholder so the card matches
// the design. (No participant-count API yet — see backend list.)
const participantCount = (item: any): number => {
  const real =
    item?.participant_count ??
    item?.registered_count ??
    item?.participants_count;
  if (real != null) return Number(real);
  return 1000 + ((Number(item?.id) || 1) * 1373) % 19000; // DUMMY
};

export default function AssessmentsScreen() {
  const { activeExamId } = useTargetExam();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<{ item: any; status: LiveStatus } | null>(
    null
  );
  const [filter, setFilter] = useState<FilterValue>("all");

  const fetchAssessments = async (isRefresh = false) => {
    if (activeExamId == null) {
      setData([]);
      setLoading(false);
      return;
    }
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const res = await getassessmentsService(activeExamId);
      const raw: any = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : raw?.results || [];
      setData(list);
    } catch (error: any) {
      console.log("ASSESSMENTS ERROR:", JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [activeExamId]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (selected) {
        setSelected(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [selected]);

  if (selected) {
    return (
      <LiveTestDetail
        item={selected.item}
        status={selected.status}
        onBack={() => {
          setSelected(null);
          fetchAssessments(true);
        }}
      />
    );
  }

  const matchesActiveExam = (item: any): boolean => {
    if (activeExamId == null) return false;
    const examId = item?.exam?.id;
    if (examId == null) return true;
    return String(examId) === String(activeExamId);
  };

  // Order: live first, then upcoming, then results.
  const order: Record<LiveStatus, number> = { live: 0, upcoming: 1, results: 2 };
  const allTests = data
    .filter(matchesActiveExam)
    .map((item) => ({ item, status: deriveStatus(item) }))
    .sort((a, b) => order[a.status] - order[b.status]);

  const counts: Record<FilterValue, number> = {
    all: allTests.length,
    live: allTests.filter((t) => t.status === "live").length,
    upcoming: allTests.filter((t) => t.status === "upcoming").length,
    completed: allTests.filter((t) => t.status === "results").length,
  };

  const tests =
    filter === "all"
      ? allTests
      : allTests.filter((t) => t.status === FILTER_STATUS[filter]);

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAssessments(true)}
            colors={["#2F86FF"]}
            tintColor="#2F86FF"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Live Tests</Text>
          <Text style={styles.pageSubtitle}>
            Compete against everyone, in real time. Climb the national leaderboard.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const active = f.value === filter;
            return (
              <TouchableOpacity
                key={f.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setFilter(f.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {f.label}
                </Text>
                {counts[f.value] > 0 && (
                  <View style={[styles.chipBadge, active && styles.chipBadgeActive]}>
                    <Text
                      style={[
                        styles.chipBadgeText,
                        active && styles.chipBadgeTextActive,
                      ]}
                    >
                      {counts[f.value]}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2F86FF" />
          </View>
        ) : tests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {filter === "all" ? "No live tests yet" : `No ${filter} tests`}
            </Text>
            <Text style={styles.emptySubtitle}>
              Ranked live tests will appear here when scheduled.
            </Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {tests.map(({ item, status }) => {
              const meta = STATUS_META[status];
              return (
                <TouchableOpacity
                  key={String(item.id)}
                  style={[styles.card, meta.live && styles.cardLive]}
                  activeOpacity={0.85}
                  onPress={() => setSelected({ item, status })}
                >
                  <View style={styles.cardTopRow}>
                    <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
                      {meta.live ? <View style={styles.liveDot} /> : null}
                      <Text style={[styles.statusPillText, { color: meta.color }]}>
                        {meta.label}
                      </Text>
                    </View>
                    <Text style={styles.participants}>
                      {participantCount(item).toLocaleString("en-US")} in
                    </Text>
                  </View>

                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>

                  <Text style={styles.cardMeta}>
                    {whenLabel(item, status)} · {item.question_count ?? 0} Qs ·{" "}
                    {item.total_duration_minutes ?? 0} min
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
