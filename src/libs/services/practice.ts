import { genericGet } from "./genericService";


export async function getChapterPerformanceService(examId: number | string) {
  return await genericGet(`/v1/student/chapters/performance/${examId}/`, true);
}

export const getTopicsService = (
  subjectId: number,
  parent?: number
) => {
  const url = parent
    ? `/api/v1/subjects/${subjectId}/topics/?parent=${parent}`
    : `/api/v1/subjects/${subjectId}/topics/`;

  return genericGet(url);
};