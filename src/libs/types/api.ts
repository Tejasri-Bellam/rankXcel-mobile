export interface ApiError {
  status: number;
  errors: ApiErrorFields;
  /**
   * Raw response body from the server (when the response was JSON).
   * Useful for reading structured error metadata (e.g. assessment gate
   * fields like `gate_status`, `unlocks_at`, `window_open`) without
   * adding a dedicated field to ApiError for every new contract.
   */
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
 
 