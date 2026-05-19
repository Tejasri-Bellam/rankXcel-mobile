
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

// Mock Tests
export async function getMockTestsService() {
  return await genericGet(`/v1/mock-tests/`,true);
}

// Mock Test By ID
export async function getMockTestByIdService(
  id: number | string
) {
  return await genericGet(`/v1/mock-tests/${id}/`,true);
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

// Create Mock
export async function createMockTestService(payload: {
  title: string;
  exam: ExamTag;
  subject: string;
  difficulty: Difficulty;
  duration: string;
  questions: number;
}) {
  return await genericPost(`/v1/mock-tests/`,payload, { isMultipart: false, useAccessToken: true}
  );
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
export async function submitMockResponseService(
  mockId: number | string,
  questionId: number | string,
  payload: { selected_option: string }) 
  {
  return await genericPut(`/v1/mock-tests/${mockId}/responses/${questionId}/`,payload, { isMultipart: false, useAccessToken: true});
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