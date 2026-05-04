import { useEffect, useState } from "react";
import {
  getAnalyticsToday,
  getAnalyticsSummary,
  getAnalyticsActivity,
  getCourseOptions,
  getQuizHistory,
} from "@/libs/services/analytics/analyticsService";
import type {
  ActivityDataPoint,
  ActivityPeriod,
  AnalyticsSummary,
  AnalyticsTodaySummary,
  CourseOption,
  QuizHistoryResponse,
} from "@/types/analytics";

interface ActivityFilters {
  course_id?: number;
  start_date?: string;
  end_date?: string;
}

interface UseAnalyticsResult {
  today: AnalyticsTodaySummary | null;
  summary: AnalyticsSummary | null;
  courses: CourseOption[];
  quizHistory: QuizHistoryResponse | null;
  isLoading: boolean;
}

export function useAnalytics(enabled: boolean, refreshKey = 0): UseAnalyticsResult {
  const [today, setToday] = useState<AnalyticsTodaySummary | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      getAnalyticsToday().catch(() => null),
      getAnalyticsSummary().catch(() => null),
      getCourseOptions().catch(() => null),
      getQuizHistory().catch(() => null),
    ]).then(([todayRes, summaryRes, coursesRes, quizRes]) => {
      if (cancelled) return;
      if (todayRes) setToday(todayRes.data);
      if (summaryRes) setSummary(summaryRes.data);
      if (coursesRes) setCourses(coursesRes.data);
      if (quizRes) setQuizHistory(quizRes.data);
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [enabled, refreshKey]);

  return { today, summary, courses, quizHistory, isLoading };
}

interface UseAnalyticsActivityResult {
  activity: ActivityDataPoint[];
  isLoading: boolean;
}

export function useAnalyticsActivity(
  enabled: boolean,
  period: ActivityPeriod = "weekly",
  filters?: ActivityFilters,
  refreshKey = 0,
): UseAnalyticsActivityResult {
  const [activity, setActivity] = useState<ActivityDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const course_id = filters?.course_id;
  const start_date = filters?.start_date;
  const end_date = filters?.end_date;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setIsLoading(true);
    getAnalyticsActivity(period, { course_id, start_date, end_date })
      .then(({ data }) => {
        if (!cancelled) setActivity(data.activity);
      })
      .catch(() => {
        // silent — analytics is non-critical
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [enabled, period, course_id, start_date, end_date, refreshKey]);

  return { activity, isLoading };
}
