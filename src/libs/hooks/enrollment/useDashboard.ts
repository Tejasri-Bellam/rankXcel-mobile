import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getDashboardDataService,
  getDashboardUserService,
  getMyTargetExamsService,
} from "@/src/libs/services/dashboard";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardUser {
  id: number;
  name: string;
  email: string;
  [key: string]: any;
}

export interface TargetExam {
  id: number;
  name: string;
  code: string;
  description: string;
  total_duration_minutes: number;
  is_active: boolean;
}

export type DashboardData = Record<string, any> | null;

interface UseDashboardState {
  user: DashboardUser | null;
  targetExams: TargetExam[];
  activeExamId: number | string | null;
  dashboardData: DashboardData | null;
  isLoading: boolean;
  error: string | null;
}

interface UseDashboardResult {
  user: DashboardUser | null;
  targetExams: TargetExam[];
  activeExamId: number | string | null;
  dashboardData: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  setActiveExamId: (id: number | string) => void;
  refresh: () => void;
}

interface TargetExamResponse {
  results: TargetExam[];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDashboard(enabled: boolean = true): UseDashboardResult {
  const [state, setState] = useState<UseDashboardState>({
    user: null,
    targetExams: [],
    activeExamId: null,
    dashboardData: null,
    isLoading: enabled,
    error: null,
  });

  // ── 1. Fetch user + target exams ────────────────────────────────────────────
const fetchInitial = useCallback(async () => {
  setState((prev) => ({ ...prev, isLoading: true, error: null }));

  try {
    const [userRes, examsRes] = await Promise.all([
      getDashboardUserService(),
      getMyTargetExamsService(),
    ]);

    const user: DashboardUser | any = userRes?.data ?? null;

    const examsData = examsRes?.data as TargetExam[];

    const targetExams: TargetExam[] = Array.isArray(examsData)
      ? examsData
      : [];

    const savedId = await AsyncStorage.getItem("activeExamId");

    const firstId = targetExams[0]?.id ?? null;

    const activeExamId = savedId ? Number(savedId) : firstId;

    setState((prev) => ({
      ...prev,
      user,
      targetExams,
      activeExamId,
      isLoading: false,
    }));

    if (user) {
      await AsyncStorage.setItem("user", JSON.stringify(user));
    }

    if (targetExams.length) {
      await AsyncStorage.setItem(
        "targetExams",
        JSON.stringify(targetExams)
      );
    }
  } catch (err) {
    const [cachedUser, cachedExams, cachedExamId] = await Promise.all([
      AsyncStorage.getItem("user"),
      AsyncStorage.getItem("targetExams"),
      AsyncStorage.getItem("activeExamId"),
    ]);

    const user = cachedUser ? JSON.parse(cachedUser) : null;

    const targetExams = cachedExams
      ? JSON.parse(cachedExams)
      : [];

    const activeExamId = cachedExamId
      ? Number(cachedExamId)
      : targetExams[0]?.id ?? null;

    setState((prev) => ({
      ...prev,
      user,
      targetExams,
      activeExamId,
      isLoading: false,
      error: targetExams.length
        ? null
        : "Failed to load dashboard. Check your connection.",
    }));
  }
}, []);
  // ── 2. Fetch dashboard data when active exam changes ────────────────────────
  const fetchDashboard = useCallback(async (examId: number | string) => {
    try {
      const res = await getDashboardDataService(examId);
      const dashboardData: DashboardData = res?.data ?? null;

      setState((prev) => ({ ...prev, dashboardData }));

      if (dashboardData)
        await AsyncStorage.setItem(
          `dashboardData_${examId}`,
          JSON.stringify(dashboardData)
        );
    } catch (err) {
      // Offline fallback for this exam
      const cached = await AsyncStorage.getItem(`dashboardData_${examId}`);
      if (cached) {
        setState((prev) => ({ ...prev, dashboardData: JSON.parse(cached) }));
      }
    }
  }, []);

  // ── 3. Set active exam (persists choice) ────────────────────────────────────
  const setActiveExamId = useCallback(async (id: number | string) => {
    setState((prev) => ({ ...prev, activeExamId: id }));
    await AsyncStorage.setItem("activeExamId", String(id));
  }, []);

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    fetchInitial();
  }, [enabled, fetchInitial]);

  useEffect(() => {
    if (state.activeExamId != null) {
      fetchDashboard(state.activeExamId);
    }
  }, [state.activeExamId, fetchDashboard]);

  return {
    user: state.user,
    targetExams: state.targetExams,
    activeExamId: state.activeExamId,
    dashboardData: state.dashboardData,
    isLoading: state.isLoading,
    error: state.error,
    setActiveExamId,
    refresh: fetchInitial,
  };
}