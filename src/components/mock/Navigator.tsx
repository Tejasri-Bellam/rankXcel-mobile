import React, { useEffect, useState } from 'react';
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MockExamScreen from './ExamScreen';
import { getMockTestQuestionsService } from '../../libs/services/mock-library';

interface Props {
  mockId: number | string;
  durationMinutes: number;
  onSubmit: (answers: Record<string, string[]>, timeTakenSeconds: number) => void;
  onBackToMocks?: () => void;
}

type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked';

export default function MockExamNavigator({
  mockId,
  durationMinutes,
  onSubmit,
  onBackToMocks,
}: Props) {
  const [exam, setExam]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [initialAnswers, setInitialAnswers] = useState<Record<string, string[]>>({});
  const [initialStatuses, setInitialStatuses] = useState<Record<string, QuestionStatus>>({});

  useEffect(() => {
    loadQuestions();
  }, []);

  const normalizeQuestion = (q: any): any | null => {
    // The mock-test-questions endpoint wraps each question; q.id is the
    // junction-row id, not the real question id. The backend's per-response
    // endpoint expects the real question id, so prefer question_id / question.id.
    const realId = q?.question_id ?? q?.question?.id ?? q?.id;
    if (!q || realId == null) return null;
    const inner = q?.question ?? q;
    const choices = inner.choices ?? inner.options ?? inner.answer_options
      ?? q.choices ?? q.options ?? q.answer_options ?? [];
    return {
      id: realId,
      text: inner.question_text ?? inner.text ?? inner.statement
        ?? q.question_text ?? q.text ?? q.statement ?? '',
      type: inner.question_type ?? inner.type ?? q.question_type ?? q.type ?? 'MCQ',
      options: (Array.isArray(choices) ? choices : []).map((c: any) => ({
        id: String(c?.id ?? c?.value ?? ''),
        text: c?.text ?? c?.label ?? String(c ?? ''),
      })),
      marks_correct: q.marks_correct ?? inner.marks_correct ?? 4,
      marks_incorrect: q.marks_incorrect ?? inner.marks_incorrect ?? -1,
      chapter_name: q.chapter_name ?? q.chapter ?? inner.chapter_name ?? inner.chapter ?? null,
      subject: q.subject_name ?? q.subject ?? inner.subject_name ?? inner.subject ?? null,
      selected_options: q.selected_options ?? q.selected_choices ?? q.response?.selected_options,
    };
  };

  const looksLikeQuestion = (o: any): boolean =>
    !!o && typeof o === 'object' && o.id != null &&
    (typeof o.question_text === 'string' ||
      typeof o.text === 'string' ||
      typeof o.statement === 'string' ||
      Array.isArray(o.choices) ||
      Array.isArray(o.options));

  const findQuestionsArray = (node: any, depth = 0): any[] | null => {
    if (!node || depth > 6) return null;
    if (Array.isArray(node) && node.length > 0 && node.every(looksLikeQuestion)) {
      return node;
    }
    if (typeof node === 'object') {
      for (const key of Object.keys(node)) {
        const found = findQuestionsArray(node[key], depth + 1);
        if (found) return found;
      }
    }
    return null;
  };

  const groupQuestionsBySubject = (questions: any[]) => {
    const grouped: Record<string, any[]> = {};
    questions.forEach((q) => {
      const normalized = normalizeQuestion(q);
      if (!normalized) return;
      const subject = String(normalized.subject || 'General');
      if (!grouped[subject]) grouped[subject] = [];
      grouped[subject].push(normalized);
    });
    return Object.keys(grouped).map((subject, idx) => ({
      id: idx + 1,
      name: subject,
      questions: grouped[subject],
    }));
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMockTestQuestionsService(mockId);
      const raw: any = res?.data ?? res;
      console.log('MOCK QUESTIONS RAW:', JSON.stringify(raw, null, 2));

      let examData: any = null;

      // 1) Pre-grouped sections in the response.
      if (Array.isArray(raw?.sections) && raw.sections.length > 0) {
        examData = {
          ...raw,
          sections: raw.sections.map((s: any, idx: number) => ({
            id: s?.id ?? idx + 1,
            name: s?.name ?? s?.subject_name ?? s?.subject ?? `Section ${idx + 1}`,
            questions: (s?.questions ?? []).map(normalizeQuestion).filter(Boolean),
          })),
        };
      } else {
        // 2) Walk the response and find any array of question objects.
        const questions = findQuestionsArray(raw);
        if (questions && questions.length > 0) {
          examData = {
            name: 'Mock Test',
            duration_minutes: durationMinutes,
            sections: groupQuestionsBySubject(questions),
          };
        }
      }

      if (!examData) {
        examData = { sections: [], duration_minutes: durationMinutes };
      }

      if (!examData.duration_minutes) {
        examData.duration_minutes = durationMinutes;
      }

      // Drop empty sections.
      examData.sections = (examData.sections ?? []).filter(
        (s: any) => Array.isArray(s.questions) && s.questions.length > 0
      );

      // Hydrate previously saved responses (resume support).
      const existing: Record<string, any> = raw?.existing_answers ?? {};
      const savedAnswers: Record<string, string[]> = {};
      const savedStatuses: Record<string, QuestionStatus> = {};
      Object.entries(existing).forEach(([qId, val]: [string, any]) => {
        const ids: any[] = val?.selected_choice_ids ?? val?.selected_options ?? [];
        if (Array.isArray(ids) && ids.length > 0) {
          savedAnswers[qId] = ids.map((v: any) => String(v));
        }
        if (val?.is_marked_for_review) savedStatuses[qId] = 'marked';
        else if (ids?.length > 0) savedStatuses[qId] = 'answered';
      });

      // Also pick up selected_options inlined on each question (alternative shape).
      examData.sections.forEach((s: any) => {
        (s.questions ?? []).forEach((q: any) => {
          if (savedAnswers[q.id]) return;
          const sel = q.selected_options;
          if (Array.isArray(sel) && sel.length > 0) {
            savedAnswers[q.id] = sel.map((v: any) => String(v));
            savedStatuses[q.id] = 'answered';
          }
        });
      });

      setInitialAnswers(savedAnswers);
      setInitialStatuses(savedStatuses);
      setExam(examData);
    } catch (err) {
      console.log('MOCK QUESTIONS ERROR:', err);
      setError('Failed to load questions. Please go back and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={{ marginTop: 12, color: '#9898B0', fontSize: 14 }}>
          Loading mock test…
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 36, marginBottom: 16 }}>⚠️</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 8, textAlign: 'center' }}>
          Failed to Load
        </Text>
        <Text style={{ fontSize: 13, color: '#9898B0', textAlign: 'center', marginBottom: 24 }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadQuestions}
          style={{ backgroundColor: '#6C5CE7', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginBottom: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
        {onBackToMocks && (
          <TouchableOpacity onPress={onBackToMocks}>
            <Text style={{ color: '#9898B0', fontSize: 14 }}>← Back to Mock Library</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  return (
    <MockExamScreen
      mockId={mockId}
      durationMinutes={durationMinutes}
      exam={exam}
      initialAnswers={initialAnswers}
      initialStatuses={initialStatuses}
      onSubmit={onSubmit}
      onBackToMocks={onBackToMocks}
    />
  );
}