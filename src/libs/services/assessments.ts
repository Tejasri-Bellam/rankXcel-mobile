import { genericGet, genericPost } from "./genericService";
 
// Get All Assessments — exam-scoped list: GET /v1/exams/{examId}/assessments/
// Falls back to the global student endpoint when no target exam is selected.
export async function getassessmentsService(
  examId?: number | string,
  page?: number,
  status?: string,
) {
  const qs = new URLSearchParams();
  if (page && page > 1) qs.set("page", String(page));
  if (status) qs.set("status", status);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  if (examId != null) {
    return await genericGet(`/v1/exams/${examId}/assessments/${suffix}`, true);
  }
  return await genericGet(`/v1/student/assessments/${suffix}`, true);
}


// Get Single Assessment
export async function getassessmentsIdService(id: number) {
  return await genericGet(`/v1/student/assessments/${id}/attempts/`, true);
}

// Get Questions
export async function getassessmentsQuestionsService(id: number) {
  return await genericGet(`/v1/student/assessments/${id}/questions/`,true);
}

// Register for an assessment — empty POST.
export async function registerAssessmentService(assessmentId: number | string) {
  return await genericPost(
    `/v1/assessments/${assessmentId}/register/`,
    {},
    { isMultipart: false, useAccessToken: true }
  );
}

// Leaderboard for an assessment.
export async function getAssessmentLeaderboardService(
  assessmentId: number | string
) {
  return await genericGet(`/v1/assessments/${assessmentId}/leaderboard/`, true);
}

// Reattempt
export async function reattemptAssessmentService(assessment_id: number) {
  return await genericPost(`/v1/student/assessments/${assessment_id}/reattempt/`,{},
    { isMultipart: false, useAccessToken: true }
  );
}

