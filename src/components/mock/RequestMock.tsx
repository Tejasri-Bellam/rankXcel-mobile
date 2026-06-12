import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Ionicons } from '@expo/vector-icons';
import {
  createMockTestService,
  getMyTargetExamsOptionsService,
  getSubjectOptionsService,
  OptionItem,
} from '../../libs/services/mock-library';
import { getTopicsService } from '../../libs/services/practice';

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
}

type Difficulty = 'easy' | 'medium' | 'hard' | 'any';

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'any', label: 'Any' },
];

export default function RequestMockModal({ visible, onClose, onCreated, defaultExamId }: Props) {
  const [exams, setExams] = useState<OptionItem[]>([]);
  const [subjects, setSubjects] = useState<OptionItem[]>([]);
  const [topics, setTopics] = useState<OptionItem[]>([]);
  const [subtopics, setSubtopics] = useState<OptionItem[]>([]);
  const [selectedExam, setSelectedExam] = useState<OptionItem | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<OptionItem | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<OptionItem | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<OptionItem | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [duration, setDuration] = useState('');
  const [questionCount, setQuestionCount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const resetForm = useCallback(() => {
    setSelectedExam(null); setSelectedSubject(null);
    setSelectedTopic(null); setSelectedSubtopic(null);
    setSubjects([]); setTopics([]); setSubtopics([]);
    setDifficulty('medium'); setDuration(''); setQuestionCount('');
  }, []);

  useEffect(() => {
    if (!visible) return;
    resetForm();
    (async () => {
      try {
        const res = await getMyTargetExamsOptionsService();
        const list = toOptionsArray(res);
        setExams(list);
        if (defaultExamId != null) {
          const match = list.find((e) => String(e.id) === String(defaultExamId));
          if (match) setSelectedExam(match);
        }
      } catch {}
    })();
  }, [visible, resetForm, defaultExamId]);

  useEffect(() => {
    if (!selectedExam) return;
    setSelectedSubject(null); setSelectedTopic(null); setSelectedSubtopic(null);
    setSubjects([]); setTopics([]); setSubtopics([]);
    getSubjectOptionsService(selectedExam.id).then((r) => setSubjects(toOptionsArray(r))).catch(() => {});
  }, [selectedExam]);

  useEffect(() => {
    if (!selectedSubject) return;
    setSelectedTopic(null); setSelectedSubtopic(null); setTopics([]); setSubtopics([]);
    // Topics for the subject: /v1/subjects/{id}/topics/
    getTopicsService(selectedSubject.id)
      .then((r) => setTopics(toOptionsArray(r)))
      .catch(() => {});
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedSubject || !selectedTopic) return;
    setSelectedSubtopic(null); setSubtopics([]);
    // Subtopics: /v1/subjects/{id}/topics/?parent_id={topicId} — the API already
    // returns only the children of the selected topic, so use the response as-is.
    getTopicsService(selectedSubject.id, selectedTopic.id)
      .then((r) => setSubtopics(toOptionsArray(r)))
      .catch(() => {});
  }, [selectedSubject, selectedTopic]);

  const canSubmit = !!selectedExam && !!selectedSubject && Number(duration) > 0 && Number(questionCount) > 0 && !submitting;

  const handleSubmit = async () => {
    if (submittingRef.current || !selectedExam || !selectedSubject) return;
    const dNum = Number(duration);
    const qNum = Number(questionCount);
    if (!dNum || !qNum) { Alert.alert('Missing fields', 'Enter duration and number of questions.'); return; }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const topicIds = selectedSubtopic
        ? [selectedSubtopic.id]
        : selectedTopic
        ? [selectedTopic.id]
        : [];
      const payload = {
        exam: selectedExam.id,
        subject: selectedSubject.id,
        topic_ids: topicIds,
        question_count: qNum,
        total_duration_minutes: dNum,
        difficulty: difficulty === 'any' ? null : difficulty,
        test_type: 'MOCK_TEST' as const,
      };
      console.log('Create mock payload:', JSON.stringify(payload));
      const res = await createMockTestService(payload);
      console.log('Create mock response:', JSON.stringify(res));
      const created = (res as any)?.data;
      const newId = created?.mock_test_id ?? created?.id;
      if (!newId) throw new Error('No ID returned.');
      onCreated(String(newId));
      onClose();
    } catch (err) {
      // The axios interceptor rejects with a custom ApiError: { status, errors, body }
      const apiErr = err as { status?: number; errors?: Record<string, string[]>; body?: any };
      console.log('Create mock error status:', apiErr?.status, 'body:', JSON.stringify(apiErr?.body), 'errors:', JSON.stringify(apiErr?.errors));
      let message = 'Could not create mock test.';
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

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              style={styles.panel}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.title}>Add Mock Test</Text>
              <Text style={styles.subtitle}>
                Configure your custom mock test based on your preferences.
              </Text>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Exam <Text style={styles.req}>*</Text></Text>
                <Dropdown style={[styles.dropdown, styles.dropdownDisabled]} data={exams}
                  labelField="name" valueField="id" placeholder="Select exam..."
                  value={selectedExam?.id} disable
                  onChange={(item) => setSelectedExam(item)} />

                <Text style={styles.label}>Subject <Text style={styles.req}>*</Text></Text>
                <Dropdown style={[styles.dropdown, !selectedExam && styles.dropdownDisabled]}
                  data={subjects} labelField="name" valueField="id" search searchPlaceholder="Search..."
                  placeholder={selectedExam ? 'Select subject' : 'Select exam first'}
                  value={selectedSubject?.id} disable={!selectedExam}
                  onChange={(item) => setSelectedSubject(item)} />

                <Text style={styles.label}>Topic</Text>
                <Dropdown style={[styles.dropdown, !selectedSubject && styles.dropdownDisabled]}
                  data={topics} labelField="name" valueField="id" search searchPlaceholder="Search..."
                  placeholder={selectedSubject ? 'Select topic' : 'Select subject first'}
                  value={selectedTopic?.id} disable={!selectedSubject}
                  onChange={(item) => setSelectedTopic(item)} />

                <Text style={styles.label}>Subtopic</Text>
                <Dropdown style={[styles.dropdown, !selectedTopic && styles.dropdownDisabled]}
                  data={subtopics} labelField="name" valueField="id" search searchPlaceholder="Search..."
                  placeholder={selectedTopic ? 'Select subtopic' : 'Select topic first'}
                  value={selectedSubtopic?.id} disable={!selectedTopic}
                  onChange={(item) => setSelectedSubtopic(item)} />

                <Text style={styles.label}>Difficulty</Text>
                <View style={styles.diffRow}>
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <TouchableOpacity
                      key={d.value}
                      style={[styles.diffBtn, difficulty === d.value && styles.diffBtnActive]}
                      onPress={() => setDifficulty(d.value)}
                    >
                      <Text style={[styles.diffText, difficulty === d.value && styles.diffTextActive]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.inlineRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Duration (min) <Text style={styles.req}>*</Text></Text>
                    <TextInput style={styles.input} placeholder="e.g. 180"
                      placeholderTextColor="#9CA3AF" keyboardType="number-pad"
                      value={duration} onChangeText={setDuration} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Questions <Text style={styles.req}>*</Text></Text>
                    <TextInput style={styles.input} placeholder="e.g. 90"
                      placeholderTextColor="#9CA3AF" keyboardType="number-pad"
                      value={questionCount} onChangeText={setQuestionCount} />
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitBtn, !canSubmit && { opacity: 0.5 }]}
                    onPress={handleSubmit} disabled={!canSubmit}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitText}>Request Mock Test</Text>
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
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    maxHeight: '88%',
  },
  closeIcon: { position: 'absolute', top: 16, right: 16, padding: 4, zIndex: 10 },
  title: { fontSize: 18, fontWeight: '800', color: '#1A1A2E', marginBottom: 4, paddingRight: 28 },
  subtitle: { fontSize: 12, color: '#9CA3AF', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#1A1A2E', marginBottom: 6, marginTop: 10 },
  req: { color: '#EF4444' },
  dropdown: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, backgroundColor: '#fff',
  },
  dropdownDisabled: { backgroundColor: '#F9FAFB' },
  diffRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  diffBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center',
  },
  diffBtnActive: { backgroundColor: '#3B7DF8', borderColor: '#3B7DF8' },
  diffText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  diffTextActive: { color: '#fff' },
  inlineRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 13, color: '#1A1A2E',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: {
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cancelText: { color: '#3B7DF8', fontWeight: '600', fontSize: 13 },
  submitBtn: {
    flex: 1, backgroundColor: '#3B7DF8', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});