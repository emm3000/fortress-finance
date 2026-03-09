import apiClient from "./api.client";
import { useAuthStore } from "../store/auth.store";
import { OnboardingService } from "./onboarding.service";

export const AuthService = {
  /**
   * Register a new user
   */
  async register(data: any) {
    const response = await apiClient.post("/auth/register", data);
    const { user, token } = response.data;
    await useAuthStore.getState().setAuth(user, token);

    try {
      await OnboardingService.syncPreferencesIfNeeded();
    } catch (error) {
      console.error("No se pudieron sincronizar preferencias iniciales:", error);
    }

    return response.data;
  },

  /**
   * Login user
   */
  async login(data: any) {
    const response = await apiClient.post("/auth/login", data);
    const { user, token } = response.data;
    await useAuthStore.getState().setAuth(user, token);

    try {
      await OnboardingService.syncPreferencesIfNeeded();
    } catch (error) {
      console.error("No se pudieron sincronizar preferencias iniciales:", error);
    }

    return response.data;
  },

  /**
   * Logout user locally
   */
  async logout() {
    await useAuthStore.getState().logout();
  }
};
