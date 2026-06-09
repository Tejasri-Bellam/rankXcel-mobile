import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { leaderboardStyles as s } from "@/src/styles/sidebar/assessments/leaderboard";

interface Props {
  assessmentId?: number;
  onBack: () => void;
}

interface LeaderRow {
  name: string;
  percentage: number;
  isYou?: boolean;
}

// DUMMY: there is no leaderboard API yet (see backend list). This static set
// renders the design; swap for the real ranked response when available.
const PLACEHOLDER_ROWS: LeaderRow[] = [
  { name: "Aarav S.", percentage: 98 },
  { name: "Diya M.", percentage: 96 },
  { name: "Kabir R.", percentage: 95 },
  { name: "Ishaan P.", percentage: 92 },
  { name: "Ananya G.", percentage: 91 },
  { name: "You", percentage: 88, isYou: true },
  { name: "Vivaan T.", percentage: 86 },
  { name: "Saanvi K.", percentage: 84 },
];

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function Leaderboard({ onBack }: Props) {
  const rows = PLACEHOLDER_ROWS;

  return (
    <View style={s.safeArea}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color="#3B82F6" />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.title}>Leaderboard</Text>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row, index) => {
          const rank = index + 1;
          const topThree = rank <= 3;
          return (
            <View
              key={`${row.name}-${index}`}
              style={[s.row, row.isYou && s.rowYou]}
            >
              <View style={s.rankWrap}>
                {topThree ? (
                  <Ionicons
                    name="star"
                    size={16}
                    color={rank === 2 ? "#9CA3AF" : "#F5A623"}
                  />
                ) : (
                  <Text style={s.rankNum}>{rank}</Text>
                )}
              </View>

              <View style={s.avatar}>
                <Text style={s.avatarText}>
                  {row.isYou ? "Y" : initials(row.name)}
                </Text>
              </View>

              <Text style={s.name}>{row.isYou ? "You (you)" : row.name}</Text>

              <Text style={s.pct}>{row.percentage}%</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
