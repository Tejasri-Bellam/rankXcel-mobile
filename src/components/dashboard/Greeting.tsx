import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/src/styles/styles";
import { DashboardUser, TargetExam } from "@/src/libs/types/dashboard";

interface GreetingProps {
  user: DashboardUser | null;
  targetExams: TargetExam[];
  activeExamId: number | string | null;
  onSelectExam: (id: number | string) => void;
}

export default function Greeting({
  user,
  targetExams,
  activeExamId,
  onSelectExam,
}: GreetingProps) {
  const getFirstName = (fullName: string) => {
    if (!fullName) return "User";
    return fullName.trim().split(" ")[0];
  };

  const firstName = getFirstName(user?.name ?? "");

  const now = new Date();
  const hour = now.getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17) greeting = "Good evening";

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

        <Text style={styles.greetingDate}>{formattedDate}</Text>

        <View style={styles.examBadgesContainer}>
          {targetExams.map((item) => {
            const examId = item.exam ?? item.id;
            const isActive = examId === activeExamId;

            return (
              <TouchableOpacity
                key={String(examId)}
                style={[styles.examBadge, isActive && styles.examBadgeActive]}
                onPress={() => onSelectExam(examId)}
              >
                <MaterialCommunityIcons
                  name="book-open-outline"
                  size={16}
                  color={isActive ? COLORS.primary : COLORS.textLight}
                />

                <Text
                  style={[
                    styles.examBadgeText,
                    isActive && styles.examBadgeTextActive,
                  ]}
                >
                  {item.exam_name}
                  {item.target_year ? ` ${item.target_year}` : ""}
                </Text>

                {isActive && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            );
          })}
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
