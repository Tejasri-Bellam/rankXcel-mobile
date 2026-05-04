import { useState, useEffect } from "react";
import { getFeaturedCourse } from "@/libs/services/catalog/catalogService";
import type { CourseDetail } from "@/types/courses";

interface UseFeaturedCourseReturn {
  course: CourseDetail | null;
  isLoading: boolean;
  error: string | null;
}

export function useFeaturedCourse(): UseFeaturedCourseReturn {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await getFeaturedCourse();
        if (!cancelled) setCourse(response.data);
      } catch (err) {
        if (!cancelled) setError("Failed to load featured course");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { course, isLoading, error };
}
