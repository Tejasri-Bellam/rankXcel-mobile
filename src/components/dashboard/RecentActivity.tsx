import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { COLORS, getScoreColor } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DashboardData } from "@/src/libs/types/dashboard";

interface RecentActivityProps {
  dashboardData: DashboardData | null;
}

const MAX_ROWS = 5;

const scoreColor = getScoreColor;

// Icon per activity type — matches the bottom-nav tab icons (see BottomNav):
// Mock → Mocks tab, Assessment/Live → Live tab, Practice/Test → Syllabus tab.
const typeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  switch ((type || "").toLowerCase()) {
    case "mock":
      return "document-text-outline";
    case "assessment":
    case "live":
      return "radio-outline";
    case "test":
      return "document-outline";
    case "practice":
    default:
      return "play-outline";
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

export default function RecentActivity({ dashboardData }: RecentActivityProps) {
  const router = useRouter();

  const activity = dashboardData?.recent_activity ?? [];

  if (!activity.length) return null;

  const rows = activity.slice(0, MAX_ROWS);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="time-outline" size={15} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Recent activity</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/history")}>
          <Text style={styles.link}>History ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {rows.map((item, index) => {
          const pct = Math.round(item.percentage ?? 0);
          const color = scoreColor(pct);
          return (
            <View
              key={index}
              style={[styles.row, index === 0 && styles.rowFirst]}
            >
              <View style={styles.rowIcon}>
                <Ionicons
                  name={typeIcon(item.type)}
                  size={16}
                  color={COLORS.primary}
                />
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
        })}
      </View>
    </View>
  );
}

const styles: any = {
  section: { marginTop: 22, marginBottom: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },
  link: { fontSize: 13, fontWeight: "700", color: COLORS.primary },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rowFirst: { borderTopWidth: 0 },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: { flex: 1, marginLeft: 12 },
  rowTitle: { fontSize: 13, fontWeight: "600", color: COLORS.textDark },
  rowSub: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  rowPct: { fontSize: 14, fontWeight: "800" },
};
