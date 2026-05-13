import { genericDelete, genericGet, genericPost } from "./genericService";

// Get All Assessments
export async function getassessmentsService() {
  return await genericGet("/v1/student/assessments/", true);
}

// Get Single Assessment
export async function getassessmentsIdService(id: number) {
  return await genericGet(`/v1/student/assessments/${id}/attempt/`, true);
}

// Get Questions
export async function getassessmentsQuestionsService(id: number) {
  return await genericGet(`/v1/student/assessments/${id}/questions/`,true);
}

// Reattempt
export async function reattemptAssessmentService(id: number) {
  return await genericPost(`/v1/student/assessments/${id}/reattempt/`,{},
    { isMultipart: false, useAccessToken: true }
  );
}

// // Delete Question
// export async function deleteQuestionsService(assessmentId: number,questionId: number) {
//   return await genericDelete(`/v1/student/assessments/${assessmentId}/questions/${questionId}/`,true);
// }