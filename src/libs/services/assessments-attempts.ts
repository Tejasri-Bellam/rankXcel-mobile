import { genericGet, genericPost, genericPut } from "./genericService";

// A node inside a result's topic_breakdown map. The map is keyed by subject id;
// each entry carries aggregate correct/wrong/unattempted counts plus nested
// topic/subtopic rows of the same shape. Every node carries its own `name` and
// `accuracy`, so weak areas can be surfaced (and deep-linked into practice)
// straight from this map. The legacy flat fields (topic_name/subject_name) are
// kept optional for older /result/ payloads.
export interface AssessmentTopicBreakdown {
  name?: string;
  score?: number;
  total_score?: number;
  max_score: number;
  correct_score?: number;
  wrong_score?: number;
  correct: number;
  wrong: number;
  unattempted: number;
  accuracy?: number;
  topic_name?: string;
  subject_name?: string;
  topics?: Record<string, Partial<AssessmentTopicBreakdown>>;
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
  correct_questions_count: number;
  wrong_questions_count: number;
  correct_questions_score: number;
  wrong_questions_score: number;
  topic_breakdown: Record<string, AssessmentTopicBreakdown>;
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