import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError, PaginatedResponse } from "@/types/api";
import { listEnrollments } from "@/libs/services/enrollment/enrollmentService";
import type { Enrollment, EnrollmentStatus } from "@/types/enrollment";

interface UseEnrollmentsState {
  enrollments: Enrollment[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: ApiError | null;
  hasNextPage: boolean;
  totalCount: number;
}

interface UseEnrollmentsResult extends UseEnrollmentsState {
  loadMore: () => void;
  refresh: () => void;
}

export function useEnrollments(status?: EnrollmentStatus, enabled: boolean = true, search?: string): UseEnrollmentsResult {
  const [state, setState] = useState<UseEnrollmentsState>({
    enrollments: [],
    isLoading: enabled,
    isLoadingMore: false,
    error: null,
    hasNextPage: false,
    totalCount: 0,
  });

  const pageRef = useRef(1);
  const loadingMoreRef = useRef(false);
  const statusRef = useRef(status);
  statusRef.current = status;
  const searchRef = useRef(search);
  searchRef.current = search;

  const fetchPage = useCallback(async (page: number, reset: boolean) => {
    if (reset) {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
    } else {
      setState((prev) => ({ ...prev, isLoadingMore: true }));
    }

    try {
      const response = await listEnrollments({
        status: statusRef.current,
        search: searchRef.current,
        page,
        page_size: 10,
      });
      const paginated: PaginatedResponse<Enrollment> = response.data;

      setState((prev) => ({
        enrollments: reset
          ? paginated.results
          : [...prev.enrollments, ...paginated.results],
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
        error: err as ApiError,
      }));
    } finally {
      loadingMoreRef.current = false;
    }
  }, []);

  const refresh = useCallback(() => {
    pageRef.current = 1;
    loadingMoreRef.current = false;
    fetchPage(1, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !state.hasNextPage) return;
    loadingMoreRef.current = true;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    fetchPage(nextPage, false);
  }, [state.hasNextPage, fetchPage]);

  useEffect(() => {
    if (!enabled) return;
    pageRef.current = 1;
    fetchPage(1, true);
  }, [status, search, fetchPage, enabled]);

  return { ...state, loadMore, refresh };
}
