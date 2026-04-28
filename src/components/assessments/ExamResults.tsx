import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { examResultStyles as styles } from '../../styles/sidebar/assessments/exam';
import examData from '../json/assessmentExam';

interface Props {
  answers: Record<string, string[]>;
  timeTakenSeconds: number;
  onBack: () => void;
}

export default function ExamResults({ answers, timeTakenSeconds, onBack }: Props) {
  const { exam , result } : any = examData;

  // Calculate actual score from user answers
  const allQuestions = exam.sections.flatMap((s : any) => s.questions);
  let correct = 0;
  let wrong = 0;
  let attempted = 0;
  let score = 0;

  allQuestions.forEach((q : any) => {
    const userAnswer = answers[q.id] || [];
    if (userAnswer.length > 0) {
      attempted++;
      const isCorrect =
        q.correct_answers.length === userAnswer.length &&
        q.correct_answers.every((a : string) => userAnswer.includes(a));
      if (isCorrect) {
        correct++;
        score += q.marks_correct;
      } else {
        wrong++;
        score += q.marks_incorrect;
      }
    }
  });

  const skipped = allQuestions.length - attempted;
  const totalMarks = allQuestions.reduce((sum : number , q : any ) => sum + q.marks_correct, 0);
  const percentage = ((score / totalMarks) * 100).toFixed(2);

  const formatTimeTaken = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // Subject-wise performance
  const subjectPerf = exam.sections.map((section : any) => {
    let sScore = 0;
    let sCorrect = 0;
    let sTotalMarks = section.questions.reduce((sum : number , q : any ) => sum + q.marks_correct, 0);

    section.questions.forEach((q : any) => {
      const userAnswer = answers[q.id] || [];
      if (userAnswer.length > 0) {
        const isCorrect =
          q.correct_answers.length === userAnswer.length &&
          q.correct_answers.every((a : string) => userAnswer.includes(a));
        if (isCorrect) {
          sScore += q.marks_correct;
          sCorrect++;
        } else {
          sScore += q.marks_incorrect;
        }
      }
    });

    const accuracy =
      attempted > 0 ? Math.round((sCorrect / section.questions.length) * 100) : 0;

    return {
      subject: section.name,
      score: `${sScore < 0 ? sScore : sScore}/${sTotalMarks}`,
      accuracy: `${accuracy}%`,
      color: result.subject_performance.find((sp : any) => sp.subject === section.name)?.color || '#6C5CE7',
    };
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Score card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreCardTop}>
            <View>
              <Text style={styles.scoreDate}>{result.date}</Text>
              <Text style={styles.scoreValue}>
                {score < 0 ? score : score}
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
              <Text style={styles.scoreStatText}>{correct} correct</Text>
            </View>
            <View style={styles.scoreStatItem}>
              <View style={[styles.scoreStatDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.scoreStatText}>{wrong} wrong</Text>
            </View>
            <View style={styles.scoreStatItem}>
              <View style={[styles.scoreStatDot, { backgroundColor: '#9898B0' }]} />
              <Text style={styles.scoreStatText}>{skipped} skipped</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📈</Text>
            <Text style={styles.statValue}>{percentage}%</Text>
            <Text style={styles.statLabel}>Percentage</Text>
            <Text style={styles.statSub}>{score} / {totalMarks}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>
              {attempted > 0 ? Math.round((correct / attempted) * 100) : 0}%
            </Text>
            <Text style={styles.statLabel}>Accuracy</Text>
            <Text style={styles.statSub}>{correct}/{attempted} correct</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱</Text>
            <Text style={styles.statValue}>{formatTimeTaken(timeTakenSeconds)}</Text>
            <Text style={styles.statLabel}>Time Taken</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✍</Text>
            <Text style={styles.statValue}>{attempted}</Text>
            <Text style={styles.statLabel}>Attempted</Text>
            <Text style={styles.statSub}>{allQuestions.length} questions</Text>
          </View>
        </View>

        {/* Subject-wise Performance */}
        <Text style={styles.sectionHeading}>Subject-wise Performance</Text>

        <View style={styles.subjectTable}>
          <View style={styles.subjectTableHeader}>
            <Text style={[styles.subjectCell, { flex: 2 }]}>SUBJECT</Text>
            <Text style={styles.subjectCell}>SCORE</Text>
            <Text style={styles.subjectCell}>ACCURACY</Text>
          </View>

          {subjectPerf.map((sp : any, idx : number) => (
            <View key={idx} style={styles.subjectRow}>
              <View style={[styles.subjectCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <View style={[styles.subjectColorDot, { backgroundColor: sp.color }]} />
                <Text style={styles.subjectName}>{sp.subject}</Text>
              </View>
              <Text style={styles.subjectCell}>{sp.score}</Text>
              <Text style={styles.subjectCell}>{sp.accuracy}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}