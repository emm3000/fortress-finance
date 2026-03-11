import { useAuthStore } from "../store/auth.store";
import { OnboardingService } from "./onboarding.service";
import { useNetworkStore } from "../store/network.store";
import { NotificationService } from "./notification.service";
import { supabase } from "./supabase.client";

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
  email: string;
  token: string;
  newPassword: string;
}

const assertOnline = () => {
  if (!useNetworkStore.getState().isOnline) {
    throw new Error("Sin internet. Conectate para continuar.");
  }
};

export const AuthService = {
  /**
   * Register a new user
   */
  async register(data: RegisterInput) {
    assertOnline();
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        },
      },
    });

    if (error) {
      throw error;
    }

    await useAuthStore.getState().hydrateFromSession(authData.session ?? null);

    try {
      await OnboardingService.syncPreferencesIfNeeded();
    } catch (error) {
      console.error("No se pudieron sincronizar preferencias iniciales:", error);
    }

    return authData;
  },

  /**
   * Login user
   */
  async login(data: LoginInput) {
    assertOnline();
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      throw error;
    }

    await useAuthStore.getState().hydrateFromSession(authData.session);

    try {
      await OnboardingService.syncPreferencesIfNeeded();
    } catch (error) {
      console.error("No se pudieron sincronizar preferencias iniciales:", error);
    }

    return authData;
  },

  /**
   * Logout user locally
   */
  async logout() {
    if (useNetworkStore.getState().isOnline) {
      try {
        await NotificationService.unregisterCurrentToken();
      } catch (error) {
        console.error("No se pudo desregistrar push token:", error);
      }
    }

    await useAuthStore.getState().logout();
  },

  async requestPasswordReset(data: RequestResetInput) {
    assertOnline();
    const { error } = await supabase.auth.resetPasswordForEmail(data.email);
    if (error) {
      throw error;
    }

    return {
      message:
        "Te enviamos un codigo de recuperacion a tu correo. Ingresalo junto con tu nueva contraseña.",
    };
  },

  async confirmPasswordReset(data: ConfirmResetInput) {
    assertOnline();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: data.email,
      token: data.token,
      type: "recovery",
    });
    if (verifyError) {
      throw verifyError;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: data.newPassword,
    });
    if (updateError) {
      throw updateError;
    }

    await supabase.auth.signOut();
    await useAuthStore.getState().hydrateFromSession(null);
    return { message: "Contrasena actualizada correctamente." };
  },
};
