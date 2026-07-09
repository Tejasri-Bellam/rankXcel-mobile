import { genericGet, genericPatch } from "./genericService";

export type NotificationPreferences = {
  streak_reminders: boolean;
  live_exam_alerts: boolean;
  practice_nudges: boolean;
  result_published: boolean;
  offers_and_news: boolean;
};

// GET /v1/notification-preferences/ — returns the user's current preferences
export async function getNotificationPreferencesService() {
  return await genericGet(`/v1/notification-preferences/`, true);
}

// PATCH /v1/notification-preferences/ — partial update, one or more keys
export async function updateNotificationPreferencesService(
  values: Partial<NotificationPreferences>
) {
  return await genericPatch(
    "/v1/notification-preferences/",
    values,
    { useAccessToken: true }
  );
}