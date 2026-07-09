import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  getMockTestResultService,
  getMockAttemptResultService,
  MockTest,
  MockTestResult,
  MockTopicBreakdown,
} from '../../libs/services/mock-library';
import { getScoreColor } from '@/src/styles/styles';
import { SUBJECT_ACCENTS } from '@/src/libs/constants';
import { resultsStyles as styles } from '@/src/styles/styles/mock/resultsstyles';

interface Props {
  mockId: number | string;
  // Attempt to read the result from; when set, the attempt-based /result/
  // endpoint is used, otherwise it falls back to the mock-based one.
  attemptId?: number | string | null;
  mock: MockTest;
  answers: Record<string, string[]>;
  timeTakenSeconds: number;
  // When the result is already known (just submitted), render it immediately
  // instead of re-fetching /result/ — same shape, so no flicker.
  initialResult?: MockTestResult | null;
  onBack: () => void;
  onViewSolutions?: () => void;
  onDone: () => void;
}

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

const getMockTitle = (mock: MockTest): string => {
  const examName =
    typeof mock.exam === 'object' && mock.exam !== null && 'name' in mock.exam
      ? mock.exam.name
      : String(mock.exam || '');
  return mock.title ?? `${examName} mock`;
};

const num = (v: any): number => (v != null && !Number.isNaN(Number(v)) ? Number(v) : 0);

// Colour a 0–100 strength/accuracy value: red <30, orange 30–39, yellow 40–59, green 60–100.
const strengthColor = getScoreColor;

// Stable accent colour per subject name (no design tokens for this on the API).
const subjectAccent = (name: string): string => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return SUBJECT_ACCENTS[h % SUBJECT_ACCENTS.length];
};

export default function MockExamResults({
  mockId,
  attemptId,
  mock,
  timeTakenSeconds,
  initialResult,
  onBack,
  onViewSolutions,
  onDone,
}: Props) {
  const [result, setResult] = useState<MockTestResult | null>(initialResult ?? null);
  const [loading, setLoading] = useState(!initialResult);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialResult) return; // already have it from the submit response
    loadResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadResult = async () => {
    try {
      setLoading(true);
      setError(null);
      const res =
        attemptId != null
          ? await getMockAttemptResultService(attemptId)
          : await getMockTestResultService(mockId);
      const data = ((res as any)?.data ?? (res as any)) as MockTestResult | null;
      if (!data) {
        setError('Failed to load results.');
        return;
      }
      setResult(data);
    } catch {
      setError('Failed to load results.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color='#6C63FF' />
        <Text style={styles.centeredText}>Loading results…</Text>
      </SafeAreaView>
    );
  }

  if (error || !result) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
        <Text style={styles.centeredText}>{error ?? 'No results available.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadResult} activeOpacity={0.85}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Derive totals from topic_breakdown ──
  const topics: MockTopicBreakdown[] = Object.values(result.topic_breakdown ?? {});
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  topics.forEach((t) => {
    correct += num(t.correct);
    wrong += num(t.wrong);
    skipped += num(t.unattempted);
  });
  const totalQ =
    correct + wrong + skipped || num(mock.question_count) || 0;

  // One accuracy value drives the Accuracy card.
  const accuracyPct =
    totalQ > 0 ? Math.round((correct / totalQ) * 100) : Math.round(num(result.accuracy));

  // Score percentage (total_score / max_score) — headlines the hero banner.
  const percentagePct =
    result.percentage != null && !Number.isNaN(Number(result.percentage))
      ? Math.round(num(result.percentage))
      : num(result.max_score) > 0
      ? Math.round((num(result.total_score) / num(result.max_score)) * 100)
      : accuracyPct;

  // Raw marks scored out of the maximum — surfaced on the hero banner.
  const totalScore = num(result.total_score);
  const maxScore = num(result.max_score);

  const timeTaken = num(result.time_taken_seconds) || num(timeTakenSeconds);
  const xp = 100 + correct * 10;
  const percentile = mock.percentile != null ? Math.round(num(mock.percentile)) : null;

  const verdict =
    percentagePct >= 80 ? 'Mastered' : percentagePct >= 50 ? 'Good progress' : 'Needs work';

  // Weakest topics → "Practice next" suggestions.
  const weakTopics = topics
    .map((t) => {
      const att = num(t.correct) + num(t.wrong) + num(t.unattempted);
      return {
        name: t.topic_name || 'Topic',
        subject: t.subject_name || '',
        acc: att > 0 ? Math.round((num(t.correct) / att) * 100) : 0,
      };
    })
    .filter((t) => t.acc < 60)
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 4);

  const subjects = (result.strength_by_subject ?? []).map((s) => ({
    name: s.subject_name,
    acc: Math.round(num(s.accuracy)),
  }));

  const mockTitle = getMockTitle(mock);

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color='#6C63FF' />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Hero banner ── */}
        <View style={styles.banner}>
          {/* Decorative concentric rings behind the score */}
          <View style={styles.ringWrap} pointerEvents="none">
            <View style={styles.ringOuter}>
              <View style={styles.ringInner} />
            </View>
          </View>

          <Text style={styles.bannerTitle} numberOfLines={1}>
            {mockTitle.toUpperCase()} · COMPLETE
          </Text>

          <View style={styles.bannerScoreWrap}>
            <Text style={styles.bannerScore}>{percentagePct}</Text>
            <Text style={styles.bannerScorePct}>%</Text>
          </View>

          <Text style={styles.bannerScoreMarks}>
            {totalScore} / {maxScore} marks
          </Text>

          <Text style={styles.bannerSub}>
            {correct} of {totalQ} correct · {verdict}
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="flash" size={12} color="#fff" />
              <Text style={styles.badgeText}>+{xp} XP</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={12} color="#fff" />
              <Text style={styles.badgeText}>{formatTime(timeTaken)}</Text>
            </View>
            {percentile != null && (
              <View style={styles.badge}>
                <Ionicons name="trophy-outline" size={12} color="#fff" />
                <Text style={styles.badgeText}>Top {Math.max(1, 100 - percentile)}%</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Stat cards ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="locate-outline" size={18} color='#6C63FF' />
            <Text style={styles.statValue}>{accuracyPct}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#22C55E" />
            <Text style={styles.statValue}>{correct}/{totalQ}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={18} color="#F59E0B" />
            <Text style={styles.statValue}>{formatTime(timeTaken)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>

        {/* ── Review all questions ── */}
        {onViewSolutions && (
          <TouchableOpacity style={styles.reviewCard} onPress={onViewSolutions} activeOpacity={0.85}>
            <Ionicons name="eye-outline" size={18} color='#6C63FF' />
            <Text style={styles.reviewCardText}>Review all questions</Text>
          </TouchableOpacity>
        )}

        {/* ── Practice next ── */}
        {weakTopics.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="locate" size={16} color='#6C63FF' />
              <Text style={styles.sectionTitle}>Practice Next</Text>
            </View>
            {weakTopics.map((t, i) => (
              <TouchableOpacity
                key={`${t.name}-${i}`}
                style={styles.practiceRow}
                onPress={onDone}
                activeOpacity={0.8}
              >
                <View style={[styles.practiceIcon, { backgroundColor: '#F59E0B' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.practiceName} numberOfLines={1}>{t.name}</Text>
                  <Text style={styles.practiceSub}>Weak · tap to practise</Text>
                </View>
                <View style={styles.practicePill}>
                  <Ionicons name="play" size={11} color="#6C63FF" />
                  <Text style={styles.practicePillText}>Practice</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Strength by subject ── */}
        {subjects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bar-chart-outline" size={16} color='#6C63FF' />
              <Text style={styles.sectionTitle}>Strength by Subject</Text>
            </View>
            {subjects.map((s, i) => (
              <View key={`${s.name}-${i}`} style={styles.subjectRow}>
                <View style={styles.subjectHeaderRow}>
                  <View style={styles.subjectNameWrap}>
                    <View style={[styles.subjectDot, { backgroundColor: subjectAccent(s.name) }]} />
                    <Text style={styles.subjectName} numberOfLines={1}>{s.name}</Text>
                  </View>
                  <Text style={[styles.subjectPct, { color: strengthColor(s.acc) }]}>{s.acc}%</Text>
                </View>
                <View style={styles.subjectTrack}>
                  <View
                    style={[
                      styles.subjectFill,
                      { width: `${Math.min(100, Math.max(0, s.acc))}%`, backgroundColor: strengthColor(s.acc) },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Percentile banner ── */}
        {percentile != null && (
          <View style={styles.beatBanner}>
            <View style={styles.trophyWrap}>
              <Ionicons name="trophy" size={22} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.beatTitle}>You beat {percentile}% of test-takers</Text>
              <Text style={styles.beatSub}>Based on everyone who took this set</Text>
            </View>
          </View>
        )}

        {/* ── Bottom actions ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.75}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keepGoingBtn}
            onPress={() => router.push('/practice')}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.keepGoingText}>Keep Going</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
