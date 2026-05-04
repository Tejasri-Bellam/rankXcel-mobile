import { useCallback, useEffect, useState } from "react";
import type { ApiError } from "@/types/api";
import { getCourseProgress } from "@/libs/services/player/learningService";
import type { CourseProgress } from "@/types/player";

interface UseCourseProgressResult {
  progress: CourseProgress | null;
  isLoading: boolean;
  error: ApiError | null;
  refresh: () => Promise<void>;
}

export function useCourseProgress(enrollmentId: number): UseCourseProgressResult {
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    if (!enrollmentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await getCourseProgress(enrollmentId);
      setProgress(data);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    load();
  }, [load]);

  return { progress, isLoading, error, refresh: load };
}
