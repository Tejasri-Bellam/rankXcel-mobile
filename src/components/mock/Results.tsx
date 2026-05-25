// src/components/mock/MockExamResults.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockResultStyles as styles } from '../../styles/sidebar/mockExams/results';
import { getMockTestResultService, MockTest } from '../../libs/services/mock-library';

interface Props {
  mockId: number | string;
  mock: MockTest;
  answers: Record<string, string[]>;
  timeTakenSeconds: number;
  onBack: () => void;
  onViewSolutions?: () => void;
  onViewAnalysis?: () => void;
}

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function MockExamResults({
  mockId,
  mock,
  timeTakenSeconds,
  onBack,
  onViewSolutions,
  onViewAnalysis,
}: Props) {
  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => { loadResult(); }, []);

  const loadResult = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMockTestResultService(mockId);
      console.log('MOCK RESULT API:', JSON.stringify(res, null, 2));
      setResult(res?.data ?? null);
    } catch (err) {
      console.log('MOCK RESULT ERROR:', err);
      setError('Failed to load results.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={{ marginTop: 12, color: '#9898B0' }}>Loading results…</Text>
      </SafeAreaView>
    );
  }

  if (!result) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>📊</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 }}>
          {error ? 'Could not load results' : 'Results not available yet'}
        </Text>
        <Text style={{ fontSize: 14, color: '#9898B0', textAlign: 'center', marginBottom: 24 }}>
          Your mock has been submitted. Please try again in a moment.
        </Text>
        <TouchableOpacity
          onPress={loadResult}
          style={{ backgroundColor: '#6C5CE7', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 12 }}>
          <Text style={{ color: '#9898B0', fontSize: 14 }}>← Back to Mock Library</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Extract directly from API result ──
  const finalScore  = Number(result?.total_score ?? result?.score ?? 0);
  const totalMarks  = Number(result?.max_score ?? result?.total_marks ?? mock.max_score ?? mock.question_count ?? 0);
  const timeTaken   = Number(result?.time_taken_seconds ?? timeTakenSeconds ?? 0);

  const chapterBreakdown: Record<string, any> = result?.chapter_breakdown ?? {};
  const chapterEntries = Object.values(chapterBreakdown);

  let finalCorrect = 0, finalWrong = 0, finalSkipped = 0;
  chapterEntries.forEach((ch: any) => {
    finalCorrect += Number(ch?.correct ?? 0);
    finalWrong   += Number(ch?.wrong ?? 0);
    finalSkipped += Number(ch?.unattempted ?? ch?.skipped ?? 0);
  });

  // Fallback to top-level fields if no chapter_breakdown.
  if (chapterEntries.length === 0) {
    finalCorrect = Number(result?.correct_count ?? result?.correct ?? 0);
    finalWrong   = Number(result?.wrong_count ?? result?.wrong ?? 0);
    finalSkipped = Number(result?.skipped_count ?? result?.unattempted ?? 0);
  }

  const finalAttempted = finalCorrect + finalWrong;
  const totalQuestions = Number(result?.total_questions ?? mock.question_count ?? (finalAttempted + finalSkipped));

  const percentage = result?.percentage != null
    ? Number(result.percentage).toFixed(1)
    : totalMarks > 0 ? ((finalScore / totalMarks) * 100).toFixed(1) : '0.0';

  const percentile = result?.percentile ?? mock.percentile ?? null;
  const rank       = result?.rank ?? null;

  const dateLabel = result?.submitted_at
    ? new Date(result.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Mock Library</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreCardTop}>
            <View>
              <Text style={styles.scoreDate}>{dateLabel}</Text>
              <Text style={styles.scoreValue}>
                {finalScore}
                <Text style={styles.scoreDivider}>/{totalMarks}</Text>
              </Text>
              <Text style={styles.scorePercent}>{percentage}%</Text>
            </View>
            <View style={styles.trophyContainer}>
              <Text style={styles.trophyIcon}>🏆</Text>
            </View>
          </View>
          <View style={styles.scoreStatsRow}>
            {[
              { label: `${finalCorrect} correct`, color: '#22C55E' },
              { label: `${finalWrong} wrong`,     color: '#EF4444' },
              { label: `${finalSkipped} skipped`, color: 'rgba(255,255,255,0.5)' },
            ].map(({ label, color }) => (
              <View key={label} style={styles.scoreStatItem}>
                <View style={[styles.scoreStatDot, { backgroundColor: color }]} />
                <Text style={styles.scoreStatText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statValue}>{percentage}%</Text>
            <Text style={styles.statLabel}>Percentage</Text>
            <Text style={styles.statSub}>{finalScore}/{totalMarks}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>
              {finalAttempted > 0 ? Math.round((finalCorrect / finalAttempted) * 100) : 0}%
            </Text>
            <Text style={styles.statLabel}>Accuracy</Text>
            <Text style={styles.statSub}>{finalCorrect}/{finalAttempted} correct</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱</Text>
            <Text style={styles.statValue}>{formatTime(timeTaken)}</Text>
            <Text style={styles.statLabel}>Time Taken</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✍️</Text>
            <Text style={styles.statValue}>{finalAttempted}</Text>
            <Text style={styles.statLabel}>Attempted</Text>
            <Text style={styles.statSub}>
              {Math.max(0, totalQuestions - finalAttempted)} skipped
            </Text>
          </View>
          {percentile != null && (
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📈</Text>
              <Text style={styles.statValue}>{percentile}%ile</Text>
              <Text style={styles.statLabel}>Percentile</Text>
            </View>
          )}
          {rank != null && (
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🏅</Text>
              <Text style={styles.statValue}>#{rank}</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
          )}
        </View>

        {/* What next */}
        <View style={styles.nextCard}>
          <Text style={styles.nextCardTitle}>What would you like to do next?</Text>

          {onViewSolutions && (
            <TouchableOpacity style={styles.nextRow} onPress={onViewSolutions} activeOpacity={0.7}>
              <View style={[styles.nextIconBox, { backgroundColor: '#F0EEFF' }]}>
                <Text style={{ fontSize: 18 }}>📖</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextLabel}>View Solutions</Text>
                <Text style={styles.nextSub}>See correct answers & explanations</Text>
              </View>
              <Text style={styles.nextChevron}>›</Text>
            </TouchableOpacity>
          )}

          {onViewAnalysis && (
            <TouchableOpacity style={styles.nextRow} onPress={onViewAnalysis} activeOpacity={0.7}>
              <View style={[styles.nextIconBox, { backgroundColor: '#FFF0E8' }]}>
                <Text style={{ fontSize: 18 }}>📈</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextLabel}>Detailed Analysis</Text>
                <Text style={styles.nextSub}>Chapter-wise breakdown & insights</Text>
              </View>
              <Text style={styles.nextChevron}>›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.nextRow} onPress={onBack} activeOpacity={0.7}>
            <View style={[styles.nextIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Text style={{ fontSize: 18 }}>📚</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextLabel}>Mock Library</Text>
              <Text style={styles.nextSub}>Browse all mock tests</Text>
            </View>
            <Text style={styles.nextChevron}>›</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
