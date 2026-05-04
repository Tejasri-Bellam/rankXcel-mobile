import { useEffect, useState } from "react";
import type { ApiError } from "@/types/api";
import { listCategories } from "@/libs/services/courses/courseService";
import type { Category } from "@/types/courses";

interface UseCategoriesResult {
  categories: Category[];
  isLoading: boolean;
  error: ApiError | null;
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await listCategories({ page_size: 100 });
        if (!cancelled) {
          setCategories(response.data.results);
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
  }, []);

  return { categories, isLoading, error };
}
