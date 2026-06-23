import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MockExamScreen from './ExamScreen';
import { getMockTestService, MockTestResult } from '../../libs/services/mock-library';
import { navigatorStyles } from '@/src/styles/styles/mock/navigatorstyles';

interface Props {
  mockId: number | string;
  durationMinutes: number;
  onSubmit: (
    answers: Record<string, string[]>,
    timeTakenSeconds: number,
    result?: MockTestResult | null,
  ) => void;
  onBackToMocks?: () => void;
}

type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked';

export default function MockExamNavigator({
  mockId,
  durationMinutes,
  onSubmit,
  onBackToMocks,
}: Props) {
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialAnswers, setInitialAnswers] = useState<Record<string, string[]>>({});
  const [initialStatuses, setInitialStatuses] = useState<Record<string, QuestionStatus>>({});

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadQuestions(); }, []);

  const normalizeQuestion = (q: any): any | null => {
    const realId = q?.question_id ?? q?.question?.id ?? q?.id;
    if (!q || realId == null) return null;
    const inner = q?.question ?? q;
    const choices =
      inner.choices ?? inner.options ?? inner.answer_options ??
      q.choices ?? q.options ?? q.answer_options ?? [];
    return {
      id: realId,
      text:
        inner.question_text ?? inner.text ?? inner.statement ??
        q.question_text ?? q.text ?? q.statement ?? '',
      type: inner.question_type ?? inner.type ?? q.question_type ?? q.type ?? 'MCQ',
      options: (Array.isArray(choices) ? choices : []).map((c: any) => ({
        id: String(c?.id ?? c?.value ?? ''),
        text: c?.text ?? c?.label ?? String(c ?? ''),
      })),
      marks_correct: q.marks_correct ?? inner.marks_correct ?? 4,
      marks_incorrect: q.marks_incorrect ?? inner.marks_incorrect ?? -1,
      subject: q.subject_name ?? q.subject ?? inner.subject_name ?? inner.subject ?? null,
      selected_options: q.selected_options ?? q.selected_choices ?? q.response?.selected_options,
    };
  };

  const looksLikeQuestion = (o: any): boolean =>
    !!o && typeof o === 'object' && o.id != null &&
    (typeof o.question_text === 'string' || typeof o.text === 'string' ||
      Array.isArray(o.choices) || Array.isArray(o.options));

  const findQuestionsArray = (node: any, depth = 0): any[] | null => {
    if (!node || depth > 6) return null;
    if (Array.isArray(node) && node.length > 0 && node.every(looksLikeQuestion)) return node;
    if (typeof node === 'object') {
      for (const key of Object.keys(node)) {
        const found = findQuestionsArray(node[key], depth + 1);
        if (found) return found;
      }
    }
    return null;
  };

  const groupBySubject = (questions: any[]) => {
    const grouped: Record<string, any[]> = {};
    questions.forEach((q) => {
      const norm = normalizeQuestion(q);
      if (!norm) return;
      const subject = String(norm.subject || 'General');
      if (!grouped[subject]) grouped[subject] = [];
      grouped[subject].push(norm);
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
      const res = await getMockTestService(mockId);
      const raw: any = res?.data ?? res;
      let examData: any = null;

      if (Array.isArray(raw?.sections) && raw.sections.length > 0) {
        examData = {
          ...raw,
          sections: raw.sections.map((s: any, idx: number) => ({
            id: s?.id ?? idx + 1,
            name: s?.name ?? s?.subject_name ?? `Section ${idx + 1}`,
            questions: (s?.questions ?? []).map(normalizeQuestion).filter(Boolean),
          })),
        };
      } else {
        const questions = findQuestionsArray(raw);
        if (questions && questions.length > 0) {
          examData = {
            name: 'Mock Test',
            duration_minutes: durationMinutes,
            sections: groupBySubject(questions),
          };
        }
      }

      if (!examData) examData = { sections: [], duration_minutes: durationMinutes };
      if (!examData.duration_minutes) examData.duration_minutes = durationMinutes;
      examData.sections = (examData.sections ?? []).filter(
        (s: any) => Array.isArray(s.questions) && s.questions.length > 0
      );

      // Restore saved answers
      const existing: Record<string, any> = raw?.existing_answers ?? {};
      const savedAnswers: Record<string, string[]> = {};
      const savedStatuses: Record<string, QuestionStatus> = {};
      Object.entries(existing).forEach(([qId, val]: [string, any]) => {
        const ids: any[] = val?.selected_choice_ids ?? val?.selected_options ?? [];
        if (Array.isArray(ids) && ids.length > 0)
          savedAnswers[qId] = ids.map((v: any) => String(v));
        if (val?.is_marked_for_review) savedStatuses[qId] = 'marked';
        else if (ids?.length > 0) savedStatuses[qId] = 'answered';
      });
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
    } catch {
      setError('Failed to load questions. Please go back and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={navigatorStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B7DF8" />
        <Text style={navigatorStyles.loadingText}>Loading mock test…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={navigatorStyles.errorContainer}>
        <Text style={navigatorStyles.errorIcon}>⚠️</Text>
        <Text style={navigatorStyles.errorTitle}>
          Failed to Load
        </Text>
        <Text style={navigatorStyles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={loadQuestions}
          style={navigatorStyles.retryBtn}
        >
          <Text style={navigatorStyles.retryText}>Retry</Text>
        </TouchableOpacity>
        {onBackToMocks && (
          <TouchableOpacity onPress={onBackToMocks}>
            <Text style={navigatorStyles.backText}>← Back to Mock Library</Text>
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