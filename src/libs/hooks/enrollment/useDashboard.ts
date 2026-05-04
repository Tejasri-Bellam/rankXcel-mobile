import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiError } from "@/types/api";
import { getDashboard } from "@/libs/services/enrollment/enrollmentService";
import type { DashboardCourse, Enrollment } from "@/types/enrollment";

interface UseDashboardState {
  courses: DashboardCourse[];
  isLoading: boolean;
  error: ApiError | null;
}

interface UseDashboardResult {
  enrollments: Enrollment[];
  rawCourses: DashboardCourse[];
  progressByEnrollmentId: Record<number, { percent: number; completed: number; total: number }>;
  isLoading: boolean;
  isLoadingMore: false;
  hasNextPage: false;
  error: ApiError | null;
  refresh: () => void;
  loadMore: () => void;
}

/**
 * Maps a DashboardCourse to the existing Enrollment shape so that EnrollmentCard
 * (and anything else expecting `Enrollment`) keeps working unchanged.
 *
 * Notes on missing fields:
 * - course_slug — not returned by /api/v1/dashboard/. Falls back to String(course_id),
 *   which the /course/player route accepts via params.
 * - pricing_group / pricing_group_name — not returned. Set to null.
 */
function mapDashboardToEnrollment(d: DashboardCourse): Enrollment {
  return {
    id: d.enrollment_id,
    course: d.course_id,
    course_title: d.course_title,
    course_slug: String(d.course_id),
    course_thumbnail: d.course_thumbnail_url,
    pricing_group: null,
    pricing_group_name: null,
    status: d.status,
    enrolled_at: d.enrolled_at,
    cohort_start_date: d.cohort_start_date ?? null,
  };
}

export function useDashboard(enabled: boolean = true, search?: string): UseDashboardResult {
  const [state, setState] = useState<UseDashboardState>({
    courses: [],
    isLoading: enabled,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await getDashboard();
      setState({ courses: response.data, isLoading: false, error: null });
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false, error: err as ApiError }));
    }
  }, []);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!enabled) return;
    fetchData();
  }, [enabled, fetchData]);

  // Client-side search filter (the dashboard endpoint accepts no query params).
  const filteredCourses = useMemo(() => {
    const q = search?.trim().toLowerCase();
    if (!q) return state.courses;
    return state.courses.filter((c) => c.course_title.toLowerCase().includes(q));
  }, [state.courses, search]);

  const enrollments = useMemo(
    () => filteredCourses.map(mapDashboardToEnrollment),
    [filteredCourses],
  );

  const progressByEnrollmentId = useMemo(() => {
    const out: Record<number, { percent: number; completed: number; total: number }> = {};
    for (const c of state.courses) {
      out[c.enrollment_id] = {
        percent: parseFloat(c.progress_percentage),
        completed: c.completed_chapters,
        total: c.total_chapters,
      };
    }
    return out;
  }, [state.courses]);

  return {
    enrollments,
    rawCourses: filteredCourses,
    progressByEnrollmentId,
    isLoading: state.isLoading,
    isLoadingMore: false,
    hasNextPage: false,
    error: state.error,
    refresh,
    loadMore: () => {},
  };
}
