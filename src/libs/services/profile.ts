import {
  genericGet,
  genericPost,
  genericPatch,
  genericDelete,
} from "./genericService";

import { UpdateProfilePayload, ChangePasswordPayload } from "../types/auth";

// Get Current User
export async function getMeService() {
  return await genericGet(
    "/v1/auth/me/",
    true
  );
}

// Update Current User
export async function updateMeService(
  values: UpdateProfilePayload
) {
  return await genericPatch(
    "/v1/auth/me/",
    values,
    { useAccessToken: true }
  );
}

// Change Password (authenticated)
export async function changePasswordService(
  values: ChangePasswordPayload
) {
  return await genericPost(
    "/v1/auth/me/change-password/",
    values,
    { useAccessToken: true }
  );
}

// Get preferences
export async function getPreferencesService() {
  return await genericGet(
    "/v1/exams/target-exams/",
    true
  );
}

// Get all available exams (for dropdown), optionally scoped to a country.
// GET /v1/exams/?country={id}
export async function getExamsListService(countryId?: number | string | null) {
  const query =
    countryId != null && countryId !== ""
      ? `?country=${encodeURIComponent(countryId)}`
      : "";
  return await genericGet(
    `/v1/exams/${query}`,
    true
  );
}

// Get Target Exams — the logged-in user's assigned target exams (scoped by the
// auth token). Optionally filtered to a country. GET /v1/exams/target-exams/
export async function getTargetExamsService(countryId?: number | string | null) {
  const query =
    countryId != null && countryId !== ""
      ? `?country=${encodeURIComponent(countryId)}`
      : "";
  return await genericGet(
    `/v1/exams/target-exams/${query}`,
    true
  );
}

// Add Target Exam
export async function addTargetExamService(
  payload: {
    exam: number | string;
    target_year: number | string;
  }
) {
  return await genericPost(
    "/v1/exams/target-exams/",
    payload,
    { useAccessToken: true }
  );
}

// Delete a Target Exam (DELETE /v1/exams/target-exams/{id}/)
export async function deleteTargetExamService(
  id: number | string
) {
  return await genericDelete(
    `/v1/exams/target-exams/${id}/`,
    true
  );
}

// Get Exam Tree
export async function getExamTreeService(
  examId: number | string
) {
  return await genericGet(
    `/v1/exams/${examId}/tree/`,
    true
  );
}

// Get Subjects for an Exam
export async function getExamSubjectsService(
  examId: number | string
) {
  return await genericGet(
    `/v1/exams/${examId}/subjects/`,
    true
  );
}

// Get Chapters for a Subject
export async function getSubjectChaptersService(
  subjectId: number | string
) {
  return await genericGet(
    `/v1/subjects/${subjectId}/chapters/`,
    true
  );
}

// Get Notifications
export async function getNotificationsService() {
  return await genericGet(
    "/v1/notifications/settings/",
    true
  );
}

// Update Notifications
export async function updateNotificationsService(
  data: any
) {
  return await genericPatch(
    "/v1/notifications/settings/",
    data,
    { useAccessToken: true }
  );
}

// Delete Account
export async function deleteAccountService() {
  return await genericDelete(
    "/v1/auth/delete-account/",
    true
  );
}