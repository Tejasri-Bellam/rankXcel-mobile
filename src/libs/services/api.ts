import axios, { AxiosError, AxiosInstance } from "axios";

interface ApiError {
  status: number;
  errors: Record<string, string[]>;
  body?: Record<string, unknown>;
}

interface ErrorResponseData {
  detail?: string;
  [key: string]: unknown;
}

export function getHeaders(
  authToken: string | null,
  isMultipart: boolean = false
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (authToken?.trim()) {
    headers["Authorization"] = `Token ${authToken}`;
  }

  headers["Content-Type"] = isMultipart
    ? "multipart/form-data"
    : "application/json";

  return headers;
}

function customizeAxiosError(error: AxiosError<ErrorResponseData>): ApiError {
  const { response, request, message } = error;
  const apiError: ApiError = { status: 0, errors: {} };

  if (response) {
    const { data, status } = response;
    apiError.status = status;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      apiError.body = data as Record<string, unknown>;
    }

    if (status === 400 && data && typeof data === "object") {
      if (typeof data.detail === "string") {
        apiError.errors.nonFieldErrors = [data.detail];
      } else {
        const rawErrors = data as Record<string, unknown>;
        for (const [key, value] of Object.entries(rawErrors)) {
          const normalizedKey =
            key === "non_field_errors" ? "nonFieldErrors" : key;
          if (Array.isArray(value)) {
            apiError.errors[normalizedKey] = value as string[];
          } else if (typeof value === "string") {
            apiError.errors[normalizedKey] = [value];
          }
        }
      }
    } else if (status === 401 || status === 403) {
      const detail = data?.detail
        ? data.detail.replace("token", "credentials")
        : null;

      if (status === 401) {
        apiError.errors.nonFieldErrors = detail
          ? [detail, "Unauthorized"]
          : ["Unauthorized"];
      } else {
        apiError.errors.nonFieldErrors = detail
          ? [detail, "Forbidden"]
          : ["Forbidden"];
      }
    } else if (status === 404) {
      const detail =
        typeof data?.detail === "string" ? data.detail : "Resource not found";
      apiError.errors.nonFieldErrors = [detail];
    } else if (status === 429) {
      const detail =
        typeof data?.detail === "string" ? data.detail : "Too many requests";
      apiError.errors.nonFieldErrors = [detail, "Please try again later"];
    } else {
      const detail =
        typeof data?.detail === "string" ? data.detail : "Unknown error";
      apiError.errors.nonFieldErrors = [detail, "Please try again later"];
    }
  } else if (request) {
    apiError.errors.nonFieldErrors = [
      "Network error or server did not respond",
      "Please check your connection or try again later",
    ];
  } else {
    apiError.errors.nonFieldErrors = [
      message,
      "An unexpected error occurred, please try again later",
    ];
  }

  return apiError;
}

function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
    withCredentials: false,
    timeout: 15000,
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ErrorResponseData>) => {
      return Promise.reject(customizeAxiosError(error));
    }
  );

  return instance;
}

export const axiosInstance: AxiosInstance = createAxiosInstance();
 

