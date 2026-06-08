import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DashboardData } from "@/src/libs/types/dashboard";

interface ContinueProps {
  dashboardData: DashboardData | null;
  examId: number | string | null;
}

interface PracticeItem {
  chapter: string;
  subject: string;
  status: string;
  questionCount?: number;
  durationMinutes?: number;
  accuracyTrend?: string;
}

const subjectStyle: Record<string, { bg: string; text: string }> = {
  Physics: { bg: COLORS.primaryLight, text: COLORS.primary },
  Chemistry: { bg: COLORS.greenLight, text: COLORS.green },
  Mathematics: { bg: COLORS.orangeLight, text: COLORS.orange },
  Mathemetics: { bg: COLORS.orangeLight, text: COLORS.orange },
};

const fallbackStyle = { bg: COLORS.grayBg, text: COLORS.textMedium };

const MAX_ITEMS = 4;

export default function Continue({ dashboardData, examId }: ContinueProps) {
  const router = useRouter();
console.log('ddd', dashboardData);

  const focus = dashboardData?.todays_focus ?? null;
  const weak = dashboardData?.weak_chapters ?? [];

  // Build the practice list: today's focus first, then weak chapters,
  // de-duplicated by chapter name.
  const seen = new Set<string>();
  const items: PracticeItem[] = [];

  if (focus) {
    seen.add(focus.topic_name);
    items.push({
      chapter: focus.topic_name,
      subject: focus.subject_name,
      status: "Weak",
      questionCount: focus.question_count,
      durationMinutes: focus.estimated_duration_minutes,
      accuracyTrend: focus.accuracy_trend,
    });
  }

  for (const c of weak) {
    if (seen.has(c.topic_name)) continue;
    seen.add(c.topic_name);
    items.push({
      chapter: c.topic_name,
      subject: c.subject_name,
      status: "Weak",
    });
    if (items.length >= MAX_ITEMS) break;
  }

  if (!items.length) return null;
console.log('ssss', items);

  const startPractice = (item: PracticeItem) => {
    if (examId == null) return;
    router.push({
      pathname: "/practice",
      params: {
        chapterName: item.chapter,
        subjectName: item.subject,
        questionCount: String(item.questionCount ?? 20),
        durationMinutes: String(item.durationMinutes ?? 30),
        accuracyTrend: item.accuracyTrend ?? "",
        examId: String(examId),
      },
    });
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="locate" size={16} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Continue practising</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/practice")}>
          <Text style={styles.link}>Syllabus ›</Text>
        </TouchableOpacity>
      </View>

      {items.map((item, index) => {
        const palette = subjectStyle[item.subject] ?? fallbackStyle;
        return (
          <View key={`${item.chapter}-${index}`} style={styles.card}>
            <View style={[styles.thumb, { backgroundColor: palette.text }]} />

            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.chapter}
              </Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                {item.subject} · {item.status}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.practiceBtn}
              onPress={() => startPractice(item)}
              disabled={examId == null}
            >
              <Ionicons name="play" size={12} color={COLORS.primary} />
              <Text style={styles.practiceBtnText}>Practice</Text>
            </TouchableOpacity>
          </View>
        );
      })}
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
    padding: 12,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textDark },
  cardSub: { fontSize: 12, color: COLORS.textLight, marginTop: 3 },
  practiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  practiceBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
};
