import { useEffect, useState } from "react";
import { listEnrollments } from "@/libs/services/enrollment/enrollmentService";
import type { Enrollment } from "@/types/enrollment";

interface UseEnrollmentCheckResult {
  enrollment: Enrollment | null;
  isLoading: boolean;
}

export function useEnrollmentCheck(
  courseSlug: string | null,
  isAuthenticated: boolean,
  refreshKey: number = 0,
): UseEnrollmentCheckResult {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !courseSlug) {
      setEnrollment(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    listEnrollments({ page_size: 50 })
      .then((res) => {
        if (cancelled) return;
        const found = res.data.results.find((e) => e.course_slug === courseSlug) ?? null;
        setEnrollment(found);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setEnrollment(null);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [courseSlug, isAuthenticated, refreshKey]);

  return { enrollment, isLoading };
}
