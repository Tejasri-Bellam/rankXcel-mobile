import { axiosInstance, getHeaders } from "@/src/libs/services/api";
import { storageGetAccessToken } from "@/src/libs/storage";
import type { ApiResponse } from "@/src/libs/types/api";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export interface ServiceOptions {
  isMultipart?: boolean;
  useAccessToken?: boolean;
  // Per-request timeout (ms). Defaults to the axios instance timeout (15s).
  // Use a larger value for slow endpoints like AI tutor generation.
  timeout?: number;
}

export async function genericService<T = unknown>(
  method: HttpMethod,
  apiPath: string,
  data?: object | FormData | null,
  options: ServiceOptions = {}
): Promise<ApiResponse<T>> {
  const { isMultipart = false, useAccessToken = true, timeout } = options;
  const authToken = useAccessToken ? await storageGetAccessToken() : null;
  const headers = getHeaders(authToken, isMultipart);
  console.log(`Making ${method.toUpperCase()} request to ${apiPath} with data:`, data, "and headers:", headers, "Options:", options, authToken);
  const response = await axiosInstance.request<T>({
    method,
    url: apiPath,
    headers,
    ...(timeout != null ? { timeout } : {}),
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

 