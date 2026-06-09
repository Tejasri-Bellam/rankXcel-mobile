import { genericGet } from "./genericService";

// GET /api/v1/auth/me/
export async function getDashboardUserService() {
  return await genericGet("/v1/auth/me/", true);
}

// GET /api/v1/exams/my-target-exams/?country={id}
export async function getMyTargetExamsService(countryId?: number | string | null) {
  const query =
    countryId != null && countryId !== ""
      ? `?country=${encodeURIComponent(countryId)}`
      : "";
  return await genericGet(`/v1/exams/my-target-exams/${query}`, true);
}

// GET /api/v1/dashboard/{exam_id}/
export async function getDashboardDataService(examId: number | string) {
  return await genericGet(`/v1/dashboard/${examId}/`, true);
}

// GET /api/v1/student/consistency/
// Daily activity feed for the Stats consistency heatmap.
export async function getConsistencyService() {
  return await genericGet(`/v1/student/consistency/`, true);
}

// GET /api/v1/dashboard/{exam_id}/history/?page={page}&type={type}
// Paginated recent-activity history feed. `type` filters by activity kind
// ("mock" | "practice" | "test" | "assessment"); omit/null for all types.
export async function getDashboardHistoryService(
  examId: number | string,
  page: number = 1,
  type?: string | null
) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (type) params.set("type", type);
  const query = params.toString() ? `?${params.toString()}` : "";
  return await genericGet(`/v1/dashboard/${examId}/history/${query}`, true);
}