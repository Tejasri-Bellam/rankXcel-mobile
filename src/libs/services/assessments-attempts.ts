import { genericGETService, genericPOSTService, genericPATCHService, genericDELETEService, genericPUTService } from "./api";
import { UpdateProfilePayload } from "../types/auth";

// Get Attempt
export async function getassessmentAttemptsService(attemptId: number) {
  return await genericGETService(`/v1/assessment-attempts/${attemptId}/`,true);
}

// Start Attempt
export async function assessmentStartService(attemptId: number) {
  return await genericPOSTService(`/v1/assessment-attempts/${attemptId}/start/`,{},false,true);
}

// Submit Attempt
export async function assessmentSubmitService(attemptId: number) {
  return await genericPOSTService(`/v1/assessment-attempts/${attemptId}/submit/`,{},false,true);
}

// Review
export async function getassessmentReviewService(attemptId: number) {
  return await genericGETService(`/v1/assessment-attempts/${attemptId}/review/`,true);
}

// Result
export async function getassessmentResultService(attemptId: number) {
  return await genericGETService(`/v1/assessment-attempts/${attemptId}/result/`,true);
}

// Save Answer
export async function updateAssessmentResponsesService(attemptId: number,questionId: number,values: any) {
  return await genericPUTService(`/v1/assessment-attempts/${attemptId}/responses/${questionId}/`,values,false,true);
}