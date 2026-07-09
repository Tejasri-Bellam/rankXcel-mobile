import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, getScoreColor } from "@/src/styles/styles";
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

  // Guard against overlapping onEndReached fires.
  const fetchingRef = useRef(false);

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
        setPage(pageNum);
      } catch {
        if (pageNum === 1) setError("Couldn't load your history. Pull to retry.");
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
    const pct = Math.round(item.percentage ?? 0);
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
        <Text style={[styles.rowPct, { color }]}>{pct}%</Text>
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/dashboard')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
          <Text style={styles.headerTitle}>Activity history</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = f.value === filter;
          return (
            <TouchableOpacity
              key={f.label}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelectFilter(f.value)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
    </View>
  );
}

const styles: any = {
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textDark },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: { fontSize: 13, fontWeight: "700", color: COLORS.textMedium },
  chipTextActive: { color: COLORS.white },
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
