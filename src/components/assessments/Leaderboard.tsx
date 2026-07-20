import React, { useEffect, useState } from "react";
import { getErrorMessage } from "@/src/libs/utils/apiError";
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
  // Optional breadcrumb — reference design shows "<Assessment> › Live",
  // not currently returned by the leaderboard API. Rendered only if passed.
  assessmentName?: string;
  liveLabel?: string;
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
  // Optional — not in the current API response shape either, parsed
  // defensively in case the backend adds it later.
  xp: number | null;
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
        xp:
          yr.xp ?? yr.xp_earned ?? yr.points ?? yr.xp_points
            ? num(yr.xp ?? yr.xp_earned ?? yr.points ?? yr.xp_points)
            : null,
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

const PODIUM_COLORS: Record<number, string> = {
  1: "#F5A623",
  2: "#A6ABB5",
  3: "#C97B4A",
};
const PODIUM_HEIGHTS: Record<number, number> = { 1: 96, 2: 68, 3: 54 };
const PLACEHOLDER_COLOR = "#D1D5DB";

export default function Leaderboard({
  assessmentId,
  onBack,
  assessmentName,
  liveLabel,
}: Props) {
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
            setError(getErrorMessage(err, "Couldn't load the leaderboard."));
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

  const sortedRows = [...rows].sort(
    (a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity)
  );
  const byRank = (rank: number) => sortedRows.find((r) => r.rank === rank) ?? null;
  const podiumOrder = [2, 1, 3]; // left, center, right
  const showPodium = !loading && !error && sortedRows.length > 0;

  const renderPodiumColumn = (rank: number) => {
    const entry = byRank(rank);
    const isCenter = rank === 1;
    const color = entry ? PODIUM_COLORS[rank] : PLACEHOLDER_COLOR;

    return (
      <View key={rank} style={lb.podiumCol}>
        <View
          style={[
            lb.podiumAvatar,
            isCenter && lb.podiumAvatarLg,
            { backgroundColor: color },
          ]}
        >
          <Text style={[lb.podiumAvatarText, isCenter && lb.podiumAvatarTextLg]}>
            {entry ? initials(entry.name) : "—"}
          </Text>
        </View>
        <Text style={lb.podiumName} numberOfLines={1}>
          {entry ? entry.name : " "}
        </Text>
        <Text style={lb.podiumPct}>{entry ? `${entry.percentage}%` : "—"}</Text>
        <View
          style={[
            lb.podiumBlock,
            { height: PODIUM_HEIGHTS[rank], backgroundColor: color },
          ]}
        >
          <Text style={lb.podiumBlockNum}>{rank}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={s.safeArea}>
      <View style={s.headerCard}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={18} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={s.title}>Leaderboard</Text>
        </View>
        {(assessmentName || liveLabel) && (
          <View style={lb.breadcrumb}>
            {assessmentName && <Text style={lb.breadcrumbText}>{assessmentName}</Text>}
            {assessmentName && liveLabel && (
              <Ionicons name="chevron-forward" size={12} color="#9CA3AF" />
            )}
            {liveLabel && (
              <Text style={[lb.breadcrumbText, lb.breadcrumbActive]}>{liveLabel}</Text>
            )}
          </View>
        )}
      </View>

      {loading ? (
        <View style={{ paddingTop: 60, alignItems: "center" }}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      ) : error ? (
        <View style={{ paddingTop: 60, alignItems: "center", paddingHorizontal: 24 }}>
          <Text style={{ color: "#EF4444", textAlign: "center" }}>{error}</Text>
        </View>
      ) : sortedRows.length === 0 ? (
        <View style={{ paddingTop: 60, alignItems: "center", paddingHorizontal: 24 }}>
          <Text style={{ color: "#9CA3AF", textAlign: "center" }}>No rankings yet.</Text>
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {showPodium && (
            <View style={lb.podiumWrap}>
              {podiumOrder.map((rank) => renderPodiumColumn(rank))}
            </View>
          )}

          {yourResult && (
            <View style={lb.yourCardWrap}>
              <View style={lb.yourCard}>
                <Text style={lb.yourRankNum}>
                  {yourResult.rank != null ? `#${yourResult.rank}` : "—"}
                </Text>
                <View style={lb.yourAvatar}>
                  <Text style={lb.yourAvatarText}>
                    {(() => {
                      const you = sortedRows.find((r) => r.isYou);
                      return you ? initials(you.name) : "Y";
                    })()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={lb.yourLabel}>You</Text>
                  <Text style={lb.yourMeta}>
                    {yourResult.topPercent != null ? `Top ${yourResult.topPercent}% · ` : ""}
                    {yourResult.percentage}%
                  </Text>
                </View>
                {/* {yourResult.xp != null && (
                  <View style={lb.yourXpBadge}>
                    <Ionicons name="flash" size={12} color="#FFFFFF" />
                    <Text style={lb.yourXpText}>+{yourResult.xp} XP</Text>
                  </View>
                )} */}
              </View>
            </View>
          )}

          <View style={lb.sectionRow}>
            <Text style={lb.sectionLabel}>TOP RANKS</Text>
            {totalParticipants > 0 && (
              <Text style={lb.sectionCaption}>
                {totalParticipants} participant{totalParticipants === 1 ? "" : "s"}
              </Text>
            )}
          </View>

          <View style={s.scrollContent}>
            {sortedRows.map((row, index) => {
              const rank = row.rank ?? index + 1;
              return (
                <View key={`${row.name}-${index}`} style={[s.row, row.isYou && s.rowYou]}>
                  <View style={s.rankWrap}>
                    <Text style={s.rankNum}>{rank}</Text>
                  </View>

                  <View style={s.avatar}>
                    <Text style={s.avatarText}>
                      {row.isYou ? "Y" : initials(row.name)}
                    </Text>
                  </View>

                  <Text style={s.name}>{row.isYou ? `${row.name} (You)` : row.name}</Text>

                  <Text style={s.pct}>{row.percentage}%</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}