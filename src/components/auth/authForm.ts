// Shared form helpers for the auth screens (login + signup).

export type FieldErrors = {
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  password?: string;
  confirmPassword?: string;
};

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Maps server-side field keys (snake_case payload keys) to our local field names.
const SERVER_FIELD_MAP: Record<string, keyof FieldErrors> = {
  name: 'fullName',
  full_name: 'fullName',
  email: 'email',
  phone: 'mobileNumber',
  mobile: 'mobileNumber',
  password: 'password',
  confirm_password: 'confirmPassword',
};

// The axios interceptor (api.ts) rejects with a normalized shape:
//   { status, errors: Record<string, string[]>, body: rawResponseData }
// Field errors arrive as top-level keys in `errors` (e.g. errors.email), and
// non-field errors as errors.nonFieldErrors. Map the server field keys onto our
// local field names so each message renders below the matching input.
export const getApiFieldErrors = (err: any): FieldErrors => {
  const errors = err?.errors;
  const result: FieldErrors = {};
  if (errors && typeof errors === 'object') {
    for (const [key, value] of Object.entries(errors)) {
      if (key === 'nonFieldErrors') continue;
      const localKey = SERVER_FIELD_MAP[key];
      const msg = Array.isArray(value) ? value[0] : value;
      if (localKey && typeof msg === 'string') result[localKey] = msg;
    }
  }
  return result;
};

// The form-level (non-field) error message, e.g. "Invalid email or password.".
// Returns null when the backend only sent field-specific errors — those render
// below their inputs and shouldn't be repeated in a toast.
export const getNonFieldError = (err: any): string | null => {
  const nonField = err?.errors?.nonFieldErrors;
  return Array.isArray(nonField) && typeof nonField[0] === 'string'
    ? nonField[0]
    : null;
};

// Pull the most human-readable message out of the error. Prefer the non-field
// error (form-level message like "Invalid email or password."), then any
// field-level message, then the raw body as a last resort.
export const getApiErrorMessage = (
  err: any,
  fallback = 'Something went wrong',
): string => {
  const errors = err?.errors;
  if (errors && typeof errors === 'object') {
    const nonField = errors.nonFieldErrors;
    if (Array.isArray(nonField) && typeof nonField[0] === 'string')
      return nonField[0];
    const first = Object.values(errors).flat()[0];
    if (typeof first === 'string') return first;
  }
  const body = err?.body ?? err?.response?.data;
  if (body && typeof body === 'object') {
    if (typeof body.error === 'string') return body.error;
    if (typeof body.message === 'string') return body.message;
    if (typeof body.detail === 'string') return body.detail;
  }
  return fallback;
};
