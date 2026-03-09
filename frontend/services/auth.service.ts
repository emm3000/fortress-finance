import apiClient from "./api.client";
import { useAuthStore } from "../store/auth.store";
import { OnboardingService } from "./onboarding.service";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RequestResetInput {
  email: string;
}

interface ConfirmResetInput {
  token: string;
  newPassword: string;
}

export const AuthService = {
  /**
   * Register a new user
   */
  async register(data: RegisterInput) {
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
  async login(data: LoginInput) {
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
  },

  async requestPasswordReset(data: RequestResetInput) {
    const response = await apiClient.post("/auth/password-reset/request", data);
    return response.data as { message: string; resetToken?: string };
  },

  async confirmPasswordReset(data: ConfirmResetInput) {
    const response = await apiClient.post("/auth/password-reset/confirm", data);
    return response.data as { message: string };
  },
};
