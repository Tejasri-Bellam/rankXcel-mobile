import { genericPost } from "./genericService";


export type QuestionReportIssueType =
  | "QUESTION_TEXT"
  | "CHOICE"
  | "CORRECT_ANSWER"
  | "IMAGE"
  | "OTHER";

export interface QuestionReportPayload {
  issue_type: QuestionReportIssueType;
  description?: string;
  choice?: number;
}

export const reportQuestionService = (
  questionId: number | string,
  payload: QuestionReportPayload,
) => genericPost(`/v1/questions/${questionId}/reports/`, payload, true);