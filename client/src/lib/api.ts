import axios, { AxiosError } from "axios";
import { notify } from "@/lib/notify";
import { useAuthStore } from "@/store/auth-store";
import type { ApiResponse } from "@/types";

interface ApiErrorResponse {
  success: false;
  data: null;
  message?: string;
  details?: Array<{
    field?: string;
    message?: string;
  }>;
}

const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || "http://localhost:5000/api";
const apiTimeout = Number(import.meta.env.VITE_API_TIMEOUT || 15000);
let hasShownAuthError = false;

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: apiTimeout,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const message = error.response?.data?.message || error.message || "Something went wrong.";

    if (error.response?.status === 401 && useAuthStore.getState().token) {
      useAuthStore.getState().clearSession();

      if (!hasShownAuthError) {
        hasShownAuthError = true;
        notify.error(message);
        window.setTimeout(() => {
          hasShownAuthError = false;
        }, 500);
      }

      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }

      return Promise.reject(error);
    }

    if (error.response?.status && error.response.status >= 400) {
      notify.error(message);
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || error.message || "Something went wrong.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

export function unwrapResponse<T>(response: { data: ApiResponse<T> }) {
  return response.data.data;
}
