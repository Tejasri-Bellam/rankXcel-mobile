
import { getAuthState } from "../context/authStore";
import { ApiResponse } from "../types/api";
import { storageGetAccessToken } from "../utils/storage";
import { axiosInstance, getHeaders } from "./apiClient";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export interface ServiceOptions {
  isMultipart?: boolean;
  useAccessToken?: boolean;
}

export async function genericService<T = unknown>(
  method: HttpMethod,
  apiPath: string,
  data?: object | FormData | null,
  options: ServiceOptions = {}
): Promise<ApiResponse<T>> {
  const { isMultipart = false, useAccessToken = true } = options;
  const authToken = useAccessToken
    ? (getAuthState().token ?? await storageGetAccessToken())
    : null;
  const headers = getHeaders(authToken, isMultipart);
if (authToken) {
  headers['Authorization'] = `Bearer ${authToken}`;
}
  const response = await axiosInstance.request<T>({
    method,
    url: apiPath,
    headers,
    ...(method !== "get" && method !== "delete" && data ? { data } : {}),
  });
  return { data: response.data, status: response.status };
}

export async function genericGet<T = unknown>(
  apiPath: string,
  useAccessToken: boolean = true,
): Promise<ApiResponse<T>> {
  return genericService<T>("get", apiPath, null, { useAccessToken });
}

export async function genericPost<T = unknown>(
  apiPath: string,
  data: object | FormData,
  options: ServiceOptions = {}
): Promise<ApiResponse<T>> {
  return genericService<T>("post", apiPath, data, options);
}

export async function genericPut<T = unknown>(
  apiPath: string,
  data: object | FormData,
  options: ServiceOptions = {}
): Promise<ApiResponse<T>> {
  return genericService<T>("put", apiPath, data, options);
}

export async function genericPatch<T = unknown>(
  apiPath: string,
  data: object | FormData,
  options: ServiceOptions = {}
): Promise<ApiResponse<T>> {
  return genericService<T>("patch", apiPath, data, options);
}

export async function genericDelete<T = unknown>(
  apiPath: string,
  useAccessToken: boolean = true
): Promise<ApiResponse<T>> {
  return genericService<T>("delete", apiPath, null, { useAccessToken });
}
