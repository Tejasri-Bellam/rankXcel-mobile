import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { examDetailStyles as styles } from '../../styles/sidebar/assessments/exam';
import ExamNavigator from './ExamNavigator';
import ExamResults from './ExamResults';
import SolutionViewer from './SolutionViewer';
import { assessmentStartService } from '@/src/libs/services/assessments-attempts';


interface Props {
  item: any;
  onBack: () => void;
}

type ExamView = 'detail' | 'exam' | 'results' | 'solutions';

export default function ExamDetails({ item, onBack }: Props) {
  
  const assessmentId = item?.id;
  const attemptId = item?.attempt_id;

  const [currentView, setCurrentView] = useState<ExamView>('detail');

  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string[]>>({});
  const [timeTaken, setTimeTaken] = useState(0);

  // START ASSESSMENT API
  const handleStartAssessment = async () => {
    try {

      const res = await assessmentStartService(attemptId);

      console.log("START ASSESSMENT:", res);

      setCurrentView('exam');

    } catch (error) {
      console.log("START ERROR:", error);
    }
  };

  // Navigate to Exam (Re-attempt or fresh start)
  if (currentView === 'exam') {
    return (
      <ExamNavigator
        onSubmit={(answers, seconds) => {
          setSubmittedAnswers(answers);
          setTimeTaken(seconds);
          setCurrentView('results');
        }}
        onBackToAssessments={onBack}
      />
    );
  }

  // Navigate to Results 
  if (currentView === 'results') {
    return (
      <ExamResults
        attemptId={attemptId}
        exam={item}
        answers={submittedAnswers}
        timeTakenSeconds={timeTaken}
        onBack={() => setCurrentView('detail')}
        onViewSolutions={() => setCurrentView('solutions')}
      />
    );
  }

  //  Navigate to Solutions
if (currentView === 'solutions') {
    return (
      <SolutionViewer
        attemptId={attemptId}
        answers={submittedAnswers}
        onBack={() => setCurrentView('results')}
      />
    );
  }

  // ── Detail Screen ──
  const isCompleted = item?.student_status === 'completed';
  const isMissed = item?.student_status === 'missed';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Assessments</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status badge */}
        {isCompleted && (
          <View style={styles.liveBadge}>
            <View style={[styles.liveDot, { backgroundColor: '#9898B0' }]} />
            <Text style={[styles.liveText, { color: '#9898B0' }]}>COMPLETED</Text>
          </View>
        )}

        {/* Title */}
        <Text style={styles.examTitle}>{item?.name ?? 'jee_test_02'}</Text>

        {/* Tag */}
        <View style={styles.tagChip}>
          <Text style={styles.tagText}>{item?.exam?.name ?? 'JEE'}</Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱</Text>
            <Text style={styles.statValue}>{item?.total_duration_minutes ?? 10} min</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📋</Text>
            <Text style={styles.statValue}>{item?.question_count ?? 5} Total</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔁</Text>
            <Text style={styles.statValue}>{item?.attempt_count ?? 1}</Text>
            <Text style={styles.statLabel}>Attempts</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={styles.statValue}>Submitted</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.scheduleSection}>
          <Text style={styles.sectionHeading}>Schedule</Text>

          <View style={styles.scheduleItem}>
            <View style={styles.scheduleIconCol}>
              <Text style={styles.scheduleIcon}>📅</Text>
            </View>
            <View>
              <Text style={styles.scheduleMain}>{item?.window_label ?? '6 May 2026, 12:41 pm – 6 May 2026, 12:51 pm'}</Text>
              <Text style={styles.scheduleLabel}>Assessment session</Text>
            </View>
          </View>

          <View style={styles.scheduleItem}>
            <View style={styles.scheduleIconCol}>
              <Text style={styles.scheduleIcon}>⏰</Text>
            </View>
            <View>
              <Text style={styles.scheduleMain}>{item?.total_duration_minutes ?? 10} min</Text>
              <Text style={styles.scheduleLabel}>Exam duration</Text>
            </View>
          </View>
        </View>

        {/* Completed banner */}
        {isCompleted && (
          <View style={styles.liveBanner}>
            <View style={styles.liveBannerLeft}>
              <View style={[styles.liveBannerDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.liveBannerTitle}>Assessment Completed</Text>
            </View>
            <Text style={styles.liveBannerSub}>You have completed this assessment.</Text>
          </View>
        )}

        {/* Instructions accordion */}
        <TouchableOpacity style={styles.instructionsHeader}>
          <Text style={styles.instructionsTitle}>Assessment Instructions</Text>
          <Text style={styles.instructionsSubtitle}>(Read before{'\n'}starting)</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Action buttons for completed assessments */}
        {isCompleted && (
          <View style={{ marginTop: 24, gap: 12 }}>
            <TouchableOpacity
              style={[styles.resumeBtn, { backgroundColor: '#6C5CE7' }]}
              onPress={() => setCurrentView('results')}
            >
              <Text style={styles.resumeBtnText}>📊  View Results</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resumeBtn, { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E8E8F0' }]}
              onPress={() => setCurrentView('solutions')}
            >
              <Text style={[styles.resumeBtnText, { color: '#1A1A2E' }]}>📖  View Solutions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resumeBtn, { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E8E8F0' }]}
              onPress={handleStartAssessment}
            >
              <Text style={[styles.resumeBtnText, { color: '#1A1A2E' }]}>🔄  Re-attempt Assessment</Text>
            </TouchableOpacity>
          </View>
        )}

        {isMissed && (
          <View style={{ marginTop: 24, gap: 12 }}>
            <TouchableOpacity
              style={[styles.resumeBtn, { backgroundColor: '#EF4444' }]}
              onPress={handleStartAssessment}
            >
              <Text style={styles.resumeBtnText}>🔄  Retry Assessment</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom bar — only for live/upcoming */}
      {!isCompleted && !isMissed && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.resumeBtn}
            onPress={handleStartAssessment}
          >
            <Text style={styles.resumeBtnText}>▶  Resume Assessment</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}