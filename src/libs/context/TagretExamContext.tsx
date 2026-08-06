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

import { getTargetExamsService } from "@/src/libs/services/profile";
import { storageGetAccessToken } from "@/src/libs/storage";

// How an exam is scored. COMPETITIVE exams rank students against each other
// (leaderboard / rank / percentile); PASS_FAIL exams only score against a fixed
// pass mark, so every ranking-related UI is hidden for them.
export type ScoringType = "COMPETITIVE" | "PASS_FAIL";

export interface TargetExam {
  id: number;
  name: string;
  code: string;
  description: string;
  total_duration_minutes: number;
  is_active: boolean;
  target_year?: number | null;
  scoring_type: ScoringType;
  // Marks needed to pass — only sent for PASS_FAIL exams (null otherwise).
  pass_marks: number | null;
}

// Scoring rules for one exam, as consumed by the results/analytics screens.
export interface ExamScoring {
  scoringType: ScoringType;
  isPassFail: boolean;
  passMarks: number | null;
}

const COMPETITIVE_SCORING: ExamScoring = {
  scoringType: "COMPETITIVE",
  isPassFail: false,
  passMarks: null,
};

// Anything that isn't an explicit PASS_FAIL stays COMPETITIVE — including a
// missing field (older cached exams, endpoints that don't send it yet), so the
// existing experience is what we fall back to.
function toScoringType(value: any): ScoringType {
  return String(value ?? "").toUpperCase() === "PASS_FAIL"
    ? "PASS_FAIL"
    : "COMPETITIVE";
}

function toScoring(exam: TargetExam | null | undefined): ExamScoring {
  if (!exam) return COMPETITIVE_SCORING;
  const scoringType = toScoringType(exam.scoring_type);
  return {
    scoringType,
    isPassFail: scoringType === "PASS_FAIL",
    passMarks:
      scoringType === "PASS_FAIL" && exam.pass_marks != null
        ? Number(exam.pass_marks)
        : null,
  };
}

// target-exams returns each row as { id (record id), exam: { id, name, code },
// target_year, ... }. Flatten it to a TargetExam keyed on the exam id (what the
// dashboard/selection use), while tolerating an already-flat shape.
function normalizeTargetExam(item: any): TargetExam {
  const exam = item?.exam ?? item;
  return {
    id: exam?.id ?? item?.id,
    name: exam?.name ?? item?.name ?? "",
    code: exam?.code ?? item?.code ?? "",
    description: exam?.description ?? item?.description ?? "",
    total_duration_minutes:
      exam?.total_duration_minutes ?? item?.total_duration_minutes ?? 0,
    is_active: item?.is_active ?? exam?.is_active ?? true,
    target_year: item?.target_year ?? exam?.target_year ?? null,
    // scoring_type / pass_marks ride on the nested exam; tolerate the flat shape.
    scoring_type: toScoringType(exam?.scoring_type ?? item?.scoring_type),
    pass_marks: exam?.pass_marks ?? item?.pass_marks ?? null,
  };
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
  reset: () => void;
  // The currently selected exam, resolved out of `targetExams`.
  activeExam: TargetExam | null;
  // Scoring rules for the active exam.
  scoring: ExamScoring;
  // Shorthand for `scoring.isPassFail` — hide leaderboard/rank/percentile when true.
  isPassFail: boolean;
  // Scoring for a specific exam (e.g. the exam a mock/assessment belongs to).
  // Falls back to the active exam's scoring when the id is unknown.
  getExamScoring: (examId?: number | string | null) => ExamScoring;
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

      // Resolve the country to scope by: one passed in (region switch) is
      // persisted; otherwise use the saved selection (set from /get_country/ at
      // login). target-exams is scoped by the auth token AND this country, so
      // the list is specific to the logged-in user in their country.
      let activeCountryId = countryId;
      if (activeCountryId != null && activeCountryId !== "") {
        await AsyncStorage.setItem(COUNTRY_KEY, String(activeCountryId));
      } else {
        activeCountryId = await AsyncStorage.getItem(COUNTRY_KEY);
      }

      const res = await getTargetExamsService(activeCountryId);
      const data = res?.data;
      const targetExams: TargetExam[] = Array.isArray(data)
        ? data.map(normalizeTargetExam)
        : [];

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
      } else {
        // The chosen country has no target exams for this student. Drop the
        // cache too, or the previous country's exams come back on the next
        // launch (and via the offline fallback below).
        await AsyncStorage.removeItem(TARGET_EXAMS_KEY);
      }
      if (activeExamId != null) {
        await AsyncStorage.setItem(ACTIVE_EXAM_KEY, String(activeExamId));
      } else {
        await AsyncStorage.removeItem(ACTIVE_EXAM_KEY);
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

  // Clears the in-memory exam selection/catalogue. The provider is mounted
  // above the router, so it survives logout navigation — without this, the
  // previous student's activeExamId stays in memory and drives every data
  // fetch after a different student logs in. (Persisted keys are wiped
  // separately via clearUserSession.)
  // Back to the provider's launch state, `isLoading` included: "no exam yet"
  // here means unknown, not "this student has no course". Screens key their
  // empty states off `activeExamId == null`, and reporting that as settled makes
  // them announce a missing course to someone who has simply logged out. The
  // next sign-in resolves it — both LoginScreen and SignupScreen call
  // refreshExams straight after reset.
  const reset = useCallback(() => {
    inFlight.current = false;
    setState({
      targetExams: [],
      activeExamId: null,
      isLoading: true,
      error: null,
    });
  }, []);

  useEffect(() => {
    refreshExams();
  }, [refreshExams]);

  const activeExam = useMemo<TargetExam | null>(
    () =>
      state.targetExams.find(
        (e) => String(e.id) === String(state.activeExamId)
      ) ?? null,
    [state.targetExams, state.activeExamId]
  );

  const scoring = useMemo<ExamScoring>(() => toScoring(activeExam), [activeExam]);

  const getExamScoring = useCallback(
    (examId?: number | string | null): ExamScoring => {
      if (examId == null || examId === "") return scoring;
      const exam = state.targetExams.find(
        (e) => String(e.id) === String(examId)
      );
      return exam ? toScoring(exam) : scoring;
    },
    [state.targetExams, scoring]
  );

  const value = useMemo<TargetExamContextValue>(
    () => ({
      ...state,
      setActiveExamId,
      refreshExams,
      reset,
      activeExam,
      scoring,
      isPassFail: scoring.isPassFail,
      getExamScoring,
    }),
    [
      state,
      setActiveExamId,
      refreshExams,
      reset,
      activeExam,
      scoring,
      getExamScoring,
    ]
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
 