import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError, PaginatedResponse } from "@/types/api";
import { listCourses } from "@/libs/services/courses/courseService";
import type { CourseList, CoursesListParams } from "@/types/courses";

interface UseCoursesState {
  courses: CourseList[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: ApiError | null;
  hasNextPage: boolean;
  totalCount: number;
}

interface UseCoursesResult extends UseCoursesState {
  loadMore: () => void;
  refresh: () => void;
}

export function useCourses(
  params?: Omit<CoursesListParams, "page">,
): UseCoursesResult {
  const [state, setState] = useState<UseCoursesState>({
    courses: [],
    isLoading: true,
    isLoadingMore: false,
    error: null,
    hasNextPage: false,
    totalCount: 0,
  });

  const pageRef = useRef(1);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const isLoadingMoreRef = useRef(false);

  const fetchPage = useCallback(async (page: number, reset: boolean) => {
    if (reset) {
      isLoadingMoreRef.current = false;
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
    } else {
      setState((prev) => ({ ...prev, isLoadingMore: true }));
    }

    try {
      const response = await listCourses({
        ...paramsRef.current,
        page,
        page_size: 10,
      });
      const paginated: PaginatedResponse<CourseList> = response.data;

      setState((prev) => ({
        courses: reset
          ? paginated.results
          : [...prev.courses, ...paginated.results],
        isLoading: false,
        isLoadingMore: false,
        error: null,
        hasNextPage: paginated.next !== null,
        totalCount: paginated.count,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isLoadingMore: false,
        hasNextPage: false,
        error: err as ApiError,
      }));
    } finally {
      isLoadingMoreRef.current = false;
    }
  }, []);

  const refresh = useCallback(() => {
    pageRef.current = 1;
    fetchPage(1, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (isLoadingMoreRef.current || !state.hasNextPage) return;
    isLoadingMoreRef.current = true;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    fetchPage(nextPage, false);
  }, [state.hasNextPage, fetchPage]);

  useEffect(() => {
    pageRef.current = 1;
    fetchPage(1, true);
  }, [params?.search, params?.title, params?.category, params?.is_free, params?.ordering, fetchPage]);

  return { ...state, loadMore, refresh };
}
