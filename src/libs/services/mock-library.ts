import {
  genericGETService,
  genericPOSTService,
  genericPUTService,
} from "./api";

import {
  MockStatus,
  Difficulty,
  ExamTag,
  MockTest,
  MockQuestion,
  MockResult,
} from "../types/mock-library";

// Generic API Response
export interface MockResponse<T = any> {
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

// Mock Tests
export async function getMockTestsService() {
  return await genericGETService(`/v1/mock-tests/`,true);
}

// Mock Test By ID
export async function getMockTestByIdService(
  id: number | string
) {
  return await genericGETService(`/v1/mock-tests/${id}/`,true);
}

// Questions
export async function getMockTestQuestionsService(
  id: number | string
) {
  return await genericGETService(`/v1/mock-tests/${id}/questions/`,true);
}

// Result
export async function getMockTestResultService(
  id: number | string
) {
  return await genericGETService(`/v1/mock-tests/${id}/result/`,true);
}

// Review
export async function getMockTestReviewService(
  id: number | string
) {
  return await genericGETService(`/v1/mock-tests/${id}/review/`,true);
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
  return await genericPOSTService(`/v1/mock-tests/`,payload,false,true);
}

// Start Mock
export async function startMockTestService(
  id: number | string
) {
  return await genericPOSTService(`/v1/mock-tests/${id}/start/`,{},false,true);
}

// Submit Mock
export async function submitMockTestService(id: number | string) {
  return await genericPOSTService(`/v1/mock-tests/${id}/submit/`,{},false,true);
}

// Submit Response
export async function submitMockResponseService(
  mockId: number | string,
  questionId: number | string,
  payload: { selected_option: string }) 
  {
  return await genericPUTService(`/v1/mock-tests/${mockId}/responses/${questionId}/`,payload,false,true);
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