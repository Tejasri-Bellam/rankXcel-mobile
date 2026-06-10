import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { startMockTestService, MockTest } from '../../libs/services/mock-library';
import MockExamNavigator from './Navigator';
import MockExamResults from './Results';
import MockSolutionViewer from './SolutionViewer';

type MockView = 'detail' | 'exam' | 'results' | 'solutions';

interface Props {
  mock: MockTest;
  onBack: () => void;
  initialView?: MockView;
}

const getExamName = (exam: MockTest['exam']): string =>
  typeof exam === 'object' && exam !== null && 'name' in exam ? exam.name : String(exam || '');

const getSubjectName = (subject: MockTest['subject']): string =>
  typeof subject === 'object' && subject !== null && 'name' in subject
    ? subject.name
    : String(subject || '');

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
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string[]>>({});
  const [timeTaken, setTimeTaken] = useState(0);
  const [mockData] = useState<MockTest>(mock);

  useEffect(() => {
    router.setParams({ mockId: String(mockData.id), view: currentView });
    return () => { router.setParams({ mockId: undefined as any, view: undefined as any }); };
  }, [currentView, mockData.id]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentView === 'solutions') { setCurrentView('results'); return true; }
      if (currentView === 'exam') { setCurrentView('detail'); return true; }
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [currentView, onBack]);

  const isCompleted = mockData.status === 'SUBMITTED';
  const isInProgress = mockData.status === 'IN_PROGRESS';
  const isNotStarted = mockData.status === 'NOT_STARTED';

  const examName = getExamName(mockData.exam);
  const subjectName = getSubjectName(mockData.subject);
  const score = mockData.score ?? 0;
  const maxScore = mockData.max_score ?? mockData.question_count ?? 0;
  const lastPct = maxScore > 0 ? Math.round((score / maxScore) * 100) : null;

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
          {mockData.title || `${examName} Mock`}
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
        <Text style={styles.title}>{mockData.title || `${examName} Mock Test`}</Text>

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
          {isCompleted && lastPct !== null && (
            <View style={styles.statCard}>
              <Ionicons name="stats-chart-outline" size={20} color="#3B7DF8" />
              <Text style={styles.statValue}>{lastPct}%</Text>
              <Text style={styles.statLabel}>last score</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.bottomBar}>
        {isNotStarted && (
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

        {isInProgress && (
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => setCurrentView('exam')}
            activeOpacity={0.85}
          >
            <Text style={styles.startBtnText}>Resume mock</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )}

        {isCompleted && (
          <View style={styles.completedRow}>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => setCurrentView('results')}
              activeOpacity={0.85}
            >
              <Text style={styles.startBtnText}>View Results</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 15, fontWeight: '600', color: '#3B7DF8' },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginRight: 60,
  },

  mockIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 28,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  statLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },

  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#3B7DF8',
    borderRadius: 16,
    paddingVertical: 16,
  },
  startBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  completedRow: { gap: 10 },
});