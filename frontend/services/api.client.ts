import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Replace with your local machine's IP address for physical device testing
// Android Emulator uses 10.0.2.2
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
};

// Interceptor to handle unauthorized errors (token expired)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Logic for token expiration could go here (e.g., logout or refresh)
      await SecureStore.deleteItemAsync("auth_token");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
