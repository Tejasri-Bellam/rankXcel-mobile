// Shared static data extracted from components — status metadata, subject
// colours and currency symbols that were previously duplicated across screens.
// Values are kept identical to their original in-component definitions so every
// screen renders exactly as before.

// ───────────────────────────── Assessment status ─────────────────────────────

// The three card states an assessment can be in.
export type LiveStatus = "upcoming" | "live" | "results";

export interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  live?: boolean;
}

// AssessmentsScreen list pills — keyed by the backend's raw student_status.
// (The student's own standing: registered, completed, missed, etc. — distinct
// from the live/upcoming/results card state.)
export const STUDENT_STATUS_META: Record<string, StatusMeta> = {
  live: { label: "Live", color: "#EF4444", bg: "#FFECEC" },
  active: { label: "Active", color: "#EF4444", bg: "#FFECEC" },
  ongoing: { label: "Ongoing", color: "#EF4444", bg: "#FFECEC" },
  in_progress: { label: "In progress", color: "#EF4444", bg: "#FFECEC" },
  upcoming: { label: "Upcoming", color: "#3B82F6", bg: "#EAF1FF" },
  scheduled: { label: "Scheduled", color: "#3B82F6", bg: "#EAF1FF" },
  registered: { label: "Registered", color: "#2563EB", bg: "#EAF1FF" },
  completed: { label: "Results Out", color: "#059669", bg: "#E7F6EF" },
  submitted: { label: "Submitted", color: "#059669", bg: "#E7F6EF" },
  missed: { label: "Missed", color: "#6B7280", bg: "#F1F2F5" },
  expired: { label: "Expired", color: "#6B7280", bg: "#F1F2F5" },
  closed: { label: "Closed", color: "#6B7280", bg: "#F1F2F5" },
};

// LiveTestDetail header pill — keyed by the derived card state.
export const LIVE_STATUS_META: Record<LiveStatus, StatusMeta> = {
  upcoming: { label: "Upcoming", color: "#3B82F6", bg: "#EAF1FF" },
  live: { label: "Live now", color: "#EF4444", bg: "#FFECEC", live: true },
  results: { label: "Results out", color: "#6B7280", bg: "#F1F2F5" },
};

// ExamDetails status banner.
export const EXAM_STATUS_CONFIG = {
  live: { label: "Live Now", color: "#22C55E", bg: "#F0FDF4" },
  upcoming: { label: "Upcoming", color: "#F59E0B", bg: "#FFFBEB" },
  completed: { label: "Completed", color: "#9898B0", bg: "#F5F5F8" },
  missed: { label: "Missed", color: "#EF4444", bg: "#FEF2F2" },
} as const;

// Backend statuses that mean the student has finished their attempt.
export const SUBMITTED_STATUSES = new Set(["completed", "submitted"]);

// Map the backend's student_status to one of the three card states.
export const mapStudentStatus = (s?: string): LiveStatus | null => {
  switch ((s ?? "").toLowerCase()) {
    case "live":
    case "active":
    case "ongoing":
    case "in_progress":
      return "live";
    case "upcoming":
    case "scheduled":
      return "upcoming";
    case "completed":
    case "submitted":
    case "missed":
    case "expired":
    case "closed":
      return "results";
    default:
      return null;
  }
};

// Format any student_status value into a display pill, falling back to a
// title-cased version of the raw string for statuses we haven't styled.
export const studentStatusMeta = (s?: string): StatusMeta | null => {
  const key = (s ?? "").toLowerCase();
  if (!key) return null;
  if (STUDENT_STATUS_META[key]) return STUDENT_STATUS_META[key];
  const label = key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { label, color: "#6B7280", bg: "#F1F2F5" };
};

// ───────────────────────────── Subject colours ─────────────────────────────

// Fixed accent per known subject (DetailedAnalysis).
export const SUBJECT_COLORS: Record<string, string> = {
  Physics: "#FF6B6B",
  Chemistry: "#4ECDC4",
  Mathematics: "#6C5CE7",
  Biology: "#22C55E",
  General: "#9898B0",
};

// Fallback colours for subjects not in SUBJECT_COLORS, picked by index.
export const SUBJECT_PALETTE = [
  "#6C5CE7",
  "#F97316",
  "#22C55E",
  "#0EA5E9",
  "#EC4899",
  "#F59E0B",
];

export const getSubjectColor = (subject: string, idx: number): string =>
  SUBJECT_COLORS[subject] ?? SUBJECT_PALETTE[idx % SUBJECT_PALETTE.length];

// Per-subject accent bars on the results screens (Results / ExamResults).
export const SUBJECT_ACCENTS = [
  "#3B7DF8",
  "#F59E0B",
  "#22C55E",
  "#A855F7",
  "#EC4899",
  "#14B8A6",
];

// ───────────────────────────── Currency ─────────────────────────────

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  GBP: "£",
  USD: "$",
  EUR: "€",
  AUD: "A$",
  CAD: "C$",
};

// ───────────────────────────── Brand ─────────────────────────────

// Product name shown in the auth-screen headers.
export const BRAND = "RankXcel";

// ───────────────────────────── Subject emoji ─────────────────────────────

// Subject → emoji, shared by StrengthBySubject (dashboard) and RequestMock.
export const SUBJECT_EMOJI: Record<string, string> = {
  Physics: "⚛️",
  Chemistry: "🧪",
  Mathematics: "📐",
  Mathemetics: "📐",
};

// Shown for subjects without a dedicated emoji.
export const SUBJECT_FALLBACK_EMOJI = "📘";

export const subjectEmoji = (name: string): string =>
  SUBJECT_EMOJI[name] ?? SUBJECT_FALLBACK_EMOJI;

// ───────────────────────────── Practice / mock setup options ─────────────────

export type DifficultyValue = "easy" | "medium" | "hard" | "mixed";

export interface DifficultyOption {
  value: DifficultyValue;
  label: string;
}

// Mock generator (RequestMock) — full difficulty labels.
export const MOCK_DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "mixed", label: "Mixed" },
];

// Practice settings — "Med" is abbreviated to fit the narrower chip row.
export const PRACTICE_DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Med" },
  { value: "hard", label: "Hard" },
  { value: "mixed", label: "Mixed" },
];

// Preset question-count chips.
export const MOCK_QUESTION_OPTIONS = [15, 30, 50, 75];
export const PRACTICE_QUESTION_OPTIONS = [5, 10, 20];

// Preset duration chips (minutes) for generated mocks.
export const MOCK_DURATION_OPTIONS = [30, 60, 90, 180];

// ───────────────────────────── MCQ option letters ─────────────────────────────

// Display labels for answer options (A, B, C, …).
export const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

// ───────────────────────────── History filters ─────────────────────────────

// HistoryScreen filter chips → `type` query value (null = all types).
export const HISTORY_FILTERS: { label: string; value: string | null }[] = [
  { label: "All", value: null },
  { label: "Mock", value: "mock" },
  { label: "Practice", value: "practice" },
  { label: "Test", value: "test" },
  { label: "Assessment", value: "assessment" },
];

// ───────────────────────────── Notifications ─────────────────────────────

export type NotifKey =
  | "mockResults"
  | "weeklyTips"
  | "mockNotif"
  | "practiceReminders"
  | "productUpdates";

// ProfileScreen notification-preference rows.
export const NOTIFICATION_ITEMS: { key: NotifKey; label: string; channel: string }[] = [
  { key: "mockResults", label: "Mock results and analysis ready", channel: "Email" },
  { key: "weeklyTips", label: "Weekly study tips and performance insights", channel: "Email" },
  { key: "mockNotif", label: "Mock results notification", channel: "In-App" },
  { key: "practiceReminders", label: "Practice reminders and streaks", channel: "In-App" },
  { key: "productUpdates", label: "Product updates and announcements", channel: "In-App" },
];

// ───────────────────────────── Assessment instructions ─────────────────────────

// Numbered instruction list shown on the ExamDetails screen before a live test.
export const ASSESSMENT_INSTRUCTIONS = [
  "This is a live assessment. All students take the exam within the same time window.",
  'Your timer starts when you click "Start Assessment". You must finish within the exam duration.',
  "You must complete the exam before the assessment window closes.",
  "Marking scheme: +4 for correct, -1 for incorrect MCQ, 0 for unattended.",
  "You may switch between sections at any time during the exam.",
  'Answers are saved automatically when you click "Save & Next".',
  "Once you submit, the exam cannot be resumed.",
  "Switching tabs will be recorded and may be flagged.",
  "Results and rankings will be available after the assessment window closes.",
];

// ───────────────────────────── Tutor quick prompts ─────────────────────────────

// Preset prompts offered in the AI TutorModal.
export const TUTOR_QUICK_PROMPTS = [
  "Explain this question step by step",
  "Why is my answer wrong?",
  "Give me a hint",
];
