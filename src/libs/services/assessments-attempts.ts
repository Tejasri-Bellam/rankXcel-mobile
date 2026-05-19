import { genericGet, genericPost, genericPut } from "./genericService";


// Get Attempt
export async function getassessmentAttemptsService(attemptId: number) {
  return await genericGet(`/v1/assessment-attempts/${attemptId}/`,true);
}

export async function assessmentStartService(attemptId: number) {
  return await genericPost(`/v1/assessment-attempts/${attemptId}/start/`,{},
    { isMultipart: false, useAccessToken: true }
  );
}

// Get Questions
// export async function getassessmentsQuestionsService(id: number) {
//   console.log("Getting questions for assessment id:", id);
//   return await genericGet(`/v1/student/assessments/${id}/questions/`,true);
// }

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