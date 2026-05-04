import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";
import type { ApiError } from "@/types/api";
import {
  startAttempt,
  getAttempt,
  saveAnswers,
  submitAttempt,
  getResults,
} from "@/libs/services/quiz/quizService";

import type {
  AttemptResult,
  LocalAnswer,
  QuizAttempt,
  QuizQuestion,
} from "@/types/quiz";

const attemptKey = (quizId: number) => `quiz_attempt_${quizId}`;
const answersKey = (attemptId: number) => `quiz_answers_${attemptId}`;

interface UseQuizAttemptResult {
  attempt: QuizAttempt | null;
  questions: QuizQuestion[];
  answers: Record<number, LocalAnswer>;
  result: AttemptResult | null;
  isStarting: boolean;
  isSubmitting: boolean;
  isSavingAnswers: boolean;
  error: ApiError | null;
  startQuiz: () => Promise<boolean>;
  selectSingleOption: (questionId: number, optionId: number) => void;
  toggleMultiOption: (questionId: number, optionId: number) => void;
  setTextAnswer: (questionId: number, text: string) => void;
  saveCurrentAnswers: () => Promise<void>;
  submitQuiz: () => Promise<boolean>;
  clearError: () => void;
}

export function useQuizAttempt(quizId: number): UseQuizAttemptResult {
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<number, LocalAnswer>>({});
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingAnswers, setIsSavingAnswers] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const startQuiz = useCallback(async (): Promise<boolean> => {
    setIsStarting(true);
    setError(null);
    try {
      let attemptId: number;
      try {
        const startRes = await startAttempt(quizId);
        attemptId = startRes.data.id;
      } catch (startError) {
        // Already have an in-progress attempt — resume from stored attempt ID
        const stored = await AsyncStorage.getItem(attemptKey(quizId));
        if (!stored) throw startError;
        attemptId = Number(stored);
      }
      await AsyncStorage.setItem(attemptKey(quizId), String(attemptId));
      const attemptRes = await getAttempt(attemptId);
      setAttempt(attemptRes.data);

      // Build blank answers for all questions
      const initial: Record<number, LocalAnswer> = {};
      (attemptRes.data.questions ?? []).forEach((q) => {
        initial[q.id] = { question_id: q.id, selected_options: [], text_answer: "" };
      });
      // Layer 1: restore from API saved_answers (server ground truth)
      (attemptRes.data.saved_answers ?? []).forEach((sa) => {
        if (sa.question_id in initial) {
          initial[sa.question_id] = {
            question_id: sa.question_id,
            selected_options: sa.selected_option_ids,
            text_answer: sa.text_answer,
          };
        }
      });
      // Layer 2: local AsyncStorage may have more recent unsaved changes
      try {
        const localStr = await AsyncStorage.getItem(answersKey(attemptId));
        if (localStr) {
          const local = JSON.parse(localStr) as Record<number, LocalAnswer>;
          Object.assign(initial, local);
        }
      } catch { /* ignore corrupt cache */ }
      setAnswers(initial);
      return true;
    } catch (e) {
      setError(e as ApiError);
      return false;
    } finally {
      setIsStarting(false);
    }
  }, [quizId]);

  const selectSingleOption = useCallback((questionId: number, optionId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] ?? { question_id: questionId, text_answer: "" }),
        selected_options: [optionId],
      },
    }));
  }, []);

  const toggleMultiOption = useCallback((questionId: number, optionId: number) => {
    setAnswers((prev) => {
      const current = prev[questionId]?.selected_options ?? [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return {
        ...prev,
        [questionId]: {
          ...(prev[questionId] ?? { question_id: questionId, text_answer: "" }),
          selected_options: updated,
        },
      };
    });
  }, []);

  const setTextAnswer = useCallback((questionId: number, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] ?? { question_id: questionId, selected_options: [] }),
        text_answer: text,
      },
    }));
  }, []);

  const saveCurrentAnswers = useCallback(async () => {
    const answerValues = Object.values(answers);
    if (!attempt || answerValues.length === 0) return;
    setIsSavingAnswers(true);
    try {
      await saveAnswers(attempt.id, { answers: answerValues });
    } catch { /* API failure — local backup below covers it */ } finally {
      await AsyncStorage.setItem(answersKey(attempt.id), JSON.stringify(answers)).catch(() => {});
      setIsSavingAnswers(false);
    }
  }, [attempt, answers]);

  const submitQuiz = useCallback(async (): Promise<boolean> => {
    if (!attempt) return false;
    setIsSubmitting(true);
    setError(null);
    try {
      const answerValues = Object.values(answers);
      if (answerValues.length > 0) {
        // Best-effort save — server may have already auto-submitted on timer expiry
        await saveAnswers(attempt.id, { answers: answerValues }).catch(() => {});
      }
      // Best-effort submit — ignore errors if server already auto-submitted
      await submitAttempt(attempt.id).catch(() => {});
      await AsyncStorage.multiRemove([attemptKey(quizId), answersKey(attempt.id)]);
      const resultsRes = await getResults(attempt.id);
      setResult(resultsRes.data);
      return true;
    } catch (e) {
      setError(e as ApiError);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [attempt, answers, quizId]);

  const clearError = useCallback(() => setError(null), []);

  return {
    attempt,
    questions: attempt?.questions ?? [],
    answers,
    result,
    isStarting,
    isSubmitting,
    isSavingAnswers,
    error,
    startQuiz,
    selectSingleOption,
    toggleMultiOption,
    setTextAnswer,
    saveCurrentAnswers,
    submitQuiz,
    clearError,
  };
}
