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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getExamsListService } from '@/src/libs/services/profile';
import { mockLibraryStyles as styles } from '@/src/styles/styles/mock/mocklibrarystyles';


// ─── helpers ────────────────────────────────────────────────────────────────

// Mocks per page. Only page 1 is fetched on open; the rest come from "Load more".
const PAGE_SIZE = 20;

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
  // Tapping "Resume" on an in-progress card — goes straight back into the exam.
  onResume: () => void;
}

const MockCard: React.FC<MockCardProps> = ({ mock, onPress, onResume }) => {
  const isCompleted = mock.latest_attempt_status === 'SUBMITTED';
  // A started-but-unsubmitted attempt (the student closed the app / left mid
  // test). Keys off the ATTEMPT status, not the mock's publish `status`.
  const isInProgress = mock.latest_attempt_status === 'IN_PROGRESS';
  const lastPct = mock?.percentage;
  const lastAccuracy = mock?.accuracy;
  const tagLabel = getTagLabel(mock);
  const tagColor = getTagColor(tagLabel);

  // PASS_FAIL exams are scored against a fixed pass mark — shown alongside the
  // question count / duration so students know the bar before they start.
  const { getExamScoring } = useTargetExam();
  const { isPassFail, passMarks } = getExamScoring(
    typeof mock.exam === 'object' && mock.exam !== null ? mock.exam.id : mock.exam
  );

  return (
    <TouchableOpacity
      style={[styles.mockCard, isInProgress && styles.mockCardInProgress]}
      onPress={onPress}
      activeOpacity={0.75}
    >
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
          {isInProgress && (
            <View style={styles.inProgressPill}>
              <View style={styles.inProgressDot} />
              <Text style={styles.inProgressPillText}>In progress</Text>
            </View>
          )}
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
          {isPassFail && passMarks != null ? (
            <View style={styles.metaItem}>
              <Ionicons name="flag-outline" size={12} color="#6B7280" />
              <Text style={styles.metaItemText}>Pass marks {passMarks}</Text>
            </View>
          ) : null}
          {lastAccuracy ? (
            <Text style={styles.metaItemText}>Accuracy: {lastAccuracy}%</Text>
          ) : null}
          {isCompleted && lastPct != null ? (
            <Text style={styles.metaItemText}>last {lastPct}%</Text>
          ) : null}
        </View>
      </View>

      {/* Right: Resume CTA for an unfinished attempt, else score % or chevron */}
      {isInProgress ? (
        <TouchableOpacity
          style={styles.resumeCardBtn}
          onPress={onResume}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={13} color="#fff" />
          <Text style={styles.resumeCardBtnText}>Resume</Text>
        </TouchableOpacity>
      ) : isCompleted && lastPct != null ? (
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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedMock, setSelectedMock] = useState<MockTest | null>(null);
  const [resumeMock, setResumeMock] = useState<MockTest | null>(null);
  const [requestVisible, setRequestVisible] = useState(false);

  // Tabs — split mocks into official vs student-generated. Official is first in
  // the bar, so it's also the one selected on open.
  const [activeTab, setActiveTab] = useState<'student' | 'official'>('official');

  // Exam ids offered in the student's country. `/v1/mock-tests/` takes no
  // country filter (only `page`), so with no target exam selected it returns
  // every country's mocks — they're scoped against this set instead. Null means
  // "couldn't determine", in which case nothing is filtered out.
  const [countryExamIds, setCountryExamIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Persisted from /get_country/ at login, and on every region switch.
        const countryId = await AsyncStorage.getItem('regionCountryId');
        if (!countryId) return;
        const res = await getExamsListService(countryId);
        const { results } = extractPage<{ id: number | string }>(res);
        const ids = new Set(
          results.map((e) => String(e?.id)).filter((id) => id && id !== 'undefined'),
        );
        if (active && ids.size > 0) setCountryExamIds(ids);
      } catch {
        // Leave unfiltered rather than risk hiding the whole library.
      }
    })();
    return () => {
      active = false;
    };
    // Re-read after a region switch — that resets the target exams, and with
    // them the active exam.
  }, [activeExamId]);

  // Pagination — the list endpoint is paginated; pull the next page when the
  // user taps "Load more".
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // The server's `count` — the total across every page of this exam's list, so
  // the header badge shows the real total from page 1 alone. Null when the
  // response isn't paginated.
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const loadMocks = useCallback(async (isRefresh = false) => {
    // No active exam (e.g. the student switched to a country they have no
    // target exam in): show nothing rather than an unscoped list of every
    // exam's mocks — or the previous exam's, left over on screen.
    if (activeExamId == null) {
      setAllMocks([]);
      setHasMore(false);
      setTotalCount(null);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const response = await getMockTestsService(activeExamId, testType, 1, PAGE_SIZE);
      const { results, next, count } = extractPage<MockTest>(response);
      setAllMocks(results);
      setPage(1);
      setHasMore(!!next);
      setTotalCount(count);
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
      const response = await getMockTestsService(
        activeExamId ?? undefined,
        testType,
        nextPage,
        PAGE_SIZE,
      );
      const { results, next, count } = extractPage<MockTest>(response);
      setAllMocks((prev) => {
        const seen = new Set(prev.map((m) => String(m.id)));
        return [...prev, ...results.filter((m) => !seen.has(String(m.id)))];
      });
      setPage(nextPage);
      setHasMore(!!next);
      if (count != null) setTotalCount(count);
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

  // Close the notification deep-link view. The mock was reached by `router.push`
  // from the notifications screen, so pop back there rather than revealing the
  // library list the user never navigated through. Nothing to pop (app opened
  // straight onto the deep-link) → go to the root.
  const closeDeepLink = () => {
    setDeepLink(null);
    if (router.canGoBack()) router.back();
    else router.replace('/dashboard');
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (requestVisible) { setRequestVisible(false); return true; }
      if (resumeMock) { setResumeMock(null); return true; }
      if (selectedMock) { setSelectedMock(null); return true; }
      if (deepLink) { closeDeepLink(); return true; }
      return false;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestVisible, resumeMock, selectedMock, deepLink]);

  // Shared by the rendered list and the background count list, so a badge can
  // never count something the list itself would hide.
  const inScope = (m: MockTest): boolean => {
    // Only show the requested test type — the API sometimes ignores the
    // test_type query param and returns both PRACTICE_TEST and MOCK_TEST.
    if (m.test_type && m.test_type !== testType) return false;
    const eid = getExamId(m.exam);
    // Can't tell which exam it belongs to — keep it rather than hide it.
    if (eid == null) return true;
    // A target exam is selected: the list came from that exam's endpoint, so
    // it's already country-correct; drop anything else that slipped through.
    if (activeExamId != null) return String(eid) === String(activeExamId);
    // No target exam: the list is the unscoped /v1/mock-tests/, which mixes
    // every country. Keep only exams offered in the student's country.
    return countryExamIds == null || countryExamIds.has(String(eid));
  };

  const visibleMocks = allMocks.filter(inScope);

  const studentMocks = visibleMocks.filter((m) => !m.is_official);
  const officialMocks = visibleMocks.filter((m) => m.is_official);
  const mocks = activeTab === 'official' ? officialMocks : studentMocks;

  // Header badge: the server's total across every page, so it's exact from page
  // 1 alone. The per-tab badges have no server equivalent — the response carries
  // no Official / My Mocks split — so they count the pages loaded so far and
  // carry a "+" while more remain.
  const totals = {
    all: totalCount ?? visibleMocks.length,
    official: officialMocks.length,
    student: studentMocks.length,
    partial: hasMore,
  };

  const fetchingMore = loadingMore;

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
        onBack={closeDeepLink}
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
              {/* The server's `count` — exact, and no longer the whole-catalogue
                  number that once showed for a country with no mocks: the list
                  is scoped to the active exam and test type. */}
              {!loading && (
                <View style={styles.pageCountBadge}>
                  <Text style={styles.pageCountText}>{totals.all}</Text>
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

        {/* Tabs — each shows its true mock count, which appears only once the
            background walk over every page has finished. */}
        <View style={styles.tabBar}>
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
                  {totals.official}
                  {totals.partial ? '+' : ''}
                </Text>
              </View>
            )}
          </TouchableOpacity>
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
                  {totals.student}
                  {totals.partial ? '+' : ''}
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
                // Tapping the card always opens the detail page — for an
                // in-progress mock that's where the "Resume mock" CTA lives, so
                // the student is never dropped back into a running test without
                // meaning to. The card's own Resume button is the shortcut.
                onPress={() => setSelectedMock(mock)}
                onResume={() => setResumeMock(mock)}
              />
            ))}
            {/* A page mixes both categories, so a tab can be empty while pages
                remain — offer "Load more" below rather than "nothing here". */}
            {mocks.length === 0 && !fetchingMore && !hasMore && (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>No mock tests found</Text>
              </View>
            )}

            {/* A page is on its way: plain spinner, no button. The
                button-with-a-spinner-inside made the pill flicker between label
                and spinner on every page while the list grew. */}
            {fetchingMore ? (
              <View style={styles.loadMoreSpinner}>
                <ActivityIndicator size="small" color="#6C63FF" />
              </View>
            ) : (
              hasMore && (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={loadMore}
                  activeOpacity={0.75}
                >
                  <Text style={styles.loadMoreText}>Load more</Text>
                </TouchableOpacity>
              )
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
