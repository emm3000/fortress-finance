import { AuthService } from "@/services/auth.service";
import { NotificationService } from "@/services/notification.service";
import { useAuthStore } from "@/store/auth.store";
import { useNetworkStore } from "@/store/network.store";
import { supabase } from "@/services/supabase.client";
import { AUTH_ERROR_FALLBACK } from "@/utils/auth-error";

jest.mock("@/services/notification.service", () => ({
  NotificationService: {
    unregisterCurrentToken: jest.fn(),
  },
}));

jest.mock("@/store/auth.store", () => ({
  useAuthStore: {
    getState: jest.fn(),
  },
}));

jest.mock("@/store/network.store", () => ({
  useNetworkStore: {
    getState: jest.fn(),
  },
}));

jest.mock("@/services/supabase.client", () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      verifyOtp: jest.fn(),
      updateUser: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      getSession: jest.fn(),
    },
  },
}));

describe("AuthService.logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAuthStore.getState).mockReturnValue({
      logout: jest.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof useAuthStore.getState>);
  });

  it("unregisters push token before local logout when online", async () => {
    jest.mocked(useNetworkStore.getState).mockReturnValue({
      isOnline: true,
      isInitialized: true,
      initialize: jest.fn(),
    } as unknown as ReturnType<typeof useNetworkStore.getState>);

    await AuthService.logout();

    expect(NotificationService.unregisterCurrentToken).toHaveBeenCalled();
    expect(useAuthStore.getState().logout).toHaveBeenCalled();
  });

  it("skips push token unregister when offline", async () => {
    jest.mocked(useNetworkStore.getState).mockReturnValue({
      isOnline: false,
      isInitialized: true,
      initialize: jest.fn(),
    } as unknown as ReturnType<typeof useNetworkStore.getState>);

    await AuthService.logout();

    expect(NotificationService.unregisterCurrentToken).not.toHaveBeenCalled();
    expect(useAuthStore.getState().logout).toHaveBeenCalled();
  });
});

describe("AuthService Supabase failures", () => {
  const fakeAuthError = (message: string, status: number, code: string) =>
    Object.assign(new Error(message), { name: "AuthApiError", status, code });
  const authError = fakeAuthError("Invalid login credentials", 400, "invalid_credentials");

  const setOnline = (isOnline: boolean) => {
    jest.mocked(useNetworkStore.getState).mockReturnValue({
      isOnline,
      isInitialized: true,
      initialize: jest.fn(),
    } as unknown as ReturnType<typeof useNetworkStore.getState>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setOnline(true);
  });

  it("throws the Spanish message when register fails", async () => {
    jest.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: null, session: null },
      error: fakeAuthError("User already registered", 422, "user_already_exists"),
    } as Awaited<ReturnType<typeof supabase.auth.signUp>>);

    await expect(
      AuthService.register({ name: "Ana", email: "a@b.co", password: "x" })
    ).rejects.toThrow("Ya existe una cuenta con ese correo.");
  });

  it("throws the Spanish message when login fails", async () => {
    jest.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: authError,
    } as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>);

    await expect(AuthService.login({ email: "a@b.co", password: "x" })).rejects.toThrow(
      "Correo o contraseña incorrectos."
    );
  });

  it("throws the Spanish message when requesting a password reset fails", async () => {
    jest.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
      data: null,
      error: fakeAuthError("Email rate limit exceeded", 429, "over_email_send_rate_limit"),
    } as Awaited<ReturnType<typeof supabase.auth.resetPasswordForEmail>>);

    await expect(AuthService.requestPasswordReset({ email: "a@b.co" })).rejects.toThrow(
      "Enviamos demasiados correos. Espera unos minutos e inténtalo de nuevo."
    );
  });

  it("throws the Spanish message when the recovery code check fails", async () => {
    jest.mocked(supabase.auth.verifyOtp).mockResolvedValue({
      data: { user: null, session: null },
      error: fakeAuthError("Token has expired or is invalid", 403, "otp_expired"),
    } as Awaited<ReturnType<typeof supabase.auth.verifyOtp>>);

    await expect(
      AuthService.confirmPasswordReset({
        email: "a@b.co",
        token: "1",
        newPassword: "x",
      })
    ).rejects.toThrow("El código expiró o no es válido. Solicita uno nuevo.");
  });

  it("throws the Spanish message when updating the password fails", async () => {
    jest.mocked(supabase.auth.verifyOtp).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.verifyOtp>>);
    jest.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: null },
      error: fakeAuthError("Password is too weak", 422, "weak_password"),
    } as Awaited<ReturnType<typeof supabase.auth.updateUser>>);

    await expect(
      AuthService.confirmPasswordReset({
        email: "a@b.co",
        token: "1",
        newPassword: "x",
      })
    ).rejects.toThrow("La contraseña es demasiado débil. Usa una más larga y variada.");
  });

  it("never surfaces the English message of an unknown Supabase error", async () => {
    jest.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: fakeAuthError("Database error saving new user", 500, "unexpected_failure"),
    } as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>);

    await expect(AuthService.login({ email: "a@b.co", password: "x" })).rejects.toThrow(
      AUTH_ERROR_FALLBACK
    );
  });

  it("keeps the offline message from assertOnline", async () => {
    setOnline(false);

    await expect(AuthService.login({ email: "a@b.co", password: "x" })).rejects.toThrow(
      "Sin internet. Conectate para continuar."
    );
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });
});
