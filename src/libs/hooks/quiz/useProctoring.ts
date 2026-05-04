import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { reportViolation } from "@/libs/services/quiz/quizService";

interface UseProctoringResult {
  violationCount: number;
}

export function useProctoring(
  attemptId: number | null,
  isEnabled: boolean,
): UseProctoringResult {
  const [violationCount, setViolationCount] = useState(0);
  const lastStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (!isEnabled || !attemptId) return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      // Detect app going to background (user switched away)
      if (lastStateRef.current === "active" && nextState !== "active") {
        reportViolation(attemptId, "tab_switch")
          .then(() => setViolationCount((c) => c + 1))
          .catch(console.error);
      }
      lastStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [attemptId, isEnabled]);

  return { violationCount };
}
