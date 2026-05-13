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
import { examResultStyles as styles } from '../../styles/sidebar/assessments/exam';
import { getassessmentResultService } from '@/src/libs/services/assessments-attempts';

interface Props {
  attemptId: number;
  answers: Record<string, string[]>;
  timeTakenSeconds: number;
  onBack: () => void;
  onViewSolutions?: () => void;
  exam: any;
}

export default function ExamResults({
  attemptId,
  answers,
  timeTakenSeconds,
  onBack,
  onViewSolutions,
  exam,
}: Props) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResult();
  }, []);

  const loadResult = async () => {
    try {
      setLoading(true);
      const res = await getassessmentResultService(attemptId);
      console.log('RESULT API:', res);
      // res.data is the result object from the API
      setResult(res?.data ?? null);
    } catch (error) {
      console.log('RESULT ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={{ marginTop: 12, color: '#9898B0' }}>Loading results...</Text>
      </SafeAreaView>
    );
  }

  // ── Derive stats ──
  // Prefer API result fields; fall back to local calculation from exam data
  const allQuestions = exam?.sections?.flatMap((s: any) => s.questions) || [];

  let correct = 0, wrong = 0, attempted = 0, score = 0;
  allQuestions.forEach((q: any) => {
    const userAnswer = answers[q.id] || [];
    if (userAnswer.length > 0) {
      attempted++;
      const isCorrect =
        q.correct_answers?.length === userAnswer.length &&
        q.correct_answers?.every((a: string) => userAnswer.includes(a));
      if (isCorrect) { correct++; score += q.marks_correct; }
      else           { wrong++;   score += q.marks_incorrect; }
    }
  });

  // If API returned a result, use those values
  const finalScore    = result?.score           ?? score;
  const finalCorrect  = result?.correct_count   ?? correct;
  const finalWrong    = result?.wrong_count      ?? wrong;
  const finalAttempted = result?.attempted_count ?? attempted;
  const totalMarks    = result?.total_marks      ?? allQuestions.reduce((sum: number, q: any) => sum + (q.marks_correct ?? 0), 0);
  const finalSkipped  = allQuestions.length - finalAttempted;
  const percentage    = result?.percentage != null
    ? Number(result.percentage).toFixed(1)
    : totalMarks > 0 ? ((finalScore / totalMarks) * 100).toFixed(1) : '0.0';

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // Subject-wise performance
  const subjectPerf = (exam?.sections || []).map((section: any) => {
    let sScore = 0, sCorrect = 0;
    const sTotalMarks = section.questions.reduce((sum: number, q: any) => sum + (q.marks_correct ?? 0), 0);
    section.questions.forEach((q: any) => {
      const userAnswer = answers[q.id] || [];
      if (userAnswer.length > 0) {
        const isCorrect =
          q.correct_answers?.length === userAnswer.length &&
          q.correct_answers?.every((a: string) => userAnswer.includes(a));
        if (isCorrect) { sScore += q.marks_correct; sCorrect++; }
        else           { sScore += q.marks_incorrect; }
      }
    });
    const accuracy = section.questions.length > 0
      ? Math.round((sCorrect / section.questions.length) * 100)
      : 0;
    const spData = result?.subject_performance?.find((sp: any) => sp.subject === section.name);
    return {
      subject: section.name,
      score: sScore,
      totalMarks: sTotalMarks,
      accuracy,
      correct: sCorrect,
      color: spData?.color || '#6C5CE7',
    };
  });

  const dateLabel = result?.date ?? new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Assessments</Text>
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
            <View style={styles.scoreStatItem}>
              <View style={[styles.scoreStatDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.scoreStatText}>{finalCorrect} correct</Text>
            </View>
            <View style={styles.scoreStatItem}>
              <View style={[styles.scoreStatDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.scoreStatText}>{finalWrong} wrong</Text>
            </View>
            <View style={styles.scoreStatItem}>
              <View style={[styles.scoreStatDot, { backgroundColor: 'rgba(255,255,255,0.5)' }]} />
              <Text style={styles.scoreStatText}>{finalSkipped} skipped</Text>
            </View>
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
        </View>

        {/* Subject-wise Performance */}
        {subjectPerf.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Subject-wise Performance</Text>
            <View style={styles.subjectTable}>
              <View style={styles.subjectTableHeader}>
                <Text style={[styles.subjectCell, { flex: 2 }]}>SUBJECT</Text>
                <Text style={styles.subjectCell}>SCORE</Text>
                <Text style={styles.subjectCell}>ACCURACY</Text>
                <Text style={styles.subjectCell}>CORRECT</Text>
              </View>
              {subjectPerf.map((sp: any, idx: number) => (
                <View key={idx} style={styles.subjectRow}>
                  <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.subjectColorDot, { backgroundColor: sp.color }]} />
                    <Text style={styles.subjectName}>{sp.subject}</Text>
                  </View>
                  <Text style={[styles.subjectCell, { color: '#1A1A2E', fontWeight: '700' }]}>
                    {sp.score}/{sp.totalMarks}
                  </Text>
                  <Text style={[styles.subjectCell, { color: '#1A1A2E' }]}>{sp.accuracy}%</Text>
                  <Text style={[styles.subjectCell, { color: '#22C55E', fontWeight: '700' }]}>
                    {sp.correct}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Action buttons */}
        {onViewSolutions && (
          <View style={{ marginTop: 24, gap: 12 }}>
            <TouchableOpacity
              style={{ backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E8E8F0', paddingVertical: 14, borderRadius: 14, alignItems: 'center' }}
              onPress={onViewSolutions}
            >
              <Text style={{ color: '#1A1A2E', fontWeight: '700', fontSize: 15 }}>
                📖  View Solutions
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
