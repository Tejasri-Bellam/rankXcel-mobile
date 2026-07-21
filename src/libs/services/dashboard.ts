import { genericGet } from "./genericService";

// GET /api/v1/auth/me/
export async function getDashboardUserService() {
  return await genericGet("/v1/auth/me/", true);
}

// GET /api/v1/dashboard/{exam_id}/
export async function getDashboardDataService(examId: number | string) {
  return await genericGet(`/v1/dashboard/${examId}/`, true);
}

// GET /api/v1/exams/{exam_id}/stats/
// Headline Stats numbers for the active exam:
//   { exam_readiness, avg_accuracy, total_attempts }
export async function getExamStatsService(examId: number | string) {
  return await genericGet(`/v1/exams/${examId}/stats/`, true);
}

// GET /api/v1/exams/{exam_id}/trends/
// Performance trends for the Stats → Trends tab. Response:
//   { accuracy_trend: [{ index, accuracy, type, submitted_at }], accuracy_delta,
//     time_per_question_trend: [{ index, seconds, ... }], time_delta,
//     percentile_trend: [{ index, percentile, ... }] }
export type TrendsFilter = 'all' | 'mock' | 'assessment';

export const getExamTrendsService = (
  examId: number | string,
  type: TrendsFilter = 'all',
) => genericGet(`/v1/exams/${examId}/trends/?type=${type}`, true);

// GET /api/v1/exams/{exam_id}/weakest-nodes/
// Lowest-accuracy topics for the active exam. Response is a flat array:
//   [{ topic_id, topic_name, parent_topic_name, subject_name, accuracy,
//      questions_attempted }]
export async function getWeakestNodesService(examId: number | string) {
  return await genericGet(`/v1/exams/${examId}/weakest-nodes/`, true);
}

// GET /api/v1/exams/{exam_id}/subtopic/{topic_id}/
// Detailed analytics for a single weak node (sub-topic). Response:
//   { topic_id, topic_name, parent_topic_name, subject_name, exam_name,
//     accuracy, label, questions_attempted, avg_time_seconds, attempts,
//     thirty_day_gain, accuracy_trend: [{ date, accuracy }] }
export async function getSubtopicDetailService(
  examId: number | string,
  topicId: number | string
) {
  return await genericGet(`/v1/exams/${examId}/subtopic/${topicId}/trends`, true);
}

// GET /api/v1/student/consistency/?exam_id={exam_id}
// Daily activity feed for the Stats consistency heatmap.
export async function getConsistencyService(examId: number | string) {
  return await genericGet(
    `/v1/student/consistency/?exam_id=${encodeURIComponent(examId)}`,
    true
  );
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