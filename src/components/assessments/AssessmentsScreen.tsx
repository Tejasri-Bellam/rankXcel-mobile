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
import Toast, { useToast } from "@/src/components/common/Toast";
import { getErrorMessage } from "@/src/libs/utils/apiError";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getassessmentsService } from "@/src/libs/services/assessments";
import { submitAbandonedAttempt } from "@/src/libs/utils/examSession";
import { useTargetExam } from "@/src/libs/context/TagretExamContext";
import { useHeaderScrollHandler } from "@/src/libs/context/HeaderScrollContext";
import LiveTestDetail from "./LiveTestDetail";
import { liveTestsStyles as styles } from "@/src/styles/styles/assessments/assessmentsscreenstyles";
import {
  LiveStatus,
  LIVE_STATUS_META,
  mapStudentStatus,
  studentStatusMeta,
} from "@/src/libs/constants";

type FilterValue = "all" | "live" | "upcoming" | "completed" | "missed";

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Live", value: "live" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
  { label: "Missed", value: "missed" },
];

const FILTER_VALUES = FILTERS.map((f) => f.value);
const isFilterValue = (v: unknown): v is FilterValue =>
  typeof v === "string" && (FILTER_VALUES as string[]).includes(v);

// Every tab except "All" maps 1:1 to the backend's `?status=` value, so the list
// is filtered server-side across all pages — not just within the pages already
// loaded on the client (which is why a client-side "Completed" would miss items
// sitting on an un-fetched page).
const statusQuery = (f: FilterValue): string | undefined =>
  f === "all" ? undefined : f;

// Bucket a raw student_status into the tab it belongs to. Used only for the tab
// count badges, which are derived client-side from the full unfiltered list.
const FILTER_OF_STATUS: Record<string, Exclude<FilterValue, "all">> = {
  live: "live",
  active: "live",
  ongoing: "live",
  in_progress: "live",
  upcoming: "upcoming",
  scheduled: "upcoming",
  registered: "upcoming",
  completed: "completed",
  submitted: "completed",
  missed: "missed",
  expired: "missed",
  closed: "missed",
};

const deriveStatus = (item: any): LiveStatus => {
  const scheduled = new Date(item?.scheduled_at).getTime();
  const end = scheduled + (item?.total_duration_minutes ?? 0) * 60 * 1000;
  const now = Date.now();
  const windowEnded = !isNaN(scheduled) && now > end;

  // Prefer the authoritative server status; fall back to schedule-based timing.
  const mapped = mapStudentStatus(item?.student_status);
  if (mapped) {
    // The scheduled window is the source of truth for whether a test is still
    // open. The backend can keep reporting "live"/"in_progress" past the end
    // time when an attempt was never submitted — but a closed window is results,
    // never live. This is what stops a stale "Resume" button (and the "Live"
    // pill) showing after the assessment has actually ended.
    if (mapped === "live" && windowEnded) return "results";
    return mapped;
  }

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

// The card pill mirrors the backend's raw student_status directly (completed →
// "Completed", missed → "Missed", live → "Live", …). The one exception: once a
// completed attempt's results have been published (`assessment_results` true),
// the pill reads "Results Out" instead of "Completed".
const studentDisplayMeta = (
  item: any
): { label: string; color: string; bg: string } | null => {
  const status = (item?.student_status ?? "").toLowerCase();
  if (status === "completed" && item?.assessment_results) {
    return LIVE_STATUS_META.results;
  }
  return studentStatusMeta(item?.student_status);
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
  // Bumped on a timer so time-based labels / statuses re-derive without a refetch.
  const [, setNow] = useState(() => Date.now());

  // Pagination — the list endpoint is paginated (20/page); pull pages as the
  // user scrolls. `allCount` is the server's grand total across all pages,
  // fetched separately (unfiltered) for the "All" tab badge.
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allCount, setAllCount] = useState(0);
  const loadingMoreRef = useRef(false);
  const { toast, showToast, hideToast } = useToast();

  const [allAssessments, setAllAssessments] = useState<any[]>([]);

  // Honour a `tab` filter passed in via navigation (e.g. Home's "Upcoming live
  // → All"), then clear it so a manual filter change isn't overridden later.
  useEffect(() => {
    if (isFilterValue(params.tab)) {
      setFilter(params.tab);
      router.setParams({ tab: undefined } as any);
    }
  }, [params.tab, router]);

  const fetchAssessments = async (isRefresh = false, silent = false) => {
    if (activeExamId == null) {
      setData([]);
      setLoading(false);
      return;
    }
    try {
      if (silent) {
        // background refresh (auto status flip) — no spinner
      } else if (isRefresh) setRefreshing(true);
      else setLoading(true);
      // Filter server-side via `?status=` so the tab reflects every matching
      // assessment across all pages, not just the ones already loaded.
      const res = await getassessmentsService(
        activeExamId,
        1,
        statusQuery(filter)
      );
      const raw: any = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : raw?.results || [];
      setData(list);
      setPage(1);
      setHasMore(!Array.isArray(raw) && !!raw?.next);
    } catch (error: any) {
      console.log("ASSESSMENTS ERROR:", JSON.stringify(error, null, 2));
      if (!silent)
        showToast(getErrorMessage(error, "Couldn't load assessments."), "error");
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
      const res = await getassessmentsService(
        activeExamId,
        nextPage,
        statusQuery(filter)
      );
      const raw: any = res?.data;
      const list: any[] = Array.isArray(raw) ? raw : raw?.results || [];
      setData((prev) => {
        const seen = new Set(prev.map((x) => String(x.id)));
        return [...prev, ...list.filter((x: any) => !seen.has(String(x.id)))];
      });
      setPage(nextPage);
      setHasMore(!Array.isArray(raw) && !!raw?.next);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  };

  // The visible list is filtered server-side per tab, so the tab count badges
  // need the full unfiltered list separately. Pull every page once in the
  // background and bucket them client-side. Independent of the active filter.
  const fetchAllForCounts = async () => {
    if (activeExamId == null) return;

    let page = 1;
    const all: any[] = [];
    let serverCount: number | null = null;

    try {
      while (true) {
        const res = await getassessmentsService(activeExamId, page);
        const raw: any = res?.data;
        if (page === 1 && typeof raw?.count === "number") serverCount = raw.count;

        const list: any[] = Array.isArray(raw) ? raw : raw?.results || [];
        if (list.length === 0) break;

        all.push(...list);

        if (Array.isArray(raw) || !raw?.next) break;

        page++;
      }

      const unique = Array.from(
        new Map(all.map((item) => [item.id, item])).values()
      );

      setAllAssessments(unique);
      setAllCount(serverCount ?? unique.length);
    } catch (err) {
      console.log("Background count fetch failed", err);
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (distanceFromBottom < 400) loadMore();
  };

  // Refetch the (server-filtered) list whenever the exam or active tab changes.
  useEffect(() => {
    fetchAssessments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExamId, filter]);

  // Pull the full unfiltered list once per exam for the tab count badges.
  useEffect(() => {
    fetchAllForCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExamId]);

  // Tick every 30s so time-only labels (e.g. "Live now · ends …") stay current
  // even while the screen sits open.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  // The card's live/upcoming/results state is driven by the backend's
  // student_status, so a re-render alone won't flip an "upcoming" test to
  // "live" — we need fresh data. Schedule a silent refetch for the exact moment
  // the soonest test starts (upcoming → live) or ends (live → results), so the
  // list updates on its own without a manual pull-to-refresh.
  useEffect(() => {
    if (loading || refreshing || activeExamId == null) return;
    const now = Date.now();
    let next = Infinity;
    // Schedule against the full list so a boundary fires regardless of which tab
    // is active (the visible list may be filtered down to a subset).
    for (const item of allAssessments) {
      const start = new Date(item?.scheduled_at).getTime();
      if (isNaN(start)) continue;
      const end = start + (item?.total_duration_minutes ?? 0) * 60 * 1000;
      if (start > now) next = Math.min(next, start);
      if (end > now) next = Math.min(next, end);
    }
    if (!isFinite(next)) return;
    // +1s buffer so the boundary has definitely passed when we refetch.
    const delay = Math.max(next - now + 1000, 1000);
    const id = setTimeout(async () => {
      // A window just closed while the list sat open — submit an attempt the
      // student abandoned mid-exam before refreshing, so its card reflects the
      // real (submitted) state rather than a stale in-progress one. No-ops unless
      // a stored attempt's deadline has actually passed.
      await submitAbandonedAttempt();
      fetchAssessments(false, true);
      fetchAllForCounts();
    }, delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAssessments, loading, refreshing, activeExamId]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Render from the freshest copy of this test in `data` (kept current by the
    // 30s tick and the boundary refetch) and re-derive its status each render,
    // rather than the frozen snapshot captured at tap time. Otherwise a test
    // that goes live — or that the student just registered for — while its
    // detail is open keeps showing "Registered"/"Upcoming" instead of "Enter
    // live test" until a manual pull-to-refresh.
    const fresh =
      data.find((it) => String(it?.id) === String(selected.item?.id)) ??
      selected.item;
    return (
      <LiveTestDetail
        item={fresh}
        status={deriveStatus(fresh)}
        onBack={() => {
          setSelected(null);
          fetchAssessments(true);
          fetchAllForCounts();
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

  // Display order: live first, then upcoming, then results/closed.
  const order: Record<LiveStatus, number> = { live: 0, upcoming: 1, results: 2 };

  // Tab count badges come from the full unfiltered list, bucketed by the same
  // categories the backend filters on. "All" prefers the server's grand total.
  const examScoped = allAssessments.filter(matchesActiveExam);
  const counts: Record<FilterValue, number> = {
    all: allCount || examScoped.length,
    live: 0,
    upcoming: 0,
    completed: 0,
    missed: 0,
  };
  for (const item of examScoped) {
    const bucket = FILTER_OF_STATUS[(item?.student_status ?? "").toLowerCase()];
    if (bucket) counts[bucket] += 1;
  }

  // The list is already filtered server-side for the active tab, so just sort
  // what came back — no further client-side status filtering.
  const tests = data
    .filter(matchesActiveExam)
    .map((item) => ({
      item,
      status: deriveStatus(item),
    }))
    .sort((a, b) => order[a.status] - order[b.status]);

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
            onRefresh={() => {
              fetchAssessments(true);
              fetchAllForCounts();
            }}
            colors={["#6C63FF"]}
            tintColor="#6C63FF"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Live Tests</Text>
          <Text style={styles.pageSubtitle}>
            Compete against everyone, in real time. Climb the National Leaderboard.
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
            <ActivityIndicator size="large" color="#6C63FF" />
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
              // The card shows the backend's raw student_status pill.
              const ss = studentDisplayMeta(item);
              // The pulsing live dot follows the derived status, so it goes away
              // once the scheduled window has closed (not just when the backend
              // flips student_status away from live).
              const isLive = status === "live";
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
            color="#6C63FF"
            style={{ marginVertical: 16 }}
          />
        )}
      </ScrollView>
      <Toast {...toast} onHide={hideToast} />
    </SafeAreaView>
  );
}
