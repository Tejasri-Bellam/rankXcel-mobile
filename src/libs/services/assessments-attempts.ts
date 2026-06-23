import { genericGet, genericPost, genericPut } from "./genericService";

// Per-topic row inside a result's topic_breakdown map. The map is keyed by
// "Subject / Topic" (e.g. "Japan TZ Subject / Verb Conjugation").
export interface AssessmentTopicBreakdown {
  score: number;
  max_score: number;
  correct_score?: number;
  wrong_score?: number;
  correct: number;
  wrong: number;
  unattempted: number;
  topic_name: string;
  subject_name: string;
  subtopics?: Record<string, Partial<AssessmentTopicBreakdown>>;
}

// Shape returned by both POST /submit/ and GET /result/ — they're identical
// except /result/ additionally fills in rank / total_participants once the
// assessment window has closed.
export interface AssessmentResult {
  attempt_id: number;
  status: string;
  submitted_at: string;
  assessment: { id: number; name: string };
  total_score: number;
  max_score: number;
  percentage: number;
  accuracy: number;
  rank: number | null;
  total_participants: number | null;
  time_taken_seconds: number;
  topic_breakdown: Record<string, AssessmentTopicBreakdown>;
  strength_by_subject: { subject_name: string; accuracy: number }[];
}

// Get Attempt
export async function getassessmentAttemptsService(attemptId: number) {
  return await genericGet(`/v1/assessment-attempts/${attemptId}/`,true);
}

export async function assessmentStartService(attemptId: number) {
  return await genericPost(`/v1/assessment-attempts/${attemptId}/start/`,{},
    { isMultipart: false, useAccessToken: true }
  );
}

// Save Answer
export async function updateAssessmentResponsesService(
  attemptId: number,
  questionId: number,
  values: any
) {

  return await genericPut(`/v1/assessment-attempts/${attemptId}/responses/${questionId}/`,
    values,
    { isMultipart: false, useAccessToken: true}
  );
}

// Submit Attempt
export async function assessmentSubmitService(attemptId: number) {
  return await genericPost(`/v1/assessment-attempts/${attemptId}/submit/`,{},
    { isMultipart: false, useAccessToken: true }
  );
}

// Review
export async function getassessmentReviewService(attemptId: number) {
  return await genericGet(`/v1/assessment-attempts/${attemptId}/review/`,true);
}

// Result
export async function getassessmentResultService(attemptId: number) {
  return await genericGet(`/v1/assessment-attempts/${attemptId}/result/`,true);
}

// Solutions (per-question)
export async function getassessmentSolutionsService(id: number) {
  return await genericGet(`/v1/questions/${id}/solutions/`, true);
}

// Detailed Analysis
export async function getAssessmentDetailedAnalysisService(
  id: number | string
) {
  return await genericGet(`/v1/assessment-attempts/${id}/detailed-analysis/`, true);
}

// AI Tutor — ask about a question within an assessment attempt.
export interface TutorPayload {
  question_id?: number | string;
  message: string;
}

export async function askAssessmentTutorService(
  attemptId: number | string,
  payload: TutorPayload,
) {
  return await genericPost(`/v1/assessment-attempts/${attemptId}/tutor/`, payload, {
    isMultipart: false,
    useAccessToken: true,
    timeout: 60000, // AI generation is slow; the default 15s times out.
  });
}