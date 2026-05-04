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
  const { exam, result } = examData;

  const allQuestions = exam.sections.flatMap((s) => s.questions);

  let correct = 0;
  let wrong = 0;
  let attempted = 0;
  let score = 0;

  allQuestions.forEach((q) => {
    const userAnswer = answers[q.id] || [];

    if (userAnswer.length > 0) {
      attempted++;

      const isCorrect =
        q.correct_answers.length === userAnswer.length &&
        q.correct_answers.every((a) => userAnswer.includes(a));

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

  const totalMarks = allQuestions.reduce(
    (sum, q) => sum + q.marks_correct,
    0
  );

  const percentage = ((score / totalMarks) * 100).toFixed(2);

  const formatTimeTaken = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // Subject-wise performance
  const subjectPerf = exam.sections.map((section) => {
    let sScore = 0;
    let sCorrect = 0;

    const sTotalMarks = section.questions.reduce(
      (sum, q) => sum + q.marks_correct,
      0
    );

    section.questions.forEach((q) => {
      const userAnswer = answers[q.id] || [];

      if (userAnswer.length > 0) {
        const isCorrect =
          q.correct_answers.length === userAnswer.length &&
          q.correct_answers.every((a) => userAnswer.includes(a));

        if (isCorrect) {
          sScore += q.marks_correct;
          sCorrect++;
        } else {
          sScore += q.marks_incorrect;
        }
      }
    });

    const accuracy = Math.round(
      (sCorrect / section.questions.length) * 100
    );

    return {
      subject: section.name,
      score: `${sScore}/${sTotalMarks}`,
      accuracy: `${accuracy}%`,
      color:
        result.subject_performance.find(
          (sp) => sp.subject === section.name
        )?.color || '#6C5CE7',
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
        {/* Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreDate}>{result.date}</Text>
          <Text style={styles.scoreValue}>
            {score}/{totalMarks}
          </Text>
          <Text style={styles.scorePercent}>{percentage}%</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <Text>Correct: {correct}</Text>
          <Text>Wrong: {wrong}</Text>
          <Text>Skipped: {skipped}</Text>
          <Text>Time: {formatTimeTaken(timeTakenSeconds)}</Text>
        </View>

        {/* Subject Performance */}
        <Text style={styles.sectionHeading}>Subject-wise Performance</Text>

        {subjectPerf.map((sp, idx) => (
          <View key={idx} style={{ marginBottom: 10 }}>
            <Text>{sp.subject}</Text>
            <Text>{sp.score}</Text>
            <Text>{sp.accuracy}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}