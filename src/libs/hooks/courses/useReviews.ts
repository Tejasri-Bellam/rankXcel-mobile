import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError } from "@/types/api";
import { listReviews, getReviewStats } from "@/libs/services/courses/reviewService";
import type { Review, ReviewStats } from "@/types/reviews";

interface UseReviewsResult {
  reviews: Review[];
  stats: ReviewStats | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  error: ApiError | null;
  loadMore: () => void;
  refresh: () => void;
}

export function useReviews(courseId: number | null): UseReviewsResult {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const pageRef = useRef(1);

  const load = useCallback(async () => {
    if (!courseId) return;
    setIsLoading(true);
    setError(null);
    pageRef.current = 1;

    try {
      const [reviewsRes, statsRes] = await Promise.all([
        listReviews(courseId, 1),
        getReviewStats(courseId),
      ]);
      setReviews(reviewsRes.data.results);
      setHasNextPage(reviewsRes.data.next !== null);
      setStats(statsRes.data);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!courseId || !hasNextPage || isLoadingMore) return;
    setIsLoadingMore(true);
    const nextPage = pageRef.current + 1;
    try {
      const res = await listReviews(courseId, nextPage);
      setReviews((prev) => [...prev, ...res.data.results]);
      setHasNextPage(res.data.next !== null);
      pageRef.current = nextPage;
    } catch {
      // silent
    } finally {
      setIsLoadingMore(false);
    }
  }, [courseId, hasNextPage, isLoadingMore]);

  return { reviews, stats, isLoading, isLoadingMore, hasNextPage, error, loadMore, refresh: load };
}
