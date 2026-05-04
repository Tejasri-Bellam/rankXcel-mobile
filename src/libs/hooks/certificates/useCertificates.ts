import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError, PaginatedResponse } from "@/types/api";
import { listCertificates } from "@/libs/services/certificates/certificateService";
import type { CertificateList } from "@/types/certificates";

interface UseCertificatesState {
  certificates: CertificateList[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: ApiError | null;
  hasNextPage: boolean;
  totalCount: number;
}

interface UseCertificatesResult extends UseCertificatesState {
  loadMore: () => void;
  refresh: () => void;
}

export function useCertificates(
  enabled: boolean = true,
  search?: string,
): UseCertificatesResult {
  const [state, setState] = useState<UseCertificatesState>({
    certificates: [],
    isLoading: enabled,
    isLoadingMore: false,
    error: null,
    hasNextPage: false,
    totalCount: 0,
  });

  const pageRef = useRef(1);

  const fetchPage = useCallback(
    async (page: number, reset: boolean, searchTerm?: string) => {
      if (reset) {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
      } else {
        setState((prev) => ({ ...prev, isLoadingMore: true }));
      }

      try {
        const response = await listCertificates({
          page,
          page_size: 20,
          search: searchTerm,
        });
        const paginated: PaginatedResponse<CertificateList> = response.data;

        setState((prev) => ({
          certificates: reset
            ? paginated.results
            : [...prev.certificates, ...paginated.results],
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
      }
    },
    [],
  );

  const refresh = useCallback(() => {
    pageRef.current = 1;
    fetchPage(1, true, search);
  }, [fetchPage, search]);

  const loadMore = useCallback(() => {
    if (state.isLoadingMore || !state.hasNextPage) return;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    fetchPage(nextPage, false, search);
  }, [state.isLoadingMore, state.hasNextPage, fetchPage, search]);

  useEffect(() => {
    if (!enabled) return;
    pageRef.current = 1;
    fetchPage(1, true, search);
  }, [fetchPage, enabled, search]);

  return { ...state, loadMore, refresh };
}
