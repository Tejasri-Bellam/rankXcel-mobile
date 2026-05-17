// src/components/assessments/ExamDetails.tsx

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ExamNavigator from './ExamNavigator';
import ExamResults from './ExamResults';
import SolutionViewer from './SolutionViewer';
import { assessmentStartService } from '@/src/libs/services/assessments-attempts';
import { reattemptAssessmentService } from '@/src/libs/services/assessments';
import { examDetailsStyles as styles } from '@/src/styles/sidebar/assessments/examDetails';

interface Props {
  item: any;
  onBack: () => void;
}

type ExamView = 'detail' | 'exam' | 'results' | 'solutions';

const STATUS_CONFIG = {
  live:      { label: 'Live Now',  color: '#22C55E', bg: '#F0FDF4' },
  upcoming:  { label: 'Upcoming',  color: '#F59E0B', bg: '#FFFBEB' },
  completed: { label: 'Completed', color: '#9898B0', bg: '#F5F5F8' },
  missed:    { label: 'Missed',    color: '#EF4444', bg: '#FEF2F2' },
} as const;

const INSTRUCTIONS = [
  'This is a live assessment. All students take the exam within the same time window.',
  'Your timer starts when you click "Start Assessment". You must finish within the exam duration.',
  'You must complete the exam before the assessment window closes.',
  'Marking scheme: +4 for correct, -1 for incorrect MCQ, 0 for unattended.',
  'You may switch between sections at any time during the exam.',
  'Answers are saved automatically when you click "Save & Next".',
  'Once you submit, the exam cannot be resumed.',
  'Switching tabs will be recorded and may be flagged.',
  'Results and rankings will be available after the assessment window closes.',
];

export default function ExamDetails({ item, onBack }: Props) {
  const assessmentId: number = item?.id;
  const [attemptId, setAttemptId] = useState<number>(item?.latest_attempt_id);
  const [currentView, setCurrentView] = useState<ExamView>('detail');
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string[]>>({});
  const [timeTaken, setTimeTaken] = useState(0);
  const [startLoading, setStartLoading] = useState(false);

  const [showInstructions, setShowInstructions] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [requireConfirmation, setRequireConfirmation] = useState(
    item?.student_status === 'completed' ||
    item?.student_status === 'missed'
  );

  const isCompleted  = item?.latest_attempt_status === 'SUBMITTED';
  const isInProgress = item?.latest_attempt_status === 'IN_PROGRESS';
  const isMissed     = item?.student_status === 'missed';
  const isLive       = item?.student_status === 'live';
  const isUpcoming   = item?.student_status === 'upcoming';

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

  // ── Handlers ─────────────────────────────────────
  const handleStartFromInstructions = async () => {
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
      // INVALID_STATE = already started → proceed to exam
    } finally {
      setStartLoading(false);
    }
    setCurrentView('exam');
  };

  const handleReattempt = async () => {
    try {
      setStartLoading(true);
      const res: any = await reattemptAssessmentService(assessmentId);
      const newAttemptId =
        res?.data?.id ??
        res?.data?.attempt_id ??
        res?.data?.latest_attempt_id;

      if (!newAttemptId) {
        throw new Error('No attempt id returned');
      }

      setAttemptId(newAttemptId);
      // Check box for Retry and Re-attempt
      setRequireConfirmation(true);

      // Open instructions
      setShowInstructions(true);

    } catch {
      Alert.alert(
        'Error',
        'Failed to create a new attempt. Please try again.'
      );
    } finally {
      setStartLoading(false);
    }
  };

  

  if (currentView === 'exam') {
    return (
      <ExamNavigator
        assessmentId={assessmentId}
        attemptId={attemptId}
        durationMinutes={item?.total_duration_minutes ?? 60}
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

  // Detail screen
  const sc = STATUS_CONFIG[getStatus()];
  const schedule = formatSchedule();

  return (
    <SafeAreaView style={styles.safeArea}  edges={['top', 'bottom']}>
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
          { paddingBottom: 120 }
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
          <Text style={styles.instructionsChevron}>
            {showInstructions ? '⌃' : '⌄'}
          </Text>
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

            {/* Checkbox only for reattempt/retry */}
            {requireConfirmation && (
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAccepted(!accepted)}
              >
                <View
                  style={[
                    styles.checkbox,
                    accepted
                      ? styles.checkboxChecked
                      : styles.checkboxUnchecked,
                  ]}
                >
                  {accepted && (
                    <Text style={styles.checkboxTick}>✓</Text>
                  )}
                </View>

                <Text style={styles.checkboxLabel}>
                  I have read and understood all instructions.
                </Text>
              </TouchableOpacity>
            )}
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

        {/* Bottom CTA — Completed / Missed */}
        {(isCompleted || isMissed) && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[
                styles.completedBottomBtn,
                {
                  opacity:
                    requireConfirmation && !accepted
                      ? 0.5
                      : 1,
                },
              ]}
              onPress={
                requireConfirmation
                  ? handleStartFromInstructions
                  : handleReattempt
              }
              disabled={requireConfirmation && !accepted}
            >
              {startLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.completedBottomBtnText}>
                  🔄{isCompleted
                  ? 'Re-attempt Assessment'
                  : 'Retry Assessment'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
    </ScrollView>
    </SafeAreaView>
  );
}