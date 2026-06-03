export interface ApiError {
  status: number;
  errors: ApiErrorFields;
  body?: Record<string, unknown>;
}
 
export interface ApiErrorFields {
  nonFieldErrors?: string[];
  [key: string]: string[] | undefined;
}
 
export interface ApiResponse<T> {
  data: T;
  status: number;
}
 
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
 
 