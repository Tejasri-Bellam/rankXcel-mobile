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

export default function ExamNavigator({
  assessmentId,
  attemptId,
  durationMinutes,
  onSubmit,
  onBackToAssessments,
}: Props) {
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
