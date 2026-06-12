import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  createMockTestService,
  getMockTestsService,
  ExamObject,
  SubjectObject,
  OptionItem,
  TestType,
} from '../../libs/services/mock-library';
import { MockTest } from '@/src/libs/types/mock-library';
import { useTargetExam } from '@/src/libs/context/TagretExamContext';
import { useHeaderScrollHandler } from '@/src/libs/context/HeaderScrollContext';
import MockDetails from './Details';
import RequestMockModal from './RequestMock';


// ─── helpers ────────────────────────────────────────────────────────────────

// Pull `{ results, next }` out of a (possibly nested) paginated API response.
const extractPage = <T,>(response: any): { results: T[]; next: string | null } => {
  const body = response?.data ?? response;
  if (Array.isArray(body)) return { results: body, next: null };
  if (Array.isArray(body?.results)) return { results: body.results, next: body.next ?? null };
  if (Array.isArray(body?.data?.results))
    return { results: body.data.results, next: body.data.next ?? null };
  return { results: [], next: null };
};

const isExamObject = (v: MockTest['exam']): v is ExamObject =>
  typeof v === 'object' && v !== null && 'name' in v;

const isSubjectObject = (v: MockTest['subject']): v is SubjectObject =>
  typeof v === 'object' && v !== null && 'name' in v;

const getExamName = (exam: MockTest['exam']): string =>
  isExamObject(exam) ? exam.name : String(exam || '');

const getExamId = (exam: MockTest['exam']): number | null =>
  isExamObject(exam) ? exam.id : null;

const getSubjectName = (subject: MockTest['subject']): string =>
  isSubjectObject(subject) ? subject.name : String(subject || '');

const formatDuration = (mins: number | null | undefined): string => {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h * 60 + m} min`;
  if (h > 0) return `${h * 60} min`;
  return `${m} min`;
};

// Tag label for a mock (Recommended / Advanced / subject tag)
const getTagLabel = (mock: MockTest): string | null => {
  if ((mock as any).recommended) return 'Recommended';
  const title = mock.title ?? '';
  if (title.toLowerCase().includes('advanced')) return 'Advanced';
  const subjectName = getSubjectName(mock.subject);
  if (subjectName) return subjectName;
  return null;
};

const getTagColor = (label: string | null): string => {
  if (!label) return '#3B7DF8';
  if (label === 'Recommended') return '#3B7DF8';
  if (label === 'Advanced') return '#8B5CF6';
  return '#9CA3AF';
};

// ─── MockCard ────────────────────────────────────────────────────────────────

interface MockCardProps {
  mock: MockTest;
  onPress: () => void;
}

const MockCard: React.FC<MockCardProps> = ({ mock, onPress }) => {
  const isCompleted = mock.status === 'SUBMITTED';
  const score = mock.score ?? 0;
  const maxScore = mock.max_score ?? mock.question_count ?? 0;
  const lastPct = maxScore > 0 ? Math.round((score / maxScore) * 100) : null;

  const tagLabel = getTagLabel(mock);
  const tagColor = getTagColor(tagLabel);

  return (
    <TouchableOpacity style={styles.mockCard} onPress={onPress} activeOpacity={0.75}>
      {/* Icon */}
      <View style={styles.mockCardIcon}>
        <Ionicons name="document-text-outline" size={22} color="#3B7DF8" />
      </View>

      {/* Content */}
      <View style={styles.mockCardBody}>
        <Text style={styles.mockCardTitle} numberOfLines={1}>
          {mock.title || `${getExamName(mock.exam)} Mock`}
        </Text>

        {/* Tag + meta */}
        <View style={styles.mockCardMeta}>
          {tagLabel && (
            <View style={[styles.mockTag, { backgroundColor: tagColor + '18' }]}>
              <Text style={[styles.mockTagText, { color: tagColor }]}>{tagLabel}</Text>
            </View>
          )}
          <Text style={styles.mockMetaText}>
            {mock.question_count ?? 0} questions · {formatDuration(mock.total_duration_minutes)}
            {isCompleted && lastPct !== null ? ` · last ${lastPct}%` : ''}
          </Text>
        </View>
      </View>

      {/* Right: score % or chevron */}
      {isCompleted && lastPct !== null ? (
        <Text style={styles.mockCardScore}>{lastPct}%</Text>
      ) : (
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      )}
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

interface MockLibraryProps {
  testType?: TestType;
  title?: string;
  subtitle?: string;
  showBuild?: boolean;
}

export default function MockLibrary({
  testType = 'MOCK_TEST',
  title = 'Mock Tests',
  subtitle = 'Full-length, exam-pattern papers. Sit them under timed conditions.',
  showBuild = true,
}: MockLibraryProps = {}) {
  const { activeExamId } = useTargetExam();
  const onHeaderScroll = useHeaderScrollHandler();

  const [allMocks, setAllMocks] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedMock, setSelectedMock] = useState<MockTest | null>(null);
  const [resumeMock, setResumeMock] = useState<MockTest | null>(null);
  const [requestVisible, setRequestVisible] = useState(false);

  // Pagination — the list endpoint is paginated; pull pages as the user scrolls.
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  const loadMocks = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const response = await getMockTestsService(activeExamId ?? undefined, testType, 1);
      const { results, next } = extractPage<MockTest>(response);
      setAllMocks(results);
      setPage(1);
      setHasMore(!!next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mock tests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeExamId, testType]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || loading || refreshing || !hasMore) return;
    loadingMoreRef.current = true;
    const nextPage = page + 1;
    try {
      setLoadingMore(true);
      const response = await getMockTestsService(activeExamId ?? undefined, testType, nextPage);
      const { results, next } = extractPage<MockTest>(response);
      setAllMocks((prev) => {
        const seen = new Set(prev.map((m) => String(m.id)));
        return [...prev, ...results.filter((m) => !seen.has(String(m.id)))];
      });
      setPage(nextPage);
      setHasMore(!!next);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [activeExamId, testType, page, hasMore, loading, refreshing]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (distanceFromBottom < 400) loadMore();
  }, [loadMore]);

  useEffect(() => { loadMocks(); }, [loadMocks]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (requestVisible) { setRequestVisible(false); return true; }
      if (resumeMock) { setResumeMock(null); return true; }
      if (selectedMock) { setSelectedMock(null); return true; }
      return false;
    });
    return () => sub.remove();
  }, [requestVisible, resumeMock, selectedMock]);

  const mocks = allMocks
    // Only show the requested test type — the API sometimes ignores the
    // test_type query param and returns both PRACTICE_TEST and MOCK_TEST.
    .filter((m) => !m.test_type || m.test_type === testType)
    .filter((m) => {
      if (activeExamId == null) return true;
      const eid = getExamId(m.exam);
      return eid == null || String(eid) === String(activeExamId);
    });

  if (resumeMock) {
    return (
      <MockDetails
        mock={resumeMock}
        initialView="exam"
        onBack={() => { setResumeMock(null); loadMocks(true); }}
      />
    );
  }

  if (selectedMock) {
    return (
      <MockDetails
        mock={selectedMock}
        onBack={() => { setSelectedMock(null); loadMocks(true); }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={(e) => {
          handleScroll(e);
          onHeaderScroll(e);
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadMocks(true)}
            colors={['#3B7DF8']}
            tintColor="#3B7DF8"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.pageTitle}>{title}</Text>
            <Text style={styles.pageSubtitle}>{subtitle}</Text>
          </View>
          {showBuild && (
            <TouchableOpacity
              style={styles.buildBtn}
              onPress={() => setRequestVisible(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="add" size={15} color="#3B7DF8" />
              <Text style={styles.buildBtnText}>Build mock</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#3B7DF8" />
            <Text style={styles.loadingText}>Loading mock tests...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Ionicons name="wifi-outline" size={40} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadMocks()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardList}>
            {mocks.map((mock) => (
              <MockCard
                key={String(mock.id)}
                mock={mock}
                onPress={() => {
                  if (mock.status === 'IN_PROGRESS') setResumeMock(mock);
                  else setSelectedMock(mock);
                }}
              />
            ))}
            {mocks.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>No mock tests found</Text>
              </View>
            )}
            {loadingMore && (
              <ActivityIndicator size="small" color="#3B7DF8" style={{ marginVertical: 16 }} />
            )}
          </View>
        )}
      </ScrollView>

      <RequestMockModal
        visible={requestVisible}
        onClose={() => setRequestVisible(false)}
        onCreated={() => { setRequestVisible(false); loadMocks(true); }}
        defaultExamId={activeExamId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EEEFF5' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#EEEFF5',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: { flex: 1, marginRight: 12 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#9CA3AF', lineHeight: 18 },

  cardList: { paddingHorizontal: 16, gap: 12 },

  mockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  mockCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mockCardBody: { flex: 1 },
  mockCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  mockCardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  mockTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mockTagText: { fontSize: 11, fontWeight: '700' },
  mockMetaText: { fontSize: 12, color: '#9CA3AF' },
  mockCardScore: {
    fontSize: 16,
    fontWeight: '800',
    color: '#22C55E',
    flexShrink: 0,
  },

  buildBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#3B7DF8',
    borderStyle: 'dashed',
    backgroundColor: '#fff',
    flexShrink: 0,
  },
  buildBtnText: { fontSize: 13, fontWeight: '600', color: '#3B7DF8' },

  centered: { alignItems: 'center', paddingTop: 60, gap: 12 },
  loadingText: { fontSize: 14, color: '#9CA3AF' },
  errorText: { fontSize: 14, color: '#EF4444', textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: {
    backgroundColor: '#3B7DF8',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});