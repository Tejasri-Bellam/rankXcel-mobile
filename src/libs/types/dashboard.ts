// Shape of GET /api/v1/dashboard/{exam_id}/

export interface SubjectStrength {
  subject_name: string;
  accuracy: number;
}

export interface RecentActivityItem {
  type: string; // "Practice" | "Mock" | "Assessment"
  label: string;
  submitted_at: string; // ISO timestamp
  percentage: number;
}

export interface TodaysFocusItem {
  topic_name: string;
  subject_name: string;
  accuracy: number;
}

export interface InProgressSession {
  test_name: string;
  last_section: string;
  time_ago: string;
  total_questions: number;
  progress_percentage: number;
}

export interface UpcomingAssessment {
  name: string;
  time_label: string;
  difficulty: string;
}

export interface StreakDay {
  day: string;
  completed: boolean;
}

export interface DashboardStreak {
  current_streak: number;
  best_streak: number;
  streak_days: StreakDay[];
}

export interface DashboardData {
  selected_exam_id: number;
  strength_by_subject: SubjectStrength[];
  streak: DashboardStreak;
  recent_activity: RecentActivityItem[];
  in_progress_session: InProgressSession | null;
  upcoming_assessments: UpcomingAssessment[];
  todays_focus: TodaysFocusItem[];
}

// GET /api/v1/dashboard/{exam_id}/history/ (paginated)
export interface DashboardHistoryPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: RecentActivityItem[];
}

export interface DashboardUser {
  name: string;
  email: string;
  [key: string]: any;
}
