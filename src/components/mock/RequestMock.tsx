import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  createExamMockTestService,
  getSubjectOptionsService,
  OptionItem,
  TestType,
} from '../../libs/services/mock-library';
import { requestMockStyles as styles } from '@/src/styles/styles/mock/requestmockstyles';
import {
  MOCK_DIFFICULTY_OPTIONS as DIFFICULTY_OPTIONS,
  MOCK_QUESTION_OPTIONS as QUESTION_OPTIONS,
  MOCK_DURATION_OPTIONS as DURATION_OPTIONS,
} from '@/src/libs/constants';

const toOptionsArray = (raw: unknown): OptionItem[] => {
  if (Array.isArray(raw)) return raw as OptionItem[];
  if (raw && typeof raw === 'object') {
    const r = raw as { results?: OptionItem[]; data?: OptionItem[] | { results?: OptionItem[] } };
    if (Array.isArray(r.results)) return r.results;
    if (Array.isArray(r.data)) return r.data;
    if (r.data && typeof r.data === 'object' && Array.isArray((r.data as any).results))
      return (r.data as { results: OptionItem[] }).results;
  }
  return [];
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: (mockId: string) => void;
  defaultExamId?: number | string | null;
  // 'MOCK_TEST' supports full-syllabus + multi-subject; practice is multi-subject only.
  testType?: TestType;
}

type Scope = 'full' | 'subjects';
type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

// Server validation errors that map to a specific input in this form.
type FieldErrors = {
  subjects?: string;
  questionCount?: string;
  difficulty?: string;
  duration?: string;
};

// Maps the backend's snake_case field keys onto our local field names so each
// message renders below the matching input. Keys not listed here (e.g.
// `questions` generation errors) fall through to the form-level banner.
const SERVER_FIELD_MAP: Record<string, keyof FieldErrors> = {
  subject_ids: 'subjects',
  subjects: 'subjects',
  question_count: 'questionCount',
  difficulty: 'difficulty',
  total_duration_minutes: 'duration',
  duration: 'duration',
};

export default function RequestMockModal({
  visible,
  onClose,
  onCreated,
  defaultExamId,
  testType = 'MOCK_TEST',
}: Props) {
  const insets = useSafeAreaInsets();
  const isPractice = testType === 'PRACTICE_TEST';

  const [subjects, setSubjects] = useState<OptionItem[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Practice has no full-syllabus scope — always pick subjects.
  const [scope, setScope] = useState<Scope>(isPractice ? 'subjects' : 'full');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(30);
  const [showCustomCount, setShowCustomCount] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('mixed');
  const [duration, setDuration] = useState<number>(60);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // Server-side validation errors, keyed by form field, plus a form-level
  // message for non-field / generation errors that don't map to a single input.
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const clearErrors = useCallback(() => {
    setFieldErrors({});
    setFormError(null);
  }, []);

  const resetForm = useCallback(() => {
    setScope(isPractice ? 'subjects' : 'full');
    setSelectedSubjectIds([]);
    setShowCustomCount(false);
    setQuestionCount(30);
    setDifficulty('mixed');
    setDuration(60);
    clearErrors();
  }, [isPractice, clearErrors]);

  useEffect(() => {
    if (!visible) return;
    resetForm();
    if (defaultExamId == null) return;
    setLoadingSubjects(true);
    getSubjectOptionsService(Number(defaultExamId))
      .then((r) => setSubjects(toOptionsArray(r)))
      .catch(() => setSubjects([]))
      .finally(() => setLoadingSubjects(false));
  }, [visible, resetForm, defaultExamId]);

  const toggleSubject = (id: number) => {
    clearErrors();
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const allSubjectsSelected =
    subjects.length > 0 && selectedSubjectIds.length === subjects.length;
  const toggleSelectAll = () => {
    clearErrors();
    setSelectedSubjectIds(allSubjectsSelected ? [] : subjects.map((s) => s.id));
  };

  const isFullSyllabus = scope === 'full' && !isPractice;
  const isPresetCount = QUESTION_OPTIONS.includes(questionCount);
  const customCountValue = !isPresetCount && questionCount > 0 ? String(questionCount) : '';

  const handleCustomCount = (text: string) => {
    clearErrors();
    const n = parseInt(text.replace(/[^0-9]/g, ''), 10);
    setQuestionCount(Number.isFinite(n) ? n : 0);
  };
  const adjustCount = (delta: number) => {
    clearErrors();
    setQuestionCount((prev) => Math.max(1, Math.min(200, (prev || 0) + delta)));
  };

  const needsSubjects = scope === 'subjects' || isPractice;

  const difficultyLabel =
    DIFFICULTY_OPTIONS.find((d) => d.value === difficulty)?.label ?? '';
  const summaryParts = [
    ...(isFullSyllabus ? [] : [`${questionCount} question${questionCount === 1 ? '' : 's'}`]),
    ...(needsSubjects
      ? [`${selectedSubjectIds.length} subject${selectedSubjectIds.length === 1 ? '' : 's'}`]
      : []),
    difficultyLabel,
    ...(isFullSyllabus ? [] : [`${duration} min`]),
  ].filter(Boolean);

  const canSubmit =
    defaultExamId != null &&
    !submitting &&
    questionCount > 0 &&
    (!needsSubjects || selectedSubjectIds.length > 0);

  const handleSubmit = async () => {
    if (submittingRef.current || defaultExamId == null) return;
    if (needsSubjects && selectedSubjectIds.length === 0) {
      Alert.alert('Pick a subject', 'Select at least one subject to continue.');
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    clearErrors();
    try {
      const payload = isFullSyllabus
        ? {
            // Question count and time limit are set automatically by the backend
            // for full-syllabus mocks.
            test_type: testType as 'MOCK_TEST' | 'PRACTICE_TEST',
            is_full_syllabus: true as const,
            difficulty,
          }
        : {
            test_type: testType as 'MOCK_TEST' | 'PRACTICE_TEST',
            is_full_syllabus: false as const,
            subject_ids: selectedSubjectIds,
            question_count: questionCount,
            difficulty,
            total_duration_minutes: duration,
          };
      const res = await createExamMockTestService(defaultExamId, payload);
      const created = (res as any)?.data ?? res;
      const newId = created?.mock_test_id ?? created?.id;
      if (!newId) throw new Error('No ID returned.');
      onCreated(String(newId));
      onClose();
    } catch (err) {
      // The axios interceptor rejects with a normalized ApiError:
      // { status, errors: Record<string, string[]>, body }. Field errors arrive
      // as top-level keys in `errors`; non-field errors as errors.nonFieldErrors.
      const apiErr = err as { errors?: Record<string, string[]> };
      const nextFieldErrors: FieldErrors = {};
      const formParts: string[] = [];
      if (apiErr?.errors && typeof apiErr.errors === 'object') {
        for (const [key, value] of Object.entries(apiErr.errors)) {
          const text = Array.isArray(value) ? value.join(', ') : String(value);
          if (!text) continue;
          const localKey = key === 'nonFieldErrors' ? undefined : SERVER_FIELD_MAP[key];
          if (localKey) nextFieldErrors[localKey] = text;
          else formParts.push(text);
        }
      } else if (err instanceof Error) {
        formParts.push(err.message);
      }
      setFieldErrors(nextFieldErrors);
      setFormError(
        formParts.length
          ? formParts.join('\n')
          : Object.keys(nextFieldErrors).length
            ? null
            : 'Could not generate mock test.',
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const renderChipRow = <T,>(
    items: { value: T; label: string }[],
    selected: T,
    onSelect: (v: T) => void,
  ) => (
    <View style={styles.chipRow}>
      {items.map((it) => {
        const active = it.value === selected;
        return (
          <TouchableOpacity
            key={String(it.value)}
            style={[styles.optChip, active && styles.optChipActive]}
            onPress={() => onSelect(it.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.optChipText, active && styles.optChipTextActive]}>
              {it.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>
              {isPractice ? 'Build a practice set' : 'Build your own mock'}
            </Text>
            <TouchableOpacity
              style={styles.closeIcon}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            {`We'll auto-generate a fresh paper to your spec — different questions every time.`}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {/* Scope — mocks only */}
            {!isPractice && (
              <>
                <Text style={styles.sectionLabel}>SCOPE</Text>
                <View style={styles.segment}>
                  {([
                    { value: 'full', label: 'Full syllabus' },
                    { value: 'subjects', label: 'Pick subjects' },
                  ] as { value: Scope; label: string }[]).map((s) => {
                    const active = scope === s.value;
                    return (
                      <TouchableOpacity
                        key={s.value}
                        style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                        onPress={() => {
                          clearErrors();
                          setScope(s.value);
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Subjects */}
            {needsSubjects && (
              <>
                <View style={styles.subjectHeader}>
                  <Text style={[styles.sectionLabel, styles.subjectHeaderLabel]}>SUBJECTS</Text>
                  {subjects.length > 0 && (
                    <TouchableOpacity
                      onPress={toggleSelectAll}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.selectAllText}>
                        {allSubjectsSelected ? 'Clear all' : 'Select all'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                {loadingSubjects ? (
                  <ActivityIndicator color="#6366F1" style={{ marginVertical: 12 }} />
                ) : subjects.length === 0 ? (
                  <Text style={styles.emptySubjects}>No subjects available for this exam.</Text>
                ) : (
                  <View style={styles.subjectWrap}>
                    {subjects.map((subj) => {
                      const active = selectedSubjectIds.includes(subj.id);
                      return (
                        <TouchableOpacity
                          key={subj.id}
                          style={[styles.subjectChip, active && styles.subjectChipActive]}
                          onPress={() => toggleSubject(subj.id)}
                          activeOpacity={0.8}
                        >
                          {active && (
                            <Ionicons name="checkmark" size={13} color="#fff" />
                          )}
                          <Text
                            style={[styles.subjectText, active && styles.subjectTextActive]}
                          >
                            {subj.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                {!!fieldErrors.subjects && (
                  <Text style={styles.fieldError}>{fieldErrors.subjects}</Text>
                )}
              </>
            )}

            {/* Question count is set automatically by the backend for
                full-syllabus mocks, so hide the selector there. */}
            {!isFullSyllabus && (
              <>
                <Text style={styles.sectionLabel}>QUESTIONS</Text>
                <View style={styles.chipRow}>
                  {QUESTION_OPTIONS.map((n) => {
                    const active = !showCustomCount && questionCount === n;
                    return (
                      <TouchableOpacity
                        key={n}
                        style={[styles.optChip, active && styles.optChipActive]}
                        onPress={() => {
                          clearErrors();
                          setShowCustomCount(false);
                          setQuestionCount(n);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.optChipText, active && styles.optChipTextActive]}>
                          {n}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {/* Edit — reveals a custom count input. */}
                  <TouchableOpacity
                    style={[styles.editChip, showCustomCount && styles.optChipActive]}
                    onPress={() => setShowCustomCount((v) => !v)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="pencil"
                      size={15}
                      color={showCustomCount ? '#4338CA' : '#6B7280'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Custom count — shown on demand via the edit icon. */}
                {showCustomCount && (
                  <View style={styles.customCountRow}>
                    <TextInput
                      style={styles.customCountInput}
                      placeholder="Custom count"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      value={customCountValue}
                      onChangeText={handleCustomCount}
                      autoFocus
                    />
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustCount(1)}
                        hitSlop={{ top: 6, bottom: 2, left: 6, right: 6 }}
                      >
                        <Ionicons name="chevron-up" size={14} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustCount(-1)}
                        hitSlop={{ top: 2, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons name="chevron-down" size={14} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                {!!fieldErrors.questionCount && (
                  <Text style={styles.fieldError}>{fieldErrors.questionCount}</Text>
                )}
              </>
            )}

            <Text style={styles.sectionLabel}>DIFFICULTY</Text>
            <View style={styles.segment}>
              {DIFFICULTY_OPTIONS.map((d) => {
                const active = difficulty === d.value;
                return (
                  <TouchableOpacity
                    key={d.value}
                    style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                    onPress={() => {
                      clearErrors();
                      setDifficulty(d.value);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {!!fieldErrors.difficulty && (
              <Text style={styles.fieldError}>{fieldErrors.difficulty}</Text>
            )}

            {isFullSyllabus ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>
                  Time limit is set automatically for full-syllabus mocks.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>TIME LIMIT</Text>
                {renderChipRow(
                  DURATION_OPTIONS.map((n) => ({ value: n, label: `${n}m` })),
                  duration,
                  (v) => {
                    clearErrors();
                    setDuration(v);
                  },
                )}
                {!!fieldErrors.duration && (
                  <Text style={styles.fieldError}>{fieldErrors.duration}</Text>
                )}
              </>
            )}

            {summaryParts.length > 0 && (
              <Text style={styles.summaryText}>{summaryParts.join('  ·  ')}</Text>
            )}

            {!!formError && (
              <View style={styles.formError}>
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.generateBtn, !canSubmit && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.9}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={16} color="#fff" />
                  <Text style={styles.generateText}>
                    {isPractice ? 'Generate practice' : 'Generate mock'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
