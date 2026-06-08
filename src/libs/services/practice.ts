import { genericGet } from "./genericService";

// Per-topic performance (accuracy) for an exam — drives the syllabus rings.
// GET /api/v1/student/topics/performance/{exam_id}/
export async function getTopicPerformanceService(examId: number | string) {
  return await genericGet(`/v1/student/topics/performance/${examId}/`, true);
}

// Full syllabus tree (topics → subtopics) for an exam.
// GET /api/v1/exams/{id}/syllabus/
export async function getExamSyllabusService(examId: number | string) {
  return await genericGet(`/v1/exams/${examId}/syllabus/`, true);
}

// Topics for a subject. Pass parent to fetch the sub-topics of a topic.
// GET /api/v1/subjects/{subject_id}/topics/?parent={parent}
export const getTopicsService = (subjectId: number | string, parent?: number | string) => {
  const qs = parent != null ? `?parent=${parent}` : "";
  return genericGet(`/v1/subjects/${subjectId}/topics/${qs}`, true);
};
