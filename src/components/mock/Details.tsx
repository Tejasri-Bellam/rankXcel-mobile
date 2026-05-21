// src/components/mock/MockDetails.tsx

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
import { mockDetailsStyles as styles } from '../../styles/sidebar/mockExams/mockDetails';
import {
  startMockTestService,
  getMockTestByIdService,
  MockTest,
} from '../../libs/services/mock-library';
import MockExamNavigator from './Navigator';
import MockExamResults from './Results';
import MockSolutionViewer from './SolutionViewer';
import MockDetailedAnalysis from './DetailedAnalysis';

interface Props {
  mock: MockTest;
  onBack: () => void;
}

type MockView = 'detail' | 'exam' | 'results' | 'solutions' | 'analysis';

const STATUS_CONFIG = {
  NOT_STARTED: { label: 'Not Started', color: '#9898B0', bg: '#F3F4F6' },
  IN_PROGRESS: { label: 'In Progress', color: '#6C5CE7', bg: '#EEF2FF' },
  SUBMITTED:   { label: 'Completed',   color: '#22C55E', bg: '#F0FDF4' },
} as const;

const INSTRUCTIONS = [
  'Read each question carefully before selecting your answer.',
  'Your timer starts when you click "Start Mock". You must finish within the allotted duration.',
  'Marking scheme: +4 for correct answers, -1 for incorrect MCQ answers, 0 for unattempted.',
  'You may switch between sections at any time during the exam.',
  'Answers are saved automatically when you click "Save & Next".',
  'Once you submit, the mock test cannot be resumed.',
  'You can mark questions for review and revisit them before final submission.',
  'Results and solutions will be available immediately after submission.',
];

const getExamName = (exam: MockTest['exam']): string =>
  typeof exam === 'object' && exam !== null && 'name' in exam
    ? exam.name
    : String(exam || '');

const getSubjectName = (subject: MockTest['subject']): string =>
  typeof subject === 'object' && subject !== null && 'name' in subject
    ? subject.name
    : String(subject || '');

const formatDuration = (mins: number | null | undefined): string => {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h} hr`;
  return `${m} min`;
};

export default function MockDetails({ mock, onBack }: Props) {
  const [currentView, setCurrentView] = useState<MockView>('detail');
  const [startLoading, setStartLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string[]>>({});
  const [timeTaken, setTimeTaken] = useState(0);
  const [mockData, setMockData] = useState<MockTest>(mock);

  const isCompleted  = mockData.status === 'SUBMITTED';
  const isInProgress = mockData.status === 'IN_PROGRESS';
  const isNotStarted = mockData.status === 'NOT_STARTED';

  const sc = STATUS_CONFIG[mockData.status] ?? STATUS_CONFIG.NOT_STARTED;
  const examName    = getExamName(mockData.exam);
  const subjectName = getSubjectName(mockData.subject);

  const handleStart = async () => {
    try {
      setStartLoading(true);
      await startMockTestService(String(mockData.id));
    } catch (error: any) {
      const code = error?.body?.code ?? error?.errors?.code?.[0];
      if (code !== 'INVALID_STATE') {
        Alert.alert('Error', error?.body?.error ?? 'Failed to start. Please try again.');
        return;
      }
    } finally {
      setStartLoading(false);
    }
    setCurrentView('exam');
  };

  const handleResume = () => {
    setCurrentView('exam');
  };

  const handleReattempt = async () => {
    try {
      setStartLoading(true);
      await startMockTestService(String(mockData.id));
      setAccepted(false);
      setCurrentView('exam');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to start a new attempt. Please try again.');
    } finally {
      setStartLoading(false);
    }
  };

  // ── Sub-screen routing ──────────────────────────────────────────────────
  if (currentView === 'exam') {
    return (
      <MockExamNavigator
        mockId={mockData.id}
        durationMinutes={mockData.total_duration_minutes ?? 60}
        onSubmit={(answers, seconds) => {
          setSubmittedAnswers(answers);
          setTimeTaken(seconds);
          setCurrentView('results');
        }}
        onBackToMocks={onBack}
      />
    );
  }

  if (currentView === 'results') {
    return (
      <MockExamResults
        mockId={mockData.id}
        mock={mockData}
        answers={submittedAnswers}
        timeTakenSeconds={timeTaken}
        onBack={() => setCurrentView('detail')}
        onViewSolutions={() => setCurrentView('solutions')}
        onViewAnalysis={() => setCurrentView('analysis')}
      />
    );
  }

  if (currentView === 'solutions') {
    return (
      <MockSolutionViewer
        mockId={mockData.id}
        answers={submittedAnswers}
        onBack={() => setCurrentView('results')}
      />
    );
  }

  if (currentView === 'analysis') {
    return (
      <MockDetailedAnalysis
        mockId={mockData.id}
        mock={mockData}
        answers={submittedAnswers}
        onBack={() => setCurrentView('results')}
      />
    );
  }

  // ── Detail Screen ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Mock Library</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status pill */}
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: sc.color }]} />
          <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {mockData.title || `${examName} Mock Test`}
        </Text>

        {/* Subject */}
        {!!subjectName && (
          <Text style={styles.subjectLabel}>{subjectName}</Text>
        )}

        {/* Exam chip */}
        {!!examName && (
          <View style={styles.tagChip}>
            <Text style={styles.tagText}>{examName}</Text>
          </View>
        )}

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {[
            { icon: '⏱', value: formatDuration(mockData.total_duration_minutes), label: 'Duration' },
            { icon: '📋', value: `${mockData.question_count ?? 0} Qs`, label: 'Questions' },
            { icon: '🎯', value: `${mockData.max_score ?? mockData.question_count ?? 0}`, label: 'Max Marks' },
            { icon: '📊', value: mockData.difficulty
                ? String(mockData.difficulty).charAt(0).toUpperCase() + String(mockData.difficulty).slice(1).toLowerCase()
                : 'Medium',
              label: 'Difficulty' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue} numberOfLines={1}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Completed banner with score */}
        {isCompleted && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedBannerIcon}>🏆</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.completedBannerTitle}>Mock Completed</Text>
              {mockData.score != null && (
                <Text style={styles.completedBannerSub}>
                  Score: {mockData.score}/{mockData.max_score ?? mockData.question_count}
                  {mockData.percentile != null ? `  ·  ${mockData.percentile}%ile` : ''}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.viewResultsBtn}
              onPress={() => setCurrentView('results')}
            >
              <Text style={styles.viewResultsBtnText}>View Results</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* In Progress banner */}
        {isInProgress && (
          <View style={styles.inProgressBanner}>
            <Text style={styles.inProgressTitle}>⏳  Mock In Progress</Text>
            <Text style={styles.inProgressSub}>
              You have an active session. Resume to continue.
            </Text>
          </View>
        )}

        {/* Instructions accordion */}
        <TouchableOpacity
          style={styles.instructionsHeader}
          onPress={() => setShowInstructions(!showInstructions)}
          activeOpacity={0.8}
        >
          <Text style={styles.instructionsHeaderIcon}>📋</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.instructionsTitle}>Mock Test Instructions</Text>
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
                <Text style={styles.instructionNumber}>{index + 1}.</Text>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}

            {/* Checkbox only for reattempt */}
            {isCompleted && (
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAccepted(!accepted)}
              >
                <View
                  style={[
                    styles.checkbox,
                    accepted ? styles.checkboxChecked : styles.checkboxUnchecked,
                  ]}
                >
                  {accepted && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  I have read and understood all instructions.
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {isNotStarted && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleStart}
            disabled={startLoading}
          >
            {startLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>▶ Start Mock</Text>
            )}
          </TouchableOpacity>
        )}

        {isInProgress && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleResume}
          >
            <Text style={styles.primaryBtnText}>▶ Resume Mock</Text>
          </TouchableOpacity>
        )}

        {isCompleted && (
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (!accepted) && { opacity: 0.5 },
            ]}
            onPress={handleReattempt}
            disabled={!accepted || startLoading}
          >
            {startLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>🔄 Re-attempt Mock</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}