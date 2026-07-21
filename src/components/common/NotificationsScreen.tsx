import React, { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/src/libs/utils/apiError";
import {
  ActivityIndicator,
  Alert,
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
import BottomNav from "./BottomNav";
import { deleteAlertService, getAlertsService, markAlertReadService, markAllAlertsReadService } from "@/src/libs/services/alerts";

// Types
type AlertItem = {
  id: number;
  alert_type: string;
  level: "INFO" | "WARNING" | "ERROR";
  title: string;
  body: string;
  data: Record<string, any>;
  action_url: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

// Helpers
function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}

type IconConfig = {
  name: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
  lib: "ionicons" | "mci";
  bg: string;
  color: string;
};

function getIconConfig(alertType: string, level: string): IconConfig {
  switch (alertType) {
    case "RESULT_READY":
      return { name: "trophy-outline", lib: "ionicons", bg: "#FFF3E0", color: "#F57C00" };
    case "ATTEMPT_AUTO_SUBMITTED":
      return { name: "time-outline", lib: "ionicons", bg: "#FFF8E1", color: "#FBC02D" };
    case "MOCK_TEST_CREATED":
      return { name: "document-text-outline", lib: "ionicons", bg: "#E8F5E9", color: "#388E3C" };
    case "ASSESSMENT_CREATED":
      return { name: "radio-outline", lib: "ionicons", bg: COLORS.primaryLight, color: COLORS.primary };
    case "ASSESSMENT_REMINDER":
      return { name: "notifications-outline", lib: "ionicons", bg: "#EDE7F6", color: "#7B1FA2" };
    case "BADGE_UNLOCKED":
      return { name: "medal-outline", lib: "mci", bg: "#E3F2FD", color: "#1565C0" };
    case "STREAK_REMINDER":
      return { name: "flame-outline", lib: "ionicons", bg: COLORS.redLight, color: COLORS.red };
    case "RANK_UPDATE":
      return { name: "bar-chart-outline", lib: "ionicons", bg: "#F3E5F5", color: "#6A1B9A" };
    default:
      if (level === "WARNING")
        return { name: "warning-outline", lib: "ionicons", bg: "#FFF8E1", color: "#F9A825" };
      return { name: "notifications-outline", lib: "ionicons", bg: COLORS.grayBg, color: COLORS.textMedium };
  }
}

function NotifIcon({ alertType, level }: { alertType: string; level: string }) {
  const cfg = getIconConfig(alertType, level);
  return (
    <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
      {cfg.lib === "mci" ? (
        <MaterialCommunityIcons name={cfg.name as any} size={20} color={cfg.color} />
      ) : (
        <Ionicons name={cfg.name as any} size={20} color={cfg.color} />
      )}
    </View>
  );
}

// Main Screen
export default function NotificationsScreen() {
  const router = useRouter();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res: any = await getAlertsService();
      const payload = res?.data;
      const list: AlertItem[] = Array.isArray(payload)
        ? payload
        : payload?.results ?? [];
      setAlerts(list);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load notifications. Pull down to retry."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts(true);
  };

  const handleMarkRead = async (item: AlertItem) => {
    if (item.is_read) return;

    // Update UI immediately
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === item.id
          ? {
              ...a,
              is_read: true,
              read_at: new Date().toISOString(),
            }
          : a
      )
    );

    try {
      await markAlertReadService(item.id);
    } catch {
      // If API fails, reload from server
      fetchAlerts(true);
    }
  };

  const handleMarkAllRead = async () => {
    // Apply optimistically first — no confirmation dialog so the state flush
    // is immediate and cards visually clear in the same frame.
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    try {
      await markAllAlertsReadService();
    } catch {
      // Revert on failure
      fetchAlerts(true);
    }
  };

  const handleDelete = (item: AlertItem) => {
    Alert.alert("Delete notification", "Remove this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setAlerts((prev) => prev.filter((a) => a.id !== item.id));
          try {
            await deleteAlertService(item.id);
          } catch {
            fetchAlerts(true);
          }
        },
      },
    ]);
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color={COLORS.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Notifications</Text>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
          >
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons
            name="alert-circle-outline"
            size={40}
            color={COLORS.textLight}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchAlerts()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons
            name="notifications-off-outline"
            size={44}
            color={COLORS.textLight}
          />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyBody}>
            You're all caught up. Check back later.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {alerts.map((item) => (
            <NotifCard
              key={item.id}
              item={item}
              onPress={() => handleMarkRead(item)}
              onDelete={() => handleDelete(item)}
            />
          ))}
          <View style={{ height: 12 }} />
        </ScrollView>
      )}

      <BottomNav />
    </View>
  );
}

// Card
function NotifCard({
  item,
  onPress,
  onDelete,
}: {
  item: AlertItem;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, !item.is_read && styles.cardUnread]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <NotifIcon alertType={item.alert_type} level={item.level} />

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title || item.body}
        </Text>
        {item.title && item.body !== item.title ? (
          <Text style={styles.cardSub} numberOfLines={2}>
            {item.body}
          </Text>
        ) : null}
        <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
      </View>

      <View style={styles.cardRight}>
        {!item.is_read && <View style={styles.dot} />}
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={15} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// Styles
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: COLORS.background,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  backText: {
    fontSize: 17,
    color: COLORS.primary,
    marginLeft: 2,
    fontWeight: "500",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  markAllBtn: {
    position: "absolute",
    right: 16,
    bottom: 18,
  },
  markAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },

  // States
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 4,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  emptyBody: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: "center",
  },

  // List
  list: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: COLORS.cardShadow ?? "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardUnread: {
    backgroundColor: "#F0F4FF",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    alignSelf: "center",
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textDark,
    lineHeight: 20,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.textMedium,
    lineHeight: 17,
  },
  cardTime: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  cardRight: {
    alignItems: "flex-start",
    gap: 8,
    paddingTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.grayBg,
    alignItems: "center",
    justifyContent: "center",
  },
});