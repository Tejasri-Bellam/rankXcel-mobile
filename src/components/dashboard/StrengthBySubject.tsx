import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DashboardData } from "@/src/libs/types/dashboard";

interface StrengthBySubjectProps {
  dashboardData: DashboardData | null;
}

const subjectMeta: Record<string, { emoji: string; color: string }> = {
  Physics: { emoji: "⚛️", color: COLORS.primary },
  Chemistry: { emoji: "🧪", color: COLORS.green },
  Mathematics: { emoji: "📐", color: COLORS.orange },
  Mathemetics: { emoji: "📐", color: COLORS.orange },
};

const barColor = (pct: number) => {
  if (pct >= 60) return COLORS.green;
  if (pct >= 40) return COLORS.orange;
  return COLORS.red;
};

export default function StrengthBySubject({
  dashboardData,
}: StrengthBySubjectProps) {
  const router = useRouter();

  const subjects = dashboardData?.strength_by_subject ?? [];

  if (!subjects.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="stats-chart" size={15} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Strength by Subject</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/analytics")}>
          <Text style={styles.link}>Stats ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {subjects.map((item, index) => {
          const pct = Math.round(item.accuracy ?? 0);
          const meta = subjectMeta[item.subject_name] ?? {
            emoji: "📘",
            color: COLORS.primary,
          };
          const color = barColor(pct);
          return (
            <View
              key={item.subject_name}
              style={[styles.row, index === subjects.length - 1 && { marginBottom: 0 }]}
            >
              <Text style={styles.emoji}>{meta.emoji}</Text>
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={styles.subjectName}>{item.subject_name}</Text>
                  <Text style={[styles.subjectPct, { color }]}>{pct}%</Text>
                </View>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min(100, Math.max(2, pct))}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
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
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  emoji: { fontSize: 18, width: 26 },
  rowBody: { flex: 1 },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  subjectName: { fontSize: 14, fontWeight: "600", color: COLORS.textDark },
  subjectPct: { fontSize: 14, fontWeight: "800" },
  barBg: {
    height: 7,
    backgroundColor: COLORS.border,
    borderRadius: 5,
    overflow: "hidden",
  },
  barFill: { height: 7, borderRadius: 5 },
};
