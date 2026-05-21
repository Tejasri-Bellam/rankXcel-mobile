// src/components/mock/MockDetailedAnalysis.tsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockAnalysisStyles as styles } from '../../styles/sidebar/mockExams/detailedAnalysis';
import { getMockTestResultService, MockTest } from '../../libs/services/mock-library';

interface Props {
  mockId: number | string;
  mock: MockTest;
  answers: Record<string, string[]>;
  onBack: () => void;
}

type AnalysisTab = 'subject' | 'chapter' | 'ai';

const SUBJECT_COLORS = ['#6C5CE7', '#F97316', '#22C55E', '#0EA5E9', '#EC4899', '#F59E0B'];

function isAnswerCorrect(q: any, userAnswer: string[]): boolean {
  return (
    q.correct_answers?.length === userAnswer.length &&
    q.correct_answers?.every((a: string) => userAnswer.includes(a))
  );
}

// Circular progress (SVG-like with View border trick)
function CircleProgress({ percentage, size = 72, color = '#6C5CE7', label }: {
  percentage: number;
  size?: number;
  color?: string;
  label?: string;
}) {
  const clipped = Math.min(100, Math.max(0, percentage));
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 6,
          borderColor: color + '30',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
          // Fake arc: overlay colored border on top portion
        }}
      >
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 6,
            borderColor: 'transparent',
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
      {!!label && (
        <Text style={{ fontSize: 11, color: '#9898B0', marginTop: 6, fontWeight: '600' }}>
          {label}
        </Text>
      )}
    </View>
  );
}

export default function MockDetailedAnalysis({ mockId, mock, answers, onBack }: Props) {
  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('subject');

  const allQuestions: any[] = useMemo(
    () => (mock as any)?.sections?.flatMap((s: any) => s.questions) ?? [],
    [mock]
  );

  useEffect(() => { loadResult(); }, []);

  const loadResult = async () => {
    try {
      setLoading(true);
      const res = await getMockTestResultService(mockId);
      setResult(res?.data ?? null);
    } catch (err) {
      console.log('MOCK ANALYSIS ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Per-subject stats ───────────────────────────────────────────────────
  const subjectStats = useMemo(() => {
    const sections: any[] = (mock as any)?.sections ?? [];
    return sections.map((section: any, idx: number) => {
      let sScore = 0, sCorrect = 0, sWrong = 0, sAttempted = 0;
      const sTotalMarks = (section.questions ?? []).reduce(
        (sum: number, q: any) => sum + (q.marks_correct ?? 4), 0
      );
      (section.questions ?? []).forEach((q: any) => {
        const ua = answers[q.id] ?? [];
        if (ua.length > 0) {
          sAttempted++;
          if (isAnswerCorrect(q, ua)) { sScore += q.marks_correct ?? 4; sCorrect++; }
          else                         { sScore += q.marks_incorrect ?? -1; sWrong++; }
        }
      });
      const sSkipped  = (section.questions ?? []).length - sAttempted;
      const sAccuracy = sAttempted > 0 ? Math.round((sCorrect / sAttempted) * 100) : 0;
      return {
        subject:    section.name,
        score:      sScore,
        totalMarks: sTotalMarks,
        accuracy:   sAccuracy,
        correct:    sCorrect,
        wrong:      sWrong,
        skipped:    sSkipped,
        total:      (section.questions ?? []).length,
        attempted:  sAttempted,
        color:      SUBJECT_COLORS[idx % SUBJECT_COLORS.length],
      };
    });
  }, [mock, answers]);

  // ── Per-chapter stats ───────────────────────────────────────────────────
  const chapterStats = useMemo(() => {
    const chapters: any[] = [];
    const sections: any[] = (mock as any)?.sections ?? [];
    sections.forEach((section: any, sIdx: number) => {
      const chapterMap: Record<string, any[]> = {};
      (section.questions ?? []).forEach((q: any) => {
        const key = q.chapter_name ?? q.topic_name ?? q.chapter ?? 'General';
        if (!chapterMap[key]) chapterMap[key] = [];
        chapterMap[key].push(q);
      });
      Object.entries(chapterMap).forEach(([chName, qs]) => {
        let cScore = 0, cCorrect = 0, cWrong = 0, cAttempted = 0;
        const cTotal = qs.reduce((s, q) => s + (q.marks_correct ?? 4), 0);
        qs.forEach((q) => {
          const ua = answers[q.id] ?? [];
          if (ua.length > 0) {
            cAttempted++;
            if (isAnswerCorrect(q, ua)) { cScore += q.marks_correct ?? 4; cCorrect++; }
            else                         { cScore += q.marks_incorrect ?? -1; cWrong++; }
          }
        });
        const cAccuracy = cAttempted > 0 ? Math.round((cCorrect / cAttempted) * 100) : 0;
        chapters.push({
          chapter:    chName,
          subject:    section.name,
          subjectColor: SUBJECT_COLORS[sIdx % SUBJECT_COLORS.length],
          score:      cScore,
          totalMarks: cTotal,
          correct:    cCorrect,
          wrong:      cWrong,
          accuracy:   cAccuracy,
          attempted:  cAttempted,
          total:      qs.length,
        });
      });
    });
    return chapters;
  }, [mock, answers]);

  // ── Overall stats ────────────────────────────────────────────────────────
  const overall = useMemo(() => {
    let correct = 0, wrong = 0, attempted = 0, score = 0;
    const totalMarks = allQuestions.reduce((s, q) => s + (q.marks_correct ?? 4), 0);
    allQuestions.forEach((q: any) => {
      const ua = answers[q.id] ?? [];
      if (ua.length > 0) {
        attempted++;
        if (isAnswerCorrect(q, ua)) { correct++; score += q.marks_correct ?? 4; }
        else                         { wrong++;   score += q.marks_incorrect ?? -1; }
      }
    });
    const skipped  = allQuestions.length - attempted;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const finalScore     = result?.score ?? score;
    const finalTotalMarks = result?.total_marks ?? totalMarks;
    const percentage = finalTotalMarks > 0
      ? Math.round((finalScore / finalTotalMarks) * 100)
      : 0;
    return { correct, wrong, attempted, skipped, accuracy, percentage, score: finalScore, totalMarks: finalTotalMarks };
  }, [allQuestions, answers, result]);

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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Results Overview</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Page title */}
        <Text style={styles.pageTitle}>Detailed Analysis</Text>
        {!!(mock as any)?.title && (
          <Text style={styles.pageSubtitle}>{(mock as any).title}</Text>
        )}

        {/* Overall legend */}
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

        {/* Tabs */}
        <View style={styles.tabRow}>
          {([
            { key: 'subject', label: 'Subject Analysis' },
            { key: 'chapter', label: 'Question Breakdown' },
            { key: 'ai',      label: 'AI Insights' },
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

        {/* ── Subject Analysis tab ────────────────────────────────────────── */}
        {activeTab === 'subject' && (
          <>
            <Text style={styles.sectionLabel}>Correct / Incorrect / Skipped</Text>

            {subjectStats.map((sp, idx) => (
              <View key={idx} style={styles.subjectCard}>
                {/* Circle + Subject name */}
                <View style={styles.subjectCardTop}>
                  <CircleProgress
                    percentage={sp.accuracy}
                    size={72}
                    color={sp.color}
                  />
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

                {/* Progress bar */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${sp.accuracy}%` as any, backgroundColor: sp.color },
                    ]}
                  />
                </View>

                {/* Mini stats */}
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

            {/* Score Breakdown by Subject table */}
            <Text style={styles.sectionLabel}>Score Breakdown by Subject</Text>
            <View style={styles.breakdownCard}>
              {subjectStats.map((sp, idx) => (
                <View key={idx} style={[styles.breakdownRow, idx > 0 && styles.breakdownRowBorder]}>
                  <View style={styles.breakdownLeft}>
                    <Text style={styles.breakdownSubject}>{sp.subject}</Text>
                    <View style={styles.breakdownTagRow}>
                      <Text style={[styles.breakdownTag, { color: '#22C55E' }]}>
                        +{sp.correct * 4} earned
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
              {/* Legend */}
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

        {/* ── Chapter Breakdown tab ────────────────────────────────────────── */}
        {activeTab === 'chapter' && (
          <>
            <Text style={styles.sectionLabel}>Chapter-wise Performance</Text>

            {/* Table header */}
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
                      {
                        backgroundColor: cp.accuracy >= 70
                          ? '#F0FDF4'
                          : cp.accuracy >= 40
                          ? '#FFFBEB'
                          : '#FEF2F2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.accuracyText,
                        {
                          color: cp.accuracy >= 70
                            ? '#22C55E'
                            : cp.accuracy >= 40
                            ? '#F59E0B'
                            : '#EF4444',
                        },
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

        {/* ── AI Insights tab ──────────────────────────────────────────────── */}
        {activeTab === 'ai' && (
          <>
            <Text style={styles.sectionLabel}>AI Performance Insights</Text>

            {/* Strength card */}
            {subjectStats.filter(s => s.accuracy >= 60).map((sp, idx) => (
              <View key={idx} style={[styles.insightCard, styles.insightStrength]}>
                <View style={styles.insightIconBox}>
                  <Text style={{ fontSize: 20 }}>💪</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightTitle}>Strong in {sp.subject}</Text>
                  <Text style={styles.insightDesc}>
                    {sp.accuracy}% accuracy with {sp.correct}/{sp.total} questions correct.
                    Keep it up!
                  </Text>
                </View>
              </View>
            ))}

            {/* Weakness card */}
            {subjectStats.filter(s => s.accuracy < 40 && s.attempted > 0).map((sp, idx) => (
              <View key={idx} style={[styles.insightCard, styles.insightWeakness]}>
                <View style={styles.insightIconBox}>
                  <Text style={{ fontSize: 20 }}>⚠️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightTitle}>Needs Work: {sp.subject}</Text>
                  <Text style={styles.insightDesc}>
                    Only {sp.accuracy}% accuracy. Focus on {sp.subject} concepts
                    and practice more problems.
                  </Text>
                </View>
              </View>
            ))}

            {/* Time insight */}
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

            {/* Skipped insight */}
            {overall.skipped > 5 && (
              <View style={[styles.insightCard, { borderLeftColor: '#F59E0B', borderLeftWidth: 3 }]}>
                <View style={styles.insightIconBox}>
                  <Text style={{ fontSize: 20 }}>💡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightTitle}>Tip: Reduce Skips</Text>
                  <Text style={styles.insightDesc}>
                    You skipped {overall.skipped} questions. Even educated guesses can improve your score.
                    Try to attempt every question next time.
                  </Text>
                </View>
              </View>
            )}

            {/* Best chapter */}
            {chapterStats.length > 0 && (() => {
              const best = [...chapterStats].sort((a, b) => b.accuracy - a.accuracy)[0];
              return best.accuracy > 0 ? (
                <View style={[styles.insightCard, { borderLeftColor: '#22C55E', borderLeftWidth: 3 }]}>
                  <View style={styles.insightIconBox}>
                    <Text style={{ fontSize: 20 }}>⭐</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insightTitle}>Best Chapter: {best.chapter}</Text>
                    <Text style={styles.insightDesc}>
                      {best.accuracy}% accuracy in {best.chapter} ({best.subject}).
                      This is your strongest topic!
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