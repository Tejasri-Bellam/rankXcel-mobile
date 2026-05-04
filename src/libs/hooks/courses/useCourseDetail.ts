import { useEffect, useState } from "react";
import type { ApiError } from "@/types/api";
import {
  getCourseDetail,
  listPricingGroups,
  listCohorts,
} from "@/libs/services/courses/courseService";
import type { CourseDetail, PricingGroup, PublicCohort } from "@/types/courses";

interface UseCourseDetailResult {
  course: CourseDetail | null;
  pricingGroups: PricingGroup[];
  cohorts: PublicCohort[];
  isLoading: boolean;
  error: ApiError | null;
}

export function useCourseDetail(slug: string): UseCourseDetailResult {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [pricingGroups, setPricingGroups] = useState<PricingGroup[]>([]);
  const [cohorts, setCohorts] = useState<PublicCohort[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const [detail, pricing] = await Promise.all([
          getCourseDetail(slug),
          listPricingGroups(slug),
        ]);

        if (!cancelled) {
          setCourse(detail.data);
          setPricingGroups(pricing.data.results);

          // Fetch cohorts using the course ID from detail response
          listCohorts(detail.data.id)
            .then((res) => { if (!cancelled) setCohorts(res.data.results); })
            .catch(() => { /* cohorts are optional — silent fail */ });

          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as ApiError);
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slug]);

  return { course, pricingGroups, cohorts, isLoading, error };
}
