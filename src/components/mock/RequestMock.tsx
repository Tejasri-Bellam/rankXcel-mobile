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
  subjectEmoji,
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
  const [difficulty, setDifficulty] = useState<Difficulty>('mixed');
  const [duration, setDuration] = useState<number>(60);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const resetForm = useCallback(() => {
    setScope(isPractice ? 'subjects' : 'full');
    setSelectedSubjectIds([]);
    setQuestionCount(30);
    setDifficulty('mixed');
    setDuration(60);
  }, [isPractice]);

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
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const isFullSyllabus = scope === 'full' && !isPractice;
  const isPresetCount = QUESTION_OPTIONS.includes(questionCount);
  const customCountValue = !isPresetCount && questionCount > 0 ? String(questionCount) : '';

  const handleCustomCount = (text: string) => {
    const n = parseInt(text.replace(/[^0-9]/g, ''), 10);
    setQuestionCount(Number.isFinite(n) ? n : 0);
  };
  const adjustCount = (delta: number) =>
    setQuestionCount((prev) => Math.max(1, Math.min(200, (prev || 0) + delta)));

  const needsSubjects = scope === 'subjects' || isPractice;
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
      console.log('err', err);
      
      // The axios interceptor rejects with a custom ApiError: { status, errors, body }
      const apiErr = err as { status?: number; errors?: Record<string, string[]>; body?: any };
      let message = 'Could not generate mock test.';
      if (apiErr?.errors && typeof apiErr.errors === 'object') {
        const parts = Object.entries(apiErr.errors).map(([k, v]) => {
          const text = Array.isArray(v) ? v.join(', ') : String(v);
          return k === 'nonFieldErrors' ? text : `${k}: ${text}`;
        });
        if (parts.length) message = parts.join('\n');
      } else if (err instanceof Error) {
        message = err.message;
      }
      Alert.alert('Error', message);
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
                        onPress={() => setScope(s.value)}
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

            {/* Subject chips */}
            {needsSubjects && (
              <>
                {isPractice && <Text style={[styles.sectionLabel, { marginTop: 4 }]}>SUBJECTS</Text>}
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
                          <Text style={styles.subjectEmoji}>{subjectEmoji(subj.name)}</Text>
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
              </>
            )}

            {/* Question count is set automatically by the backend for
                full-syllabus mocks, so hide the selector there. */}
            {!isFullSyllabus && (
              <>
                <Text style={styles.sectionLabel}>NUMBER OF QUESTIONS</Text>
                {renderChipRow(
                  QUESTION_OPTIONS.map((n) => ({ value: n, label: String(n) })),
                  questionCount,
                  setQuestionCount,
                )}

                {/* Custom count — typing here overrides the preset chips above. */}
                <View style={styles.customCountRow}>
                  <TextInput
                    style={styles.customCountInput}
                    placeholder="Custom count"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={customCountValue}
                    onChangeText={handleCustomCount}
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
                    onPress={() => setDifficulty(d.value)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

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
                  setDuration,
                )}
              </>
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
