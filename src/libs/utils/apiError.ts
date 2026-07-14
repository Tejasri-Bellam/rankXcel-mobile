// Helpers for turning the normalized ApiError (produced by the axios interceptor
// in src/libs/services/api.ts) into UI-friendly pieces.
//
// Every failed request rejects with { status, errors, body }, where `errors` is
// { nonFieldErrors?: string[], [serverFieldKey]: string[] }. Field-level errors
// arrive keyed by the backend's field name (snake_case, e.g. "email", "phone",
// "question_count"); the form-level message lives under `nonFieldErrors`.
//
// Forms should render each field error below its matching input (see the auth
// screens for the pattern) and surface `nonFieldError` in a banner/toast.

export interface ParsedApiError {
  // Field-level errors keyed by the backend's field name. Excludes nonFieldErrors.
  fieldErrors: Record<string, string>;
  // Form-level message (e.g. "Invalid email or password."), or null.
  nonFieldError: string | null;
}

const joinMessages = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    const parts = value.filter((v): v is string => typeof v === "string" && !!v);
    return parts.length ? parts.join(" ") : null;
  }
  return typeof value === "string" && value ? value : null;
};

// Split a rejected request into per-field errors + a form-level message.
export function parseApiError(err: any): ParsedApiError {
  const result: ParsedApiError = { fieldErrors: {}, nonFieldError: null };
  const errors = err?.errors;
  if (errors && typeof errors === "object") {
    for (const [key, value] of Object.entries(errors)) {
      const msg = joinMessages(value);
      if (!msg) continue;
      if (key === "nonFieldErrors") result.nonFieldError = msg;
      else result.fieldErrors[key] = msg;
    }
  }
  return result;
}

// Look up a field error by any of the backend keys that may carry it. Handy when
// the server and the local field name differ (e.g. "full_name" vs "name").
export function getFieldError(
  parsed: ParsedApiError,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    if (parsed.fieldErrors[key]) return parsed.fieldErrors[key];
  }
  return undefined;
}

// The single best human-readable message to show when there's no field-specific
// slot to render into. Prefers the form-level message, then any field message,
// then raw body fallbacks.
export function getErrorMessage(err: any, fallback = "Something went wrong"): string {
  const { fieldErrors, nonFieldError } = parseApiError(err);
  if (nonFieldError) return nonFieldError;
  const firstField = Object.values(fieldErrors)[0];
  if (firstField) return firstField;
  const body = err?.body ?? err?.response?.data;
  if (body && typeof body === "object") {
    for (const k of ["error", "message", "detail"] as const) {
      if (typeof (body as any)[k] === "string") return (body as any)[k];
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
