export interface DashboardOverview {
  mocks_taken: number;
  mocks_this_week: number;
  avg_accuracy: number;
  assessments_taken: number;
  assessments_this_week: number;
  assessments_avg_accuracy: number;
}

export interface PerformanceScore {
  date: string;
  score: number;
  percentage: number;
}

export interface RecentPerformance {
  trend: "improving" | "declining" | string;
  scores: PerformanceScore[];
}

export interface SubjectHealth {
  subject_name: string;
  accuracy: number;
  status: string;
}

export interface WeakChapter {
  chapter_name: string;
  subject_name: string;
  percentage: number;
  attempts: number;
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

export interface TodaysFocusData {
  chapter_name: string;
  subject_name: string;
  accuracy_trend: string;
  question_count: number;
  estimated_duration_minutes: number;
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
  overview: DashboardOverview;
  recent_performance: RecentPerformance;
  subject_health: {
    from_mocks: SubjectHealth[];
    from_assessments: SubjectHealth[];
  };
  weak_chapters: WeakChapter[];
  in_progress_session: InProgressSession | null;
  upcoming_assessments: UpcomingAssessment[];
  todays_focus: TodaysFocusData | null;
  streak: DashboardStreak;
}

export interface DashboardUser {
  name: string;
  email: string;
  [key: string]: any;
}