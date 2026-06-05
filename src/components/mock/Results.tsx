import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMockTestResultService, MockTest } from '../../libs/services/mock-library';

interface Props {
  mockId: number | string;
  mock: MockTest;
  answers: Record<string, string[]>;
  timeTakenSeconds: number;
  onBack: () => void;
  onViewSolutions?: () => void;
  onDone: () => void;
}

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

const getMockTitle = (mock: MockTest): string => {
  const examName =
    typeof mock.exam === 'object' && mock.exam !== null && 'name' in mock.exam
      ? mock.exam.name
      : String(mock.exam || '');
  return mock.title ?? `${examName} mock`;
};

export default function MockExamResults({
  mockId,
  mock,
  timeTakenSeconds,
  onBack,
  onViewSolutions,
  onDone,
}: Props) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadResult(); }, []);

  const loadResult = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMockTestResultService(mockId);
      setResult(res?.data ?? null);
    } catch (err) {
      setError('Failed to load results.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEEFF5' }}>
        <ActivityIndicator size="large" color="#3B7DF8" />
        <Text style={{ marginTop: 12, color: '#9CA3AF' }}>Loading results…</Text>
      </SafeAreaView>
    );
  }

  // ── Parse result ──
  const chapterBreakdown: Record<string, any> = result?.chapter_breakdown ?? {};
  const chapterEntries = Object.values(chapterBreakdown);

  let totalCorrect = 0, totalWrong = 0, totalSkipped = 0;
  chapterEntries.forEach((ch: any) => {
    totalCorrect += Number(ch?.correct ?? 0);
    totalWrong += Number(ch?.wrong ?? 0);
    totalSkipped += Number(ch?.unattempted ?? 0);
  });

  const totalQ = totalCorrect + totalWrong + totalSkipped || mock.question_count || 0;
  const score = Number(result?.total_score ?? 0);
  const maxScore = Number(result?.max_score ?? mock.max_score ?? totalQ);
  const pct = maxScore > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
  const timeTaken = Number(result?.time_taken_seconds ?? timeTakenSeconds ?? 0);
  const mockTitle = getMockTitle(mock);

  const motivationText =
    pct >= 80 ? 'Excellent! 🎉' : pct >= 50 ? 'Keep going 🌱' : 'Keep going 🌱';

  const XP = Math.max(10, Math.round(totalCorrect * 10));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Back */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color="#3B7DF8" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Results label */}
        <Text style={styles.resultsLabel}>Results</Text>

        {/* Big circle score */}
        <View style={styles.scoreCircleWrap}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scorePct}>{pct}%</Text>
            <Text style={styles.scoreSubLabel}>{totalCorrect}/{totalQ} correct</Text>
          </View>
        </View>

        {/* Motivation */}
        <Text style={styles.motivationText}>{motivationText}</Text>
        <Text style={styles.mockTitleLabel}>{mockTitle}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark" size={18} color="#22C55E" />
            <Text style={styles.statValue}>{totalCorrect}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="close" size={18} color="#EF4444" />
            <Text style={styles.statValue}>{totalWrong}</Text>
            <Text style={styles.statLabel}>Wrong</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={18} color="#3B7DF8" />
            <Text style={styles.statValue}>{formatTime(timeTaken)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>

        {/* XP banner */}
        <View style={styles.xpBanner}>
          <Ionicons name="flash" size={16} color="#F59E0B" />
          <View style={{ flex: 1 }}>
            <Text style={styles.xpTitle}>+{XP} XP earned</Text>
            <Text style={styles.xpSub}>Streak extended · keep it up!</Text>
          </View>
        </View>

        {/* Review answers button */}
        {onViewSolutions && (
          <TouchableOpacity style={styles.reviewBtn} onPress={onViewSolutions} activeOpacity={0.85}>
            <Ionicons name="eye-outline" size={18} color="#fff" />
            <Text style={styles.reviewBtnText}>Review answers</Text>
          </TouchableOpacity>
        )}

        {/* Done button */}
        <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.75}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EEEFF5' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 15, fontWeight: '600', color: '#3B7DF8' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },

  resultsLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 8,
    marginBottom: 20,
    textDecorationLine: 'underline',
    textDecorationColor: '#EF4444',
  },

  scoreCircleWrap: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  scoreCircle: { alignItems: 'center', justifyContent: 'center' },
  scorePct: { fontSize: 48, fontWeight: '900', color: '#1A1A2E' },
  scoreSubLabel: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },

  motivationText: { fontSize: 24, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  mockTitleLabel: { fontSize: 13, color: '#9CA3AF', marginBottom: 28 },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  xpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  xpTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  xpSub: { fontSize: 12, color: '#B45309', marginTop: 2 },

  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B7DF8',
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
    marginBottom: 12,
  },
  reviewBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  doneBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
});