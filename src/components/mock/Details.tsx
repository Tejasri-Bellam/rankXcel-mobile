import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  startMockTestService,
  retakeMockTestService,
  MockTest,
  MockTestResult,
} from '../../libs/services/mock-library';
import MockExamNavigator from './Navigator';
import MockExamResults from './Results';
import MockSolutionViewer from './SolutionViewer';
import Toast, { useToast } from '../common/Toast';
import type { AutoSubmitReason } from './ExamScreen';
import { detailsStyles as styles } from '@/src/styles/styles/mock/detailsstyles';

// Copy shown when the attempt was submitted for the student (not via the
// Submit button) — the timer ran out, or they left the app past the grace
// window. Surfaced as a toast on the results screen so it isn't a silent jump.
const AUTO_SUBMIT_MESSAGE: Record<AutoSubmitReason, string> = {
  timeup: "Time's up! Your mock test was submitted automatically.",
  inactivity: 'You left the test, so it was submitted automatically.',
};

type MockView = 'detail' | 'exam' | 'results' | 'solutions';

interface Props {
  mock: MockTest;
  onBack: () => void;
  initialView?: MockView;
  // Seed the attempt id (notification deep-link to a specific attempt's
  // results) instead of falling back to the mock's latest_attempt_id.
  initialAttemptId?: number | string | null;
}

const formatDuration = (mins: number | null | undefined): string => {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h * 60 + m}`;
  if (h > 0) return `${h * 60}`;
  return `${m}`;
};

export default function MockDetails({ mock, onBack, initialView = 'detail', initialAttemptId = null }: Props) {
  const [currentView, setCurrentView] = useState<MockView>(initialView);
  const [startLoading, setStartLoading] = useState(false);
  // Attempt id from the /start/ response; drives the attempt-based questions,
  // response-save and submit endpoints. Seeded from `initialAttemptId` when
  // deep-linking straight into a specific attempt's results.
  const [attemptId, setAttemptId] = useState<number | string | null>(initialAttemptId);
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string[]>>({});
  const [submittedResult, setSubmittedResult] = useState<MockTestResult | null>(null);
  const [timeTaken, setTimeTaken] = useState(0);
  const [mockData] = useState<MockTest>(mock);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    router.setParams({ mockId: String(mockData.id), view: currentView });
    return () => { router.setParams({ mockId: undefined as any, view: undefined as any }); };
  }, [currentView, mockData.id]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentView === 'solutions') { setCurrentView('results'); return true; }
      // Block device-back while writing the mock — the test must be submitted
      // (via the in-screen Submit / X) rather than abandoned by going back.
      if (currentView === 'exam') { return true; }
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [currentView, onBack]);

  // Resume is driven by the ATTEMPT status (latest_attempt_status), not the
  // mock's publish `status` (which is PUBLISHED/etc. and never IN_PROGRESS).
  const isInProgress = mockData.latest_attempt_status === 'IN_PROGRESS';
  // Retake is offered once the student has at least one attempt.
  const canRetake = Number(mockData.total_attempts ?? 0) > 0;
  // Attempt id for viewing results: the just-finished attempt this session, else
  // the latest attempt from the mock list/detail.
  const resultAttemptId = attemptId ?? mockData.latest_attempt_id ?? null;

  // Start (or resume) an attempt. The /start/ response carries the attempt_id
  // that the questions / response / submit endpoints are keyed on. There is NO
  // resume API: /start/ REJECTS an in-progress mock (400), so resuming reuses
  // the existing latest_attempt_id and goes straight to the questions endpoint —
  // the same pattern as assessments.
  const handleStart = async () => {
    // Resume: the in-progress attempt already exists, so reuse its id and skip
    // /start/ entirely (it would 400 with "already have an in-progress attempt").
    // The questions endpoint rebuilds the timer from the attempt's server clock.
    if (isInProgress && mockData.latest_attempt_id != null) {
      setAttemptId(mockData.latest_attempt_id);
      setCurrentView('exam');
      return;
    }
    try {
      setStartLoading(true);
      const res = await startMockTestService(String(mockData.id));
      const data: any = (res as any)?.data ?? res;
      const aId = data?.attempt_id ?? data?.attempt?.id ?? null;
      if (aId == null) {
        Alert.alert('Error', 'Could not start the attempt. Please try again.');
        setCurrentView('detail');
        return;
      }
      setAttemptId(aId);
      setCurrentView('exam');
    } catch (error: any) {
      console.log('err', error);

      // /start/ 400s when an attempt is already in progress (list data was stale)
      // and does NOT return its id — recover by resuming the known
      // latest_attempt_id rather than surfacing an error.
      const msg = String(
        error?.errors?.mock_test_id?.[0] ?? error?.body?.mock_test_id?.[0] ?? '',
      ).toLowerCase();
      const inProgressConflict =
        error?.status === 400 && msg.includes('in-progress');
      const aId =
        error?.body?.attempt_id ??
        (inProgressConflict ? mockData.latest_attempt_id : null) ??
        null;
      if (aId != null) {
        setAttemptId(aId);
        setCurrentView('exam');
        return;
      }
      Alert.alert(
        'Error',
        error?.body?.error ??
          error?.errors?.mock_test_id?.[0] ??
          'Failed to start. Please try again.',
      );
      setCurrentView('detail');
    } finally {
      setStartLoading(false);
    }
  };

  // Retake a submitted mock: reset it, then start a fresh attempt.
const handleRetake = async () => {
  try {
    setStartLoading(true);

    const res = await retakeMockTestService(String(mockData.id));
    const data: any = res?.data ?? res;

    const aId =
      data?.attempt_id ??
      data?.attempt?.id ??
      null;

    if (aId) {
      setAttemptId(aId);
      setCurrentView('exam');
      return;
    }

    Alert.alert('Error', 'Unable to start retake.');
  } catch (error: any) {
    Alert.alert(
      'Error',
      error?.body?.error ?? 'Failed to retake. Please try again.'
    );
  } finally {
    setStartLoading(false);
  }
};

  // Entering straight into the exam view (e.g. "Resume" from the library) has no
  // attempt id yet — kick off /start/ to obtain it.
  useEffect(() => {
    if (currentView === 'exam' && attemptId == null) handleStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (currentView === 'exam' && attemptId == null) {
    return (
      <SafeAreaView style={[styles.safeArea, { alignItems: 'center', justifyContent: 'center' }]} edges={[]}>
        <ActivityIndicator size="large" color='#6C63FF' />
      </SafeAreaView>
    );
  }

  if (currentView === 'exam' && attemptId != null) {
    return (
      <MockExamNavigator
        mockId={mockData.id}
        attemptId={attemptId}
        durationMinutes={mockData.total_duration_minutes ?? 60}
        onSubmit={(answers, seconds, result, autoSubmitReason) => {
          setSubmittedAnswers(answers);
          setTimeTaken(seconds);
          setSubmittedResult(result ?? null);
          setCurrentView('results');
          // Auto-submit (timer expiry / left the app) is not user-initiated —
          // tell the student why they landed on the results screen.
          if (autoSubmitReason) {
            showToast(AUTO_SUBMIT_MESSAGE[autoSubmitReason], 'info');
          }
        }}
        onBackToMocks={onBack}
      />
    );
  }

  if (currentView === 'results') {
    return (
      <>
        <MockExamResults
          mockId={mockData.id}
          attemptId={resultAttemptId}
          mock={mockData}
          answers={submittedAnswers}
          timeTakenSeconds={timeTaken}
          initialResult={submittedResult}
          onBack={onBack}
          onViewSolutions={() => setCurrentView('solutions')}
          onDone={onBack}
        />
        <Toast {...toast} onHide={hideToast} />
      </>
    );
  }

  if (currentView === 'solutions') {
    return (
      <MockSolutionViewer
        mockId={mockData.id}
        attemptId={resultAttemptId}
        answers={submittedAnswers}
        onBack={() => setCurrentView('results')}
      />
    );
  }

  // ── Detail screen ──
  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color="#6C63FF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {mockData.name}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Icon */}
        <View style={styles.mockIcon}>
          <Ionicons name="document-text-outline" size={28} color="#6C63FF" />
        </View>

        {/* Title */}
        <Text style={styles.title}>{mockData.name}</Text>

        {/* Description */}
        <Text style={styles.description}>
          A full exam-pattern paper. The timer runs the whole way through; feedback and a ranked
          breakdown come after you submit.
        </Text>

        {/* Subjects covered by this mock */}
        {mockData.subjects && mockData.subjects.length > 0 && (
          <View style={styles.subjectsSection}>
            <Text style={styles.subjectsTitle}>Subjects</Text>
            <View style={styles.subjectsRow}>
              {mockData.subjects.map((subject) => (
                <View key={subject.id} style={styles.subjectChip}>
                  <Text style={styles.subjectChipText}>{subject.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="document-text-outline" size={20} color="#6C63FF" />
            <Text style={styles.statValue}>{mockData.question_count ?? 0}</Text>
            <Text style={styles.statLabel}>questions</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={20} color="#6C63FF" />
            <Text style={styles.statValue}>{formatDuration(mockData.total_duration_minutes)}</Text>
            <Text style={styles.statLabel}>minutes</Text>
          </View>
          {/* Last score — backend doesn't return this yet, so it's a static
              placeholder until the field is available. */}
          <View style={styles.statCard}>
            <Ionicons name="disc-outline" size={20} color="#6C63FF" />
            <Text style={styles.statValue}>75%</Text>
            <Text style={styles.statLabel}>last score</Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.bottomBar}>
        {/* Mid-test resume takes priority. Otherwise, once there's at least one
            attempt (total_attempts > 0) the Start button is replaced by Retake
            and View Results is shown; a never-attempted mock just shows Start. */}
        {isInProgress ? (
          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleStart}
            disabled={startLoading}
            activeOpacity={0.85}
          >
            {startLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.startBtnText}>Resume mock</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        ) : canRetake ? (
          <View style={styles.completedRow}>
            <TouchableOpacity
              style={[styles.startBtn, styles.completedBtn, styles.retakeBtn]}
              onPress={() => setCurrentView('results')}
              activeOpacity={0.85}
            >
              <Text style={[styles.startBtnText, styles.retakeBtnText]}>View Results</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.startBtn, styles.completedBtn]}
              onPress={handleRetake}
              disabled={startLoading}
              activeOpacity={0.85}
            >
              {startLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.startBtnText}>Retake mock</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleStart}
            disabled={startLoading}
            activeOpacity={0.85}
          >
            {startLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.startBtnText}>Start mock</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
