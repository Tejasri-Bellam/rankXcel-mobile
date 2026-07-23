
import { genericGet, genericPost, genericPut } from "./genericService";

// API Response
export type MockStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'PUBLISHED';
 
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
  name:string;
  exam: ExamObject | string;
  subject: SubjectObject | string;
  // Subjects covered by the mock, as returned by the API list/detail endpoints.
  subjects?: SubjectObject[];
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
  // Number of attempts the student has made; retake is offered once > 0.
  total_attempts?: number;
  // Most recent attempt — used to view its result / review / analysis.
  latest_attempt_id?: number | null;
  latest_attempt_number?: number | null;
  // The student's most recent attempt status (IN_PROGRESS/SUBMITTED/…). Distinct
  // from `status`, which is the mock's PUBLISH state — this is what tells us a
  // mid-test attempt can be resumed.
  latest_attempt_status?: string | null;
  // Scope: full-syllabus vs. subject-picked. Drives the card's scope label.
  is_full_syllabus?: boolean;
  // Admin-authored ("official") mock — shown with an Admin badge on the card.
  is_official?: boolean;
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

// AI Tutor conversation (mock review) ----------------------------------------
// The tutor in the mock review runs as a conversation scoped to a question:
//   1. POST .../questions/{qid}/conversation/  → start the conversation
//   2. GET  .../questions/{qid}/conversation/  → fetch the conversation id
//   3. GET  /conversations/{cid}/follow-up-messages/  → load chat history
//   4. POST /conversations/{cid}/follow-up-messages/  → send a message / get a reply

// Start (or ensure) a conversation for a question within a mock test.
export async function startMockQuestionConversationService(
  mockId: number | string,
  questionId: number | string,
) {
  const res = await genericPost(
    `/v1/mock-tests/${mockId}/questions/${questionId}/conversation/`,
    {},
    { isMultipart: false, useAccessToken: true, timeout: 60000 },
  );
  console.log(
    `[TUTOR] POST conversation (mock ${mockId}, question ${questionId}) response:`,
    JSON.stringify(res?.data, null, 2),
  );
  return res;
}

// Retrieve the conversation (including its id) for a question.
export async function getMockQuestionConversationService(
  mockId: number | string,
  questionId: number | string,
) {
  const res = await genericGet(
    `/v1/mock-tests/${mockId}/questions/${questionId}/conversation/`,
    true,
  );
  console.log(
    `[TUTOR] GET conversation (mock ${mockId}, question ${questionId}) response:`,
    JSON.stringify(res?.data, null, 2),
  );
  return res;
}

// Load the follow-up message history for a conversation.
export async function getConversationMessagesService(
  conversationId: string,
) {
  const res = await genericGet(
    `/v1/conversations/${conversationId}/follow-up-messages/`,
    true,
  );
  console.log(
    `[TUTOR] GET follow-up-messages (conversation ${conversationId}) response:`,
    JSON.stringify(res?.data, null, 2),
  );
  return res;
}

// Send a follow-up message and receive the tutor's reply. The endpoint stores
// the exchange as { content: { question, response } }, so the input field is
// `question`.
export async function sendConversationMessageService(
  conversationId: string,
  message: string,
) {
  const res = await genericPost(
    `/v1/conversations/${conversationId}/follow-up-messages/`,
    { question: message },
    { isMultipart: false, useAccessToken: true, timeout: 60000 },
  );
  console.log(
    `[TUTOR] POST follow-up-messages (conversation ${conversationId}) response:`,
    JSON.stringify(res?.data, null, 2),
  );
  return res;
}

// Questions
export async function getMockTestQuestionsService(
  id: number | string
) {
  return await genericGet(`/v1/mock-tests/${id}/questions/`,true);
}

// Questions + already-saved answers for an in-progress attempt (resume flow).
// GET /v1/mock-test-attempts/{attemptId}/questions/
export async function getMockAttemptQuestionsService(
  attemptId: number | string
) {
  return await genericGet(`/v1/mock-test-attempts/${attemptId}/questions/`, true);
}

// Mock detail — returns the test with its questions AND the user's already
// saved answers (existing_answers), so an in-progress mock can be resumed.
// GET /v1/mock-tests/{id}/
export async function getMockTestService(
  id: number | string
) {
  return await genericGet(`/v1/mock-tests/${id}/`, true);
}

// Per-subject summary inside a result's topic_breakdown map. The map is keyed
// by subject id; each entry carries aggregate correct/wrong/unattempted counts
// plus nested topic/subtopic rows of the same shape. Each node also carries its
// own `name` and `accuracy`, so weak areas can be surfaced (and deep-linked into
// practice) straight from this map.
export interface MockTopicBreakdown {
  name?: string;
  max_score: number;
  total_score: number;
  correct_score?: number;
  wrong_score?: number;
  correct: number;
  wrong: number;
  unattempted: number;
  accuracy: number;
  topics?: Record<string, Partial<MockTopicBreakdown>>;
  subtopics?: Record<string, Partial<MockTopicBreakdown>>;
}

// Shape returned by both POST /submit/ and GET /result/ — they're identical.
export interface MockTestResult {
  mock_test_id: number;
  status: MockStatus;
  submitted_at: string;
  total_score: number;
  max_score: number;
  percentage: number;
  accuracy: number;
  time_taken_seconds: number;
  correct_questions_count: number;
  wrong_questions_count: number;
  correct_questions_score: number;
  wrong_questions_score: number;
  topic_breakdown: Record<string, MockTopicBreakdown>;
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

// Attempt-based result / review / detailed-analysis. Keyed on the attempt_id
// returned by /start/ (the current attempt-based exam flow).
// GET /v1/mock-test-attempts/{attemptId}/result/
export async function getMockAttemptResultService(attemptId: number | string) {
  return await genericGet(`/v1/mock-test-attempts/${attemptId}/result/`, true);
}

// GET /v1/mock-test-attempts/{attemptId}/review/
export async function getMockAttemptReviewService(attemptId: number | string) {
  return await genericGet(`/v1/mock-test-attempts/${attemptId}/review/`, true);
}

// GET /v1/mock-test-attempts/{attemptId}/detailed-analysis/
export async function getMockAttemptDetailedAnalysisService(attemptId: number | string) {
  return await genericGet(`/v1/mock-test-attempts/${attemptId}/detailed-analysis/`, true);
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

// Build-your-own mock — exam-scoped: POST /v1/exams/{examId}/mock-tests/
// Three scopes are supported via one payload shape:
//   • Pick subjects   → subject_ids: [..] (one or many) + count/difficulty/duration
//   • Full syllabus   → is_full_syllabus: true (subjects omitted; duration auto from exam)
//   • Practice        → test_type: 'PRACTICE_TEST' with a single subject_id
export interface BuildMockTestPayload {
  test_type: 'MOCK_TEST' | 'PRACTICE_TEST';
  subject_ids?: number[];
  is_full_syllabus?: boolean;
  question_count?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  total_duration_minutes?: number;
}

export async function createExamMockTestService(
  examId: number | string,
  payload: BuildMockTestPayload,
) {
  return await genericPost(`/v1/exams/${examId}/mock-tests/`, payload, {
    isMultipart: false,
    useAccessToken: true,
  });
}

// Options
export interface OptionItem {
  id: number;
  name: string;
  code: string;
}

export async function getSubjectOptionsService(examId?: number) {
  const qs = examId ? `?exam_id=${examId}` : '';
  return await genericGet(`/v1/options/subjects/?exam=${examId}`, true);
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
  return await genericPost(`/v1/mock-tests/${id}/submit/`,{}, { isMultipart: false, useAccessToken: true, timeout: 60000 }
);
}

// Submit an attempt — finalizes the in-progress attempt returned by /start/.
// POST /v1/mock-test-attempts/{attemptId}/submit/
export async function submitMockAttemptService(attemptId: number | string) {
  return await genericPost(`/v1/mock-test-attempts/${attemptId}/submit/`, {}, {
    isMultipart: false,
    useAccessToken: true,
    // Submit triggers server-side scoring, which routinely takes longer than
    // the default 15s and was timing out to a status-0 "network error".
    timeout: 60000,
  });
}

// Retake a submitted mock — resets it so a fresh attempt can be started.
// POST /v1/mock-tests/{mockTestId}/retake/
export async function retakeMockTestService(mockTestId: number | string) {
  return await genericPost(`/v1/mock-tests/${mockTestId}/retake/`, {}, {
    isMultipart: false,
    useAccessToken: true,
  });
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

// Save a single answer against an attempt (attempt-based exam flow).
// PUT /v1/mock-test-attempts/{attemptId}/responses/{questionId}/
export async function submitMockAttemptResponseService(
  attemptId: number | string,
  questionId: number | string,
  payload: MockResponsePayload,
) {
  return await genericPut(
    `/v1/mock-test-attempts/${attemptId}/responses/${questionId}/`,
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