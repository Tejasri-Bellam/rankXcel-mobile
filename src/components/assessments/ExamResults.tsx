import { useEffect, useState } from 'react';
import React from 'react';
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
  examResultStyles as styles,
  GREEN, RED, GRAY, ACCENT,
} from '../../styles/sidebar/assessments/results';
import { getassessmentResultService } from '@/src/libs/services/assessments-attempts';

// Types
interface Props {
  attemptId: number;
  answers: Record<string, string[]>;
  timeTakenSeconds: number;
  onBack: () => void;
  onViewSolutions?: () => void;
  exam: any;
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
  accuracy: number;
}

// Helpers
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

// Component
export default function ExamResults({
  attemptId,
  answers,
  timeTakenSeconds,
  onBack,
  onViewSolutions,
  exam,
}: Props) {
  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const allQuestions: any[] = exam?.sections?.flatMap((s: any) => s.questions) ?? [];

  useEffect(() => { loadResult(); }, []);

  const loadResult = async () => {
    try {
      setLoading(true);
      const res = await getassessmentResultService(attemptId);
      console.log('RESULT API:', JSON.stringify(res, null, 2));
      setResult(res?.data ?? null);
    } catch (err) {
      console.log('RESULT ERROR:', JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={{ marginTop: 12, color: GRAY }}>Loading results…</Text>
      </SafeAreaView>
    );
  }

  if (!result && allQuestions.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>📊</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 }}>
          Results Loading…
        </Text>
        <Text style={{ fontSize: 14, color: GRAY, textAlign: 'center', marginBottom: 24 }}>
          Your exam has been submitted. Results may take a moment to process.
        </Text>
        <TouchableOpacity
          onPress={loadResult}
          style={{ backgroundColor: '#6C5CE7', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 12 }}>
          <Text style={{ color: GRAY, fontSize: 14 }}>← Back to Assessments</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  let localCorrect = 0, localWrong = 0, localAttempted = 0, localScore = 0;
  allQuestions.forEach((q: any) => {
    const ua = answers[q.id] ?? [];
    if (ua.length > 0) {
      localAttempted++;
      if (isAnswerCorrect(q, ua)) { localCorrect++; localScore += q.marks_correct ?? 0; }
      else                         { localWrong++;   localScore += q.marks_incorrect ?? 0; }
    }
  });

  const finalScore     = result?.score           ?? localScore;
  const finalCorrect   = result?.correct_count   ?? localCorrect;
  const finalWrong     = result?.wrong_count      ?? localWrong;
  const finalAttempted = result?.attempted_count  ?? localAttempted;
  const totalMarks     = result?.total_marks
    ?? allQuestions.reduce((s: number, q: any) => s + (q.marks_correct ?? 0), 0);
  const finalSkipped   = allQuestions.length - finalAttempted;
  const percentage     = result?.percentage != null
    ? Number(result.percentage).toFixed(1)
    : totalMarks > 0 ? ((finalScore / totalMarks) * 100).toFixed(1) : '0.0';

  const dateLabel = result?.date ?? new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // Subject-wise stats
  const subjectPerf: SubjectStat[] = (exam?.sections ?? []).map((section: any) => {
    let sScore = 0, sCorrect = 0, sWrong = 0, sAttempted = 0;
    const sTotalMarks = (section.questions ?? []).reduce(
      (sum: number, q: any) => sum + (q.marks_correct ?? 0), 0
    );
    (section.questions ?? []).forEach((q: any) => {
      const ua = answers[q.id] ?? [];
      if (ua.length > 0) {
        sAttempted++;
        if (isAnswerCorrect(q, ua)) { sScore += q.marks_correct ?? 0; sCorrect++; }
        else                         { sScore += q.marks_incorrect ?? 0; sWrong++; }
      }
    });
    const sSkipped  = (section.questions ?? []).length - sAttempted;
    const sAccuracy = sAttempted > 0 ? Math.round((sCorrect / sAttempted) * 100) : 0;
    const spData    = result?.subject_performance?.find((sp: any) => sp.subject === section.name);
    return {
      subject:    section.name,
      score:      sScore,
      totalMarks: sTotalMarks,
      accuracy:   sAccuracy,
      correct:    sCorrect,
      wrong:      sWrong,
      skipped:    sSkipped,
      color:      spData?.color ?? '#6C5CE7',
    };
  });

  // Chapter-wise stats
  const chapterPerf: ChapterStat[] = [];
  (exam?.sections ?? []).forEach((section: any) => {
    const chapterMap: Record<string, any[]> = {};
    (section.questions ?? []).forEach((q: any) => {
      const key = q.chapter_name ?? q.topic_name ?? q.chapter ?? 'General';
      if (!chapterMap[key]) chapterMap[key] = [];
      chapterMap[key].push(q);
    });
    Object.entries(chapterMap).forEach(([chName, qs]) => {
      let cScore = 0, cCorrect = 0, cWrong = 0, cAttempted = 0;
      const cTotal = qs.reduce((s, q) => s + (q.marks_correct ?? 0), 0);
      qs.forEach((q) => {
        const ua = answers[q.id] ?? [];
        if (ua.length > 0) {
          cAttempted++;
          if (isAnswerCorrect(q, ua)) { cScore += q.marks_correct ?? 0; cCorrect++; }
          else                         { cScore += q.marks_incorrect ?? 0; cWrong++; }
        }
      });
      const cAccuracy = cAttempted > 0 ? Math.round((cCorrect / cAttempted) * 100) : 0;
      chapterPerf.push({
        chapter:    chName,
        subject:    section.name,
        score:      cScore,
        totalMarks: cTotal,
        correct:    cCorrect,
        wrong:      cWrong,
        accuracy:   cAccuracy,
      });
    });
  });


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Assessments</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Score Card ── */}
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
              { label: `${finalCorrect} correct`,  color: GREEN },
              { label: `${finalWrong} wrong`,       color: RED },
              { label: `${finalSkipped} skipped`,   color: 'rgba(255,255,255,0.5)' },
            ].map(({ label, color }) => (
              <View key={label} style={styles.scoreStatItem}>
                <View style={[styles.scoreStatDot, { backgroundColor: color }]} />
                <Text style={styles.scoreStatText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Stats Grid ── */}
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
        </View>

        {/* TABLE 1 — Subject-wise Performance */}
        {subjectPerf.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Subject-wise Performance</Text>
            <View style={styles.table}>
              {/* Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={styles.subjectColSubject}>Subject</Text>
                {['Score', 'Accuracy', 'Correct', 'Wrong', 'Skipped'].map((h) => (
                  <Text key={h} style={styles.subjectColData}>{h}</Text>
                ))}
              </View>
              {/* Rows */}
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
                  <Text style={[styles.subjectDataCell, { color: GREEN }]}>
                    {sp.correct}
                  </Text>
                  <Text style={[styles.subjectDataCell, { color: RED }]}>
                    {sp.wrong}
                  </Text>
                  <Text style={[styles.subjectDataCell, { color: GRAY }]}>
                    {sp.skipped}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* TABLE 2 — Chapter-wise Breakdown */}
        {chapterPerf.length > 0 && (
          <>
            <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Chapter-wise Breakdown</Text>
            <View style={styles.table}>
              {/* Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={styles.chapterColChapter}>Chapter</Text>
                {['Subject', 'Score', 'Correct', 'Wrong', 'Accuracy'].map((h) => (
                  <Text key={h} style={styles.chapterColData}>{h}</Text>
                ))}
              </View>
              {/* Rows */}
              {chapterPerf.map((cp, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.chapterNameText} numberOfLines={2}>{cp.chapter}</Text>
                  <Text style={[styles.chapterDataCell, { color: GRAY }]}>{cp.subject}</Text>
                  <Text style={[styles.chapterDataCell, { color: ACCENT }]}>
                    {cp.score}/{cp.totalMarks}
                  </Text>
                  <Text style={[styles.chapterDataCell, { color: GREEN }]}>{cp.correct}</Text>
                  <Text style={[styles.chapterDataCell, { color: RED }]}>{cp.wrong}</Text>
                  <Text style={[styles.chapterDataCell, { color: '#1A1A2E' }]}>{cp.accuracy}%</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── What would you like to do next? ── */}
        <View style={styles.nextCard}>
          <Text style={styles.nextCardTitle}>What would you like to do next?</Text>

          {/* View Solutions */}
          {onViewSolutions && (
            <TouchableOpacity
              style={styles.nextRow}
              onPress={() => {
                try { onViewSolutions(); }
                catch (e) { console.log('onViewSolutions error:', e); }
              }}
              activeOpacity={0.7}
            >
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

          {/* Detailed Analysis (placeholder) */}
          <TouchableOpacity style={styles.nextRow} activeOpacity={0.7}>
            <View style={[styles.nextIconBox, { backgroundColor: '#FFF0E8' }]}>
              <Text style={{ fontSize: 18 }}>📈</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextLabel}>Detailed Analysis</Text>
              <Text style={styles.nextSub}>Chapter-wise breakdown & AI insights</Text>
            </View>
            <Text style={styles.nextChevron}>›</Text>
          </TouchableOpacity>

          {/* Assessments */}
          <TouchableOpacity style={styles.nextRow} onPress={onBack} activeOpacity={0.7}>
            <View style={[styles.nextIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Text style={{ fontSize: 18 }}>📝</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextLabel}>Assessments</Text>
              <Text style={styles.nextSub}>View all assessments</Text>
            </View>
            <Text style={styles.nextChevron}>›</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}