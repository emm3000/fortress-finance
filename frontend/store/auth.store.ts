import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { setAuthToken, setUnauthorizedHandler } from "../services/api.client";
import { captureException, setMonitoringUser } from "../services/monitoring.service";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, token) => {
    await SecureStore.setItemAsync("auth_token", token);
    await SecureStore.setItemAsync("user_data", JSON.stringify(user));
    setAuthToken(token);
    setMonitoringUser(user);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("auth_token");
    await SecureStore.deleteItemAsync("user_data");
    setAuthToken(null);
    setMonitoringUser(null);
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      const userData = await SecureStore.getItemAsync("user_data");

      if (token && userData) {
        const user = JSON.parse(userData) as User;
        setAuthToken(token);
        setMonitoringUser(user);
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthToken(null);
        setMonitoringUser(null);
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
      captureException(error, { phase: "auth_store_initialize" });
      setMonitoringUser(null);
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

setUnauthorizedHandler(async () => {
  await useAuthStore.getState().logout();
});
