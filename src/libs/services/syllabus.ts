// Service surface for the Syllabus feature flow:
//   1. Load the syllabus tree (the "Syllabus" page)
//   2. Subject overview (per-topic performance)
//   3. Start a practice/test from a syllabus node (resolve ids → create session)
//   4. Take the session (load questions, save answers, AI tutor)
//
// Endpoint/name mapping mirrors the product spec. Where an equivalent service
// already exists elsewhere it is re-exported here (under the spec name) so the
// syllabus pages have a single, spec-aligned import surface — no duplicated
// HTTP logic.

import { genericGet, genericPost, genericPut } from "./genericService";

/* 1. Load the syllabus tree --------------------------------------------- */

// Full syllabus tree (subjects → topics → subtopics) for an exam.
// GET /v1/exams/{examId}/syllabus/
export { getExamSyllabusService } from "./practice";

/* 2. Subject overview sub-page ------------------------------------------ */

// Per-topic performance (accuracy) for an exam — drives the syllabus rings.
// GET /v1/student/topics/performance/{examId}/
export { getTopicPerformanceService as getChapterPerformanceService } from "./practice";

/* 3. Start a practice/test from a syllabus node ------------------------- */

// Name → id resolution helpers — only used when ids aren't threaded from the
// tree, then create the session.

// Resolve the subject for an exam.
// GET /v1/options/subjects/?exam_id={examId}
export async function getOptionsSubjectsService(examId: number | string) {
  return await genericGet(`/v1/options/subjects/?exam_id=${examId}`, true);
}

// Resolve a topic (mid-level) by its parent subject.
// GET /v1/options/topics/?subject_id={subjectId}
export async function getOptionsChaptersService(subjectId: number | string) {
  return await genericGet(`/v1/options/topics/?subject_id=${subjectId}`, true);
}

// Resolve a sub-topic by its parent topic.
// GET /v1/options/topics/?chapter_id={topicId}
export async function getOptionsTopicsService(topicId: number | string) {
  return await genericGet(`/v1/options/topics/?chapter_id=${topicId}`, true);
}

// Create a practice/test session scoped to an exam.
// POST /v1/exams/{examId}/mock-tests/
export interface RequestMockTestPayload {
  exam: number;
  subject: number;
  topic_ids: number[];
  question_count: number;
  // "any" difficulty is normalized to "mixed" by the caller.
  difficulty?: "easy" | "medium" | "hard" | "mixed" | null;
  test_type: "PRACTICE_TEST" | "MOCK_TEST";
  total_duration_minutes?: number;
}

export async function requestMockTestService(
  examId: number | string,
  payload: RequestMockTestPayload,
) {
  return await genericPost(`/v1/exams/${examId}/mock-tests/`, payload, {
    isMultipart: false,
    useAccessToken: true,
  });
}

/* 4. Take the session --------------------------------------------------- */

// Load the questions for a session.
// GET /v1/mock-tests/{id}/questions/
export { getMockTestQuestionsService } from "./mock-library";

// Save / check a single answer.
// PUT /v1/mock-tests/{id}/responses/{questionId}/
export interface QuestionResponsePayload {
  selected_choice_ids?: number[];
  // NUMERICAL questions submit a typed value rather than choice ids.
  numeric_answer?: string | null;
  is_marked_for_review?: boolean;
  time_spent_seconds?: number;
}

export async function saveQuestionResponseService(
  mockId: number | string,
  questionId: number | string,
  payload: QuestionResponsePayload,
) {
  return await genericPut(
    `/v1/mock-tests/${mockId}/responses/${questionId}/`,
    payload,
    { isMultipart: false, useAccessToken: true },
  );
}

// AI tutor — ask about a question within the session.
// POST /v1/mock-tests/{id}/tutor/
export interface TutorPayload {
  question_id?: number | string;
  message: string;
}

export async function askTutorService(
  mockId: number | string,
  payload: TutorPayload,
) {
  return await genericPost(`/v1/mock-tests/${mockId}/tutor/`, payload, {
    isMultipart: false,
    useAccessToken: true,
    timeout: 60000, // AI generation is slow; the default 15s times out.
  });
}
