import { genericGet } from "./genericService";


export async function getChapterPerformanceService(examId: number | string) {
  return await genericGet(`/v1/student/chapters/performance/${examId}/`, true);
}
