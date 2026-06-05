import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DashboardData } from "@/src/libs/types/dashboard";

interface UpcomingProps {
  dashboardData: DashboardData | null;
}

export default function Upcoming({ dashboardData }: UpcomingProps) {
  const router = useRouter();
  const assessments = dashboardData?.upcoming_assessments ?? [];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="radio" size={15} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Upcoming live</Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/assessments",
              params: { tab: "upcoming" },
            })
          }
        >
          <Text style={styles.link}>All ›</Text>
        </TouchableOpacity>
      </View>

      {assessments.length === 0 ? (
        <View style={[styles.card, styles.emptyCard]}>
          <Ionicons
            name="calendar-outline"
            size={22}
            color={COLORS.textLight}
          />
          <Text style={styles.emptyText}>No live tests scheduled yet.</Text>
        </View>
      ) : (
        assessments.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.85}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/assessments",
                params: { tab: "upcoming" },
              })
            }
          >
            <View style={styles.liveIcon}>
              <Ionicons name="radio" size={18} color={COLORS.red} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                {item.time_label}
                {item.difficulty ? ` · ${item.difficulty}` : ""}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.textLight}
            />
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles: any = {
  section: { marginTop: 22 },
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  liveIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.redLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textDark },
  cardSub: { fontSize: 12, color: COLORS.textLight, marginTop: 3 },
  emptyCard: { alignItems: "center", justifyContent: "center", paddingVertical: 22, gap: 8 },
  emptyText: { fontSize: 13, color: COLORS.textLight },
};
