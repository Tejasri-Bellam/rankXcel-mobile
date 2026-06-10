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
import {
  getassessmentResultService,
  getAssessmentDetailedAnalysisService,
} from '@/src/libs/services/assessments-attempts';

interface Props {
  attemptId: number;
  exam: any;
  answers?: Record<string, string[]>;
  timeTakenSeconds: number;
  onBack: () => void;
  onViewSolutions?: () => void;
  onDone?: () => void;
}

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function ExamResults({
  attemptId,
  exam,
  timeTakenSeconds,
  onBack,
  onViewSolutions,
  onDone,
}: Props) {
  const [result, setResult] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadResult(); }, []);

  const loadResult = async () => {
    try {
      setLoading(true);
      setError(null);
      // The /result/ endpoint doesn't always carry the correct/wrong
      // breakdown; the detailed-analysis endpoint does. Fetch both.
      const [resultRes, analysisRes] = await Promise.allSettled([
        getassessmentResultService(attemptId),
        getAssessmentDetailedAnalysisService(attemptId),
      ]);
      const resultData =
        resultRes.status === 'fulfilled' ? (resultRes.value as any)?.data ?? null : null;
      const analysisData =
        analysisRes.status === 'fulfilled' ? (analysisRes.value as any)?.data ?? null : null;
      console.log('ASSESSMENT RESULT API:', JSON.stringify(resultData, null, 2));
      console.log('ASSESSMENT ANALYSIS API:', JSON.stringify(analysisData, null, 2));
      setResult(resultData);
      setAnalysis(analysisData);
      if (!resultData && !analysisData) setError('Failed to load results.');
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
  const num = (...vals: any[]): number => {
    for (const v of vals) {
      if (v != null && !Number.isNaN(Number(v))) return Number(v);
    }
    return 0;
  };

  // Aggregate correct/wrong/skipped from a chapter_breakdown map/array or a
  // subject_summary array (both share the same per-row field names).
  const sumRows = (source: any): { c: number; w: number; s: number } => {
    const cb = source?.chapter_breakdown ?? source?.subject_summary;
    const rows = Array.isArray(cb)
      ? cb
      : cb && typeof cb === 'object'
      ? Object.values(cb)
      : [];
    return rows.reduce(
      (acc: any, r: any) => ({
        c: acc.c + num(r?.correct),
        w: acc.w + num(r?.wrong),
        s: acc.s + num(r?.unattempted, r?.skipped),
      }),
      { c: 0, w: 0, s: 0 },
    );
  };

  const bd = sumRows(analysis);
  const bdAlt = sumRows(result);
  const bdCorrect = bd.c || bdAlt.c;
  const bdWrong = bd.w || bdAlt.w;
  const bdSkipped = bd.s || bdAlt.s;

  const totalCorrect = num(
    result?.correct, result?.total_correct, analysis?.correct, analysis?.total_correct, bdCorrect,
  );
  const totalWrong = num(
    result?.wrong, result?.total_wrong, analysis?.wrong, analysis?.total_wrong, bdWrong,
  );
  const totalSkipped = num(
    result?.skipped, result?.unattempted, analysis?.skipped, analysis?.unattempted, bdSkipped,
  );

  const totalQ =
    num(result?.total_questions, result?.total, analysis?.total_questions) ||
    totalCorrect + totalWrong + totalSkipped ||
    exam?.question_count ||
    0;
  const pct = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
  const timeTaken = num(result?.time_taken_seconds, analysis?.time_taken_seconds, timeTakenSeconds);

  const assessmentName: string =
    result?.assessment?.name ?? exam?.name ?? 'Assessment';

  const motivationText = pct >= 80 ? 'Excellent! 🎉' : 'Keep going 🌱';
  const XP = Math.max(10, Math.round(totalCorrect * 10));

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
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
            <Text style={styles.scorePct} numberOfLines={1} adjustsFontSizeToFit>
              {pct}%
            </Text>
            <Text style={styles.scoreSubLabel}>{totalCorrect}/{totalQ} correct</Text>
          </View>
        </View>

        {/* Motivation */}
        <Text style={styles.motivationText}>{motivationText}</Text>
        <Text style={styles.mockTitleLabel}>{assessmentName} · live</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark" size={16} color="#22C55E" />
            <Text style={styles.statValue}>{totalCorrect}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="close" size={16} color="#EF4444" />
            <Text style={styles.statValue}>{totalWrong}</Text>
            <Text style={styles.statLabel}>Wrong</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="remove-outline" size={16} color="#9CA3AF" />
            <Text style={styles.statValue}>{totalSkipped}</Text>
            <Text style={styles.statLabel}>Skipped</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={16} color="#3B7DF8" />
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
        <TouchableOpacity style={styles.doneBtn} onPress={onDone ?? onBack} activeOpacity={0.75}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>

        {error && <Text style={styles.errorNote}>{error}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EEEFF5' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 15, fontWeight: '600', color: '#3B7DF8' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' },

  resultsLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 4,
    marginBottom: 14,
    textDecorationLine: 'underline',
    textDecorationColor: '#EF4444',
  },

  scoreCircleWrap: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  scoreCircle: { alignItems: 'center', justifyContent: 'center' },
  scorePct: { fontSize: 40, fontWeight: '900', color: '#1A1A2E' },
  scoreSubLabel: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },

  motivationText: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  mockTitleLabel: { fontSize: 13, color: '#9CA3AF', marginBottom: 16 },

  statsRow: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  xpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
    width: '100%',
    marginBottom: 14,
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
    paddingVertical: 15,
    width: '100%',
    marginBottom: 10,
  },
  reviewBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  doneBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },

  errorNote: { marginTop: 14, fontSize: 13, color: '#EF4444' },
});
