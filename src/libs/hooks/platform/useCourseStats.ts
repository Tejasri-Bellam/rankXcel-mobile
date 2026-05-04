import { useEffect, useState } from "react";
import { getCourseStats } from "@/libs/services/platform/platformService";
import type { CourseStats } from "@/types/platform";

export function useCourseStats(): { stats: CourseStats | null; isLoading: boolean } {
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCourseStats()
      .then(({ data }) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        // silent — stats are non-critical
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { stats, isLoading };
}
