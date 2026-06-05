import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getMyTargetExamsService } from "@/src/libs/services/dashboard";
import { storageGetAccessToken } from "@/src/libs/storage";

export interface TargetExam {
  id: number;
  name: string;
  code: string;
  description: string;
  total_duration_minutes: number;
  is_active: boolean;
}

interface TargetExamState {
  targetExams: TargetExam[];
  activeExamId: number | string | null;
  isLoading: boolean;
  error: string | null;
}

interface TargetExamContextValue extends TargetExamState {
  setActiveExamId: (id: number | string) => void;
  refreshExams: (countryId?: number | string | null) => Promise<void>;
}

const TargetExamContext = createContext<TargetExamContextValue | null>(null);

const ACTIVE_EXAM_KEY = "activeExamId";
const TARGET_EXAMS_KEY = "targetExams";
const COUNTRY_KEY = "regionCountryId";

interface TargetExamProviderProps {
  children: React.ReactNode;
}

export function TargetExamProvider({
  children,
}: TargetExamProviderProps): React.ReactElement {
  const [state, setState] = useState<TargetExamState>({
    targetExams: [],
    activeExamId: null,
    isLoading: true,
    error: null,
  });

  // Guards against concurrent fetches (provider mount + Header mount, etc.)
  const inFlight = useRef(false);

  const refreshExams = useCallback(async (countryId?: number | string | null) => {
    if (inFlight.current) return;
    inFlight.current = true;

    try {
      const token = await storageGetAccessToken();
      if (!token) {
        // Not authenticated yet — nothing to load.
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // A country passed in (region switch) is persisted so later refreshes keep
      // scoping the catalogue to it; otherwise fall back to the saved selection.
      let activeCountryId = countryId;
      if (activeCountryId != null && activeCountryId !== "") {
        await AsyncStorage.setItem(COUNTRY_KEY, String(activeCountryId));
      } else {
        activeCountryId = await AsyncStorage.getItem(COUNTRY_KEY);
      }

      const res = await getMyTargetExamsService(activeCountryId);
      const data = res?.data as TargetExam[];
      const targetExams: TargetExam[] = Array.isArray(data) ? data : [];

      const savedId = await AsyncStorage.getItem(ACTIVE_EXAM_KEY);
      const savedExists =
        savedId != null &&
        targetExams.some((e) => String(e.id) === String(savedId));

      const activeExamId = savedExists
        ? Number(savedId)
        : targetExams[0]?.id ?? null;

      setState({ targetExams, activeExamId, isLoading: false, error: null });

      if (targetExams.length) {
        await AsyncStorage.setItem(
          TARGET_EXAMS_KEY,
          JSON.stringify(targetExams)
        );
      }
      if (activeExamId != null) {
        await AsyncStorage.setItem(ACTIVE_EXAM_KEY, String(activeExamId));
      }
    } catch {
      // Offline fallback: hydrate from cache.
      const [cachedExams, cachedId] = await Promise.all([
        AsyncStorage.getItem(TARGET_EXAMS_KEY),
        AsyncStorage.getItem(ACTIVE_EXAM_KEY),
      ]);

      const targetExams: TargetExam[] = cachedExams
        ? JSON.parse(cachedExams)
        : [];
      const activeExamId = cachedId
        ? Number(cachedId)
        : targetExams[0]?.id ?? null;

      setState({
        targetExams,
        activeExamId,
        isLoading: false,
        error: targetExams.length
          ? null
          : "Failed to load target exams. Check your connection.",
      });
    } finally {
      inFlight.current = false;
    }
  }, []);

  const setActiveExamId = useCallback((id: number | string) => {
    setState((prev) => ({ ...prev, activeExamId: id }));
    AsyncStorage.setItem(ACTIVE_EXAM_KEY, String(id));
  }, []);

  useEffect(() => {
    refreshExams();
  }, [refreshExams]);

  const value = useMemo<TargetExamContextValue>(
    () => ({ ...state, setActiveExamId, refreshExams }),
    [state, setActiveExamId, refreshExams]
  );

  return (
    <TargetExamContext.Provider value={value}>
      {children}
    </TargetExamContext.Provider>
  );
}

export function useTargetExam(): TargetExamContextValue {
  const ctx = useContext(TargetExamContext);
  if (!ctx)
    throw new Error("useTargetExam must be used within TargetExamProvider");
  return ctx;
}
 