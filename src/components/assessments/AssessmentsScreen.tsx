import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getassessmentsService } from "@/src/libs/services/assessments";
import { useTargetExam } from "@/src/libs/context/TagretExamContext";
import { useHeaderScrollHandler } from "@/src/libs/context/HeaderScrollContext";
import LiveTestDetail, { LiveStatus } from "./LiveTestDetail";
import { liveTestsStyles as styles } from "@/src/styles/sidebar/assessments/liveTests";

type FilterValue = "all" | "live" | "upcoming" | "completed";

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Live", value: "live" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
];

const FILTER_VALUES = FILTERS.map((f) => f.value);
const isFilterValue = (v: unknown): v is FilterValue =>
  typeof v === "string" && (FILTER_VALUES as string[]).includes(v);

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

// The raw student_status straight from the backend, styled for a small pill.
// (Distinct from the live/upcoming/results card state — this is the student's
// own standing: registered, completed, missed, etc.)
const STUDENT_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  live: { label: "Live", color: "#EF4444", bg: "#FFECEC" },
  active: { label: "Active", color: "#EF4444", bg: "#FFECEC" },
  ongoing: { label: "Ongoing", color: "#EF4444", bg: "#FFECEC" },
  in_progress: { label: "In progress", color: "#EF4444", bg: "#FFECEC" },
  upcoming: { label: "Upcoming", color: "#3B82F6", bg: "#EAF1FF" },
  scheduled: { label: "Scheduled", color: "#3B82F6", bg: "#EAF1FF" },
  registered: { label: "Registered", color: "#2563EB", bg: "#EAF1FF" },
  completed: { label: "Results Out", color: "#059669", bg: "#E7F6EF" },
  submitted: { label: "Submitted", color: "#059669", bg: "#E7F6EF" },
  missed: { label: "Missed", color: "#DC2626", bg: "#FDECEC" },
  expired: { label: "Expired", color: "#6B7280", bg: "#F1F2F5" },
  closed: { label: "Closed", color: "#6B7280", bg: "#F1F2F5" },
};

// Format any student_status value into a display pill, falling back to a
// title-cased version of the raw string for statuses we haven't styled.
const studentStatusMeta = (
  s?: string
): { label: string; color: string; bg: string } | null => {
  const key = (s ?? "").toLowerCase();
  if (!key) return null;
  if (STUDENT_STATUS_META[key]) return STUDENT_STATUS_META[key];
  const label = key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { label, color: "#6B7280", bg: "#F1F2F5" };
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

// End time = scheduled_at + total_duration_minutes.
const assessmentEndTime = (item: any): Date | null => {
  const start = new Date(item?.scheduled_at).getTime();
  if (isNaN(start)) return null;
  return new Date(start + (item?.total_duration_minutes ?? 0) * 60 * 1000);
};

const timeOnly = (d: Date): string =>
  d.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

// upcoming → "Sun 14 Jun, 7:00 PM – 8:00 PM" · live → "Live now · ends 8:00 PM"
// · results → "Sat 6 Jun (closed)"
const whenLabel = (item: any, status: LiveStatus): string => {
  const end = assessmentEndTime(item);
  if (status === "live") {
    return end ? `Live now · ends ${timeOnly(end)}` : "Live now";
  }
  const d = new Date(item?.scheduled_at);
  if (isNaN(d.getTime())) return status === "results" ? "Closed" : "—";
  if (status === "results") {
    return `${d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })} (closed)`;
  }
  const startStr = d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return end ? `${startStr} – ${timeOnly(end)}` : startStr;
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
  const onHeaderScroll = useHeaderScrollHandler();
  const router = useRouter();
  const params = useLocalSearchParams<{
    tab?: string;
    openId?: string;
    openName?: string;
  }>();
  // The deep-link target we've already resolved (id/name), so we don't re-open
  // it — while still allowing a *new* deep-link to be handled.
  const handledOpenKeyRef = useRef<string | null>(null);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<{ item: any; status: LiveStatus } | null>(
    null
  );
  const [filter, setFilter] = useState<FilterValue>("all");

  // Pagination — the list endpoint is paginated (20/page); pull pages as the
  // user scrolls. `totalCount` is the server's total across all pages.
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const loadingMoreRef = useRef(false);

  // Honour a `tab` filter passed in via navigation (e.g. Home's "Upcoming live
  // → All"), then clear it so a manual filter change isn't overridden later.
  useEffect(() => {
    if (isFilterValue(params.tab)) {
      setFilter(params.tab);
      router.setParams({ tab: undefined } as any);
    }
  }, [params.tab, router]);

  const fetchAssessments = async (isRefresh = false) => {
    if (activeExamId == null) {
      setData([]);
      setLoading(false);
      return;
    }
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const res = await getassessmentsService(activeExamId, 1);
      const raw: any = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : raw?.results || [];
      setData(list);
      setPage(1);
      setHasMore(!Array.isArray(raw) && !!raw?.next);
      setTotalCount(
        typeof raw?.count === "number" ? raw.count : list.length
      );
    } catch (error: any) {
      console.log("ASSESSMENTS ERROR:", JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMore = async () => {
    if (
      loadingMoreRef.current ||
      loading ||
      refreshing ||
      !hasMore ||
      activeExamId == null
    )
      return;
    loadingMoreRef.current = true;
    const nextPage = page + 1;
    try {
      setLoadingMore(true);
      const res = await getassessmentsService(activeExamId, nextPage);
      const raw: any = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : raw?.results || [];
      setData((prev) => {
        const seen = new Set(prev.map((x) => String(x.id)));
        return [...prev, ...list.filter((x: any) => !seen.has(String(x.id)))];
      });
      setPage(nextPage);
      setHasMore(!Array.isArray(raw) && !!raw?.next);
      if (typeof raw?.count === "number") setTotalCount(raw.count);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (distanceFromBottom < 400) loadMore();
  };

  useEffect(() => {
    fetchAssessments();
  }, [activeExamId]);

  // Deep-link from Home's "Upcoming live": open the tapped assessment's detail
  // (the register page), matching by id (else by name). The list is paginated,
  // so if it's not on the loaded pages yet, keep paging until we find it.
  useEffect(() => {
    const { openId, openName } = params;
    if (!openId && !openName) return;
    if (loading) return; // wait for the first page

    const key = String(openId ?? openName);
    if (handledOpenKeyRef.current === key) return;

    const match = data.find((it: any) => {
      if (openId && String(it?.id) === String(openId)) return true;
      if (
        openName &&
        String(it?.name).trim().toLowerCase() ===
          String(openName).trim().toLowerCase()
      )
        return true;
      return false;
    });

    if (match) {
      handledOpenKeyRef.current = key;
      router.setParams({ openId: undefined, openName: undefined } as any);
      setSelected({ item: match, status: deriveStatus(match) });
      return;
    }

    // Not on the loaded pages yet — pull the next page and retry when it lands.
    if (hasMore && !loadingMore) {
      loadMore();
      return;
    }

    // Exhausted every page without a match — stop trying for this target.
    if (!hasMore) {
      handledOpenKeyRef.current = key;
      router.setParams({ openId: undefined, openName: undefined } as any);
    }
  }, [
    data,
    params.openId,
    params.openName,
    loading,
    hasMore,
    loadingMore,
    router,
  ]);

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

  // Order: live first, then upcoming, then results. All tabs show every
  // assessment for the exam (so the student can browse/register); only the Live
  // filter is restricted to registered + live below.
  const order: Record<LiveStatus, number> = { live: 0, upcoming: 1, results: 2 };
  const allTests = data
    .filter(matchesActiveExam)
    .map((item) => ({ item, status: deriveStatus(item) }))
    .sort((a, b) => order[a.status] - order[b.status]);

  // Live filter = registered AND the backend's live student_status.
  const isLive = (t: { item: any; status: LiveStatus }) =>
    Boolean(t.item?.is_registered) &&
    String(t.item?.student_status ?? "").toLowerCase() === "live";

  const counts: Record<FilterValue, number> = {
    // "All" reflects the server's total across all pages, not just what's loaded.
    all: totalCount || allTests.length,
    live: allTests.filter(isLive).length,
    upcoming: allTests.filter((t) => t.status === "upcoming").length,
    completed: allTests.filter((t) => t.status === "results").length,
  };

  const tests =
    filter === "all"
      ? allTests
      : filter === "live"
        ? allTests.filter(isLive)
        : allTests.filter((t) => t.status === FILTER_STATUS[filter]);

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={(e) => {
          handleScroll(e);
          onHeaderScroll(e);
        }}
        scrollEventThrottle={16}
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
              // The card shows only the backend's student_status pill.
              const ss = studentStatusMeta(item.student_status);
              const isLive = ["live", "active", "ongoing", "in_progress"].includes(
                String(item.student_status ?? "").toLowerCase()
              );
              return (
                <TouchableOpacity
                  key={String(item.id)}
                  style={[styles.card, isLive && styles.cardLive]}
                  activeOpacity={0.85}
                  onPress={() => setSelected({ item, status })}
                >
                  {ss && (
                    <View style={styles.cardTopRow}>
                      <View style={[styles.statusPill, { backgroundColor: ss.bg }]}>
                        {isLive ? <View style={styles.liveDot} /> : null}
                        <Text style={[styles.statusPillText, { color: ss.color }]}>
                          {ss.label}
                        </Text>
                      </View>
                    </View>
                  )}

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

        {loadingMore && (
          <ActivityIndicator
            size="small"
            color="#2F86FF"
            style={{ marginVertical: 16 }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
