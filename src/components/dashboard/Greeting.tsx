import React from "react";
import { Text, View } from "react-native";
import { COLORS } from "@/src/styles/styles";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DashboardData } from "@/src/libs/types/dashboard";

interface GreetingProps {
  user: any | null;
  dashboardData: DashboardData | null;
}

const getFirstName = (fullName: string) => {
  if (!fullName) return "there";
  return fullName.trim().split(" ")[0];
};

export default function Greeting({ user, dashboardData }: GreetingProps) {
  const firstName = getFirstName(user?.name ?? "");

  const currentStreak = dashboardData?.streak?.current_streak ?? 0;

  // Gamification fields come from auth/me when available, otherwise we fall
  // back to data we do have so the row never renders empty.
  const level = user?.level ?? user?.current_level ?? null;
  const rankTitle =
    user?.rank_title ?? user?.title ?? user?.badge ?? user?.tier ?? null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.hi}>Hi, {firstName} 👋</Text>

      <View style={styles.badgeRow}>
        {/* Current streak */}
        <View style={[styles.badge, { backgroundColor: COLORS.redLight }]}>
          <Ionicons name="flame" size={13} color={COLORS.red} />
          <Text style={[styles.badgeText, { color: COLORS.red }]}>
            {currentStreak}
          </Text>
        </View>

        {/* Level / rank title */}
        {(level != null || rankTitle) && (
          <View style={[styles.badge, { backgroundColor: COLORS.primaryLight }]}>
            <MaterialCommunityIcons
              name="medal-outline"
              size={13}
              color={COLORS.primary}
            />
            <Text style={[styles.badgeText, { color: COLORS.primary }]}>
              {level != null ? `Lvl ${level}` : ""}
              {level != null && rankTitle ? " · " : ""}
              {rankTitle ?? ""}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles: any = {
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  hi: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
};
