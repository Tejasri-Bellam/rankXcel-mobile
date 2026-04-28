import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
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
import {
  mockDataJson,
  SORT_OPTIONS,
  EXAM_FILTERS,
  DIFFICULTY_FILTERS,
} from '../json/mockLibrary';
import { mockLibraryStyles } from '@/src/styles/sidebar/mockLibraryStyles';
import { COLORS } from '@/src/styles/styles';


// ─── Types ────────────────────────────────────────────────────────────────────
type MockStatus = 'in_progress' | 'completed' | 'not_attempted';
type Difficulty = 'Easy' | 'Medium' | 'Hard';
type ExamTag = 'EAMCET' | 'JEE' | 'JEE Mains' | 'JEE2' | 'Mains';

interface MockTest {
  id: string;
  exam: ExamTag;
  title: string;
  subject: string;
  duration: string;
  questions: number;
  marks?: number;
  difficulty: Difficulty;
  status: MockStatus;
  score?: string;
  percentile?: string;
  accuracy?: string;
  lastAttempt?: string;
}

// ─── Static Mock Data ─────────────────────────────────────────────────────────
const MOCK_DATA = mockDataJson as MockTest[];
// ─── Helpers ─────────────────────────────────────────────────────────────────
const examTagColor = (exam: ExamTag) => {
  switch (exam) {
    case 'EAMCET': return COLORS.primary;
    case 'JEE': return '#10B981';
    case 'JEE Mains': return COLORS.orange;
    case 'JEE2': return '#8B5CF6';
    default: return COLORS.primary;
  }
};

const difficultyColor = (d: Difficulty) => {
  if (d === 'Easy') return COLORS.green;
  if (d === 'Medium') return COLORS.orange;
  return COLORS.red;
};

const statusLabel = (s: MockStatus) => {
  if (s === 'in_progress') return 'In Progress';
  if (s === 'completed') return 'Completed';
  return 'Not Attempted';
};

const statusColor = (s: MockStatus) => {
  if (s === 'in_progress') return COLORS.primary;
  if (s === 'completed') return COLORS.green;
  return COLORS.textLight;
};

// ─── Mock Card ────────────────────────────────────────────────────────────────
const MockCard = ({ mock }: { mock: MockTest }) => {
  const tagBg = examTagColor(mock.exam) + '22';
  const tagText = examTagColor(mock.exam);
  const diffColor = difficultyColor(mock.difficulty);
  const diffBg = diffColor + '22';

  return (
    <View style={mockLibraryStyles.mockCard}>
      {/* Top row: exam tag + status */}
      <View style={mockLibraryStyles.mockCardTop}>
        <View style={[mockLibraryStyles.examTag, { backgroundColor: tagBg }]}>
          <Text style={[mockLibraryStyles.examTagText, { color: tagText }]}>{mock.exam}</Text>
        </View>
        <View style={mockLibraryStyles.statusRow}>
          <View style={[mockLibraryStyles.statusDot, { backgroundColor: statusColor(mock.status) }]} />
          <Text style={[mockLibraryStyles.statusText, { color: statusColor(mock.status) }]}>
            {statusLabel(mock.status)}
          </Text>
        </View>
      </View>

      {/* Title & subject */}
      <Text style={mockLibraryStyles.mockTitle}>{mock.title}</Text>
      <Text style={mockLibraryStyles.mockSubject}>{mock.subject}</Text>

      {/* Meta row */}
      <View style={mockLibraryStyles.mockMeta}>
        <View style={mockLibraryStyles.mockMetaItem}>
          <Ionicons name="time-outline" size={13} color={COLORS.textLight} />
          <Text style={mockLibraryStyles.mockMetaText}>{mock.duration}</Text>
        </View>
        <View style={mockLibraryStyles.mockMetaItem}>
          <MaterialCommunityIcons name="help-circle-outline" size={13} color={COLORS.textLight} />
          <Text style={mockLibraryStyles.mockMetaText}>{mock.questions} Q</Text>
        </View>
        {mock.marks !== undefined && (
          <View style={mockLibraryStyles.mockMetaItem}>
            <Ionicons name="star-outline" size={13} color={COLORS.textLight} />
            <Text style={mockLibraryStyles.mockMetaText}>{mock.marks} Marks</Text>
          </View>
        )}
        <View style={[mockLibraryStyles.diffBadge, { backgroundColor: diffBg }]}>
          <Text style={[mockLibraryStyles.diffText, { color: diffColor }]}>{mock.difficulty}</Text>
        </View>
      </View>

      {/* Completed stats */}
      {mock.status === 'completed' && mock.score && (
        <View style={mockLibraryStyles.statsRow}>
          <View style={mockLibraryStyles.statItem}>
            <Text style={mockLibraryStyles.statValue}>{mock.score}</Text>
            <Text style={mockLibraryStyles.statLabel}>Score</Text>
          </View>
          <View style={mockLibraryStyles.statDivider} />
          <View style={mockLibraryStyles.statItem}>
            <Text style={mockLibraryStyles.statValue}>{mock.percentile}</Text>
            <Text style={mockLibraryStyles.statLabel}>Percentile</Text>
          </View>
          <View style={mockLibraryStyles.statDivider} />
          <View style={mockLibraryStyles.statItem}>
            <Text style={mockLibraryStyles.statValue}>{mock.accuracy}</Text>
            <Text style={mockLibraryStyles.statLabel}>Accuracy</Text>
          </View>
        </View>
      )}

      {/* Last attempt */}
      {mock.lastAttempt && (
        <Text style={mockLibraryStyles.lastAttempt}>Last attempt: {mock.lastAttempt}</Text>
      )}

      {/* Action button */}
      {mock.status === 'in_progress' && (
        <TouchableOpacity style={mockLibraryStyles.resumeBtn}>
          <Ionicons name="play-circle" size={16} color={COLORS.white} />
          <Text style={mockLibraryStyles.resumeBtnText}>Resume</Text>
        </TouchableOpacity>
      )}
      {mock.status === 'not_attempted' && (
        <TouchableOpacity style={mockLibraryStyles.startBtn}>
          <Text style={mockLibraryStyles.startBtnText}>Start Mock →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Filter Panel (Modal) ─────────────────────────────────────────────────────
const FilterModal = ({
  visible,
  onClose,
  selectedExams,
  setSelectedExams,
  selectedDifficulties,
  setSelectedDifficulties,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  selectedExams: ExamTag[];
  setSelectedExams: (v: ExamTag[]) => void;
  selectedDifficulties: Difficulty[];
  setSelectedDifficulties: (v: Difficulty[]) => void;
  onApply: () => void;
}) => {
  const toggleExam = (e: ExamTag) => {
    setSelectedExams(
      selectedExams.includes(e) ? selectedExams.filter((x) => x !== e) : [...selectedExams, e]
    );
  };
  const toggleDiff = (d: Difficulty) => {
    setSelectedDifficulties(
      selectedDifficulties.includes(d)
        ? selectedDifficulties.filter((x) => x !== d)
        : [...selectedDifficulties, d]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={mockLibraryStyles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={mockLibraryStyles.filterPanel}>
              <Text style={mockLibraryStyles.filterPanelTitle}>Filters</Text>

              {/* Exam section */}
              <Text style={mockLibraryStyles.filterSection}>Exam</Text>
              <View style={mockLibraryStyles.filterSearchBox}>
                <Ionicons name="search-outline" size={14} color={COLORS.textLight} />
                <Text style={mockLibraryStyles.filterSearchPlaceholder}>Search exams...</Text>
              </View>
              {EXAM_FILTERS.map((exam) => (
                <TouchableOpacity
                  key={exam}
                  style={mockLibraryStyles.filterCheckRow}
                  onPress={() => toggleExam(exam)}
                >
                  <View style={[mockLibraryStyles.checkbox, selectedExams.includes(exam) && mockLibraryStyles.checkboxActive]}>
                    {selectedExams.includes(exam) && (
                      <Ionicons name="checkmark" size={11} color={COLORS.white} />
                    )}
                  </View>
                  <Text style={mockLibraryStyles.filterCheckLabel}>{exam}</Text>
                </TouchableOpacity>
              ))}

              {/* Difficulty section */}
              <Text style={[mockLibraryStyles.filterSection, { marginTop: 16 }]}>Difficulty</Text>
              {DIFFICULTY_FILTERS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={mockLibraryStyles.filterCheckRow}
                  onPress={() => toggleDiff(d)}
                >
                  <View style={[mockLibraryStyles.checkbox, selectedDifficulties.includes(d) && mockLibraryStyles.checkboxActive]}>
                    {selectedDifficulties.includes(d) && (
                      <Ionicons name="checkmark" size={11} color={COLORS.white} />
                    )}
                  </View>
                  <Text style={mockLibraryStyles.filterCheckLabel}>{d}</Text>
                </TouchableOpacity>
              ))}

              {/* Apply */}
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

// ─── Sort Dropdown ────────────────────────────────────────────────────────────
const SortDropdown = ({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) => {
  if (!visible) return null;
  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={mockLibraryStyles.sortOverlay}>
        <TouchableWithoutFeedback>
          <View style={mockLibraryStyles.sortDropdown}>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[mockLibraryStyles.sortOption, opt === selected && mockLibraryStyles.sortOptionActive]}
                onPress={() => { onSelect(opt); onClose(); }}
              >
                <Text style={[mockLibraryStyles.sortOptionText, opt === selected && mockLibraryStyles.sortOptionTextActive]}>
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MockLibrary() {

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'attempts' | 'requests'>('all');
  const [searchText, setSearchText] = useState('');
  const [sortVisible, setSortVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedSort, setSelectedSort] = useState('Newest First');
  const [selectedExams, setSelectedExams] = useState<ExamTag[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([]);

  const totalMocks = MOCK_DATA.length;

  const attempted = MOCK_DATA.filter(
    (m:any) => m.status !== 'not_attempted'
  ).length;

  const filteredMocks = MOCK_DATA.filter((m:any) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'attempts' && m.status !== 'not_attempted') ||
      (activeTab === 'requests' && false);

    const matchesSearch =
      !searchText ||
      m.title.toLowerCase().includes(searchText.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchText.toLowerCase());

    const matchesExam =
      selectedExams.length === 0 ||
      selectedExams.includes(m.exam);

    const matchesDiff =
      selectedDifficulties.length === 0 ||
      selectedDifficulties.includes(m.difficulty);

    return matchesTab && matchesSearch && matchesExam && matchesDiff;
  });

  const activeFilterCount = selectedExams.length + selectedDifficulties.length;

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
      >
        {/* ── Page header ── */}
        <View style={mockLibraryStyles.pageHeader}>
          <View>
            <Text style={mockLibraryStyles.pageTitle}>Mock Library</Text>
            <Text style={mockLibraryStyles.pageSubtitle}>
              {totalMocks} mock tests · {attempted} attempted
            </Text>
          </View>
          <TouchableOpacity style={mockLibraryStyles.requestBtn}>
            <Ionicons name="add" size={16} color={COLORS.white} />
            <Text style={mockLibraryStyles.requestBtnText}>Request Mock</Text>
          </TouchableOpacity>
        </View>

        {/* ── Search ── */}
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

        {/* ── Tabs ── */}
        <View style={mockLibraryStyles.tabRow}>
          {(['all', 'attempts', 'requests'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[mockLibraryStyles.tab, activeTab === tab && mockLibraryStyles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[mockLibraryStyles.tabText, activeTab === tab && mockLibraryStyles.tabTextActive]}>
                {tab === 'all' ? 'All Mocks' : tab === 'attempts' ? 'My Attempts' : 'My Requests'}
              </Text>
              {tab === 'requests' && (
                <View style={mockLibraryStyles.tabBadge}>
                  <Text style={mockLibraryStyles.tabBadgeText}>10</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Filter & Sort bar ── */}
        <View style={mockLibraryStyles.filterBar}>
          <TouchableOpacity
            style={[mockLibraryStyles.filterBtn, activeFilterCount > 0 && mockLibraryStyles.filterBtnActive]}
            onPress={() => setFilterVisible(true)}
          >
            <Ionicons
              name="options-outline"
              size={15}
              color={activeFilterCount > 0 ? COLORS.primary : COLORS.textMedium}
            />
            <Text style={[mockLibraryStyles.filterBtnText, activeFilterCount > 0 && { color: COLORS.primary }]}>
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

        {/* ── Sort Dropdown ── */}
        {sortVisible && (
          <SortDropdown
            visible={sortVisible}
            selected={selectedSort}
            onSelect={setSelectedSort}
            onClose={() => setSortVisible(false)}
          />
        )}

        {/* ── Results count ── */}
        <Text style={mockLibraryStyles.resultsCount}>{filteredMocks.length} mocks found</Text>

        {/* ── Mock Cards ── */}
        {filteredMocks.map((mock:any) => (
          <MockCard key={mock.id} mock={mock} />
        ))}

        {/* ── Load more ── */}
        <TouchableOpacity style={mockLibraryStyles.loadMoreBtn}>
          <Text style={mockLibraryStyles.loadMoreText}>Load more mocks</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Filter Modal ── */}
      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        selectedExams={selectedExams}
        setSelectedExams={setSelectedExams}
        selectedDifficulties={selectedDifficulties}
        setSelectedDifficulties={setSelectedDifficulties}
        onApply={() => setFilterVisible(false)}
      />

      <Sidebar 
        visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <ProfileMenu
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </SafeAreaView>
  );
}