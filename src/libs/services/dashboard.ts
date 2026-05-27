import { genericGet } from "./genericService";

// GET /api/v1/auth/me/
export async function getDashboardUserService() {
  return await genericGet("/v1/auth/me/", true);
}

// GET /api/v1/exams/my-target-exams/
export async function getMyTargetExamsService() {
  return await genericGet("/v1/exams/my-target-exams/", true);
}

// GET /api/v1/dashboard/{exam_id}/
export async function getDashboardDataService(examId: number | string) {
  return await genericGet(`/v1/dashboard/${examId}/`, true);
}