import React, { useState } from 'react';
import ExamDetails from './ExamDetails';
import ExamInstructions from './ExamInstructions';
import ExamScreen from './ExamScreen';
import ExamResultScreen from './ExamResults';

type ExamStep =
  | 'detail'
  | 'instructions'
  | 'exam'
  | 'result';

interface Props {
  onBackToAssessments: () => void;
}

export default function ExamNavigator({ onBackToAssessments }: Props) {
  const [step, setStep] = useState<ExamStep>('detail');
  const [examAnswers, setExamAnswers] = useState<Record<string, string[]>>({});
  const [timeTaken, setTimeTaken] = useState(0);

  const handleSubmitExam = (
    answers: Record<string, string[]>,
    timeTakenSeconds: number,
  ) => {
    setExamAnswers(answers);
    setTimeTaken(timeTakenSeconds);
    setStep('result');
  };

  switch (step) {
    case 'detail':
      return (
        <ExamDetails
          onBack = {onBackToAssessments}
          onResume : any ={() => setStep('instructions')}
        />
      );

    case 'instructions':
      return (
        <ExamInstructions
          onStartExam={() => setStep('exam')}
        />
      );

    case 'exam':
      return (
        <ExamScreen
          onSubmit={handleSubmitExam}
        />
      );

    case 'result':
      return (
        <ExamResultScreen
          answers={examAnswers}
          timeTakenSeconds={timeTaken}
          onBack={onBackToAssessments}
        />
      );

    default:
      return null;
  }
}