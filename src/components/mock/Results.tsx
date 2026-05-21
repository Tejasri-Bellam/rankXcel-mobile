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
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function isAnswerCorrect(q: any, userAnswer: string[]): boolean {
  return (
    q.correct_answers?.length === userAnswer.length &&
    q.correct_answers?.every((a: string) => userAnswer.includes(a))
  );
}

export default function MockExamResults({
  mockId,
  mock,
  answers,
  timeTakenSeconds,
  onBack,
  onViewSolutions,
  onViewAnalysis,
}: Props) {
  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const allQuestions: any[] = (mock as any)?.sections?.flatMap((s: any) => s.questions) ?? [];

  useEffect(() => { loadResult(); }, []);

  const loadResult = async () => {
    try {
      setLoading(true);
      const res = await getMockTestResultService(mockId);
      console.log('MOCK RESULT API:', JSON.stringify(res, null, 2));
      setResult(res?.data ?? null);
    } catch (err) {
      console.log('MOCK RESULT ERROR:', err);
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

  // Compute local stats as fallback
  let localCorrect = 0, localWrong = 0, localAttempted = 0, localScore = 0;
  allQuestions.forEach((q: any) => {
    const ua = answers[q.id] ?? [];
    if (ua.length > 0) {
      localAttempted++;
      if (isAnswerCorrect(q, ua)) { localCorrect++; localScore += q.marks_correct ?? 4; }
      else                         { localWrong++;   localScore += q.marks_incorrect ?? -1; }
    }
  });

  const finalScore     = result?.score           ?? localScore;
  const finalCorrect   = result?.correct_count   ?? localCorrect;
  const finalWrong     = result?.wrong_count      ?? localWrong;
  const finalAttempted = result?.attempted_count  ?? localAttempted;
  const totalMarks     = result?.total_marks
    ?? allQuestions.reduce((s: number, q: any) => s + (q.marks_correct ?? 4), 0)
    ?? mock.max_score
    ?? mock.question_count
    ?? 0;
  const finalSkipped   = (result?.total_questions ?? allQuestions.length) - finalAttempted;
  const percentage     = result?.percentage != null
    ? Number(result.percentage).toFixed(1)
    : totalMarks > 0 ? ((finalScore / totalMarks) * 100).toFixed(1) : '0.0';
  const percentile     = result?.percentile ?? mock.percentile ?? null;
  const rank           = result?.rank ?? null;

  const dateLabel = result?.date ?? new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
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
              { label: `${finalCorrect} correct`,  color: '#22C55E' },
              { label: `${finalWrong} wrong`,       color: '#EF4444' },
              { label: `${finalSkipped} skipped`,   color: 'rgba(255,255,255,0.5)' },
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
            <Text style={styles.statValue}>{formatTime(timeTakenSeconds)}</Text>
            <Text style={styles.statLabel}>Time Taken</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✍️</Text>
            <Text style={styles.statValue}>{finalAttempted}</Text>
            <Text style={styles.statLabel}>Attempted</Text>
            <Text style={styles.statSub}>{finalSkipped} skipped</Text>
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