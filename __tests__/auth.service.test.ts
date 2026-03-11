import { AuthService } from "@/services/auth.service";
import { NotificationService } from "@/services/notification.service";
import { useAuthStore } from "@/store/auth.store";
import { useNetworkStore } from "@/store/network.store";

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
