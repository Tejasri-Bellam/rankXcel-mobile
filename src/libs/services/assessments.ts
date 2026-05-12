import { genericGETService, genericPOSTService, genericPATCHService, genericDELETEService } from "./api";


// Get All Assessments
export async function getassessmentsService() {
  return await genericGETService("/v1/assessments/", true);
}

// Get Single Assessment
export async function getassessmentsIdService(id: number) {
  return await genericGETService(`/v1/assessments/${id}/`, true);
}

// Get Questions
export async function getassessmentsQuestionsService(id: number) {
  return await genericGETService(`/v1/assessments/${id}/questions/`,true);
}

// Reattempt
export async function reattemptAssessmentService(id: number) {
  return await genericPOSTService(`/v1/assessments/${id}/reattempt/`,{},false,true);
}

// Delete Question
export async function deleteQuestionsService(assessmentId: number,questionId: number) {
  return await genericDELETEService(`/v1/assessments/${assessmentId}/questions/${questionId}/`,true);
}