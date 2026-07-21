import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  BackHandler } from 'react-native';

import { router } from 'expo-router';
import ExamNavigator from './ExamNavigator';
import SubmitSuccessModal from './SubmitSuccessModal';
import ExamResults from './ExamResults';
import SolutionViewer from './SolutionViewer';
import { assessmentStartService, AssessmentResult } from '@/src/libs/services/assessments-attempts';
import { examDetailsStyles as styles } from '@/src/styles/styles/assessments/examdetailsstyles';
import {
  EXAM_STATUS_CONFIG,
  ASSESSMENT_INSTRUCTIONS as INSTRUCTIONS,
} from '@/src/libs/constants';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  item: any;
  onBack: () => void;
}

type ExamView = 'detail' | 'exam' | 'results' | 'solutions';

export default function ExamDetails({ item, onBack }: Props) {
  const assessmentId: number = item?.id;
  const [attemptId] = useState<number>(item?.latest_attempt_id);
  const [currentView, setCurrentView] = useState<ExamView>('detail');
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string[]>>({});
  const [submittedResult, setSubmittedResult] = useState<AssessmentResult | null>(null);
  const [timeTaken, setTimeTaken] = useState(0);
  const [startLoading, setStartLoading] = useState(false);
  // Shown after a successful submit; dismissing it redirects to the home page.
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const status = item?.derived_status ?? item?.student_status;

  const [showInstructions, setShowInstructions] = useState(true);

  const isCompleted  = item?.latest_attempt_status === 'SUBMITTED' || status === 'completed';
  const isInProgress = item?.latest_attempt_status === 'IN_PROGRESS';
  const isMissed     = status === 'missed';
  const isLive       = status === 'live';
  const isUpcoming   = status === 'upcoming';

  // Reflect the current sub-view in the URL.
  useEffect(() => {
    router.setParams({
      assessmentId: assessmentId != null ? String(assessmentId) : undefined as any,
      view: currentView,
    });
    return () => {
      router.setParams({ assessmentId: undefined as any, view: undefined as any });
    };
  }, [currentView, assessmentId]);

  // Hardware back: pop within the assessment flow.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentView === 'solutions') { setCurrentView('results'); return true; }
      if (currentView === 'results' || currentView === 'exam') {
        setCurrentView('detail');
        return true;
      }
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [currentView, onBack]);

  // Helpers
  const formatSchedule = (): string | null => {
    if (!item?.scheduled_at) return null;
    const start = new Date(item.scheduled_at);
    const end   = new Date(start.getTime() + (item.total_duration_minutes ?? 0) * 60000);
    const fmt = (d: Date) =>
      d.toLocaleString('en-US', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      });
    return `${fmt(start)} — ${fmt(end)}`;
  };

  const getStatus = () => {
    if (isCompleted) return 'completed';
    if (isLive)      return 'live';
    if (isUpcoming)  return 'upcoming';
    if (isMissed)    return 'missed';
    return 'upcoming';
  };

  const getStatValue = () => {
    if (isCompleted)  return 'Submitted';
    if (isInProgress) return 'In Progress';
    if (isLive)       return 'Active';
    if (isUpcoming)   return 'Upcoming';
    return 'Not Started';
  };

  // Handlers
  const handleStartFromInstructions = async () => {


    console.log('Starting assessment with attempt id:', attemptId);
    if (!attemptId) {
      Alert.alert('Error', 'No attempt ID found.');
      return;
    }
    try {
      setStartLoading(true);
      await assessmentStartService(attemptId);
    } catch (error: any) {
      const code = error?.body?.code ?? error?.errors?.code?.[0];
      if (code !== 'INVALID_STATE') {
        Alert.alert('Error', error?.body?.error ?? 'Failed to start. Please try again.');
        return;
      }
      // INVALID_STATE 
    } finally {
      setStartLoading(false);
    }
    setCurrentView('exam');
  };

  // Dismiss the success popup and route to the home page.
  const handleGoHome = () => {
    setShowSuccessModal(false);
    router.replace('/dashboard');
  };


  if (currentView === 'exam') {
    return (
      <>
        <ExamNavigator
          assessmentId={assessmentId}
          attemptId={attemptId}
          durationMinutes={item?.total_duration_minutes ?? 60}
          // Scheduled assessments close at scheduled_at + duration for everyone,
          // so a late start only gets the remaining window. No schedule → the
          // exam screen falls back to the full duration from now.
          scheduledEndMs={
            item?.scheduled_at &&
            !isNaN(new Date(item.scheduled_at).getTime())
              ? new Date(item.scheduled_at).getTime() +
                (item?.total_duration_minutes ?? 60) * 60 * 1000
              : null
          }
          onSubmit={(answers, seconds, result) => {
            setSubmittedAnswers(answers);
            setTimeTaken(seconds);
            setSubmittedResult(result ?? null);
            // On success, surface the popup and redirect home (results stay
            // reachable later from the completed assessment's detail screen).
            setShowSuccessModal(true);
          }}
          onBackToAssessments={onBack}
        />

        {/* Submit success popup — auto-redirects home after 5s. */}
        <SubmitSuccessModal visible={showSuccessModal} onDone={handleGoHome} />
      </>
    );
  }

  if (currentView === 'results') {
    return (
      <ExamResults
        attemptId={attemptId}
        exam={item}
        answers={submittedAnswers}
        timeTakenSeconds={timeTaken}
        initialResult={submittedResult}
        onBack={() => setCurrentView('detail')}
        onViewSolutions={() => setCurrentView('solutions')}
        onDone={() => setCurrentView('detail')}
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

  // Detail screen
  const sc = EXAM_STATUS_CONFIG[getStatus()];
  const schedule = formatSchedule();

  return (
    <View style={styles.safeArea}>
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
        contentContainerStyle={[
        styles.scrollContent,
        {paddingBottom: showInstructions ? 160 : 190,},
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status badge pill */}
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: sc.color }]} />
          <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{item?.name}</Text>

        {/* Description */}
        {!!item?.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        {/* Exam tag chip */}
        {!!item?.exam?.name && (
          <View style={styles.tagChip}>
            <Text style={styles.tagText}>{item.exam.name}</Text>
          </View>
        )}

        {/* Stats 2×2 grid */}
        <View style={styles.statsGrid}>
          {[
            { icon: '⏱', value: `${item?.total_duration_minutes ?? 0} min`, label: 'Duration' },
            { icon: '📋', value: `${item?.question_count ?? 0} Total`, label: 'Questions' },
            { icon: '🔁', value: `${item?.total_attempts ?? 1}`, label: 'Attempts' },
            { icon: '✅', value: getStatValue(), label: 'Status' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue} numberOfLines={1}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Schedule */}
        <Text style={styles.sectionTitle}>Schedule</Text>

        {schedule && (
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleIconBox}>
              <Text style={styles.scheduleIconText}>📅</Text>
            </View>
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleMain}>{schedule}</Text>
              <Text style={styles.scheduleLabel}>Assessment window</Text>
            </View>
          </View>
        )}

        <View style={styles.scheduleRow}>
          <View style={styles.scheduleIconBox}>
            <Text style={styles.scheduleIconText}>⏰</Text>
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleMain}>{item?.total_duration_minutes ?? 0} min</Text>
            <Text style={styles.scheduleLabel}>Exam duration</Text>
          </View>
        </View>

        {/* Completed banner */}
        {isCompleted && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedBannerIcon}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.completedBannerTitle}>Assessment Completed</Text>
              <Text style={styles.completedBannerSub}>You have completed this assessment.</Text>
            </View>
          </View>
        )}

        {/* Live / Upcoming banner */}
        {(isLive || isUpcoming) && (
          <View style={[
            styles.liveBanner,
            {
              backgroundColor: isLive ? '#F0FDF4' : '#FFFBEB',
              borderLeftColor: isLive ? '#22C55E' : '#F59E0B',
            },
          ]}>
            <Text style={[styles.liveBannerTitle, { color: isLive ? '#166534' : '#92400E' }]}>
              {isLive ? '🟢  Assessment has started!' : '🕐  Assessment is upcoming'}
            </Text>
            <Text style={[styles.liveBannerSub, { color: isLive ? '#166534' : '#92400E' }]}>
              {isLive
                ? 'Click Resume Assessment to join.'
                : 'Be ready when the window opens.'}
            </Text>
          </View>
        )}

        {/* Instructions accordion (tappable → goes to full instructions) */}
        <TouchableOpacity
          style={styles.instructionsHeader}
          onPress={() => setShowInstructions(!showInstructions)}
          activeOpacity={0.8}
        >
          <Text style={styles.instructionsHeaderIcon}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.instructionsTitle}>Assessment Instructions</Text>
            <Text style={styles.instructionsSub}>(Read before starting)</Text>
          </View>
          <Ionicons
            name={showInstructions ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#9898B0"
          />
        </TouchableOpacity>

        {showInstructions && (
          <View style={styles.instructionsContainer}>
            {INSTRUCTIONS.map((instruction, index) => (
              <View key={index} style={styles.instructionRow}>
                <Text style={styles.instructionNumber}>
                  {index + 1}.
                </Text>
                <Text style={styles.instructionText}>
                  {instruction}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom CTA — Live / Upcoming / In Progress */}
        {(isLive || isUpcoming || isInProgress) && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.resumeBtn}
              onPress={handleStartFromInstructions}
              disabled={startLoading}
            >
              {startLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resumeBtnText}>
                  {isInProgress
                    ? '▶ Resume Assessment'
                    : '▶ Start Assessment'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom CTA — Completed: results + solutions (assessments aren't re-attemptable) */}
        {isCompleted && (
          <View style={styles.bottomBar}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.resumeBtn, { flex: 1 }]}
                onPress={() => setCurrentView('results')}
              >
                <Text style={styles.resumeBtnText}>
                  👁 View Results
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.completedBottomBtn,
                  {
                    flex: 1,
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: '#6C5CE7',
                  },
                ]}
                onPress={() => setCurrentView('solutions')}
              >
                <Text
                  style={[
                    styles.completedBottomBtnText,
                    { color: '#6C5CE7' },
                  ]}
                >
                  📖 View Solutions
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom CTA — Missed: nothing to do (no re-attempt for assessments) */}
        {isMissed && (
          <View style={styles.bottomBar}>
            <View
              style={[
                styles.completedBottomBtn,
                { backgroundColor: '#F3F4F6' },
              ]}
            >
              <Text
                style={[
                  styles.completedBottomBtnText,
                  { color: '#9CA3AF' },
                ]}
              >
                Assessment missed
              </Text>
            </View>
          </View>
        )}
    </ScrollView>
    </View>
  );
}