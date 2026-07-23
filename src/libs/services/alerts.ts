import { genericGet, genericPost, genericDelete, genericPatch } from "./genericService";

// GET /v1/alerts/ — paginated list of all alerts
export async function getAlertsService(page?: number) {
  const pageQs = page && page > 1 ? `?page=${page}` : "";
  return await genericGet(`/v1/alerts/${pageQs}`, true);
}

// GET /v1/alerts/unread-count/ — { unread_count: number }
export async function getAlertsUnreadCountService() {
  return await genericGet(`/v1/alerts/unread-count/`, true);
}

// POST /v1/alerts/{id}/read/ — mark single alert as read (empty body)
export async function markAlertReadService(id: number | string) {
  return await genericPost(
    `/v1/alerts/${id}/read/`,
    {},
    { isMultipart: false, useAccessToken: true }
  );
}

// PATCH /v1/alerts/{id}/ — partial-update a single alert (e.g. { is_read: true }).
// Used when tapping an alert: mark it read before redirecting to its target.
export async function updateAlertService(
  id: number | string,
  body: Record<string, any>
) {
  return await genericPatch(`/v1/alerts/${id}/`, body, {
    isMultipart: false,
    useAccessToken: true,
  });
}

// POST /v1/alerts/read-all/ — mark all alerts as read (empty body)
export async function markAllAlertsReadService() {
  return await genericPatch(
    `/v1/alerts/read-all/`,
    {},
    { isMultipart: false, useAccessToken: true }
  );
}

// DELETE /v1/alerts/{id}/ — delete a single alert
export async function deleteAlertService(id: number | string) {
  return await genericDelete(`/v1/alerts/${id}/`, true);
}