import React, { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/src/libs/utils/apiError";
import { formatPercent } from "@/src/libs/utils/percent";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, getScoreColor } from "@/src/styles/styles";
import ScreenHeader from "@/src/components/common/ScreenHeader";
import { getDashboardHistoryService } from "@/src/libs/services/dashboard";
import {
  DashboardHistoryPage,
  RecentActivityItem,
} from "@/src/libs/types/dashboard";
import { useTargetExam } from "@/src/libs/context/TagretExamContext";
import { HISTORY_FILTERS as FILTERS } from "@/src/libs/constants";

const scoreColor = getScoreColor;

const typeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  switch ((type || "").toLowerCase()) {
    case "mock":
      return "newspaper-outline";
    case "assessment":
      return "school-outline";
    case "practice":
    default:
      return "create-outline";
  }
};

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const timeLabel = (d: Date) =>
  d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

// today → "Today, 6:20 PM" · yesterday → "Yesterday" · within 3 days →
// "2 days ago" / "3 days ago" · older → "27 May 2026"
const formatDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;

  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);

  if (diffDays === 0) return `Today, ${timeLabel(d)}`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays >= 2 && diffDays <= 3) return `${diffDays} days ago`;

  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function HistoryScreen() {
  const router = useRouter();
  const { activeExamId } = useTargetExam();

  const [items, setItems] = useState<RecentActivityItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  // Server's `count` for the currently filtered list — shown beside the title.
  const [totalCount, setTotalCount] = useState<number | null>(null);
  // Type filter dropdown. `anchor` is the on-screen box of the trigger button,
  // measured on open so the panel can be pinned right under it (the panel lives
  // in a Modal so it overlays the list instead of being clipped by it).
  const [filterOpen, setFilterOpen] = useState(false);
  const [anchor, setAnchor] = useState({ top: 0, right: 16 });
  const filterBtnRef = useRef<View>(null);

  // Guard against overlapping onEndReached fires.
  const fetchingRef = useRef(false);

  const openFilter = () => {
    filterBtnRef.current?.measureInWindow((x, y, width, height) => {
      const screenWidth = Dimensions.get("window").width;
      setAnchor({ top: y + height + 6, right: Math.max(screenWidth - (x + width), 8) });
      setFilterOpen(true);
    });
  };

  const fetchPage = useCallback(
    async (pageNum: number, type: string | null) => {
      if (activeExamId == null || fetchingRef.current) return;
      fetchingRef.current = true;
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const res = await getDashboardHistoryService(activeExamId, pageNum, type);
        const data = (res?.data ?? null) as DashboardHistoryPage | null;
        const results = data?.results ?? [];
        setItems((prev) => (pageNum === 1 ? results : [...prev, ...results]));
        setHasNext(Boolean(data?.next));
        setTotalCount(
          typeof data?.count === "number" ? data.count : results.length
        );
        setPage(pageNum);
      } catch (err) {
        if (pageNum === 1)
          setError(getErrorMessage(err, "Couldn't load your history. Pull to retry."));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        fetchingRef.current = false;
      }
    },
    [activeExamId]
  );

  // Re-fetch from page 1 whenever the active filter (or exam) changes.
  useEffect(() => {
    fetchPage(1, filter);
  }, [fetchPage, filter]);

  const onSelectFilter = (value: string | null) => {
    if (value === filter || fetchingRef.current) return;
    setItems([]);
    setHasNext(false);
    setFilter(value);
  };

  const loadMore = () => {
    if (!hasNext || loadingMore || loading) return;
    fetchPage(page + 1, filter);
  };

  const renderItem = ({ item }: { item: RecentActivityItem }) => {
    const pct = Number(item.percentage ?? 0);
    const color = scoreColor(pct);
    return (
      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <Ionicons name={typeIcon(item.type)} size={18} color={COLORS.primary} />
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.type} · {item.label}
          </Text>
          <Text style={styles.rowSub}>{formatDate(item.submitted_at)}</Text>
        </View>
        <Text style={[styles.rowPct, { color }]}>{formatPercent(pct)}%</Text>
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      <ScreenHeader
        title="Activity history"
        onBack={() => router.replace("/dashboard")}
        titleAccessory={
          totalCount != null ? (
            <View style={styles.titleCount}>
              <Text style={styles.titleCountText}>{totalCount}</Text>
            </View>
          ) : null
        }
        right={
          <View ref={filterBtnRef} collapsable={false}>
            <TouchableOpacity
              style={[styles.filterBtn, filterOpen && styles.filterBtnOpen]}
              activeOpacity={0.85}
              onPress={openFilter}
            >
              <Text style={styles.filterBtnText}>
                {FILTERS.find((f) => f.value === filter)?.label ?? "Type"}
              </Text>
              <Ionicons
                name={filterOpen ? "chevron-up" : "chevron-down"}
                size={12}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        }
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchPage(1, filter)}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="time-outline" size={28} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No activity yet.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.submitted_at}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
          }
        />
      )}

      <Modal
        visible={filterOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFilterOpen(false)}
      >
        <Pressable
          style={styles.dropdownBackdrop}
          onPress={() => setFilterOpen(false)}
        >
          <View style={[styles.dropdown, { top: anchor.top, right: anchor.right }]}>
            {FILTERS.map((f) => {
              const active = f.value === filter;
              return (
                <TouchableOpacity
                  key={f.label}
                  style={styles.dropdownRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setFilterOpen(false);
                    onSelectFilter(f.value);
                  }}
                >
                  <View style={[styles.checkbox, active && styles.checkboxChecked]}>
                    {active && (
                      <Ionicons name="checkmark" size={12} color={COLORS.white} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.dropdownLabel,
                      active && styles.dropdownLabelActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles: any = {
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  // Server-reported total for the active type filter.
  titleCount: {
    minWidth: 26,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
  },
  titleCountText: { fontSize: 12, fontWeight: "800", color: COLORS.white },

  // ── Type filter button + dropdown ──
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterBtnOpen: { borderColor: COLORS.primary },
  filterBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },

  dropdownBackdrop: { flex: 1 },
  dropdown: {
    position: "absolute",
    minWidth: 150,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dropdownLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMedium,
  },
  dropdownLabelActive: { color: COLORS.primary, fontWeight: "800" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyText: { fontSize: 14, color: COLORS.textLight, textAlign: "center" },
  retryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: { flex: 1, marginLeft: 12 },
  rowTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textDark },
  rowSub: { fontSize: 12, color: COLORS.textLight, marginTop: 3 },
  rowPct: { fontSize: 15, fontWeight: "800" },
  footer: { paddingVertical: 16, alignItems: "center" },
};
