import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../common/Header';
import { ProfileMenu } from '../common/ProfileMenu';
import Sidebar from '../common/Sidebar';
import { SORT_OPTIONS } from '../json/mockLibrary';
import { mockLibraryStyles } from '@/src/styles/sidebar/mockLibraryStyles';
import { COLORS } from '@/src/styles/styles';
import {
  ExamObject,
  getMockTestsService,
  startMockTestService,
  SubjectObject,
} from '../../libs/services/mock-library';
import { Difficulty, MockStatus, MockTest } from '@/src/libs/types/mock-library';
 

 
  // Type-safe
 
type NormalizedDifficulty = 'Easy' | 'Medium' | 'Hard';
 
// Type guards
const isExamObject = (v: MockTest['exam']): v is ExamObject =>
  typeof v === 'object' && v !== null && 'name' in v;
 
const isSubjectObject = (v: MockTest['subject']): v is SubjectObject =>
  typeof v === 'object' && v !== null && 'name' in v;
 
const getExamName = (exam: MockTest['exam']): string =>
  isExamObject(exam) ? exam.name : String(exam || '');
 
const getSubjectName = (subject: MockTest['subject']): string =>
  isSubjectObject(subject) ? subject.name : String(subject || '');
 
// Normalize difficulty: API returns 'easy' | 'medium' | 'hard' (lowercase)
const normalizeDifficulty = (d: Difficulty | string | undefined): NormalizedDifficulty => {
  if (!d) return 'Medium';
  const lower = String(d).toLowerCase();
  if (lower === 'easy') return 'Easy';
  if (lower === 'hard') return 'Hard';
  return 'Medium';
};
 
const examTagColor = (exam: string): string => {
  if (!exam) return COLORS.primary;
  const e = exam.toUpperCase();
  if (e.includes('EAMCET')) return COLORS.primary;
  if (e.includes('JEE MAINS')) return COLORS.orange;
  if (e.includes('JEE2')) return '#8B5CF6';
  if (e.includes('JEE')) return '#10B981';
  if (e.includes('LIFE')) return '#0EA5E9';
  return COLORS.primary;
};
 
const difficultyColor = (d: Difficulty | string | undefined): string => {
  const n = normalizeDifficulty(d);
  if (n === 'Easy') return COLORS.green;
  if (n === 'Medium') return COLORS.orange;
  return COLORS.red;
};
 
const difficultyBg = (d: Difficulty | string | undefined): string => {
  const n = normalizeDifficulty(d);
  if (n === 'Easy') return '#F0FDF4';
  if (n === 'Medium') return '#FFFBEB';
  return '#FEF2F2';
};
 
/* ----- Status helpers (uppercase, matching the API) ----- */
const statusLabel = (s: MockStatus): string => {
  if (s === 'IN_PROGRESS') return 'In Progress';
  if (s === 'SUBMITTED') return 'Completed';
  return 'Not Started';
};
 
const statusColor = (s: MockStatus): string => {
  if (s === 'IN_PROGRESS') return COLORS.primary;
  if (s === 'SUBMITTED') return COLORS.green;
  return COLORS.textLight;
};
 
const statusBg = (s: MockStatus): string => {
  if (s === 'IN_PROGRESS') return '#EEF2FF';
  if (s === 'SUBMITTED') return '#F0FDF4';
  return '#F3F4F6';
};
 
const formatDuration = (mins: number | null | undefined): string => {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} hr ${m} min`;
  if (h > 0) return `${h} hr`;
  return `${m} min`;
};
 
const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    let hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    return `${day} ${month} ${year}, ${hours}:${mins} ${ampm}`;
  } catch {
    return '';
  }
};
 
/* ============================================================
   Mock Card
   ============================================================ */
interface MockCardProps {
  mock: MockTest;
  onStart: (id: string) => void;
  onResume: (id: string) => void;
  onView: (id: string) => void;
  actionLoadingId: string | null;
}
 
const MockCard: React.FC<MockCardProps> = ({
  mock,
  onStart,
  onResume,
  onView,
  actionLoadingId,
}) => {
  const examName = getExamName(mock.exam);
  const subjectName = getSubjectName(mock.subject);
 
  const tagColor = examTagColor(examName);
  const tagBg = tagColor + '15';
 
  const isCompleted = mock.status === 'SUBMITTED';
  const isInProgress = mock.status === 'IN_PROGRESS';
  const isNotStarted = mock.status === 'NOT_STARTED';
 
  const isLoading = actionLoadingId === String(mock.id);
 
  const score = mock.score ?? 0;
  const maxScore = mock.max_score ?? mock.question_count ?? 0;
  const accuracy = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const percentile = mock.percentile ?? 0;
 
  return (
<View style={mockLibraryStyles.mockCard}>
<View style={mockLibraryStyles.mockCardTop}>
<View style={[mockLibraryStyles.examTag, { backgroundColor: tagBg }]}>
<Text style={[mockLibraryStyles.examTagText, { color: tagColor }]}>
            {examName}
</Text>
</View>
 
        <View
          style={[
            mockLibraryStyles.statusPill,
            { backgroundColor: statusBg(mock.status) },
          ]}
>
<View
            style={[
              mockLibraryStyles.statusDot,
              { backgroundColor: statusColor(mock.status) },
            ]}
          />
<Text
            style={[
              mockLibraryStyles.statusText,
              { color: statusColor(mock.status) },
            ]}
>
            {statusLabel(mock.status)}
</Text>
</View>
</View>
 
      <Text style={mockLibraryStyles.mockTitle}>
        {mock.title || `${examName} — Custom Mock`}
</Text>
<Text style={mockLibraryStyles.mockSubject}>{subjectName}</Text>
 
      <View style={mockLibraryStyles.metaRow}>
<View style={mockLibraryStyles.metaChip}>
<Ionicons name="time-outline" size={13} color={COLORS.textMedium} />
<Text style={mockLibraryStyles.metaChipText}>
            {formatDuration(mock.total_duration_minutes)}
</Text>
</View>
 
        <View style={mockLibraryStyles.metaChip}>
<Ionicons name="book-outline" size={13} color={COLORS.textMedium} />
<Text style={mockLibraryStyles.metaChipText}>
            {mock.question_count ?? 0} Q
</Text>
</View>
 
        <View style={mockLibraryStyles.metaChip}>
<Ionicons name="stats-chart-outline" size={13} color={COLORS.textMedium} />
<Text style={mockLibraryStyles.metaChipText}>
            {mock.max_score ?? mock.question_count ?? 0} Marks
</Text>
</View>
</View>
 
      <View
        style={[
          mockLibraryStyles.difficultyBadge,
          { backgroundColor: difficultyBg(mock.difficulty) },
        ]}
>
<Text
          style={[
            mockLibraryStyles.difficultyText,
            { color: difficultyColor(mock.difficulty) },
          ]}
>
          {normalizeDifficulty(mock.difficulty)}
</Text>
</View>
 
      {isCompleted && (
<View style={mockLibraryStyles.statsRow}>
<View style={mockLibraryStyles.statItem}>
<Text style={mockLibraryStyles.statValue}>
              {score}/{maxScore}
</Text>
<Text style={mockLibraryStyles.statLabel}>Score</Text>
</View>
<View style={mockLibraryStyles.statDivider} />
<View style={mockLibraryStyles.statItem}>
<Text style={mockLibraryStyles.statValue}>{percentile}%ile</Text>
<Text style={mockLibraryStyles.statLabel}>Percentile</Text>
</View>
<View style={mockLibraryStyles.statDivider} />
<View style={mockLibraryStyles.statItem}>
<Text style={mockLibraryStyles.statValue}>{accuracy}%</Text>
<Text style={mockLibraryStyles.statLabel}>Accuracy</Text>
</View>
</View>
      )}
 
      {isCompleted && mock.submitted_at && (
<Text style={mockLibraryStyles.lastAttempt}>
          Last attempt: {formatDate(mock.submitted_at)}
</Text>
      )}
      {isInProgress && mock.started_at && (
<Text style={mockLibraryStyles.lastAttempt}>
          Started: {formatDate(mock.started_at)}
</Text>
      )}
 
      <View style={mockLibraryStyles.actionRow}>
        {isNotStarted && (
<TouchableOpacity
            style={mockLibraryStyles.startBtn}
            onPress={() => onStart(String(mock.id))}
            disabled={isLoading}
>
            {isLoading ? (
<ActivityIndicator size="small" color={COLORS.white} />
            ) : (
<>
<Ionicons name="play" size={14} color={COLORS.white} />
<Text style={mockLibraryStyles.startBtnText}>Start Mock</Text>
</>
            )}
</TouchableOpacity>
        )}
 
        {isInProgress && (
    <TouchableOpacity
                style={[mockLibraryStyles.startBtn, { backgroundColor: COLORS.primary }]}
                onPress={() => onResume(String(mock.id))}
                disabled={isLoading}
    >
    <Ionicons name="play-forward" size={14} color={COLORS.white} />
    <Text style={mockLibraryStyles.startBtnText}>Resume</Text>
    </TouchableOpacity>
        )}
 
        {isCompleted && (
<TouchableOpacity
            style={mockLibraryStyles.viewBtn}
            onPress={() => onView(String(mock.id))}
>
<Ionicons name="eye-outline" size={14} color={COLORS.primary} />
<Text style={mockLibraryStyles.viewBtnText}>View Results</Text>
</TouchableOpacity>
        )}
</View>
</View>
  );
};
 
/* ============================================================
   Filter Modal
   ============================================================ */
interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedExams: string[];
  setSelectedExams: (v: string[]) => void;
  selectedDifficulties: NormalizedDifficulty[];
  setSelectedDifficulties: (v: NormalizedDifficulty[]) => void;
  availableExams: string[];
  onApply: () => void;
  onReset: () => void;
}
 
const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  selectedExams,
  setSelectedExams,
  selectedDifficulties,
  setSelectedDifficulties,
  availableExams,
  onApply,
  onReset,
}) => {
  const toggleExam = (e: string): void =>
    setSelectedExams(
      selectedExams.includes(e)
        ? selectedExams.filter((x) => x !== e)
        : [...selectedExams, e]
    );
 
  const toggleDiff = (d: NormalizedDifficulty): void =>
    setSelectedDifficulties(
      selectedDifficulties.includes(d)
        ? selectedDifficulties.filter((x) => x !== d)
        : [...selectedDifficulties, d]
    );
 
  const DIFFICULTIES: NormalizedDifficulty[] = ['Easy', 'Medium', 'Hard'];
 
  return (
<Modal visible={visible} transparent animationType="fade">
<TouchableWithoutFeedback onPress={onClose}>
<View style={mockLibraryStyles.modalOverlay}>
<TouchableWithoutFeedback>
<View style={mockLibraryStyles.filterPanel}>
<View style={mockLibraryStyles.filterHeader}>
<Text style={mockLibraryStyles.filterPanelTitle}>Filters</Text>
<TouchableOpacity onPress={onReset}>
<Text style={mockLibraryStyles.filterResetText}>Reset</Text>
</TouchableOpacity>
</View>
 
              <Text style={mockLibraryStyles.filterSection}>Exam</Text>
              {availableExams.map((exam) => (
<TouchableOpacity
                  key={exam}
                  style={mockLibraryStyles.filterCheckRow}
                  onPress={() => toggleExam(exam)}
>
<View
                    style={[
                      mockLibraryStyles.checkbox,
                      selectedExams.includes(exam) && mockLibraryStyles.checkboxActive,
                    ]}
>
                    {selectedExams.includes(exam) && (
<Ionicons name="checkmark" size={11} color={COLORS.white} />
                    )}
</View>
<Text style={mockLibraryStyles.filterCheckLabel}>{exam}</Text>
</TouchableOpacity>
              ))}
 
              <Text style={[mockLibraryStyles.filterSection, { marginTop: 16 }]}>
                Difficulty
</Text>
              {DIFFICULTIES.map((d) => (
<TouchableOpacity
                  key={d}
                  style={mockLibraryStyles.filterCheckRow}
                  onPress={() => toggleDiff(d)}
>
<View
                    style={[
                      mockLibraryStyles.checkbox,
                      selectedDifficulties.includes(d) && mockLibraryStyles.checkboxActive,
                    ]}
>
                    {selectedDifficulties.includes(d) && (
<Ionicons name="checkmark" size={11} color={COLORS.white} />
                    )}
</View>
<Text style={mockLibraryStyles.filterCheckLabel}>{d}</Text>
</TouchableOpacity>
              ))}
 
              <TouchableOpacity style={mockLibraryStyles.applyBtn} onPress={onApply}>
<Text style={mockLibraryStyles.applyBtnText}>Apply Filters</Text>
</TouchableOpacity>
</View>
</TouchableWithoutFeedback>
</View>
</TouchableWithoutFeedback>
</Modal>
  );
};
 
/* ============================================================
   Sort Dropdown
   ============================================================ */
interface SortDropdownProps {
  visible: boolean;
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}
 
const SortDropdown: React.FC<SortDropdownProps> = ({
  visible,
  selected,
  onSelect,
  onClose,
}) => {
  if (!visible) return null;
  return (
<TouchableWithoutFeedback onPress={onClose}>
<View style={mockLibraryStyles.sortOverlay}>
<TouchableWithoutFeedback>
<View style={mockLibraryStyles.sortDropdown}>
            {(SORT_OPTIONS as readonly string[]).map((opt) => (
<TouchableOpacity
                key={opt}
                style={[
                  mockLibraryStyles.sortOption,
                  opt === selected && mockLibraryStyles.sortOptionActive,
                ]}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
>
<Text
                  style={[
                    mockLibraryStyles.sortOptionText,
                    opt === selected && mockLibraryStyles.sortOptionTextActive,
                  ]}
>
                  {opt}
</Text>
</TouchableOpacity>
            ))}
</View>
</TouchableWithoutFeedback>
</View>
</TouchableWithoutFeedback>
  );
};
 
/* ============================================================
   Empty State
   ============================================================ */
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
<View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
<Ionicons name="document-text-outline" size={48} color={COLORS.textLight} />
<Text
      style={{
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textMedium,
        marginTop: 16,
        textAlign: 'center',
      }}
>
      {message}
</Text>
</View>
);
 
/* ============================================================
   Main Screen
   ============================================================ */
type TabKey = 'all' | 'attempts' | 'requests';
 
export default function MockLibrary() {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [sortVisible, setSortVisible] = useState<boolean>(false);
  const [filterVisible, setFilterVisible] = useState<boolean>(false);
  const [selectedSort, setSelectedSort] = useState<string>('Newest First');
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<
    NormalizedDifficulty[]
>([]);
 
  const [allMocks, setAllMocks] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
 
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
 
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(searchText), 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchText]);
 
  const loadMocks = useCallback(async (isRefresh = false): Promise<void> => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
 
      const response = await getMockTestsService();
 
      // Robust parsing — service return shape can vary
      const r = response as unknown as {
        data?: MockTest[] | { results?: MockTest[] };
        results?: MockTest[];
      };
 
      let data: MockTest[] = [];
      if (Array.isArray(r?.data)) {
        data = r.data;
      } else if (r?.data && typeof r.data === 'object' && Array.isArray((r.data as { results?: MockTest[] }).results)) {
        data = (r.data as { results: MockTest[] }).results;
      } else if (Array.isArray(r?.results)) {
        data = r.results;
      }
 
      setAllMocks(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load mock tests.';
      console.log('Error loading mocks:', err);
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
 
  useEffect(() => {
    loadMocks();
  }, [loadMocks]);
 
  const availableExams = useMemo<string[]>(() => {
    return Array.from(
      new Set(allMocks.map((m) => getExamName(m.exam)).filter(Boolean))
    );
  }, [allMocks]);
 
  const filteredMocks = useMemo<MockTest[]>(() => {
    const q = debouncedSearch.toLowerCase();
 
    const filtered = allMocks.filter((m) => {
      const examName = getExamName(m.exam);
      const subjectName = getSubjectName(m.subject);
 
      const matchesTab: boolean =
        activeTab === 'all' ||
        (activeTab === 'attempts' && m.status !== 'NOT_STARTED') ||
        (activeTab === 'requests' && false);
 
      const matchesSearch: boolean =
        !q ||
        (m.title ?? '').toLowerCase().includes(q) ||
        subjectName.toLowerCase().includes(q) ||
        examName.toLowerCase().includes(q);
 
      const matchesExam: boolean =
        selectedExams.length === 0 || selectedExams.includes(examName);
 
      const matchesDiff: boolean =
        selectedDifficulties.length === 0 ||
        selectedDifficulties.includes(normalizeDifficulty(m.difficulty));
 
      return matchesTab && matchesSearch && matchesExam && matchesDiff;
    });
 
    const order: Record<NormalizedDifficulty, number> = {
      Easy: 0,
      Medium: 1,
      Hard: 2,
    };
 
    return [...filtered].sort((a, b) => {
      switch (selectedSort) {
        case 'Oldest First':
          return Number(a.id) - Number(b.id);
        case 'Easiest First':
          return (
            order[normalizeDifficulty(a.difficulty)] -
            order[normalizeDifficulty(b.difficulty)]
          );
        case 'Hardest First':
          return (
            order[normalizeDifficulty(b.difficulty)] -
            order[normalizeDifficulty(a.difficulty)]
          );
        case 'Most Questions':
          return (b.question_count || 0) - (a.question_count || 0);
        default:
          return Number(b.id) - Number(a.id);
      }
    });
  }, [
    allMocks,
    debouncedSearch,
    activeTab,
    selectedExams,
    selectedDifficulties,
    selectedSort,
  ]);
 
  const totalCount = allMocks.length;
  const attempted = allMocks.filter((m) => m.status !== 'NOT_STARTED').length;
  const activeFilterCount = selectedExams.length + selectedDifficulties.length;
 
  const handleStart = async (id: string): Promise<void> => {
    try {
      setActionLoadingId(id);
      await startMockTestService(id);
      setAllMocks((prev) =>
        prev.map((m): MockTest =>
          String(m.id) === id ? { ...m, status: 'IN_PROGRESS' } : m
        )
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not start mock test. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setActionLoadingId(null);
    }
  };
 
  const handleResume = (id: string): void => {
    Alert.alert('Resume', `Resuming mock ${id}`);
  };
 
  const handleView = (id: string): void => {
    Alert.alert('View', `View results for mock ${id}`);
  };
 
  const resetFilters = (): void => {
    setSelectedExams([]);
    setSelectedDifficulties([]);
  };
 
  const TABS: readonly TabKey[] = ['all', 'attempts', 'requests'] as const;
 
  return (
<SafeAreaView style={mockLibraryStyles.safeArea}>
<StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
<Header
        onMenuPress={() => setDrawerOpen(true)}
        onProfilePress={() => setProfileOpen(!profileOpen)}
      />
 
      <ScrollView
        style={mockLibraryStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={mockLibraryStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
<RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadMocks(true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
>
<View style={mockLibraryStyles.pageHeader}>
<View style={{ flex: 1 }}>
<Text style={mockLibraryStyles.pageTitle}>Mock Library</Text>
<Text style={mockLibraryStyles.pageSubtitle}>
              {totalCount} mock tests · {attempted} attempted
</Text>
</View>
<TouchableOpacity style={mockLibraryStyles.requestBtn}>
<Ionicons name="add" size={16} color={COLORS.white} />
<Text style={mockLibraryStyles.requestBtnText}>Request Mock</Text>
</TouchableOpacity>
</View>
 
        <View style={mockLibraryStyles.searchBox}>
<Ionicons name="search-outline" size={16} color={COLORS.textLight} />
<TextInput
            style={mockLibraryStyles.searchInput}
            placeholder="Search mocks, topic..."
            placeholderTextColor={COLORS.textLight}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
<TouchableOpacity onPress={() => setSearchText('')}>
<Ionicons name="close-circle" size={16} color={COLORS.textLight} />
</TouchableOpacity>
          )}
</View>
 
        <View style={mockLibraryStyles.tabRow}>
          {TABS.map((tab) => (
<TouchableOpacity
              key={tab}
              style={[mockLibraryStyles.tab, activeTab === tab && mockLibraryStyles.tabActive]}
              onPress={() => setActiveTab(tab)}
>
<Text
                style={[
                  mockLibraryStyles.tabText,
                  activeTab === tab && mockLibraryStyles.tabTextActive,
                ]}
>
                {tab === 'all' ? 'All Mocks' : tab === 'attempts' ? 'My Attempts' : 'My Requests'}
</Text>
              {tab === 'requests' && (
<View style={mockLibraryStyles.tabBadge}>
<Text style={mockLibraryStyles.tabBadgeText}>{totalCount}</Text>
</View>
              )}
</TouchableOpacity>
          ))}
</View>
 
        <View style={mockLibraryStyles.filterBar}>
<TouchableOpacity
            style={[
              mockLibraryStyles.filterBtn,
              activeFilterCount > 0 && mockLibraryStyles.filterBtnActive,
            ]}
            onPress={() => setFilterVisible(true)}
>
<Ionicons
              name="options-outline"
              size={15}
              color={activeFilterCount > 0 ? COLORS.primary : COLORS.textMedium}
            />
<Text
              style={[
                mockLibraryStyles.filterBtnText,
                activeFilterCount > 0 && { color: COLORS.primary },
              ]}
>
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
</Text>
</TouchableOpacity>
 
          <TouchableOpacity
            style={mockLibraryStyles.sortBtn}
            onPress={() => setSortVisible(!sortVisible)}
>
<Text style={mockLibraryStyles.sortBtnText}>{selectedSort}</Text>
<Ionicons
              name={sortVisible ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={COLORS.textMedium}
            />
</TouchableOpacity>
</View>
 
        {sortVisible && (
<SortDropdown
            visible={sortVisible}
            selected={selectedSort}
            onSelect={setSelectedSort}
            onClose={() => setSortVisible(false)}
          />
        )}
 
        {loading && (
<View style={{ paddingTop: 48, alignItems: 'center' }}>
<ActivityIndicator size="large" color={COLORS.primary} />
<Text style={{ marginTop: 12, color: COLORS.textLight, fontSize: 13 }}>
              Loading mock tests...
</Text>
</View>
        )}
 
        {!loading && error && (
<View style={{ alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 }}>
<Ionicons name="wifi-outline" size={40} color={COLORS.red} />
<Text style={{ color: COLORS.red, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
              {error}
</Text>
<TouchableOpacity
              style={[mockLibraryStyles.startBtn, { marginTop: 16, paddingHorizontal: 28 }]}
              onPress={() => loadMocks()}
>
<Text style={mockLibraryStyles.startBtnText}>Retry</Text>
</TouchableOpacity>
</View>
        )}
 
        {!loading && !error && (
<Text style={mockLibraryStyles.resultsCount}>
            {filteredMocks.length} mocks found
</Text>
        )}
 
        {!loading && !error && filteredMocks.length === 0 && (
<EmptyState message="No mock tests found. Try adjusting your filters or search." />
        )}
 
        {!loading &&
          !error &&
          filteredMocks.map((mock) => (
<MockCard
              key={String(mock.id)}
              mock={mock}
              onStart={handleStart}
              onResume={handleResume}
              onView={handleView}
              actionLoadingId={actionLoadingId}
            />
          ))}
</ScrollView>
 
      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        selectedExams={selectedExams}
        setSelectedExams={setSelectedExams}
        selectedDifficulties={selectedDifficulties}
        setSelectedDifficulties={setSelectedDifficulties}
        availableExams={availableExams}
        onApply={() => setFilterVisible(false)}
        onReset={resetFilters}
      />
 
      <Sidebar visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
<ProfileMenu visible={profileOpen} onClose={() => setProfileOpen(false)} />
</SafeAreaView>
  );
}