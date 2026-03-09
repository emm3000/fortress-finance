import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

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

type UnauthorizedHandler = () => Promise<void> | void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let isHandlingUnauthorized = false;

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
};

export const setUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  unauthorizedHandler = handler;
};

// Interceptor to handle unauthorized errors (token expired)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true;
      try {
        if (unauthorizedHandler) {
          await unauthorizedHandler();
        } else {
          await SecureStore.deleteItemAsync("auth_token");
          await SecureStore.deleteItemAsync("user_data");
          setAuthToken(null);
        }
      } finally {
        isHandlingUnauthorized = false;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
