import React from "react";
import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useSync } from "@/hooks/useSync";
import { SyncService } from "@/services/sync.service";

jest.mock("@/services/sync.service", () => ({
  SyncService: {
    syncCategories: jest.fn(),
    fullSync: jest.fn(),
  },
}));

jest.mock("@/store/auth.store", () => ({
  useAuthStore: jest.fn((selector: (state: unknown) => unknown) =>
    selector({
      isAuthenticated: true,
      user: { id: "user-1" },
    })
  ),
}));

jest.mock("@/store/network.store", () => ({
  useNetworkStore: jest.fn((selector: (state: unknown) => unknown) =>
    selector({
      isOnline: true,
    })
  ),
}));

describe("useSync", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("continues with full sync when category refresh fails", async () => {
    jest.mocked(SyncService.syncCategories).mockRejectedValue(new Error("categories down"));
    jest.mocked(SyncService.fullSync).mockResolvedValue({
      status: "success",
      syncTimestamp: "2026-03-11T12:00:00.000Z",
      hasTransactionsUpdates: false,
      hasCastleUpdate: false,
      pendingQueueCount: 0,
      failedQueueCount: 0,
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result, unmount } = renderHook(() => useSync(), { wrapper });

    await act(async () => {
      await result.current.performSync();
    });

    expect(SyncService.syncCategories).toHaveBeenCalled();
    expect(SyncService.fullSync).toHaveBeenCalledWith("user-1");

    unmount();
    queryClient.clear();
  });
});
