import { genericGet, genericPost } from "./genericService";

// Get All Assessments
export async function getassessmentsService() {
  return await genericGet("/v1/student/assessments/", true);
}

// Get Single Assessment
export async function getassessmentsIdService(id: number) {
  return await genericGet(`/v1/student/assessments/${id}/attempts/`, true);
}

// Get Questions
export async function getassessmentsQuestionsService(id: number) {
  console.log("Getting questions for assessment id:", id);
  return await genericGet(`/v1/student/assessments/${id}/questions/`,true);
}

// Reattempt
export async function reattemptAssessmentService(assessment_id: number) {
  console.log("Reattempting assessment with id:", assessment_id);
  return await genericPost(`/v1/student/assessments/${assessment_id}/reattempt/`,{},
    { isMultipart: false, useAccessToken: true }
  );
}

