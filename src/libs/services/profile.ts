import {
  genericGet,
  genericPost,
  genericPatch,
  genericDelete,
} from "./genericService";

import { UpdateProfilePayload } from "../types/auth";

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

// Get preferences
export async function getPreferencesService() {
  console.log("api calling");

  return await genericGet(
    "/v1/exams/target-exams/",
    true
  );
}

// Target Exams
export async function updatePreferencesService(
  data: any
) {
  return await genericPatch(
    "/v1/exams/target-exams/",
    data,
    { useAccessToken: true }
  );
}

// Get Target Exams
export async function getTargetExamsService() {
  return await genericGet(
    "/v1/exams/target-exams/",
    true
  );
}

// Add Target Exam
export async function addTargetExamService(
  payload: {
    exam_id: number | string;
    target_year: number | string;
    target_percentage?: number | string;
  }
) {
  return await genericPost(
    "/v1/exams/target-exams/",
    payload,
    { useAccessToken: true }
  );
}

// Get My Target Exams
export async function getMyTargetExamsService() {
  return await genericGet(
    "/v1/exams/my-target-exams/",
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