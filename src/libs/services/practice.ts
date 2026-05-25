import { genericGet } from "./genericService";

// GET /v1/student/chapters/performance/{exam_id}/
// Returns chapter-wise percentage from assessments & mock tests.
export async function getChapterPerformanceService(examId: number | string) {
  return await genericGet(`/v1/student/chapters/performance/${examId}/`, true);
}
