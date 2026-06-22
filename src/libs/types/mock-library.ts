import { OptionItem } from "../services/mock-library";

export type MockStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED';
 
// Difficulty as returned by API (lowercase) — also accept normalized form
export type Difficulty = 'easy' | 'medium' | 'hard' | 'Easy' | 'Medium' | 'Hard';
 
// Exam codes/names are dynamic; keep as string (don't constrain)
export type ExamTag = string;
 
// Test types from API
export type TestType = 'PRACTICE_TEST' | 'MOCK_TEST' | string;

export type ApiErrorShape = {
  status: number;
  errors: Record<string, string[] | undefined>;
  body?: Record<string, unknown>;
};
 
// Nested exam object from API
export interface ExamObject {
  id: number;
  code: string;
  name: string;
}

export interface DifficultyOption {
  value: 'easy' | 'medium' | 'hard' | 'any';
  label: string;
}
 
// Nested subject object from API
export interface SubjectObject {
  id: number;
  code: string;
  name: string;
}
 
// The full MockTest shape, matching the API response
export interface MockTest {
  id: number | string;
  title?: string;
  exam: ExamObject | string;
  name: string;
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
 
// Generic API list response wrapper
export interface MockListResponse {
  data: {
    count: number;
    next: string | null;
    previous: string | null;
    results: MockTest[];
  };
  status: number;
}

// Props for the OptionDropdown component
export interface OptionDropdownProps {
  value: OptionItem | null;
  options: OptionItem[];
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  onSelect: (item: OptionItem) => void;
}

// Props for the RequestMockModal component
export interface RequestMockModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (mockId: string) => void;
}

// Sort Dropdown
export interface SortDropdownProps {
  visible: boolean;
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}