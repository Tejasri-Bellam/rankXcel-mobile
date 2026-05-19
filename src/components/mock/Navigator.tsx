import React from 'react';
import ExamScreen from './ExamScreen';

type Props = {
  assessmentId: number;
  attemptId: number;
  durationMinutes: number;
  onSubmit: (
    answers: Record<string, string[]>,
    timeTakenSeconds: number
  ) => void;
  onBackToAssessments?: () => void;
};

export default function Navigator({
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
