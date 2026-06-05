import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DashboardData } from "@/src/libs/types/dashboard";

interface RecentActivityProps {
  dashboardData: DashboardData | null;
}

const MAX_ROWS = 5;

const scoreColor = (pct: number) => {
  if (pct >= 60) return COLORS.green;
  if (pct >= 40) return COLORS.orange;
  return COLORS.red;
};

export default function RecentActivity({ dashboardData }: RecentActivityProps) {
  const router = useRouter();

  const scores = dashboardData?.recent_performance?.scores ?? [];
  const trend = dashboardData?.recent_performance?.trend ?? "";

  if (!scores.length) return null;

  // Newest first.
  const rows = [...scores].reverse().slice(0, MAX_ROWS);
  const isImproving = trend === "improving";

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="time-outline" size={15} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Recent activity</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/analytics")}>
          <Text style={styles.link}>History ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {trend ? (
          <View style={styles.trendRow}>
            <Ionicons
              name={isImproving ? "trending-up" : "trending-down"}
              size={14}
              color={isImproving ? COLORS.green : COLORS.red}
            />
            <Text
              style={[
                styles.trendText,
                { color: isImproving ? COLORS.green : COLORS.red },
              ]}
            >
              {isImproving ? "Improving" : "Needs work"}
            </Text>
          </View>
        ) : null}

        {rows.map((item, index) => {
          const pct = Math.round(item.percentage ?? 0);
          const color = scoreColor(pct);
          return (
            <View
              key={index}
              style={[styles.row, index === 0 && !trend && styles.rowFirst]}
            >
              <View style={styles.rowIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>Attempt · {item.date}</Text>
                <Text style={styles.rowSub}>Score {item.score}</Text>
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
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  trendText: { fontSize: 12, fontWeight: "700" },
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
