import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DashboardData, WeakChapter as WeakChapterItem } from "@/src/libs/types/dashboard";

interface WeakChapterProps {
  dashboardData: DashboardData | null;
}

const subjectPalette: Record<string, { bg: string; text: string }> = {
  Chemistry: { bg: COLORS.greenLight, text: COLORS.green },
  Physics: { bg: COLORS.primaryLight, text: COLORS.primary },
  Mathematics: { bg: COLORS.orangeLight, text: COLORS.orange },
  Mathemetics: { bg: COLORS.orangeLight, text: COLORS.orange },
  "Life in the UK": { bg: COLORS.primaryLight, text: COLORS.primary },
};

const fallbackSubject = { bg: COLORS.grayBg, text: COLORS.textMedium };

const severityColor = (pct: number) => {
  if (pct < 0) return COLORS.red;
  if (pct < 10) return COLORS.red;
  if (pct < 30) return COLORS.orange;
  if (pct < 60) return COLORS.yellow;
  return COLORS.green;
};

const PREVIEW_COUNT = 3;

export default function WeakChapter({ dashboardData }: WeakChapterProps) {
  const router = useRouter();

  const chapters: WeakChapterItem[] = dashboardData?.weak_chapters ?? [];

  if (!chapters.length) return null;

  const preview = chapters.slice(0, PREVIEW_COUNT);
  const remaining = chapters.length - preview.length;

  return (
    <View>
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

        {preview.map((item, index) => {
          const pct = item.percentage ?? 0;
          const color = severityColor(pct);
          const palette = subjectPalette[item.subject_name] ?? fallbackSubject;
          const barWidth = Math.min(100, Math.max(0, Math.abs(pct)));
          const attemptsLabel = `${item.attempts} ${item.attempts === 1 ? "attempt" : "attempts"}`;

          return (
            <View key={index} style={styles.weakChapterRow}>
              <View style={[styles.weakRankBubble, { backgroundColor: color }]}>
                <Text style={styles.weakRankText}>{index + 1}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={styles.weakNameRow}>
                  <Text style={styles.weakChapterName} numberOfLines={1}>
                    {item.chapter_name}
                  </Text>

                  <View
                    style={[styles.weakSubjectTag, { backgroundColor: palette.bg }]}
                  >
                    <Text style={[styles.weakSubjectText, { color: palette.text }]}>
                      {item.subject_name}
                    </Text>
                  </View>
                </View>

                <View style={styles.weakBarBg}>
                  <View
                    style={[
                      styles.weakBarFill,
                      { width: `${barWidth}%`, backgroundColor: color },
                    ]}
                  />
                </View>

                <Text style={styles.weakAttempts}>{attemptsLabel}</Text>
              </View>

              <Text style={[styles.weakPct, { color }]}>
                {pct.toFixed(pct % 1 === 0 ? 0 : 1)}%
              </Text>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => router.push("./practice")}
        >
          <Text style={styles.viewAllText}>
            {remaining > 0
              ? `View all weak areas (${remaining} more) →`
              : "View all weak areas →"}
          </Text>
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
 