import { genericPost } from "./genericService";

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  // Catalogue id resolved from the detected country — the form has no country
  // field, so it's omitted when detection fails rather than blocking the send.
  country?: number;
  message: string;
}

export async function sendContactMessageService(payload: ContactPayload) {
  return await genericPost(`/v1/masters/contact/`, payload, {
    isMultipart: false,
    useAccessToken: false,
  });
}