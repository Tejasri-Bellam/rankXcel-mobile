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

// Subjects for an exam (target exam → subjects).
// GET /api/v1/exams/{exam_id}/subjects/
export const getExamSubjectsService = (examId: number | string) =>
  genericGet(`/v1/exams/${examId}/subjects/`, true);

// Topics for a subject. Pass parentId to fetch the sub-topics of a topic.
// GET /api/v1/subjects/{subject_id}/topics/
// GET /api/v1/subjects/{subject_id}/topics/?parent_id={parentId}
export const getTopicsService = (
  subjectId: number | string,
  parentId?: number | string
) => {
  const qs = parentId != null ? `?parent_id=${parentId}` : "";
  return genericGet(`/v1/subjects/${subjectId}/topics/${qs}`, true);
};
