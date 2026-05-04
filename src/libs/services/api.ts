import axios, { type AxiosError } from 'axios';
import { storage } from '../storage/storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ;
console.log (BASE_URL)

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach JWT on every request (when token exists)
axiosInstance.interceptors.request.use(async (config) => {
  const token = await storage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Clear token on 401; pass original error through for genericService handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.clearAll();
    }
    return Promise.reject(error);
  },
);

// ---------- Generic service helpers ----------

export interface GenericServiceResponse {
  data: any;
  status: number;
}

export async function getAccessToken(): Promise<string | null> {
  return storage.getAccessToken();
}

export function getHeaders(authToken: string, isMultipartFormData: boolean) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (isMultipartFormData) {
    headers['Content-Type'] = 'multipart/form-data';
  } else {
    headers['Content-Type'] = 'application/json';
  }
  if (authToken) {
    headers['Authorization'] = `Token ${authToken}`;
  }
  return headers;
}

function axiosErrorHelper(error: unknown): GenericServiceResponse {
  const axiosError = error as AxiosError<any>;
  const status = axiosError.response?.status ?? 500;
  const data = axiosError.response?.data ?? {
    detail: axiosError.message ?? 'Something went wrong. Please try again.',
  };
  return { data, status };
}

export async function genericService(
  action: 'get' | 'post' | 'put' | 'patch' | 'delete',
  apiPath: string,
  postData: any = null,
  isMultipartFormData: boolean = false,
  useAccessToken: boolean = true,
): Promise<GenericServiceResponse> {
  try {
    const authToken = useAccessToken ? await getAccessToken() : '';
    const headers = getHeaders(authToken ?? '', isMultipartFormData);

    let response;
    if (action === 'get' || action === 'delete') {
      response = await axiosInstance[action](apiPath, { headers });
    } else {
      response = await axiosInstance[action](apiPath, postData, { headers });
    }

    return {
      data: response.data,
      status: response.status,
    };
  } catch (error) {
    console.error(`Error in ${action.toUpperCase()} ${apiPath}:`, error);
    return axiosErrorHelper(error);
  }
}

export async function genericGETService(
  apiPath: string,
  useAccessToken: boolean = true,
) {
  return genericService('get', apiPath, null, false, useAccessToken);
}

export async function genericPOSTService(
  apiPath: string,
  postData: any,
  isMultipartFormData: boolean = false,
  useAccessToken: boolean = true,
) {
  return genericService('post', apiPath, postData, isMultipartFormData, useAccessToken);
}

export async function genericPUTService(
  apiPath: string,
  postData: any,
  isMultipartFormData: boolean = false,
  useAccessToken: boolean = true,
) {
  return genericService('put', apiPath, postData, isMultipartFormData, useAccessToken);
}

export async function genericPATCHService(
  apiPath: string,
  postData: any,
  isMultipartFormData: boolean = false,
  useAccessToken: boolean = true,
) {
  return genericService('patch', apiPath, postData, isMultipartFormData, useAccessToken);
}

export async function genericDELETEService(
  apiPath: string,
  useAccessToken: boolean = true,
) {
  return genericService('delete', apiPath, null, false, useAccessToken);
}

// Convert an object to a query string (e.g. { page: 1, search: "foo" } → "?page=1&search=foo")
export function parseObjToQuery(query?: Record<string, any>): string {
  if (!query) return '';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

// Keep backward-compatible export
export const api = axiosInstance;

 