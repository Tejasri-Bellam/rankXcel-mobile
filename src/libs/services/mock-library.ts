
import { genericGet, genericPost, genericPut } from "./genericService";

// API Response
export type MockStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED';
 
// Difficulty as returned by API (lowercase) — also accept normalized form
export type Difficulty = 'easy' | 'medium' | 'hard' | 'Easy' | 'Medium' | 'Hard';
 
// Exam codes/names are dynamic; keep as string (don't constrain)
export type ExamTag = string;
 
// Test types from API
export type TestType = 'PRACTICE_TEST' | 'MOCK_TEST' | string;
 
// Nested exam object from API
export interface ExamObject {
  id: number;
  code: string;
  name: string;
}
 
// Nested subject object from API
export interface SubjectObject {
  id: number;
  code: string;
  name: string;
}
 
// The full MockTest shape
export interface MockTest {
  id: number | string;
  title?: string;
  exam: ExamObject | string;
  subject: SubjectObject | string;
  chapters: number[];
  difficulty: Difficulty;
  status: MockStatus;
  test_type: TestType;
  question_count: number;
  total_duration_minutes: number;
  max_score: number | null;
  score: number | null;
  started_at: string | null;
  submitted_at: string | null;
  percentile?: number | null;
}
 
// API list response
export interface MockListResponse {
  data: {
    count: number;
    next: string | null;
    previous: string | null;
    results: MockTest[];
  };
  status: number;
}

export interface MockResponse<T = any> {
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

// Mock Tests — exam-scoped list: GET /v1/exams/{examId}/mock-tests/
// Falls back to the global endpoint when no target exam is selected.
export async function getMockTestsService(
  examId?: number | string,
  testType: TestType = 'MOCK_TEST',
  page?: number,
) {
  const pageQs = page && page > 1 ? `&page=${page}` : '';
  if (examId != null) {
    return await genericGet(
      `/v1/exams/${examId}/mock-tests/?test_type=${testType}${pageQs}`,
      true,
    );
  }
  return await genericGet(`/v1/mock-tests/?test_type=${testType}${pageQs}`, true);
}

// Mock Test By ID
export async function getMockTestByIdService(
  id: number | string
) {
  return await genericGet(`/v1/mock-tests/${id}/`,true);
}

// AI Tutor — ask about a question within a mock/practice test.
export interface TutorPayload {
  question_id?: number | string;
  message: string;
}

export async function askMockTestTutorService(
  id: number | string,
  payload: TutorPayload,
) {
  return await genericPost(`/v1/mock-tests/${id}/tutor/`, payload, {
    isMultipart: false,
    useAccessToken: true,
    timeout: 60000, // AI generation is slow; the default 15s times out.
  });
}

// Questions
export async function getMockTestQuestionsService(
  id: number | string
) {
  return await genericGet(`/v1/mock-tests/${id}/questions/`,true);
}

// Result
export async function getMockTestResultService(
  id: number | string
) {
  return await genericGet(`/v1/mock-tests/${id}/result/`,true);
}

// Review
export async function getMockTestReviewService(
  id: number | string
) {
  return await genericGet(`/v1/mock-tests/${id}/review/`,true);
}

// Detailed Analysis
export async function getMockTestDetailedAnalysisService(
  id: number | string
) {
  return await genericGet(`/v1/mock-tests/${id}/detailed-analysis/`, true);
}

// Per-question solution (AI-generated)
export async function getQuestionSolutionService(
  questionId: number | string
) {
  return await genericGet(`/v1/questions/${questionId}/solution/`, true);
}

// Create Mock
export interface CreateMockTestPayload {
  exam: number;
  subject: number;
  chapter_ids?: number[];
  topic_ids?: number[];
  question_count: number;
  total_duration_minutes: number;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  test_type?: 'MOCK_TEST' | 'PRACTICE_TEST';
}

export async function createMockTestService(payload: CreateMockTestPayload) {
  return await genericPost(`/v1/mock-tests/`, payload, { isMultipart: false, useAccessToken: true });
}

// Options
export interface OptionItem {
  id: number;
  name: string;
  code: string;
}

export async function getMyTargetExamsOptionsService() {
  return await genericGet(`/v1/exams/my-target-exams/`, true);
}

export async function getSubjectOptionsService(examId?: number) {
  const qs = examId ? `?exam_id=${examId}` : '';
  return await genericGet(`/v1/options/subjects/${qs}`, true);
}

export async function getChapterOptionsService(subjectId?: number) {
  const qs = subjectId ? `?subject_id=${subjectId}` : '';
  return await genericGet(`/v1/options/chapters/${qs}`, true);
}

export async function getTopicOptionsService(chapterId?: number) {
  const qs = chapterId ? `?chapter_id=${chapterId}` : '';
  return await genericGet(`/v1/options/topics/${qs}`, true);
}

// Topics for a subject. Pass parentId to fetch subtopics of a topic.
export async function getSubjectTopicsService(subjectId: number, parentId?: number) {
  const qs = parentId != null ? `?parent=${parentId}` : '';
  return await genericGet(`/v1/subjects/${subjectId}/topics/${qs}`, true);
}
// Start Mock
export async function startMockTestService(
  id: number | string
) {
    return await genericPost(`/v1/mock-tests/${id}/start/`,{}, { isMultipart: false, useAccessToken: true}
  );
}
// Submit Mock
export async function submitMockTestService(id: number | string) {
  return await genericPost(`/v1/mock-tests/${id}/submit/`,{}, { isMultipart: false, useAccessToken: true}
);
}

// Submit Response
export interface MockResponsePayload {
  selected_choice_ids: number[];
  // NUMERICAL questions submit a typed value rather than choice ids. The field
  // name mirrors the assessments responses endpoint (not in the OpenAPI spec).
  numeric_answer?: string | null;
  is_marked_for_review?: boolean;
  time_spent_seconds?: number;
}

export async function submitMockResponseService(
  mockId: number | string,
  questionId: number | string,
  payload: MockResponsePayload,
) {
  return await genericPut(
    `/v1/mock-tests/${mockId}/responses/${questionId}/`,
    payload,
    { isMultipart: false, useAccessToken: true },
  );
}

// Sort Helper
export const sortToOrdering = (
  sort: string
): string => {
  switch (sort) {
    case "Newest First":
      return "-created_at";

    case "Oldest First":
      return "created_at";

    case "Easiest First":
      return "difficulty";

    case "Hardest First":
      return "-difficulty";

    case "Most Questions":
      return "-questions";

    default:
      return "-created_at";
  }
};