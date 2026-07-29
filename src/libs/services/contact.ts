import { genericPost } from "./genericService";

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  country: number;
  message: string;
}

export async function sendContactMessageService(payload: ContactPayload) {
  return await genericPost(`/v1/masters/contact/`, payload, {
    isMultipart: false,
    useAccessToken: false,
  });
}