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
import {
  mockResultStyles as styles,
  GREEN, RED, GRAY, ACCENT,
} from '../../styles/sidebar/mockExams/results';
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

interface SubjectStat {
  subject: string;
  score: number;
  totalMarks: number;
  accuracy: number;
  correct: number;
  wrong: number;
  skipped: number;
  color: string;
}

interface ChapterStat {
  chapter: string;
  subject: string;
  score: number;
  totalMarks: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
}

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

const SUBJECT_COLORS: Record<string, string> = {
  Physics: '#FF6B6B',
  Chemistry: '#4ECDC4',
  Mathematics: '#6C5CE7',
  Mathemetics: '#6C5CE7',
  Biology: '#22C55E',
  General: '#9898B0',
};

function getSubjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] || '#6C5CE7';
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
        <Text style={{ marginTop: 12, color: GRAY }}>Loading results…</Text>
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
        <Text style={{ fontSize: 14, color: GRAY, textAlign: 'center', marginBottom: 24 }}>
          Your mock has been submitted. Please try again in a moment.
        </Text>
        <TouchableOpacity
          onPress={loadResult}
          style={{ backgroundColor: '#6C5CE7', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 12 }}>
          <Text style={{ color: GRAY, fontSize: 14 }}>← Back to Mock Library</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Extract directly from API result ──
  const mockTitle: string = result?.mock_test?.title ?? mock?.title ?? 'Mock Test';
  const finalScore: number = Number(result?.total_score ?? 0);
  const totalMarks: number = Number(result?.max_score ?? 0);
  const timeTaken: number  = Number(result?.time_taken_seconds ?? timeTakenSeconds ?? 0);

  const chapterBreakdown: Record<string, any> = result?.chapter_breakdown ?? {};
  const chapterEntries = Object.values(chapterBreakdown);

  let finalCorrect = 0;
  let finalWrong = 0;
  let finalSkipped = 0;

  chapterEntries.forEach((ch: any) => {
    finalCorrect += Number(ch?.correct ?? 0);
    finalWrong   += Number(ch?.wrong ?? 0);
    finalSkipped += Number(ch?.unattempted ?? 0);
  });

  const finalAttempted = finalCorrect + finalWrong;

  const percentage: string =
    result?.percentage != null
      ? Number(result.percentage).toFixed(1)
      : totalMarks > 0
        ? ((finalScore / totalMarks) * 100).toFixed(1)
        : '0.0';

  const dateLabel: string = result?.submitted_at
    ? new Date(result.submitted_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB');

  // Subject-wise aggregation
  const subjectMap: Record<string, SubjectStat> = {};
  chapterEntries.forEach((ch: any) => {
    const subject: string = ch?.subject_name ?? 'General';
    if (!subjectMap[subject]) {
      subjectMap[subject] = {
        subject,
        score: 0,
        totalMarks: 0,
        accuracy: 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
        color: getSubjectColor(subject),
      };
    }
    subjectMap[subject].score      += Number(ch?.score ?? 0);
    subjectMap[subject].totalMarks += Number(ch?.max_score ?? 0);
    subjectMap[subject].correct    += Number(ch?.correct ?? 0);
    subjectMap[subject].wrong      += Number(ch?.wrong ?? 0);
    subjectMap[subject].skipped    += Number(ch?.unattempted ?? 0);
  });
  const subjectPerf: SubjectStat[] = Object.values(subjectMap).map((s) => ({
    ...s,
    accuracy:
      s.correct + s.wrong > 0
        ? Math.round((s.correct / (s.correct + s.wrong)) * 100)
        : 0,
  }));

  // Chapter-wise rows
  const chapterPerf: ChapterStat[] = chapterEntries.map((ch: any) => ({
    chapter: ch?.chapter_name ?? 'Unknown',
    subject: ch?.subject_name ?? 'General',
    score: Number(ch?.score ?? 0),
    totalMarks: Number(ch?.max_score ?? 0),
    correct: Number(ch?.correct ?? 0),
    wrong: Number(ch?.wrong ?? 0),
    skipped: Number(ch?.unattempted ?? 0),
    accuracy:
      Number(ch?.correct ?? 0) + Number(ch?.wrong ?? 0) > 0
        ? Math.round(
            (Number(ch.correct) / (Number(ch.correct) + Number(ch.wrong))) * 100
          )
        : 0,
  }));

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
              <Text style={styles.scoreTitle}>{mockTitle}</Text>
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
              { label: `${finalCorrect} correct`, color: GREEN },
              { label: `${finalWrong} wrong`,     color: RED },
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
            <Text style={styles.statSub}>{finalSkipped} skipped</Text>
          </View>
        </View>

        {/* Subject-wise Performance */}
        {subjectPerf.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Subject-wise Performance</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.subjectColSubject}>Subject</Text>
                {['Score', 'Accuracy', 'Correct', 'Wrong', 'Skipped'].map((h) => (
                  <Text key={h} style={styles.subjectColData}>{h}</Text>
                ))}
              </View>
              {subjectPerf.map((sp, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <View style={styles.subjectNameCell}>
                    <View style={[styles.subjectColorDot, { backgroundColor: sp.color }]} />
                    <Text style={styles.subjectNameText} numberOfLines={1}>{sp.subject}</Text>
                  </View>
                  <Text style={[styles.subjectDataCell, { color: ACCENT }]}>
                    {sp.score}/{sp.totalMarks}
                  </Text>
                  <Text style={[styles.subjectDataCell, { color: '#1A1A2E' }]}>
                    {sp.accuracy}%
                  </Text>
                  <Text style={[styles.subjectDataCell, { color: GREEN }]}>{sp.correct}</Text>
                  <Text style={[styles.subjectDataCell, { color: RED }]}>{sp.wrong}</Text>
                  <Text style={[styles.subjectDataCell, { color: GRAY }]}>{sp.skipped}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Chapter-wise Breakdown */}
        {chapterPerf.length > 0 && (
          <>
            <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Chapter-wise Breakdown</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.chapterColChapter}>Chapter</Text>
                {['Subject', 'Score', 'Correct', 'Wrong', 'Accuracy'].map((h) => (
                  <Text key={h} style={styles.chapterColData}>{h}</Text>
                ))}
              </View>
              {chapterPerf.map((cp, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.chapterNameText} numberOfLines={2}>{cp.chapter}</Text>
                  <Text style={[styles.chapterDataCell, { color: GRAY }]}>{cp.subject}</Text>
                  <Text style={[styles.chapterDataCell, { color: ACCENT }]}>
                    {cp.score}/{cp.totalMarks}
                  </Text>
                  <Text style={[styles.chapterDataCell, { color: GREEN }]}>{cp.correct}</Text>
                  <Text style={[styles.chapterDataCell, { color: RED }]}>{cp.wrong}</Text>
                  <Text style={[styles.chapterDataCell, { color: '#1A1A2E' }]}>
                    {cp.accuracy}%
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

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
 