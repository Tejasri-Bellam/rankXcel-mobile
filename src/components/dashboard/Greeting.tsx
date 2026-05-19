import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/src/styles/styles";
import React, { useEffect, useState } from "react";
import { getMeService } from "@/src/libs/services/profile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dashboardData from "../json/dashboard";

export default function Greeting() {
  const [firstName, setFirstName] = useState("User");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res : any = await getMeService();

      const fullName = res?.data?.name || "";
      const name = getFirstName(fullName);

      setFirstName(name);

      // optional cache
      await AsyncStorage.setItem(
        "user",
        JSON.stringify(res?.data)
      );
    } catch (error) {
      console.log("User fetch failed:", error);

      // fallback from storage
      const savedUser = await AsyncStorage.getItem("user");

      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const name = getFirstName(parsed?.name || "");

        setFirstName(name);
      }
    }
  };

  const getFirstName = (fullName: string) => {
    if (!fullName) return "User";

    return fullName.trim().split(" ")[0];
  };

  const now = new Date();
  const hour = now.getHours();

  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon";
  } else if (hour >= 17) {
    greeting = "Good evening";
  }

  const formattedDate = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <View className="bg-white rounded-lg shadow-md p-6 mb-6">
      <View style={styles.greetingSection}>
        <Text style={styles.greetingText}>
          {greeting}, {firstName}! 👋
        </Text>

        <Text style={styles.greetingDate}>
          {formattedDate}
        </Text>

        <View style={styles.examBadgesContainer}>
          {dashboardData.user.exams.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.examBadge,
                item.active &&
                  styles.examBadgeActive,
              ]}
            >
              <MaterialCommunityIcons
                name="book-open-outline"
                size={16}
                color={
                  item.active
                    ? COLORS.primary
                    : COLORS.textLight
                }
              />

              <Text
                style={[
                  styles.examBadgeText,
                  item.active &&
                    styles.examBadgeTextActive,
                ]}
              >
                {item.name}
              </Text>

              {item.active && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={COLORS.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles: any = {
  greetingSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },

  greetingText: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textDark,
  },

  greetingDate: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
    marginBottom: 14,
  },

  examBadgesContainer: {
    gap: 8,
  },

  examBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },

  examBadgeActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },

  examBadgeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMedium,
  },

  examBadgeTextActive: {
    color: COLORS.primary,
  },
};