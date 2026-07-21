import AsyncStorage from "@react-native-async-storage/async-storage";
import { submitMockAttemptService } from "../services/mock-library";
import { assessmentSubmitService } from "../services/assessments-attempts";

const ACTIVE_ATTEMPT_KEY = "rankxcel_active_exam_attempt";

// How long the app may sit in the background before an in-progress attempt is
// auto-submitted. Brief app-switches under this window keep the test alive (the
// wall-clock timer self-corrects on resume); leaving longer — or killing the
// app — submits the attempt.
export const EXAM_BACKGROUND_GRACE_MS = 30_000;

export type ExamKind = "mock" | "assessment";

export interface ActiveExamAttempt {
  kind: ExamKind;
  attemptId: number | string;
  // Absolute epoch-ms deadline when the attempt's time runs out.
  deadline: number;
}

// Record the attempt currently being taken so that, if the app is killed /
// swiped out of recents mid-exam, it can be submitted on the next launch.
export async function saveActiveAttempt(record: ActiveExamAttempt): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVE_ATTEMPT_KEY, JSON.stringify(record));
  } catch (e) {
    console.log("saveActiveAttempt error:", e);
  }
}

export async function clearActiveAttempt(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACTIVE_ATTEMPT_KEY);
  } catch (e) {
    console.log("clearActiveAttempt error:", e);
  }
}

export async function getActiveAttempt(): Promise<ActiveExamAttempt | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_ATTEMPT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveExamAttempt;
  } catch (e) {
    console.log("getActiveAttempt error:", e);
    return null;
  }
}

// Called once at app launch. A stored record here means the previous run ended
// without submitting (the app was closed / removed from recents during an exam).
//
// Only auto-submit if the attempt's time is actually up. If time still remains,
// KEEP the record so the student can reopen and resume where they left off — a
// later launch (past the deadline) will submit it if they never return.
export async function submitAbandonedAttempt(): Promise<void> {
  const record = await getActiveAttempt();
  if (!record) return;

  const timeLeft =
    typeof record.deadline === "number" && Date.now() < record.deadline;
  if (timeLeft) {
    console.log(
      "Active attempt still has time left — keeping for resume:",
      record,
    );
    return;
  }

  try {
    if (record.kind === "mock") {
      await submitMockAttemptService(record.attemptId);
    } else {
      await assessmentSubmitService(Number(record.attemptId));
    }
    console.log("Auto-submitted abandoned attempt (time up):", record);
  } catch (e) {
    console.log("submitAbandonedAttempt error:", e);
  } finally {
    // Clear regardless so a permanently-invalid record can't loop forever.
    await clearActiveAttempt();
  }
}
