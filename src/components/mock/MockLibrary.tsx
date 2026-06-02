import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SORT_OPTIONS } from '../json/mockLibrary';
import { mockLibraryStyles } from '@/src/styles/sidebar/mockExams/mockLibraryStyles';
import { COLORS } from '@/src/styles/styles';
import {
  createMockTestService,
  ExamObject,
  getChapterOptionsService,
  getMockTestsService,
  getMyTargetExamsOptionsService,
  getSubjectOptionsService,
  getTopicOptionsService,
  OptionItem,
  SubjectObject,
} from '../../libs/services/mock-library';
import { Difficulty, MockStatus, MockTest } from '@/src/libs/types/mock-library';
import MockDetails from './Details';
import { useTargetExam } from '@/src/libs/context/TagretExamContext';



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

const getExamId = (exam: MockTest['exam']): number | null =>
  isExamObject(exam) ? exam.id : null;

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

// Status helpers
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

// Mock Card

   interface MockCardProps {
  mock: MockTest;
  onOpen: (id: string) => void;
  onStart: (id: string) => void;
  onResume: (id: string) => void;
  actionLoadingId: string | null;
}

const MockCard: React.FC<MockCardProps> = ({
  mock,
  onOpen,
  onStart,
  onResume,
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
    <TouchableOpacity
      style={mockLibraryStyles.mockCard}
      activeOpacity={0.85}
      onPress={() => onOpen(String(mock.id))}
    >
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

      {(isNotStarted || isInProgress) && (
        <View style={mockLibraryStyles.actionRow}>
          {isNotStarted && (
            <TouchableOpacity
              style={mockLibraryStyles.startBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                onStart(String(mock.id));
              }}
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
              onPress={(e) => {
                e.stopPropagation?.();
                onResume(String(mock.id));
              }}
              disabled={isLoading}
            >
              <Ionicons name="play-forward" size={14} color={COLORS.white} />
              <Text style={mockLibraryStyles.startBtnText}>Resume</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

  // Filter Modal
interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDifficulties: NormalizedDifficulty[];
  setSelectedDifficulties: (v: NormalizedDifficulty[]) => void;
  onApply: () => void;
  onReset: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  selectedDifficulties,
  setSelectedDifficulties,
  onApply,
  onReset,
}) => {
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

              <Text style={mockLibraryStyles.filterSection}>Difficulty</Text>
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

// Request Mock Test Modal

interface DifficultyOption {
  value: 'easy' | 'medium' | 'hard' | 'any';
  label: string;
}

type ApiErrorShape = {
  status: number;
  errors: Record<string, string[] | undefined>;
  body?: Record<string, unknown>;
};

const isApiError = (e: unknown): e is ApiErrorShape =>
  typeof e === 'object' && e !== null && 'status' in e && 'errors' in e;

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (isApiError(err)) {
    const msgs = Object.values(err.errors).flat().filter(Boolean) as string[];
    if (msgs.length > 0) return msgs.join('\n');
    return `Request failed (status ${err.status})`;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'any', label: 'Any' },
];

const toOptionsArray = (raw: unknown): OptionItem[] => {
  if (Array.isArray(raw)) return raw as OptionItem[];
  if (raw && typeof raw === 'object') {
    const r = raw as { results?: OptionItem[]; data?: OptionItem[] | { results?: OptionItem[] } };
    if (Array.isArray(r.results)) return r.results;
    if (Array.isArray(r.data)) return r.data;
    if (r.data && typeof r.data === 'object' && Array.isArray((r.data as { results?: OptionItem[] }).results)) {
      return (r.data as { results: OptionItem[] }).results;
    }
  }
  return [];
};

interface OptionDropdownProps {
  value: OptionItem | null;
  options: OptionItem[];
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  onSelect: (item: OptionItem) => void;
}

const OptionDropdown: React.FC<OptionDropdownProps> = ({
  value,
  options,
  placeholder,
  disabled,
  loading,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <View>
      <TouchableOpacity
        style={[mockLibraryStyles.selectBox, disabled && mockLibraryStyles.selectBoxDisabled]}
        disabled={disabled}
        onPress={() => setOpen((v) => !v)}
      >
        <Ionicons name="search-outline" size={14} color={COLORS.textLight} />
        <Text
          style={[
            mockLibraryStyles.selectText,
            !value && mockLibraryStyles.selectPlaceholder,
          ]}
          numberOfLines={1}
        >
          {value ? value.name : placeholder}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.textLight} />
        ) : (
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={COLORS.textLight}
          />
        )}
      </TouchableOpacity>

      {open && !disabled && (
        <View style={mockLibraryStyles.dropdownPanel}>
          <TextInput
            style={[
              mockLibraryStyles.textInput,
              { borderWidth: 0, borderBottomWidth: 1, borderRadius: 0 },
            ]}
            placeholder="Search..."
            placeholderTextColor={COLORS.textLight}
            value={query}
            onChangeText={setQuery}
          />
          <ScrollView keyboardShouldPersistTaps="handled">
            {filtered.length === 0 ? (
              <Text style={mockLibraryStyles.dropdownEmpty}>No options</Text>
            ) : (
              filtered.map((opt) => (
                <TouchableOpacity
                  key={String(opt.id)}
                  style={[
                    mockLibraryStyles.dropdownItem,
                    value?.id === opt.id && mockLibraryStyles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    onSelect(opt);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  <Text style={mockLibraryStyles.dropdownItemText}>{opt.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

interface RequestMockModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (mockId: string) => void;
  defaultExamId?: number | string | null;
}

const RequestMockModal: React.FC<RequestMockModalProps> = ({
  visible,
  onClose,
  onCreated,
  defaultExamId,
}) => {
  const [exams, setExams] = useState<OptionItem[]>([]);
  const [subjects, setSubjects] = useState<OptionItem[]>([]);
  const [chapters, setChapters] = useState<OptionItem[]>([]);
  const [topics, setTopics] = useState<OptionItem[]>([]);

  const [selectedExam, setSelectedExam] = useState<OptionItem | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<OptionItem | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<OptionItem | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<OptionItem | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyOption['value']>('medium');
  const [duration, setDuration] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<string>('');

  const [examsLoading, setExamsLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const resetForm = useCallback(() => {
    setSelectedExam(null);
    setSelectedSubject(null);
    setSelectedChapter(null);
    setSelectedTopic(null);
    setSubjects([]);
    setChapters([]);
    setTopics([]);
    setDifficulty('medium');
    setDuration('');
    setQuestionCount('');
  }, []);

  useEffect(() => {
    if (!visible) return;
    resetForm();
    (async () => {
      try {
        setExamsLoading(true);
        const res = await getMyTargetExamsOptionsService();
        const list = toOptionsArray(res);
        setExams(list);
        // Default the form to the exam selected in the header.
        if (defaultExamId != null) {
          const match = list.find((e) => String(e.id) === String(defaultExamId));
          if (match) setSelectedExam(match);
        }
      } catch (err) {
        console.log('Failed to load target exams', err);
      } finally {
        setExamsLoading(false);
      }
    })();
  }, [visible, resetForm, defaultExamId]);

  useEffect(() => {
    if (!selectedExam) return;
    setSelectedSubject(null);
    setSelectedChapter(null);
    setSelectedTopic(null);
    setSubjects([]);
    setChapters([]);
    setTopics([]);
    (async () => {
      try {
        setSubjectsLoading(true);
        const res = await getSubjectOptionsService(selectedExam.id);
        setSubjects(toOptionsArray(res));
      } catch (err) {
        console.log('Failed to load subjects', err);
      } finally {
        setSubjectsLoading(false);
      }
    })();
  }, [selectedExam]);

  useEffect(() => {
    if (!selectedSubject) return;
    setSelectedChapter(null);
    setSelectedTopic(null);
    setChapters([]);
    setTopics([]);
    (async () => {
      try {
        setChaptersLoading(true);
        const res = await getChapterOptionsService(selectedSubject.id);
        setChapters(toOptionsArray(res));
      } catch (err) {
        console.log('Failed to load chapters', err);
      } finally {
        setChaptersLoading(false);
      }
    })();
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedChapter) return;
    setSelectedTopic(null);
    setTopics([]);
    (async () => {
      try {
        setTopicsLoading(true);
        const res = await getTopicOptionsService(selectedChapter.id);
        setTopics(toOptionsArray(res));
      } catch (err) {
        console.log('Failed to load topics', err);
      } finally {
        setTopicsLoading(false);
      }
    })();
  }, [selectedChapter]);

  const canSubmit =
    !!selectedExam &&
    !!selectedSubject &&
    Number(duration) > 0 &&
    Number(questionCount) > 0 &&
    !submitting;

  const handleSubmit = async (): Promise<void> => {
    if (submittingRef.current) return;
    if (!selectedExam || !selectedSubject) {
      Alert.alert('Missing fields', 'Please select an exam and subject.');
      return;
    }
    const durationNum = Number(duration);
    const questionsNum = Number(questionCount);
    if (!durationNum || !questionsNum) {
      Alert.alert('Missing fields', 'Please enter duration and number of questions.');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const payload = {
        exam: selectedExam.id,
        subject: selectedSubject.id,
        chapter_ids: selectedChapter ? [selectedChapter.id] : [],
        topic_ids: selectedTopic ? [selectedTopic.id] : [],
        question_count: questionsNum,
        total_duration_minutes: durationNum,
        difficulty: difficulty === 'any' ? null : difficulty,
        test_type: 'MOCK_TEST' as const,
      };

      const createRes = await createMockTestService(payload);
      console.log('createRes', createRes);
      const created = (createRes as {
        data?: { mock_test_id?: number | string; id?: number | string };
      })?.data;

      const newId = created?.mock_test_id ?? created?.id;
      if (!newId) {
        throw new Error('Mock test was created but no ID was returned.');
      }

      onCreated(String(newId));
      onClose();
    } catch (err) {
      console.log('createMockTest error', err);
      Alert.alert(
        'Error',
        extractErrorMessage(err, 'Could not create mock test. Please try again.'),
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={mockLibraryStyles.modalOverlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              style={mockLibraryStyles.requestPanel}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <TouchableOpacity style={mockLibraryStyles.closeIcon} onPress={onClose}>
                <Ionicons name="close" size={18} color={COLORS.textMedium} />
              </TouchableOpacity>

              <Text style={mockLibraryStyles.requestTitle}>Request Mock Test</Text>
              <Text style={mockLibraryStyles.requestSubtitle}>
                Configure your custom mock test. We&apos;ll prepare it based on your preferences.
              </Text>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={mockLibraryStyles.fieldLabel}>
                  Exam <Text style={mockLibraryStyles.fieldRequired}>*</Text>
                </Text>
                <OptionDropdown
                  value={selectedExam}
                  options={exams}
                  placeholder="Search or select an exam..."
                  loading={examsLoading}
                  onSelect={setSelectedExam}
                />

                <Text style={mockLibraryStyles.fieldLabel}>
                  Subject <Text style={mockLibraryStyles.fieldRequired}>*</Text>
                </Text>
                <OptionDropdown
                  value={selectedSubject}
                  options={subjects}
                  placeholder={selectedExam ? 'Select a subject' : 'Select an exam first'}
                  disabled={!selectedExam}
                  loading={subjectsLoading}
                  onSelect={setSelectedSubject}
                />

                <Text style={mockLibraryStyles.fieldLabel}>Chapter</Text>
                <OptionDropdown
                  value={selectedChapter}
                  options={chapters}
                  placeholder={selectedSubject ? 'Select a chapter' : 'Select a subject first'}
                  disabled={!selectedSubject}
                  loading={chaptersLoading}
                  onSelect={setSelectedChapter}
                />

                <Text style={mockLibraryStyles.fieldLabel}>Topic</Text>
                <OptionDropdown
                  value={selectedTopic}
                  options={topics}
                  placeholder={selectedChapter ? 'Select a topic' : 'Select a chapter first'}
                  disabled={!selectedChapter}
                  loading={topicsLoading}
                  onSelect={setSelectedTopic}
                />

                <Text style={mockLibraryStyles.fieldLabel}>Difficulty Level</Text>
                <View style={mockLibraryStyles.difficultyRow}>
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        mockLibraryStyles.difficultyOption,
                        difficulty === opt.value && mockLibraryStyles.difficultyOptionActive,
                      ]}
                      onPress={() => setDifficulty(opt.value)}
                    >
                      <Text
                        style={[
                          mockLibraryStyles.difficultyOptionText,
                          difficulty === opt.value && mockLibraryStyles.difficultyOptionTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={mockLibraryStyles.inlineRow}>
                  <View style={mockLibraryStyles.inlineField}>
                    <Text style={mockLibraryStyles.fieldLabel}>
                      Duration (minutes) <Text style={mockLibraryStyles.fieldRequired}>*</Text>
                    </Text>
                    <TextInput
                      style={mockLibraryStyles.textInput}
                      placeholder="e.g. 180"
                      placeholderTextColor={COLORS.textLight}
                      keyboardType="number-pad"
                      value={duration}
                      onChangeText={setDuration}
                    />
                  </View>
                  <View style={mockLibraryStyles.inlineField}>
                    <Text style={mockLibraryStyles.fieldLabel}>
                      No. of Questions <Text style={mockLibraryStyles.fieldRequired}>*</Text>
                    </Text>
                    <TextInput
                      style={mockLibraryStyles.textInput}
                      placeholder="e.g. 90"
                      placeholderTextColor={COLORS.textLight}
                      keyboardType="number-pad"
                      value={questionCount}
                      onChangeText={setQuestionCount}
                    />
                  </View>
                </View>

                <View style={mockLibraryStyles.requestActions}>
                  <TouchableOpacity
                    style={mockLibraryStyles.cancelBtn}
                    onPress={onClose}
                    disabled={submitting}
                  >
                    <Text style={mockLibraryStyles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      mockLibraryStyles.submitBtn,
                      !canSubmit && mockLibraryStyles.submitBtnDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!canSubmit}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Text style={mockLibraryStyles.submitBtnText}>Request Mock Test</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Sort Dropdown
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

//Empty State
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

// Main Screen
type TabKey = 'all' | 'attempts';

export default function MockLibrary() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [sortVisible, setSortVisible] = useState<boolean>(false);
  const [filterVisible, setFilterVisible] = useState<boolean>(false);
  const [selectedSort, setSelectedSort] = useState<string>('Newest First');
  const [selectedDifficulties, setSelectedDifficulties] = useState<
    NormalizedDifficulty[]
  >([]);

  // Mocks are scoped to the exam selected in the header.
  const { activeExamId } = useTargetExam();

  const [allMocks, setAllMocks] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId] = useState<string | null>(null);
  const [requestVisible, setRequestVisible] = useState<boolean>(false);
  const [selectedMock, setSelectedMock] = useState<MockTest | null>(null);
  const [resumeMock, setResumeMock] = useState<MockTest | null>(null);

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

  // Hardware back: pop modal / detail-view state before letting Expo Router exit.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (requestVisible) { setRequestVisible(false); return true; }
      if (filterVisible) { setFilterVisible(false); return true; }
      if (sortVisible) { setSortVisible(false); return true; }
      if (resumeMock) { setResumeMock(null); return true; }
      if (selectedMock) { setSelectedMock(null); return true; }
      return false;
    });
    return () => sub.remove();
  }, [requestVisible, filterVisible, sortVisible, resumeMock, selectedMock]);

  // Only mocks for the header-selected exam. Mocks whose exam id can't be
  // resolved are kept so nothing is hidden on an unexpected shape.
  const examScopedMocks = useMemo<MockTest[]>(() => {
    if (activeExamId == null) return allMocks;
    return allMocks.filter((m) => {
      const examId = getExamId(m.exam);
      if (examId == null) return true;
      return String(examId) === String(activeExamId);
    });
  }, [allMocks, activeExamId]);

  const filteredMocks = useMemo<MockTest[]>(() => {
    const q = debouncedSearch.toLowerCase();

    const filtered = examScopedMocks.filter((m) => {
      const examName = getExamName(m.exam);
      const subjectName = getSubjectName(m.subject);

      const matchesTab: boolean =
        activeTab === 'all' ||
        (activeTab === 'attempts' && m.status !== 'NOT_STARTED');

      const matchesSearch: boolean =
        !q ||
        (m.title ?? '').toLowerCase().includes(q) ||
        subjectName.toLowerCase().includes(q) ||
        examName.toLowerCase().includes(q);

      const matchesDiff: boolean =
        selectedDifficulties.length === 0 ||
        selectedDifficulties.includes(normalizeDifficulty(m.difficulty));

      return matchesTab && matchesSearch && matchesDiff;
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
    examScopedMocks,
    debouncedSearch,
    activeTab,
    selectedDifficulties,
    selectedSort,
  ]);

  const totalCount = examScopedMocks.length;
  const attempted = examScopedMocks.filter((m) => m.status !== 'NOT_STARTED').length;
  const activeFilterCount = selectedDifficulties.length;

  const handleOpen = (id: string): void => {
    const mock = allMocks.find((m) => String(m.id) === id);
    if (mock) setSelectedMock(mock);
  };

  const handleStart = (id: string): void => {
    const mock = allMocks.find((m) => String(m.id) === id);
    if (mock) setSelectedMock(mock);
  };

  const handleResume = (id: string): void => {
    const mock = allMocks.find((m) => String(m.id) === id);
    if (mock) setResumeMock(mock);
  };

  const resetFilters = (): void => {
    setSelectedDifficulties([]);
  };

  const TABS: readonly TabKey[] = ['all', 'attempts'] as const;

  if (resumeMock) {
    return (
      <MockDetails
        mock={resumeMock}
        initialView="exam"
        onBack={() => {
          setResumeMock(null);
          loadMocks(true);
        }}
      />
    );
  }

  if (selectedMock) {
    return (
      <MockDetails
        mock={selectedMock}
        onBack={() => {
          setSelectedMock(null);
          loadMocks(true);
        }}
      />
    );
  }

  return (
    <View style={mockLibraryStyles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            <TouchableOpacity
              style={mockLibraryStyles.requestBtn}
              onPress={() => setRequestVisible(true)}
            >
              <Ionicons name="add" size={16} color={COLORS.white} />
              <Text style={mockLibraryStyles.requestBtnText}>Add Mock</Text>
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
                style={[
                  mockLibraryStyles.tab,
                  activeTab === tab && mockLibraryStyles.tabActive,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    mockLibraryStyles.tabText,
                    activeTab === tab && mockLibraryStyles.tabTextActive,
                  ]}
                >
                  {tab === 'all' ? 'All Mocks' : 'My Attempts'}
                </Text>
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
                onOpen={handleOpen}
                onStart={handleStart}
                onResume={handleResume}
                actionLoadingId={actionLoadingId}
              />
            ))}
        </ScrollView>
      </KeyboardAvoidingView>

      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        selectedDifficulties={selectedDifficulties}
        setSelectedDifficulties={setSelectedDifficulties}
        onApply={() => setFilterVisible(false)}
        onReset={resetFilters}
      />

      <RequestMockModal
        visible={requestVisible}
        onClose={() => setRequestVisible(false)}
        onCreated={() => loadMocks(true)}
        defaultExamId={activeExamId}
      />

    </View>
  );
}