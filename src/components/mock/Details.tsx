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
import { detailsStyles as styles } from '@/src/styles/styles/mock/detailsstyles';

type MockView = 'detail' | 'exam' | 'results' | 'solutions';

interface Props {
  mock: MockTest;
  onBack: () => void;
  initialView?: MockView;
}

const formatDuration = (mins: number | null | undefined): string => {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h * 60 + m}`;
  if (h > 0) return `${h * 60}`;
  return `${m}`;
};

export default function MockDetails({ mock, onBack, initialView = 'detail' }: Props) {
  const [currentView, setCurrentView] = useState<MockView>(initialView);
  const [startLoading, setStartLoading] = useState(false);
  // Attempt id from the /start/ response; drives the attempt-based questions,
  // response-save and submit endpoints.
  const [attemptId, setAttemptId] = useState<number | string | null>(null);
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string[]>>({});
  const [submittedResult, setSubmittedResult] = useState<MockTestResult | null>(null);
  const [timeTaken, setTimeTaken] = useState(0);
  const [mockData] = useState<MockTest>(mock);

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

  const isInProgress = mockData.status === 'IN_PROGRESS';
  // Retake is offered once the student has at least one attempt.
  const canRetake = Number(mockData.total_attempts ?? 0) > 0;
  // Attempt id for viewing results: the just-finished attempt this session, else
  // the latest attempt from the mock list/detail.
  const resultAttemptId = attemptId ?? mockData.latest_attempt_id ?? null;

  // Start (or resume) an attempt. The /start/ response carries the attempt_id
  // that the questions / response / submit endpoints are keyed on; for an
  // already in-progress mock it returns the current attempt.
  const handleStart = async () => {
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
      // Some backends return the in-progress attempt id in the error body.
      const aId = error?.body?.attempt_id ?? null;
      if (aId != null) {
        setAttemptId(aId);
        setCurrentView('exam');
        return;
      }
      Alert.alert('Error', error?.body?.error ?? 'Failed to start. Please try again.');
      setCurrentView('detail');
    } finally {
      setStartLoading(false);
    }
  };

  // Retake a submitted mock: reset it, then start a fresh attempt.
  const handleRetake = async () => {
    try {
      setStartLoading(true);
      await retakeMockTestService(String(mockData.id));
    } catch (error: any) {
      Alert.alert('Error', error?.body?.error ?? 'Failed to retake. Please try again.');
      return;
    } finally {
      setStartLoading(false);
    }
    await handleStart();
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
        <ActivityIndicator size="large" color="#3B7DF8" />
      </SafeAreaView>
    );
  }

  if (currentView === 'exam' && attemptId != null) {
    return (
      <MockExamNavigator
        mockId={mockData.id}
        attemptId={attemptId}
        durationMinutes={mockData.total_duration_minutes ?? 60}
        onSubmit={(answers, seconds, result) => {
          setSubmittedAnswers(answers);
          setTimeTaken(seconds);
          setSubmittedResult(result ?? null);
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
        attemptId={resultAttemptId}
        mock={mockData}
        answers={submittedAnswers}
        timeTakenSeconds={timeTaken}
        initialResult={submittedResult}
        onBack={onBack}
        onViewSolutions={() => setCurrentView('solutions')}
        onDone={onBack}
      />
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
          <Ionicons name="chevron-back" size={18} color="#3B7DF8" />
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
          <Ionicons name="document-text-outline" size={28} color="#3B7DF8" />
        </View>

        {/* Title */}
        <Text style={styles.title}>{mockData.name}</Text>

        {/* Description */}
        <Text style={styles.description}>
          A full exam-pattern paper. The timer runs the whole way through; feedback and a ranked
          breakdown come after you submit.
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="document-text-outline" size={20} color="#3B7DF8" />
            <Text style={styles.statValue}>{mockData.question_count ?? 0}</Text>
            <Text style={styles.statLabel}>questions</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={20} color="#3B7DF8" />
            <Text style={styles.statValue}>{formatDuration(mockData.total_duration_minutes)}</Text>
            <Text style={styles.statLabel}>minutes</Text>
          </View>
          {/* Last score — backend doesn't return this yet, so it's a static
              placeholder until the field is available. */}
          <View style={styles.statCard}>
            <Ionicons name="disc-outline" size={20} color="#3B7DF8" />
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
              style={styles.startBtn}
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
            <TouchableOpacity
              style={[styles.startBtn, styles.retakeBtn]}
              onPress={() => setCurrentView('results')}
              activeOpacity={0.85}
            >
              <Text style={[styles.startBtnText, styles.retakeBtnText]}>View Results</Text>
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
