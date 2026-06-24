import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockAnalysisStyles as styles } from '@/src/styles/styles/mock/detailedanalysisstyles';
import {
  getMockTestDetailedAnalysisService,
  getMockTestResultService,
  MockTest,
} from '../../libs/services/mock-library';
import { getScoreColor, getScoreBgColor } from '@/src/styles/styles';
import { getSubjectColor } from '@/src/libs/constants';

interface Props {
  mockId: number | string;
  mock: MockTest;
  answers: Record<string, string[]>;
  onBack: () => void;
}

type AnalysisTab = 'subject' | 'chapter' | 'ai';

function CircleProgress({ percentage, size = 72, color = '#6C5CE7' }: {
  percentage: number;
  size?: number;
  color?: string;
}) {
  const clipped = Math.min(100, Math.max(0, percentage));
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: 6, borderColor: color + '30',
          justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff',
        }}
      >
        <View
          style={{
            position: 'absolute', width: size, height: size, borderRadius: size / 2,
            borderWidth: 6, borderColor: 'transparent',
            borderTopColor: color,
            borderRightColor: clipped > 25 ? color : 'transparent',
            borderBottomColor: clipped > 50 ? color : 'transparent',
            borderLeftColor: clipped > 75 ? color : 'transparent',
            transform: [{ rotate: '-90deg' }],
          }}
        />
        <Text style={{ fontSize: 14, fontWeight: '800', color: '#1A1A2E' }}>
          {clipped}%
        </Text>
      </View>
    </View>
  );
}

export default function MockDetailedAnalysis({ mockId, mock, onBack }: Props) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('subject');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [analysisRes, resultRes] = await Promise.allSettled([
        getMockTestDetailedAnalysisService(mockId),
        getMockTestResultService(mockId),
      ]);
      if (analysisRes.status === 'fulfilled') {
        console.log('MOCK ANALYSIS API:', JSON.stringify((analysisRes.value as any)?.data, null, 2));
        setAnalysis((analysisRes.value as any)?.data ?? null);
      }
      if (resultRes.status === 'fulfilled') {
        setResult((resultRes.value as any)?.data ?? null);
      }
    } catch (err) {
      console.log('MOCK ANALYSIS ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  const breakdownSource = analysis ?? result;

  const rawChapters: any[] = useMemo(() => {
    const cb = breakdownSource?.chapter_breakdown;
    if (Array.isArray(cb)) return cb;
    if (cb && typeof cb === 'object') return Object.values(cb);
    return [];
  }, [breakdownSource]);

  const chapterStats = useMemo(() => {
    return rawChapters.map((ch: any, idx: number) => {
      const correct = Number(ch?.correct ?? 0);
      const wrong = Number(ch?.wrong ?? 0);
      const skipped = Number(ch?.unattempted ?? ch?.skipped ?? 0);
      const attempted = Number(ch?.attempted ?? correct + wrong);
      const total = attempted + skipped;
      const accuracy = ch?.accuracy != null
        ? Number(ch.accuracy)
        : attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
      const subject = ch?.subject_name ?? ch?.subject ?? 'General';
      return {
        chapter: ch?.chapter_name ?? ch?.chapter ?? 'Unknown',
        subject,
        subjectColor: getSubjectColor(subject, idx),
        score: Number(ch?.earned_marks ?? ch?.score ?? 0),
        totalMarks: Number(ch?.max_marks ?? ch?.max_score ?? ch?.total_marks ?? 0),
        correct, wrong, skipped, attempted, total, accuracy,
      };
    });
  }, [rawChapters]);

  // Prefer the API's pre-aggregated subject_summary when available.
  const subjectStats = useMemo(() => {
    const summary = analysis?.subject_summary;
    if (Array.isArray(summary) && summary.length > 0) {
      return summary.map((s: any, idx: number) => {
        const correct = Number(s?.correct ?? 0);
        const wrong = Number(s?.wrong ?? 0);
        const skipped = Number(s?.unattempted ?? s?.skipped ?? 0);
        const attempted = correct + wrong;
        return {
          subject: s?.subject_name ?? 'General',
          score: Number(s?.earned_marks ?? s?.score ?? 0),
          totalMarks: Number(s?.max_marks ?? s?.max_score ?? 0),
          correct, wrong, skipped, attempted,
          total: attempted + skipped,
          accuracy: s?.accuracy != null
            ? Number(s.accuracy)
            : attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
          color: getSubjectColor(s?.subject_name ?? 'General', idx),
        };
      });
    }

    // Fallback: aggregate from chapterStats.
    const map: Record<string, any> = {};
    chapterStats.forEach((ch) => {
      if (!map[ch.subject]) {
        map[ch.subject] = {
          subject: ch.subject,
          score: 0, totalMarks: 0,
          correct: 0, wrong: 0, skipped: 0, attempted: 0, total: 0,
          color: getSubjectColor(ch.subject, Object.keys(map).length),
        };
      }
      const s = map[ch.subject];
      s.score += ch.score;
      s.totalMarks += ch.totalMarks;
      s.correct += ch.correct;
      s.wrong += ch.wrong;
      s.skipped += ch.skipped;
      s.attempted += ch.attempted;
      s.total += ch.total;
    });
    return Object.values(map).map((s: any) => ({
      ...s,
      accuracy: s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0,
    }));
  }, [analysis, chapterStats]);

  const overall = useMemo(() => {
    const correct = chapterStats.reduce((a, c) => a + c.correct, 0);
    const wrong = chapterStats.reduce((a, c) => a + c.wrong, 0);
    const skipped = chapterStats.reduce((a, c) => a + c.skipped, 0);
    const attempted = correct + wrong;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const score = Number(breakdownSource?.total_score ?? breakdownSource?.score ?? 0);
    const totalMarks = Number(
      breakdownSource?.max_score ??
      breakdownSource?.total_marks ??
      chapterStats.reduce((a, c) => a + c.totalMarks, 0)
    );
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    return { correct, wrong, skipped, attempted, accuracy, score, totalMarks, percentage };
  }, [chapterStats, breakdownSource]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={{ marginTop: 12, color: '#9898B0' }}>Loading analysis…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Results Overview</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <Text style={styles.pageTitle}>Detailed Analysis</Text>
        {!!(mock as any)?.title && (
          <Text style={styles.pageSubtitle}>{(mock as any).title}</Text>
        )}

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendText}>✓ {overall.correct}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>✗ {overall.wrong}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#9898B0' }]} />
            <Text style={styles.legendText}>— {overall.skipped}</Text>
          </View>
        </View>

        <View style={styles.tabRow}>
          {([
            { key: 'subject', label: 'Subject Analysis' },
            { key: 'chapter', label: 'Question Breakdown' },
            { key: 'ai', label: 'AI Insights' },
          ] as { key: AnalysisTab; label: string }[]).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'subject' && (
          <>
            <Text style={styles.sectionLabel}>Correct / Incorrect / Skipped</Text>

            {subjectStats.length === 0 && (
              <Text style={{ color: '#9898B0', textAlign: 'center', paddingVertical: 24 }}>
                No subject breakdown available.
              </Text>
            )}

            {subjectStats.map((sp: any, idx: number) => (
              <View key={idx} style={styles.subjectCard}>
                <View style={styles.subjectCardTop}>
                  <CircleProgress percentage={sp.accuracy} size={72} color={sp.color} />
                  <View style={styles.subjectCardInfo}>
                    <Text style={styles.subjectCardName}>{sp.subject}</Text>
                    <View style={styles.subjectLegendRow}>
                      <View style={styles.subjectLegendItem}>
                        <View style={[styles.subjectLegendDot, { backgroundColor: '#22C55E' }]} />
                        <Text style={styles.subjectLegendText}>✓ {sp.correct}</Text>
                      </View>
                      <View style={styles.subjectLegendItem}>
                        <View style={[styles.subjectLegendDot, { backgroundColor: '#EF4444' }]} />
                        <Text style={styles.subjectLegendText}>✗ {sp.wrong}</Text>
                      </View>
                      <View style={styles.subjectLegendItem}>
                        <View style={[styles.subjectLegendDot, { backgroundColor: '#9898B0' }]} />
                        <Text style={styles.subjectLegendText}>— {sp.skipped}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${sp.accuracy}%` as any, backgroundColor: sp.color },
                    ]}
                  />
                </View>

                <View style={styles.subjectMiniStats}>
                  <View style={styles.subjectMiniStat}>
                    <Text style={[styles.subjectMiniVal, { color: sp.color }]}>
                      {sp.score}/{sp.totalMarks}
                    </Text>
                    <Text style={styles.subjectMiniLabel}>Score</Text>
                  </View>
                  <View style={styles.subjectMiniStat}>
                    <Text style={styles.subjectMiniVal}>{sp.accuracy}%</Text>
                    <Text style={styles.subjectMiniLabel}>Accuracy</Text>
                  </View>
                  <View style={styles.subjectMiniStat}>
                    <Text style={styles.subjectMiniVal}>{sp.attempted}/{sp.total}</Text>
                    <Text style={styles.subjectMiniLabel}>Attempted</Text>
                  </View>
                </View>
              </View>
            ))}

            <Text style={styles.sectionLabel}>Score Breakdown by Subject</Text>
            <View style={styles.breakdownCard}>
              {subjectStats.map((sp: any, idx: number) => (
                <View key={idx} style={[styles.breakdownRow, idx > 0 && styles.breakdownRowBorder]}>
                  <View style={styles.breakdownLeft}>
                    <Text style={styles.breakdownSubject}>{sp.subject}</Text>
                    <View style={styles.breakdownTagRow}>
                      <Text style={[styles.breakdownTag, { color: '#22C55E' }]}>
                        +{sp.correct} correct
                      </Text>
                      <Text style={[styles.breakdownTag, { color: '#EF4444' }]}>
                        {sp.wrong} incorrect
                      </Text>
                      <Text style={[styles.breakdownTag, { color: '#9898B0' }]}>
                        {sp.skipped} skipped
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.breakdownScore, { color: sp.color }]}>
                    {sp.score}/{sp.totalMarks}
                    <Text style={styles.breakdownMark}> marks</Text>
                  </Text>
                </View>
              ))}
              <View style={styles.breakdownLegend}>
                <View style={styles.breakdownLegendItem}>
                  <View style={[styles.breakdownLegendDot, { backgroundColor: '#22C55E' }]} />
                  <Text style={styles.breakdownLegendText}>Correct</Text>
                </View>
                <View style={styles.breakdownLegendItem}>
                  <View style={[styles.breakdownLegendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.breakdownLegendText}>Incorrect</Text>
                </View>
                <View style={styles.breakdownLegendItem}>
                  <View style={[styles.breakdownLegendDot, { backgroundColor: '#9898B0' }]} />
                  <Text style={styles.breakdownLegendText}>Skipped</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {activeTab === 'chapter' && (
          <>
            <Text style={styles.sectionLabel}>Chapter-wise Performance</Text>

            <View style={styles.chapterTable}>
              <View style={styles.chapterTableHeader}>
                <Text style={[styles.chapterHeaderCell, { flex: 2 }]}>CHAPTER</Text>
                <Text style={styles.chapterHeaderCell}>SUBJECT</Text>
                <Text style={styles.chapterHeaderCell}>ATTEMPTED</Text>
                <Text style={styles.chapterHeaderCell}>CORRECT</Text>
                <Text style={styles.chapterHeaderCell}>ACCURACY</Text>
              </View>
              {chapterStats.map((cp, idx) => (
                <View key={idx} style={styles.chapterTableRow}>
                  <Text style={[styles.chapterCell, styles.chapterNameCell, { flex: 2 }]} numberOfLines={2}>
                    {cp.chapter}
                  </Text>
                  <View style={[styles.chapterSubjectTag, { backgroundColor: cp.subjectColor + '20' }]}>
                    <Text style={[styles.chapterSubjectText, { color: cp.subjectColor }]}>
                      {cp.subject.length > 4 ? cp.subject.substring(0, 4) : cp.subject}
                    </Text>
                  </View>
                  <Text style={styles.chapterCell}>{cp.attempted}</Text>
                  <Text style={[styles.chapterCell, { color: '#22C55E', fontWeight: '700' }]}>
                    {cp.correct}
                  </Text>
                  <View
                    style={[
                      styles.accuracyBadge,
                      { backgroundColor: getScoreBgColor(cp.accuracy) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.accuracyText,
                        { color: getScoreColor(cp.accuracy) },
                      ]}
                    >
                      {cp.accuracy}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {chapterStats.length === 0 && (
              <View style={{ alignItems: 'center', paddingTop: 48 }}>
                <Text style={{ fontSize: 32, marginBottom: 12 }}>📊</Text>
                <Text style={{ color: '#9898B0', fontSize: 14 }}>
                  Chapter data not available for this mock.
                </Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'ai' && (
          <>
            <Text style={styles.sectionLabel}>AI Performance Insights</Text>

            {subjectStats.filter((s: any) => s.accuracy >= 60).map((sp: any, idx: number) => (
              <View key={`s-${idx}`} style={[styles.insightCard, styles.insightStrength]}>
                <View style={styles.insightIconBox}>
                  <Text style={{ fontSize: 20 }}>💪</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightTitle}>Strong in {sp.subject}</Text>
                  <Text style={styles.insightDesc}>
                    {sp.accuracy}% accuracy with {sp.correct}/{sp.total} questions correct. Keep it up!
                  </Text>
                </View>
              </View>
            ))}

            {subjectStats.filter((s: any) => s.accuracy < 40 && s.attempted > 0).map((sp: any, idx: number) => (
              <View key={`w-${idx}`} style={[styles.insightCard, styles.insightWeakness]}>
                <View style={styles.insightIconBox}>
                  <Text style={{ fontSize: 20 }}>⚠️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightTitle}>Needs Work: {sp.subject}</Text>
                  <Text style={styles.insightDesc}>
                    Only {sp.accuracy}% accuracy. Focus on {sp.subject} concepts and practice more.
                  </Text>
                </View>
              </View>
            ))}

            <View style={[styles.insightCard, { borderLeftColor: '#6C5CE7', borderLeftWidth: 3 }]}>
              <View style={styles.insightIconBox}>
                <Text style={{ fontSize: 20 }}>🎯</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.insightTitle}>Overall Performance</Text>
                <Text style={styles.insightDesc}>
                  You scored {overall.score}/{overall.totalMarks} ({overall.percentage}%) with {overall.accuracy}% accuracy.
                  {overall.skipped > 0 ? ` You skipped ${overall.skipped} questions.` : ' Great job attempting all questions!'}
                </Text>
              </View>
            </View>

            {overall.skipped > 5 && (
              <View style={[styles.insightCard, { borderLeftColor: '#F59E0B', borderLeftWidth: 3 }]}>
                <View style={styles.insightIconBox}>
                  <Text style={{ fontSize: 20 }}>💡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightTitle}>Tip: Reduce Skips</Text>
                  <Text style={styles.insightDesc}>
                    You skipped {overall.skipped} questions. Even educated guesses can improve your score.
                  </Text>
                </View>
              </View>
            )}

            {chapterStats.length > 0 && (() => {
              const best = [...chapterStats].sort((a, b) => b.accuracy - a.accuracy)[0];
              return best && best.accuracy > 0 ? (
                <View style={[styles.insightCard, { borderLeftColor: '#22C55E', borderLeftWidth: 3 }]}>
                  <View style={styles.insightIconBox}>
                    <Text style={{ fontSize: 20 }}>⭐</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insightTitle}>Best Chapter: {best.chapter}</Text>
                    <Text style={styles.insightDesc}>
                      {best.accuracy}% accuracy in {best.chapter} ({best.subject}). This is your strongest topic!
                    </Text>
                  </View>
                </View>
              ) : null;
            })()}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
