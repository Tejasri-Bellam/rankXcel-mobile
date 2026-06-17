import React from 'react';
import ExamScreen from './ExamScreen';
import { AssessmentResult } from '@/src/libs/services/assessments-attempts';

type Props = {
  assessmentId: number;
  attemptId: number;
  durationMinutes: number;
  onSubmit: (
    answers: Record<string, string[]>,
    timeTakenSeconds: number,
    result?: AssessmentResult | null
  ) => void;
  onBackToAssessments?: () => void;
};

export default function ExamNavigator({
  assessmentId,
  attemptId,
  durationMinutes,
  onSubmit,
  onBackToAssessments,
}: Props) {
  console.log('ExamNavigator Props:', {
    attemptId,
  });
  return (
    <ExamScreen
      assessmentId={assessmentId}
      attemptId={attemptId}
      durationMinutes={durationMinutes}
      onSubmit={onSubmit}
      onBackToAssessments={onBackToAssessments}
    />
  );
}
