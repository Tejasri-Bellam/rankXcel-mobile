import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  leaderboardStyles as s,
  leaderboardExtraStyles as lb,
} from "@/src/styles/styles/assessments/leaderboardstyles";
import { getAssessmentLeaderboardService } from "@/src/libs/services/assessments";

interface Props {
  assessmentId?: number;
  onBack: () => void;
}

interface LeaderRow {
  name: string;
  percentage: number;
  rank: number | null;
  isYou?: boolean;
}

interface YourResult {
  rank: number | null;
  percentage: number;
  topPercent: number | null;
}

interface LeaderboardData {
  rows: LeaderRow[];
  yourResult: YourResult | null;
  totalParticipants: number;
}

const num = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Response shape:
// { total_participants, top_ranks: [{ rank, student_name, percentage }],
//   your_result: { rank, percentage, top_percent } }
// Parsed defensively (also tolerates an array / { results: [...] } fallback).
const normalizeLeaderboard = (res: any): LeaderboardData => {
  const body = res?.data ?? res ?? {};
  const list: any[] = Array.isArray(body)
    ? body
    : body?.top_ranks ??
      body?.results ??
      body?.leaderboard ??
      body?.data?.top_ranks ??
      body?.data ??
      [];

  const yr = body?.your_result ?? body?.data?.your_result ?? null;
  const yourResult: YourResult | null = yr
    ? {
        rank: yr.rank != null ? num(yr.rank) : null,
        percentage: num(yr.percentage ?? yr.score),
        topPercent: yr.top_percent != null ? num(yr.top_percent) : null,
      }
    : null;

  const rows: LeaderRow[] = (Array.isArray(list) ? list : []).map((r: any) => {
    const rank = r?.rank != null ? num(r.rank) : null;
    return {
      name:
        r?.student_name ??
        r?.name ??
        r?.user_name ??
        r?.full_name ??
        r?.user?.name ??
        r?.username ??
        "—",
      percentage: num(r?.percentage ?? r?.score_percentage ?? r?.accuracy ?? r?.score),
      rank,
      // The list rows aren't flagged, so match on the rank from your_result.
      isYou:
        Boolean(r?.is_current_user ?? r?.is_you ?? r?.is_me) ||
        (yourResult?.rank != null && rank === yourResult.rank),
    };
  });

  return {
    rows,
    yourResult,
    totalParticipants: num(body?.total_participants ?? rows.length),
  };
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function Leaderboard({ assessmentId, onBack }: Props) {
  const [board, setBoard] = useState<LeaderboardData>({
    rows: [],
    yourResult: null,
    totalParticipants: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { rows, yourResult, totalParticipants } = board;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (assessmentId == null) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await getAssessmentLeaderboardService(assessmentId);
        if (!cancelled) setBoard(normalizeLeaderboard(res));
      } catch (err: any) {
        if (!cancelled) {
          // A leaderboard that isn't available yet (e.g. an upcoming/unranked
          // test) comes back as a 4xx — that's an empty state, not an error.
          // Only surface genuine network/server failures.
          const status = Number(err?.status);
          if (status >= 400 && status < 500) {
            setBoard({ rows: [], yourResult: null, totalParticipants: 0 });
          } else {
            setError(err?.message ?? "Couldn't load the leaderboard.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  return (
    <View style={s.safeArea}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color='#6C63FF' />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.title}>Leaderboard</Text>

      {!loading && !error && (totalParticipants > 0 || yourResult) && (
        <View style={lb.summary}>
          {totalParticipants > 0 && (
            <Text style={lb.participants}>
              {totalParticipants} participant{totalParticipants === 1 ? "" : "s"}
            </Text>
          )}
          {yourResult && (
            <View style={lb.yourCard}>
              <View>
                <Text style={lb.yourLabel}>Your rank</Text>
                <Text style={lb.yourRank}>
                  {yourResult.rank != null ? `#${yourResult.rank}` : "—"}
                </Text>
              </View>
              <View style={lb.yourRight}>
                <Text style={lb.yourPct}>{yourResult.percentage}%</Text>
                {yourResult.topPercent != null && (
                  <Text style={lb.yourTop}>Top {yourResult.topPercent}%</Text>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {loading ? (
        <View style={{ paddingTop: 60, alignItems: "center" }}>
          <ActivityIndicator size="large" color='#6C63FF' />
        </View>
      ) : error ? (
        <View style={{ paddingTop: 60, alignItems: "center", paddingHorizontal: 24 }}>
          <Text style={{ color: "#EF4444", textAlign: "center" }}>{error}</Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={{ paddingTop: 60, alignItems: "center", paddingHorizontal: 24 }}>
          <Text style={{ color: "#9CA3AF", textAlign: "center" }}>
            No rankings yet.
          </Text>
        </View>
      ) : (
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row, index) => {
          const rank = row.rank ?? index + 1;
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
      )}
    </View>
  );
}

