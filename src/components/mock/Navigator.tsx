// src/components/mock/MockExamNavigator.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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

export default function MockExamNavigator({
  mockId,
  durationMinutes,
  onSubmit,
  onBackToMocks,
}: Props) {
  const [exam, setExam]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMockTestQuestionsService(mockId);
      const raw: any = res?.data ?? res;

      let examData: any = null;

      if (raw?.sections) {
        examData = raw;
      } else if (raw?.questions) {
        const grouped = raw.questions.reduce((acc: any, q: any) => {
          const subject = q.subject || q.subject_name || 'General';
          if (!acc[subject]) acc[subject] = [];
          acc[subject].push({
            id: q.id,
            text: q.question_text || q.text,
            type: q.question_type || q.type || 'MCQ',
            options: (q.choices ?? q.options ?? []).map((c: any) => ({
              id: String(c.id),
              text: c.text,
            })),
            marks_correct: q.marks_correct ?? 4,
            marks_incorrect: q.marks_incorrect ?? -1,
            chapter_name: q.chapter_name ?? q.chapter ?? null,
          });
          return acc;
        }, {});

        examData = {
          name: 'Mock Test',
          duration_minutes: durationMinutes,
          sections: Object.keys(grouped).map((subject, idx) => ({
            id: idx + 1,
            name: subject,
            questions: grouped[subject],
          })),
        };
      } else if (Array.isArray(raw)) {
        examData = { sections: raw, duration_minutes: durationMinutes };
      } else if (raw?.results && Array.isArray(raw.results)) {
        examData = { sections: raw.results, duration_minutes: durationMinutes };
      } else {
        examData = raw;
      }

      if (!examData?.duration_minutes) {
        examData = { ...examData, duration_minutes: durationMinutes };
      }

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
      onSubmit={onSubmit}
      onBackToMocks={onBackToMocks}
    />
  );
}