import { act, renderHook } from "@testing-library/react-native";

import {
  useCreateTransaction,
  useDeleteTransaction,
  useUpdateTransaction,
} from "@/hooks/useTransactionCommands";
import { TransactionRepository } from "@/db/transaction.repository";
import { AnalyticsService } from "@/services/analytics.service";

const mockInvalidateQueries = jest.fn();
const mockPerformSync = jest.fn().mockResolvedValue(undefined);

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "tx-123"),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

jest.mock("@/hooks/useSync", () => ({
  useSync: jest.fn(() => ({
    performSync: mockPerformSync,
  })),
}));

jest.mock("@/store/auth.store", () => ({
  useAuthStore: jest.fn(() => ({
    user: { id: "user-1", name: "Emm" },
  })),
}));

jest.mock("@/db/transaction.repository", () => ({
  TransactionRepository: {
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  },
}));

jest.mock("@/services/analytics.service", () => ({
  AnalyticsService: {
    track: jest.fn(),
  },
}));

jest.mock("@/utils/idle", () => ({
  runWhenIdle: (callback: () => void) => {
    callback();
    return { cancel: jest.fn() };
  },
}));

describe("transaction command hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a transaction and refreshes derived queries", async () => {
    const { result } = renderHook(() => useCreateTransaction());

    await act(async () => {
      await result.current.createTransaction({
        analyticsDate: "2026-03-11",
        amount: 25,
        categoryId: "cat-expense",
        date: "2026-03-11T12:00:00.000Z",
        description: "Almuerzo",
        type: "EXPENSE",
      });
    });

    expect(TransactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "tx-123",
        user_id: "user-1",
        category_id: "cat-expense",
        amount: 25,
        description: "Almuerzo",
        type: "EXPENSE",
        is_synced: 0,
        deleted_at: null,
      })
    );
    expect(AnalyticsService.track).toHaveBeenCalledWith(
      "transaction_created",
      expect.objectContaining({
        userId: "user-1",
        date: "2026-03-11",
      })
    );
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["transactions", "user-1"],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["dashboard", "monthly", "user-1"],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["budget-progress", "user-1"],
    });
    expect(mockPerformSync).toHaveBeenCalled();
  });

  it("updates a transaction and refreshes derived queries", async () => {
    const { result } = renderHook(() => useUpdateTransaction());

    await act(async () => {
      await result.current.updateTransaction("tx-123", {
        amount: 80,
        categoryId: "cat-income",
        date: "2026-03-12T12:00:00.000Z",
        description: "Pago",
        type: "INCOME",
      });
    });

    expect(TransactionRepository.update).toHaveBeenCalledWith("tx-123", "user-1", {
      amount: 80,
      type: "INCOME",
      category_id: "cat-income",
      description: "Pago",
      date: "2026-03-12T12:00:00.000Z",
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["transactions", "user-1"],
    });
    expect(mockPerformSync).toHaveBeenCalled();
  });

  it("soft deletes a transaction and refreshes derived queries", async () => {
    const { result } = renderHook(() => useDeleteTransaction());

    await act(async () => {
      await result.current.deleteTransaction("tx-123");
    });

    expect(TransactionRepository.softDelete).toHaveBeenCalledWith("tx-123", "user-1");
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["sync-queue-status", "user-1"],
    });
    expect(mockPerformSync).toHaveBeenCalled();
  });
});
