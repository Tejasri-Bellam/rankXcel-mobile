import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
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

// Subject → emoji, mirroring StrengthBySubject. Falls back to a book.
const SUBJECT_EMOJI: Record<string, string> = {
  Physics: '⚛️',
  Chemistry: '🧪',
  Mathematics: '📐',
  Mathemetics: '📐',
};
const subjectEmoji = (name: string) => SUBJECT_EMOJI[name] ?? '📘';

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

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'mixed', label: 'Mixed' },
];

const QUESTION_OPTIONS = [15, 30, 50, 75];
const DURATION_OPTIONS = [30, 60, 90, 180];

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

  const needsSubjects = scope === 'subjects' || isPractice;
  const canSubmit =
    defaultExamId != null &&
    !submitting &&
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
      const fullSyllabus = scope === 'full' && !isPractice;
      const payload = fullSyllabus
        ? {
            test_type: testType as 'MOCK_TEST' | 'PRACTICE_TEST',
            is_full_syllabus: true as const,
            question_count: questionCount,
            difficulty,
            total_duration_minutes: duration,
          }
        : {
            test_type: testType as 'MOCK_TEST' | 'PRACTICE_TEST',
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
            We'll auto-generate a fresh paper to your spec — different questions every time.
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

            <Text style={styles.sectionLabel}>NUMBER OF QUESTIONS</Text>
            {renderChipRow(
              QUESTION_OPTIONS.map((n) => ({ value: n, label: String(n) })),
              questionCount,
              setQuestionCount,
            )}

            <Text style={styles.sectionLabel}>DIFFICULTY</Text>
            {renderChipRow(DIFFICULTY_OPTIONS, difficulty, setDifficulty)}

            <Text style={styles.sectionLabel}>TIME LIMIT</Text>
            {renderChipRow(
              DURATION_OPTIONS.map((n) => ({ value: n, label: `${n}m` })),
              duration,
              setDuration,
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', flex: 1, paddingRight: 12 },
  closeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 8, lineHeight: 19 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginTop: 22,
    marginBottom: 10,
  },

  // Segmented scope control
  segment: {
    flexDirection: 'row',
    backgroundColor: '#EEF0F6',
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  segmentTextActive: { color: '#1A1A2E', fontWeight: '700' },

  // Subject chips
  subjectWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  subjectChipActive: { borderColor: '#6366F1', backgroundColor: '#EEF0FF' },
  subjectEmoji: { fontSize: 15 },
  subjectText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  subjectTextActive: { color: '#4338CA' },
  emptySubjects: { fontSize: 13, color: '#9CA3AF', marginVertical: 8 },

  // Option chip rows (questions / difficulty / time)
  chipRow: { flexDirection: 'row', gap: 10 },
  optChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  optChipActive: { borderColor: '#6366F1', backgroundColor: '#EEF0FF' },
  optChipText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  optChipTextActive: { color: '#4338CA' },

  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 17,
    marginTop: 28,
  },
  generateText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
