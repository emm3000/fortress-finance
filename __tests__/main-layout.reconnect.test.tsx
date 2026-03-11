import React from "react";
import { render, waitFor } from "@testing-library/react-native";

import MainLayout from "@/app/(main)/_layout";
import { NotificationService } from "@/services/notification.service";

const mockPerformSync = jest.fn().mockResolvedValue(undefined);
const mockEnsurePushTokenRegistered = jest.fn().mockResolvedValue(null);

const mockState = {
  isAuthenticated: true,
  isLoading: false,
  user: { id: "user-1" },
  isOnline: false,
};

jest.mock("expo-router", () => {
  const mockStack = function MockStack({ children }: { children: React.ReactNode }) {
    return children;
  };
  mockStack.Screen = function MockStackScreen() {
    return null;
  };

  return {
    router: globalThis.__TEST_ROUTER__,
    Stack: mockStack,
  };
});

jest.mock("@/store/auth.store", () => ({
  useAuthStore: jest.fn((selector: (state: typeof mockState) => unknown) => selector(mockState)),
}));

jest.mock("@/store/network.store", () => ({
  useNetworkStore: jest.fn((selector: (state: { isOnline: boolean }) => unknown) =>
    selector({ isOnline: mockState.isOnline })
  ),
}));

jest.mock("@/hooks/useSync", () => ({
  useSync: jest.fn(() => ({
    performSync: mockPerformSync,
  })),
}));

jest.mock("@/services/notification.service", () => ({
  NotificationService: {
    ensurePushTokenRegistered: jest.fn(),
  },
}));

describe("MainLayout reconnect behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.isAuthenticated = true;
    mockState.isLoading = false;
    mockState.user = { id: "user-1" };
    mockState.isOnline = false;
    jest
      .mocked(NotificationService.ensurePushTokenRegistered)
      .mockImplementation(mockEnsurePushTokenRegistered);
  });

  it("registers push token and triggers sync when connection is restored", async () => {
    const screen = render(<MainLayout />);

    mockState.isOnline = true;
    screen.rerender(<MainLayout />);

    await waitFor(() => {
      expect(NotificationService.ensurePushTokenRegistered).toHaveBeenCalledWith("user-1");
      expect(mockPerformSync).toHaveBeenCalled();
    });
  });
});
