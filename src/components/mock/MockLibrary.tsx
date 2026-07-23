import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/src/libs/utils/apiError';
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getMockTestsService,
  getMockTestByIdService,
  ExamObject,
  SubjectObject,
  TestType,
} from '../../libs/services/mock-library';
import { MockTest } from '@/src/libs/types/mock-library';
import { useTargetExam } from '@/src/libs/context/TagretExamContext';
import { getScoreColor } from '@/src/styles/styles';
import { useHeaderScrollHandler } from '@/src/libs/context/HeaderScrollContext';
import MockDetails from './Details';
import RequestMockModal from './RequestMock';
import { getActiveAttempt, submitAbandonedAttempt } from '@/src/libs/utils/examSession';
import { mockLibraryStyles as styles } from '@/src/styles/styles/mock/mocklibrarystyles';


// ─── helpers ────────────────────────────────────────────────────────────────

// Pull `{ results, next, count }` out of a (possibly nested) paginated API
// response. `count` is the server-side total across all pages (null when the
// response isn't paginated).
const extractPage = <T,>(
  response: any,
): { results: T[]; next: string | null; count: number | null } => {
  const body = response?.data ?? response;
  if (Array.isArray(body)) return { results: body, next: null, count: body.length };
  if (Array.isArray(body?.results))
    return { results: body.results, next: body.next ?? null, count: body.count ?? null };
  if (Array.isArray(body?.data?.results))
    return {
      results: body.data.results,
      next: body.data.next ?? null,
      count: body.data.count ?? null,
    };
  return { results: [], next: null, count: null };
};

const isExamObject = (v: MockTest['exam']): v is ExamObject =>
  typeof v === 'object' && v !== null && 'name' in v;

const isSubjectObject = (v: MockTest['subject']): v is SubjectObject =>
  typeof v === 'object' && v !== null && 'name' in v;

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
  if (!label) return '#6C63FF';
  if (label === 'Recommended') return '#6C63FF';
  if (label === 'Advanced') return '#8B5CF6';
  return '#9CA3AF';
};

// ─── MockCard ────────────────────────────────────────────────────────────────

interface MockCardProps {
  mock: MockTest;
  onPress: () => void;
}

const MockCard: React.FC<MockCardProps> = ({ mock, onPress }) => {
  const isCompleted = mock.latest_attempt_status === 'SUBMITTED';
  const lastPct = mock?.percentage;
  const lastAccuracy = mock?.accuracy;
  const tagLabel = getTagLabel(mock);
  const tagColor = getTagColor(tagLabel);

  return (
    <TouchableOpacity style={styles.mockCard} onPress={onPress} activeOpacity={0.75}>
      {/* Icon */}
      <View style={styles.mockCardIcon}>
        <Ionicons name="document-text-outline" size={22} color="#6C63FF" />
      </View>

      {/* Content */}
      <View style={styles.mockCardBody}>
        <View style={styles.mockCardTitleRow}>
          <Text style={styles.mockCardTitle} numberOfLines={1}>
            {mock.name}
          </Text>
          {mock.is_official && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Official Mock</Text>
            </View>
          )}
        </View>

        {/* Tag + meta */}
        <View style={styles.mockCardMeta}>
          {tagLabel && (
            <View style={[styles.mockTag, { backgroundColor: tagColor + '18' }]}>
              <Text style={[styles.mockTagText, { color: tagColor }]}>{tagLabel}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="document-text-outline" size={12} color="#6B7280" />
            <Text style={styles.metaItemText}>{mock.question_count ?? 0} Qs</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color="#6B7280" />
            <Text style={styles.metaItemText}>{formatDuration(mock.total_duration_minutes)}</Text>
          </View>
          {lastAccuracy ? (
            <Text style={styles.metaItemText}>Accuracy: {lastAccuracy}%</Text>
          ) : null}
          {isCompleted && lastPct != null ? (
            <Text style={styles.metaItemText}>last {lastPct}%</Text>
          ) : null}
        </View>
      </View>

      {/* Right: score % or chevron */}
      {isCompleted && lastPct != null ? (
        <Text style={[styles.mockCardScore, { color: getScoreColor(lastPct) }]}>
          {lastPct}%
        </Text>
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
  const router = useRouter();
  // Deep-link (e.g. from a notification): open a specific mock's detail or
  // results directly. `attemptId` targets a specific attempt's results.
  const params = useLocalSearchParams<{
    openMockId?: string;
    view?: string;
    attemptId?: string;
  }>();
  const handledDeepLinkRef = useRef<string | null>(null);
  const [deepLink, setDeepLink] = useState<{
    mock: MockTest;
    view: 'detail' | 'results';
    attemptId: number | null;
  } | null>(null);
  // True while the deep-linked mock is being fetched — shows a loader instead
  // of flashing the library list before the redirect lands.
  const [deepLinkResolving, setDeepLinkResolving] = useState(false);

  const [allMocks, setAllMocks] = useState<MockTest[]>([]);
  // Server-side total across all pages (the paginated response's `count`).
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedMock, setSelectedMock] = useState<MockTest | null>(null);
  const [resumeMock, setResumeMock] = useState<MockTest | null>(null);
  const [requestVisible, setRequestVisible] = useState(false);

  // Tabs — split mocks into student-generated vs official.
  const [activeTab, setActiveTab] = useState<'student' | 'official'>('student');

  // Pagination — the list endpoint is paginated; pull the next page when the
  // user taps "Load more".
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMocks = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const response = await getMockTestsService(activeExamId ?? undefined, testType, 1);
      const { results, next, count } = extractPage<MockTest>(response);
      setAllMocks(results);
      setTotalCount(count);
      setPage(1);
      setHasMore(!!next);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load mock tests.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeExamId, testType]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || refreshing || !hasMore) return;
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
    }
  }, [activeExamId, testType, page, hasMore, loading, refreshing, loadingMore]);

  useEffect(() => { loadMocks(); }, [loadMocks]);

  // Deep-link from a notification: fetch the mock by id (it may be on any page
  // of the paginated list) and open its detail — or its results when the alert
  // carries an attempt id (RESULT_PUBLISHED).
  useEffect(() => {
    const { openMockId, view, attemptId } = params;
    if (!openMockId) return;
    if (handledDeepLinkRef.current === String(openMockId)) return;
    handledDeepLinkRef.current = String(openMockId);

    let cancelled = false;
    setDeepLinkResolving(true);
    (async () => {
      try {
        const res: any = await getMockTestByIdService(openMockId);
        const mock: MockTest | null = res?.data ?? res ?? null;
        if (cancelled || !mock || mock.id == null) return;
        const aId = Number(attemptId);
        setDeepLink({
          mock,
          view: view === 'results' ? 'results' : 'detail',
          attemptId: Number.isFinite(aId) && aId > 0 ? aId : null,
        });
      } catch {
        // Mock unavailable (deleted/forbidden) — stay on the library list.
      } finally {
        if (!cancelled) {
          setDeepLinkResolving(false);
          router.setParams({ openMockId: undefined, view: undefined, attemptId: undefined } as any);
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.openMockId, params.view, params.attemptId]);

  // Auto-submit a timed-out mock and refresh the list. Mocks are self-paced, so
  // their deadline isn't in the list data — it lives in the stored active
  // attempt. On foreground (a reopen), submit any abandoned attempt then refetch
  // so its card flips from in-progress to submitted; while the library sits open,
  // a timer fires the same at the exact deadline. submitAbandonedAttempt() is a
  // no-op unless a stored attempt's deadline has actually passed.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const settleAndRefresh = async () => {
      await submitAbandonedAttempt();
      if (!cancelled) loadMocks(true);
    };

    const scheduleTimer = async () => {
      if (timer) { clearTimeout(timer); timer = null; }
      const record = await getActiveAttempt();
      if (cancelled || !record || record.kind !== 'mock') return;
      const msLeft = record.deadline - Date.now();
      // +1s so the deadline has definitely passed when the timer fires.
      if (msLeft > 0) timer = setTimeout(settleAndRefresh, msLeft + 1000);
      else settleAndRefresh();
    };

    scheduleTimer();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') { settleAndRefresh(); scheduleTimer(); }
    });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      sub.remove();
    };
  }, [loadMocks]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (requestVisible) { setRequestVisible(false); return true; }
      if (resumeMock) { setResumeMock(null); return true; }
      if (selectedMock) { setSelectedMock(null); return true; }
      if (deepLink) { setDeepLink(null); return true; }
      return false;
    });
    return () => sub.remove();
  }, [requestVisible, resumeMock, selectedMock, deepLink]);

  const visibleMocks = allMocks
    // Only show the requested test type — the API sometimes ignores the
    // test_type query param and returns both PRACTICE_TEST and MOCK_TEST.
    .filter((m) => !m.test_type || m.test_type === testType)
    .filter((m) => {
      if (activeExamId == null) return true;
      const eid = getExamId(m.exam);
      return eid == null || String(eid) === String(activeExamId);
    });

  const studentMocks = visibleMocks.filter((m) => !m.is_official);
  const officialMocks = visibleMocks.filter((m) => m.is_official);
  const mocks = activeTab === 'official' ? officialMocks : studentMocks;

  // Keep pulling pages until the active tab shows at least 10 mocks (or the
  // API runs out). A page mixes both categories, so one tab can lag behind.
  useEffect(() => {
    if (!loading && !refreshing && !loadingMore && hasMore && mocks.length < 10) {
      loadMore();
    }
  }, [mocks.length, hasMore, loading, refreshing, loadingMore, loadMore]);

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

  // Deep-linked mock still being fetched — loader instead of the list flash.
  if (deepLinkResolving) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      </SafeAreaView>
    );
  }

  // Notification deep-link target — detail, or results for a specific attempt.
  if (deepLink) {
    return (
      <MockDetails
        mock={deepLink.mock}
        initialView={deepLink.view}
        initialAttemptId={deepLink.attemptId}
        onBack={() => { setDeepLink(null); loadMocks(true); }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={onHeaderScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadMocks(true)}
            colors={['#6C63FF']}
            tintColor="#6C63FF"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <View style={styles.pageTitleRow}>
              <Text style={styles.pageTitle}>{title}</Text>
              {totalCount != null && (
                <View style={styles.pageCountBadge}>
                  <Text style={styles.pageCountText}>{totalCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.pageSubtitle}>{subtitle}</Text>
          </View>
          {showBuild && (
            <TouchableOpacity
              style={styles.buildBtn}
              onPress={() => setRequestVisible(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="add" size={15} color="#6C63FF" />
              <Text style={styles.buildBtnText}>Build mock</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs — each shows its mock count; "+" while more pages remain,
            since the paginated list may not be fully loaded yet. */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'student' && styles.tabActive]}
            onPress={() => setActiveTab('student')}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, activeTab === 'student' && styles.tabTextActive]}>
              My Mocks
            </Text>
            {!loading && (
              <View
                style={[
                  styles.tabCountBadge,
                  activeTab === 'student' && styles.tabCountBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    activeTab === 'student' && styles.tabCountTextActive,
                  ]}
                >
                  {studentMocks.length}
                  {hasMore ? '+' : ''}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'official' && styles.tabActive]}
            onPress={() => setActiveTab('official')}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, activeTab === 'official' && styles.tabTextActive]}>
              Official Mocks
            </Text>
            {!loading && (
              <View
                style={[
                  styles.tabCountBadge,
                  activeTab === 'official' && styles.tabCountBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    activeTab === 'official' && styles.tabCountTextActive,
                  ]}
                >
                  {officialMocks.length}
                  {hasMore ? '+' : ''}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#6C63FF" />
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
                  // Resume keys off the ATTEMPT status, not the mock's publish
                  // `status` (which is PUBLISHED/etc., never IN_PROGRESS).
                  if (mock.latest_attempt_status === 'IN_PROGRESS')
                    setResumeMock(mock);
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

            {/* Load more */}
            {hasMore && mocks.length > 0 && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={loadMore}
                disabled={loadingMore}
                activeOpacity={0.75}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#6C63FF" />
                ) : (
                  <Text style={styles.loadMoreText}>Load more</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <RequestMockModal
        visible={requestVisible}
        onClose={() => setRequestVisible(false)}
        onCreated={() => { setRequestVisible(false); loadMocks(true); }}
        defaultExamId={activeExamId}
        testType={testType}
      />
    </SafeAreaView>
  );
}
