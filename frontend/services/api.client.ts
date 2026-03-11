import axios from "axios";
import { Platform } from "react-native";
import { supabase } from "./supabase.client";

// Replace with your local machine's IP address for physical device testing
// Android Emulator uses 10.0.2.2, iOS Simulator uses localhost
const LOCAL_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${LOCAL_HOST}:4000/api`;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

type UnauthorizedHandler = () => Promise<void> | void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let isHandlingUnauthorized = false;

export const setUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  unauthorizedHandler = handler;
};

apiClient.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${session.access_token}`;
  } else if (config.headers) {
    delete config.headers.Authorization;
  }

  return config;
});

// Interceptor to handle unauthorized errors (token expired)
apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (isRecord(payload) && "data" in payload) {
      return {
        ...response,
        data: payload.data,
      };
    }
    return response;
  },
  async (error) => {
    if (isRecord(error?.response?.data) && "error" in error.response.data) {
      const errorPayload = error.response.data.error;
      if (isRecord(errorPayload) && typeof errorPayload.message === "string") {
        error.response.data = {
          ...error.response.data,
          error: errorPayload.message,
          code: errorPayload.code,
          details: errorPayload.details,
        };
      }
    }

    if (error.response?.status === 401 && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true;
      try {
        if (unauthorizedHandler) {
          await unauthorizedHandler();
        }
      } finally {
        isHandlingUnauthorized = false;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
