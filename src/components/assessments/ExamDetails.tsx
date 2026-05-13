import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ExamInstructions from './ExamInstructions';
import ExamNavigator from './ExamNavigator';
import ExamResults from './ExamResults';
import SolutionViewer from './SolutionViewer';
import {
  assessmentStartService,
} from '@/src/libs/services/assessments-attempts';
import { reattemptAssessmentService } from '@/src/libs/services/assessments';
import { examDetailsStyles } from '@/src/styles/sidebar/assessments/examDetails';

interface Props {
  item: any;
  onBack: () => void;
}

type ExamView = 'detail' | 'instructions' | 'exam' | 'results' | 'solutions';

export default function ExamDetails({ item, onBack }: Props) {
  const assessmentId: number = item?.id;
  const [attemptId, setAttemptId] = useState<number>(item?.attempt_id);
  const [currentView, setCurrentView] = useState<ExamView>('detail');
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string[]>>({});
  const [timeTaken, setTimeTaken] = useState(0);
  const [startLoading, setStartLoading] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(true);

  const isCompleted = item?.student_status === 'completed';
  const isMissed = item?.student_status === 'missed';
  const isLive = item?.student_status === 'live';
  const isUpcoming = item?.student_status === 'upcoming';

  // Start from instructions page (live/upcoming)
  const handleStartFromInstructions = async () => {
    try {
      console.log('BUTTON CLICKED');
      console.log('ATTEMPT ID:', attemptId);

      setStartLoading(true);

      const res = await assessmentStartService(attemptId);

      console.log('START RESPONSE:', res);

      setCurrentView('exam');
    } catch (error) {
      console.log('START ERROR:', error);
    } finally {
      setStartLoading(false);
    }
  };

  // Re-attempt: get new attempt then show instructions
  const handleReattempt = async () => {
    try {
      setStartLoading(true);
      const res: any = await reattemptAssessmentService(assessmentId);
      const newAttemptId = res?.data?.id ?? res?.data?.attempt_id;
      if (!newAttemptId) throw new Error('No attempt id returned');
      setAttemptId(newAttemptId);
      setCurrentView('instructions');
    } catch (error) {
      Alert.alert('Error', 'Failed to create a new attempt. Please try again.');
    } finally {
      setStartLoading(false);
    }
  };

  // ── Sub-views ──
  if (currentView === 'instructions') {
    return (
      <ExamInstructions
        item={item}
        startLoading={startLoading}
        onStartExam={handleStartFromInstructions}
        onBack={() => setCurrentView('detail')}
      />
    );
  }

  if (currentView === 'exam') {
    return (
      <ExamNavigator
        assessmentId={assessmentId}
        attemptId={attemptId}
        onSubmit={(answers, seconds) => {
          setSubmittedAnswers(answers);
          setTimeTaken(seconds);
          setCurrentView('results');
        }}
        onBackToAssessments={onBack}
      />
    );
  }

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

  if (currentView === 'solutions') {
    return (
      <SolutionViewer
        attemptId={attemptId}
        answers={submittedAnswers}
        onBack={() => setCurrentView('results')}
      />
    );
  }

  // ─────────────────────────────────────────
  // DETAIL SCREEN  (matches Image 1)
  // ─────────────────────────────────────────
  return (
    <SafeAreaView style={examDetailsStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={examDetailsStyles.header}>
        <TouchableOpacity style={examDetailsStyles.backBtn} onPress={onBack}>
          <Text style={examDetailsStyles.backArrow}>←</Text>
          <Text style={examDetailsStyles.backText}>Assessments</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={examDetailsStyles.scroll} contentContainerStyle={examDetailsStyles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Status badge */}
        {isLive && (
          <View style={examDetailsStyles.badge}>
            <View style={[examDetailsStyles.dot, { backgroundColor: '#22C55E' }]} />
            <Text style={[examDetailsStyles.badgeText, { color: '#22C55E' }]}>LIVE NOW</Text>
          </View>
        )}
        {isUpcoming && (
          <View style={examDetailsStyles.badge}>
            <View style={[examDetailsStyles.dot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[examDetailsStyles.badgeText, { color: '#F59E0B' }]}>UPCOMING</Text>
          </View>
        )}
        {isCompleted && (
          <View style={examDetailsStyles.badge}>
            <View style={[examDetailsStyles.dot, { backgroundColor: '#9898B0' }]} />
            <Text style={[examDetailsStyles.badgeText, { color: '#9898B0' }]}>COMPLETED</Text>
          </View>
        )}
        {isMissed && (
          <View style={examDetailsStyles.badge}>
            <View style={[examDetailsStyles.dot, { backgroundColor: '#EF4444' }]} />
            <Text style={[examDetailsStyles.badgeText, { color: '#EF4444' }]}>MISSED</Text>
          </View>
        )}

        {/* Title */}
        <Text style={examDetailsStyles.title}>{item?.name}</Text>

        {/* Exam tag */}
        {item?.exam?.name && (
          <View style={examDetailsStyles.tagChip}>
            <Text style={examDetailsStyles.tagText}>{item.exam.name}</Text>
          </View>
        )}

        {/* Stats grid */}
        <View style={examDetailsStyles.statsGrid}>
          <View style={examDetailsStyles.statCard}>
            <Text style={examDetailsStyles.statIcon}>⏱</Text>
            <Text style={examDetailsStyles.statValue}>{item?.total_duration_minutes ?? 0} min</Text>
            <Text style={examDetailsStyles.statLabel}>Duration</Text>
          </View>
          <View style={examDetailsStyles.statCard}>
            <Text style={examDetailsStyles.statIcon}>📋</Text>
            <Text style={examDetailsStyles.statValue}>{item?.question_count ?? 0} Total</Text>
            <Text style={examDetailsStyles.statLabel}>Questions</Text>
          </View>
          <View style={examDetailsStyles.statCard}>
            <Text style={examDetailsStyles.statIcon}>🔁</Text>
            <Text style={examDetailsStyles.statValue}>{item?.attempt_count ?? 1}</Text>
            <Text style={examDetailsStyles.statLabel}>Attempts</Text>
          </View>
          <View style={examDetailsStyles.statCard}>
            <Text style={examDetailsStyles.statIcon}>✅</Text>
            <Text style={examDetailsStyles.statValue} numberOfLines={1}>
              {isCompleted ? 'Submitted' : isLive ? 'Active' : isUpcoming ? 'Upcoming' : 'Not Started'}
            </Text>
            <Text style={examDetailsStyles.statLabel}>Status</Text>
          </View>
        </View>

        {/* Schedule */}
        <Text style={examDetailsStyles.sectionTitle}>Schedule</Text>
        {item?.window_label && (
          <View style={examDetailsStyles.scheduleRow}>
            <View style={examDetailsStyles.scheduleIconBox}><Text style={examDetailsStyles.scheduleIconText}>📅</Text></View>
            <View style={examDetailsStyles.scheduleInfo}>
              <Text style={examDetailsStyles.scheduleMain}>{item.window_label}</Text>
              <Text style={examDetailsStyles.scheduleLabel}>Assessment window</Text>
            </View>
          </View>
        )}
        <View style={examDetailsStyles.scheduleRow}>
          <View style={examDetailsStyles.scheduleIconBox}><Text style={examDetailsStyles.scheduleIconText}>⏰</Text></View>
          <View style={examDetailsStyles.scheduleInfo}>
            <Text style={examDetailsStyles.scheduleMain}>{item?.total_duration_minutes ?? 0} min</Text>
            <Text style={examDetailsStyles.scheduleLabel}>Exam duration</Text>
          </View>
        </View>

        {/* Live "Assessment has started!" green banner (Image 1) */}
        {(isLive || isUpcoming) && (
          <View style={examDetailsStyles.liveStartedBanner}>
            <Text style={examDetailsStyles.liveStartedTitle}>
              {isLive ? 'Assessment has started!' : 'Assessment is upcoming'}
            </Text>
            <Text style={examDetailsStyles.liveStartedSub}>
              {isLive ? 'Refresh the page to join.' : 'Be ready when the window opens.'}
            </Text>
          </View>
        )}

        {/* Completed banner */}
        {isCompleted && (
          <View style={examDetailsStyles.completedBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <View style={[examDetailsStyles.dot, { backgroundColor: '#22C55E' }]} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#166534' }}>Assessment Completed</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#22C55E' }}>You have completed this assessment.</Text>
          </View>
        )}

        {/* Instructions accordion (Image 1 bottom section) */}
        <TouchableOpacity
          style={examDetailsStyles.instructionsHeader}
          onPress={() => setInstructionsOpen(!instructionsOpen)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <Text style={{ fontSize: 18 }}>⚠️</Text>
            <View>
              <Text style={examDetailsStyles.instructionsTitle}>Assessment Instructions</Text>
              <Text style={examDetailsStyles.instructionsSub}>(Read before starting)</Text>
            </View>
          </View>
          <Text style={examDetailsStyles.instructionsChevron}>{instructionsOpen ? '∧' : '›'}</Text>
        </TouchableOpacity>

        {instructionsOpen && (
          <View style={examDetailsStyles.instructionPreview}>
            <Text style={examDetailsStyles.instructionLine}>1. This is a live assessment. All students take the exam within the same time window.</Text>
            <TouchableOpacity onPress={() => setCurrentView('instructions')} style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 13, color: '#6C5CE7', fontWeight: '600' }}>Read all instructions →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Completed actions */}
        {isCompleted && (
          <View style={examDetailsStyles.actionGroup}>
            <TouchableOpacity style={[examDetailsStyles.actionBtn, { backgroundColor: '#6C5CE7' }]} onPress={() => setCurrentView('results')}>
              <Text style={examDetailsStyles.actionBtnTextWhite}>📊  View Results</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[examDetailsStyles.actionBtn, examDetailsStyles.actionBtnOutline]} onPress={() => setCurrentView('solutions')}>
              <Text style={[examDetailsStyles.actionBtnTextWhite, { color: '#1A1A2E' }]}>📖  View Solutions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[examDetailsStyles.actionBtn, examDetailsStyles.actionBtnOutline]} onPress={handleReattempt} disabled={startLoading}>
              {startLoading
                ? <ActivityIndicator size="small" color="#1A1A2E" />
                : <Text style={[examDetailsStyles.actionBtnTextWhite, { color: '#1A1A2E' }]}>🔄  Re-attempt Assessment</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Missed actions */}
        {isMissed && (
          <View style={examDetailsStyles.actionGroup}>
            <TouchableOpacity style={[examDetailsStyles.actionBtn, { backgroundColor: '#EF4444' }]} onPress={handleReattempt} disabled={startLoading}>
              {startLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={examDetailsStyles.actionBtnTextWhite}>🔄  Retry Assessment</Text>}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA — live/upcoming only (Image 1) */}
      {(isLive || isUpcoming) && (
        <View style={examDetailsStyles.bottomBar}>
          <TouchableOpacity
            style={examDetailsStyles.resumeBtn}
            onPress={() => setCurrentView('instructions')}
            disabled={startLoading}
          >
            <Text style={examDetailsStyles.resumeBtnText}>▶  Resume Assessment</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

