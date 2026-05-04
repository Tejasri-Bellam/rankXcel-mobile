import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError, PaginatedResponse } from "@/types/api";
import { listPaymentHistory } from "@/libs/services/enrollment/enrollmentService";
import type { PaymentHistoryItem, PaymentHistoryStatus } from "@/types/enrollment";

interface UsePaymentHistoryState {
  payments: PaymentHistoryItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: ApiError | null;
  hasNextPage: boolean;
  totalCount: number;
}

interface UsePaymentHistoryOptions {
  enabled?: boolean;
  search?: string;
  status?: PaymentHistoryStatus | null;
}

interface UsePaymentHistoryResult extends UsePaymentHistoryState {
  loadMore: () => void;
  refresh: () => void;
}

export function usePaymentHistory(options: UsePaymentHistoryOptions = {}): UsePaymentHistoryResult {
  const { enabled = true, search = "", status = null } = options;
  const trimmedSearch = search.trim();
  const hasFilter = trimmedSearch.length > 0 || status !== null;

  const [state, setState] = useState<UsePaymentHistoryState>({
    payments: [],
    isLoading: enabled,
    isLoadingMore: false,
    error: null,
    hasNextPage: false,
    totalCount: 0,
  });

  const pageRef = useRef(1);
  const loadingMoreRef = useRef(false);

  const fetchPage = useCallback(
    async (page: number, reset: boolean) => {
      if (reset) {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
      } else {
        setState((prev) => ({ ...prev, isLoadingMore: true }));
      }

      try {
        const response = await listPaymentHistory({
          search: trimmedSearch || undefined,
          status: status ?? undefined,
          // When filtering, service sends blank page/page_size per backend contract
          page: hasFilter ? undefined : page,
          page_size: hasFilter ? undefined : 20,
        });
        const paginated: PaginatedResponse<PaymentHistoryItem> = response.data;

        setState((prev) => ({
          payments: reset ? paginated.results : [...prev.payments, ...paginated.results],
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
    },
    [trimmedSearch, status, hasFilter],
  );

  const refresh = useCallback(() => {
    pageRef.current = 1;
    loadingMoreRef.current = false;
    fetchPage(1, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (hasFilter || loadingMoreRef.current || !state.hasNextPage) return;
    loadingMoreRef.current = true;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    fetchPage(nextPage, false);
  }, [hasFilter, state.hasNextPage, fetchPage]);

  useEffect(() => {
    if (!enabled) return;
    pageRef.current = 1;
    fetchPage(1, true);
  }, [enabled, fetchPage]);

  return { ...state, loadMore, refresh };
}
