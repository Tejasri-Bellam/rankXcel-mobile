import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getDashboardDataService,
  getDashboardUserService,
} from "@/src/libs/services/dashboard";
import type { DashboardData } from "@/src/libs/types/dashboard";
import { TargetExam, useTargetExam } from "../../context/TagretExamContext";

// Types

export interface DashboardUser {
  id: number;
  name: string;
  email: string;
  [key: string]: any;
}

// Re-exported for components that still import these from the hook.
export type { TargetExam };
export type { DashboardData };

interface UseDashboardResult {
  user: DashboardUser | null;
  targetExams: TargetExam[];
  activeExamId: number | string | null;
  dashboardData: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  setActiveExamId: (id: number | string) => void;
  refresh: () => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDashboard(enabled: boolean = true): UseDashboardResult {
  // Target exam list + active selection are shared app-wide (header + dashboard).
  const {
    targetExams,
    activeExamId,
    isLoading: examsLoading,
    error: examsError,
    setActiveExamId,
    refreshExams,
  } = useTargetExam();

  const [user, setUser] = useState<DashboardUser | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(enabled);

  // ── 1. Fetch the current user ──────────────────────────────────────────────
  const fetchUser = useCallback(async () => {
    setUserLoading(true);
    try {
      const userRes = await getDashboardUserService();
      const nextUser = (userRes?.data ?? null) as DashboardUser | null;
      setUser(nextUser);
      if (nextUser) {
        await AsyncStorage.setItem("user", JSON.stringify(nextUser));
      }
    } catch {
      const cachedUser = await AsyncStorage.getItem("user");
      setUser(cachedUser ? JSON.parse(cachedUser) : null);
    } finally {
      setUserLoading(false);
    }
  }, []);

  // ── 2. Fetch dashboard data when the active exam changes ───────────────────
  const fetchDashboard = useCallback(async (examId: number | string) => {
    try {
      const res = await getDashboardDataService(examId);
      const data = (res?.data ?? null) as DashboardData | null;
      setDashboardData(data);

      if (data) {
        await AsyncStorage.setItem(
          `dashboardData_${examId}`,
          JSON.stringify(data)
        );
      }
    } catch {
      // Offline fallback for this exam.
      const cached = await AsyncStorage.getItem(`dashboardData_${examId}`);
      if (cached) setDashboardData(JSON.parse(cached));
    }
  }, []);

  // ── 3. Refresh everything (user + exam list; dashboard follows the exam) ───
  const refresh = useCallback(async () => {
    await Promise.all([fetchUser(), refreshExams()]);
  }, [fetchUser, refreshExams]);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    fetchUser();
  }, [enabled, fetchUser]);

  useEffect(() => {
    if (activeExamId != null) {
      fetchDashboard(activeExamId);
    }
  }, [activeExamId, fetchDashboard]);

  return {
    user,
    targetExams,
    activeExamId,
    dashboardData,
    isLoading: enabled && (examsLoading || userLoading),
    error: examsError,
    setActiveExamId,
    refresh,
  };
}
 