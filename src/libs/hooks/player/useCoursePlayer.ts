import { useCallback, useEffect, useState } from "react";
import type { ApiError } from "@/types/api";
import { getPlayerData } from "@/libs/services/player/learningService";
import type { CoursePlayer } from "@/types/player";

interface UseCoursePlayerResult {
  playerData: CoursePlayer | null;
  isLoading: boolean;
  error: ApiError | null;
  refresh: () => Promise<CoursePlayer | null>;
}

export function useCoursePlayer(enrollmentId: number): UseCoursePlayerResult {
  const [playerData, setPlayerData] = useState<CoursePlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async (): Promise<CoursePlayer | null> => {
    if (!enrollmentId) return null;
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await getPlayerData(enrollmentId);
      setPlayerData(data);
      return data;
    } catch (e) {
      setError(e as ApiError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    load();
  }, [load]);

  return { playerData, isLoading, error, refresh: load };
}
