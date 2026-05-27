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

  const mocks: any[] =
    dashboardData?.upcoming_mocks ?? dashboardData?.upcomingMocks ?? [];

  if (!mocks.length) return null;

  return (
    <View className="bg-white rounded-lg shadow-md p-6 mb-6">
      <View style={[styles.card, { marginBottom: 32 }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.upcomingTitleRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={COLORS.primary}
            />
            <Text style={[styles.cardTitle, { marginLeft: 6 }]}>
              Upcoming Mocks
            </Text>
          </View>

          <TouchableOpacity onPress={() => router.push("./mock-library")}>
            <Text style={styles.detailsLink}>All mocks →</Text>
          </TouchableOpacity>
        </View>

        {mocks.map((item: any, index: number) => (
          <TouchableOpacity key={index} style={styles.mockRow}>
            <Ionicons name="time-outline" size={18} color={COLORS.textLight} />

            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.mockName}>{item.name}</Text>
              <Text style={styles.mockWhen}>{item.when}</Text>
            </View>

            <View
              style={[styles.diffBadge, { backgroundColor: item.color + "20" }]}
            >
              <Text style={[styles.diffText, { color: item.color }]}>
                {item.difficulty}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={16}
              color={COLORS.textLight}
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles: any = {
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  upcomingTitleRow: { flexDirection: "row", alignItems: "center" },
  mockRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  mockName: { fontSize: 13, fontWeight: "600", color: COLORS.textDark },
  mockWhen: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  diffBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  diffText: { fontSize: 11, fontWeight: "700" },
  detailsLink: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
};
