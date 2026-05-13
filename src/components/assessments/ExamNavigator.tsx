import React from 'react';
import ExamScreen from './ExamScreen';

type Props = {
  assessmentId: number;
  attemptId: number;
  onSubmit: (
    answers: Record<string, string[]>,
    timeTakenSeconds: number
  ) => void;
  onBackToAssessments?: () => void;
};

export default function ExamNavigator({
  assessmentId,
  attemptId,
  onSubmit,
  onBackToAssessments,
}: Props) {
  return (
    <ExamScreen
      assessmentId={assessmentId}
      attemptId={attemptId}
      onSubmit={onSubmit}
      onBackToAssessments={onBackToAssessments}
    />
  );
}
