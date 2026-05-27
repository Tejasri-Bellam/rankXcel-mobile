export type DashboardData = Record<string, any>;

export interface TargetExam {
  id: number | string;
  exam: number | string;
  exam_name: string;
  target_year: number | string;
}

export interface DashboardUser {
  name: string;
  email: string;
  [key: string]: any;
}