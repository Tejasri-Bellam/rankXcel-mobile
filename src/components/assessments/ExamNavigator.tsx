// src/components/home/ExamNavigator.tsx
// This is a thin wrapper — it renders ExamScreen and passes onSubmit up.
// ExamScreen already handles the full exam flow with timer, submission modal, etc.
import React from 'react';
import ExamScreen from './ExamScreen';

type Props = {
  onSubmit: (answers: Record<string, string[]>, timeTakenSeconds: number) => void;
  onBackToAssessments?: () => void; // kept for backward compat
};

export default function ExamNavigator({ onSubmit, onBackToAssessments }: Props) {
  return (
    <ExamScreen
      onSubmit={(answers, seconds) => {
        onSubmit(answers, seconds);
      }}
    />
  );
}