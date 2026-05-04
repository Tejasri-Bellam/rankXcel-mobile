import { useCallback, useState } from "react";
import type { ApiError } from "@/types/api";
import {
  createReview as createReviewRequest,
  updateReview as updateReviewRequest,
} from "@/libs/services/courses/reviewService";
import type { CreateReviewRequest, MyReview, UpdateReviewRequest } from "@/types/reviews";

interface UseCreateReviewResult {
  isSubmitting: boolean;
  error: ApiError | null;
  createReview: (courseId: number, data: CreateReviewRequest) => Promise<MyReview | null>;
  updateReview: (courseId: number, data: UpdateReviewRequest) => Promise<MyReview | null>;
  clearError: () => void;
}

export function useCreateReview(): UseCreateReviewResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const createReview = useCallback(
    async (courseId: number, data: CreateReviewRequest): Promise<MyReview | null> => {
      setIsSubmitting(true);
      setError(null);
      try {
        const res = await createReviewRequest(courseId, data);
        return res.data;
      } catch (err) {
        setError(err as ApiError);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const updateReview = useCallback(
    async (courseId: number, data: UpdateReviewRequest): Promise<MyReview | null> => {
      setIsSubmitting(true);
      setError(null);
      try {
        const res = await updateReviewRequest(courseId, data);
        return res.data;
      } catch (err) {
        setError(err as ApiError);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return { isSubmitting, error, createReview, updateReview, clearError };
}
