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

// The axios interceptor (api.ts) rejects with a custom shape:
// { status, errors: Record<string, string[]>, body: rawResponseData }.
// Validation errors arrive as body.fields = { email: ["..."] }.
export const getApiFieldErrors = (err: any): FieldErrors => {
  const fields = (err?.body ?? err?.response?.data)?.fields;
  const result: FieldErrors = {};
  if (fields && typeof fields === 'object') {
    for (const [key, value] of Object.entries(fields)) {
      const localKey = SERVER_FIELD_MAP[key];
      const msg = Array.isArray(value) ? value[0] : value;
      if (localKey && typeof msg === 'string') result[localKey] = msg;
    }
  }
  return result;
};

// Pull the most human-readable message out of the error (falling back to the
// raw axios shape, just in case).
export const getApiErrorMessage = (err: any): string => {
  const body = err?.body ?? err?.response?.data;
  // Prefer a specific field-level validation message.
  const fields = body?.fields;
  if (fields && typeof fields === 'object') {
    for (const value of Object.values(fields)) {
      const msg = Array.isArray(value) ? value[0] : value;
      if (typeof msg === 'string') return msg;
    }
  }
  if (body && typeof body === 'object') {
    if (typeof body.error === 'string') return body.error;
    if (typeof body.message === 'string') return body.message;
    if (typeof body.detail === 'string') return body.detail;
  }
  const errors = err?.errors;
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors).flat()[0];
    if (typeof first === 'string') return first;
  }
  return 'Something went wrong';
};
