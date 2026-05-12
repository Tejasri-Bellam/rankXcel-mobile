export type MockStatus = 'in_progress' | 'completed' | 'not_attempted';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type ExamTag = 'EAMCET' | 'JEE' | 'JEE Mains' | 'JEE2' | 'Mains';

export interface MockTest {
  id: string;
  exam: ExamTag;
  title: string;
  subject: string;
  duration: string;
  questions: number
  marks?: number;
  difficulty: Difficulty;
  status: MockStatus;
  score?: string;
  percentile?: string;
  accuracy?: string;
  lastAttempt?: string;
  response?: string;
}

export interface MockQuestion {
  id: string;
  question_id: string;
  text: string;
  options: { id: string; text: string }[];
  subject?: string;
  topic?: string;
  marks?: number;
  negative_marks?: number;
}

export interface MockResult {
  score: string;
  percentile: string;
  accuracy: string;
  total_questions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  time_taken: string;
}

export interface MockResponse<T = any> {
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}