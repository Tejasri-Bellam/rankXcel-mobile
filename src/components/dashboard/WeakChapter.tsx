import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DashboardData } from "@/src/libs/types/dashboard";

interface WeakChapterProps {
  dashboardData: DashboardData | null;
}

const subjectColors: Record<string, string> = {
  Chemistry: "#DCFCE7",
  Physics: "#EEF0FF",
  Mathematics: "#FFF0E6",
};

const subjectTextColors: Record<string, string> = {
  Chemistry: COLORS.green,
  Physics: COLORS.primary,
  Mathematics: COLORS.orange,
};

export default function WeakChapter({ dashboardData }: WeakChapterProps) {
  const router = useRouter();

  const chapters: any[] =
    dashboardData?.weak_chapters ?? dashboardData?.weakChapters ?? [];

  if (!chapters.length) return null;

  return (
    <View className="bg-white rounded-lg shadow-md p-6 mb-6">
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.weakTitleRow}>
            <Ionicons name="warning" size={16} color={COLORS.yellow} />
            <Text style={[styles.cardTitle, { marginLeft: 6 }]}>
              Weak Chapter Alerts
            </Text>
          </View>
          <Text style={styles.aiLabel}>AI-Identified</Text>
        </View>

        {chapters.map((item: any, index: number) => (
          <View key={index} style={styles.weakChapterRow}>
            <View
              style={[styles.weakRankBubble, { backgroundColor: item.color }]}
            >
              <Text style={styles.weakRankText}>{item.rank}</Text>
            </View>

            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={styles.weakNameRow}>
                <Text style={styles.weakChapterName}>{item.name}</Text>

                <View
                  style={[
                    styles.weakSubjectTag,
                    { backgroundColor: subjectColors[item.subject] ?? "#F3F4F6" },
                  ]}
                >
                  <Text
                    style={[
                      styles.weakSubjectText,
                      { color: subjectTextColors[item.subject] ?? COLORS.textMedium },
                    ]}
                  >
                    {item.subject}
                  </Text>
                </View>
              </View>

              <View style={styles.weakBarBg}>
                <View
                  style={[
                    styles.weakBarFill,
                    { width: `${item.percent}%`, backgroundColor: item.color },
                  ]}
                />
              </View>

              <Text style={styles.weakAttempts}>{item.attempts} attempts</Text>
            </View>

            <Text style={[styles.weakPct, { color: item.color }]}>
              {item.percent}%
            </Text>
          </View>
        ))}

        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => router.push("./practice")}
        >
          <Text style={styles.viewAllText}>View all weak areas →</Text>
        </TouchableOpacity>
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
  weakTitleRow: { flexDirection: "row", alignItems: "center" },
  aiLabel: { fontSize: 11, color: COLORS.textLight, fontStyle: "italic" },
  weakChapterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  weakRankBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  weakRankText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  weakNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  weakChapterName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
    flex: 1,
  },
  weakSubjectTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  weakSubjectText: { fontSize: 11, fontWeight: "600" },
  weakBarBg: { height: 5, backgroundColor: COLORS.border, borderRadius: 4 },
  weakBarFill: { height: 5, borderRadius: 4 },
  weakAttempts: { fontSize: 10, color: COLORS.textLight, marginTop: 4 },
  weakPct: { fontSize: 14, fontWeight: "700", marginLeft: 10 },
  viewAllBtn: {
    alignItems: "center",
    marginTop: 4,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewAllText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 13,
  },
};
