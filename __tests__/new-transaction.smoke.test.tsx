import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import NewTransactionScreen from "@/app/(main)/new-transaction";
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

jest.mock("@/hooks/useCategories", () => ({
  useCategories: jest.fn(() => ({
    data: [
      { id: "cat-expense", name: "Comida", type: "EXPENSE" },
      { id: "cat-income", name: "Salario", type: "INCOME" },
    ],
    isLoading: false,
  })),
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
    getById: jest.fn(),
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

jest.mock("moti", () => ({
  MotiView: ({ children }: { children: React.ReactNode }) => children,
}));

describe("NewTransactionScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.__TEST_LOCAL_SEARCH_PARAMS__.mockReturnValue({});
  });

  it("creates a transaction, invalidates queries and triggers background sync", async () => {
    const createMock = jest.mocked(TransactionRepository.create);

    const screen = render(<NewTransactionScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("0.00"), "25");
    fireEvent.press(screen.getByText("Comida"));
    fireEvent.changeText(screen.getByPlaceholderText("YYYY-MM-DD"), "2026-03-11");
    fireEvent.changeText(screen.getByPlaceholderText("¿En qué se gastó el oro?"), "Almuerzo");
    fireEvent.press(screen.getByText("Confirmar Gasto"));

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith(
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
          type: "EXPENSE",
          amount: 25,
          categoryId: "cat-expense",
          date: "2026-03-11",
        })
      );
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["transactions", "user-1"],
      });
      expect(globalThis.__TEST_ROUTER__.back).toHaveBeenCalled();
      expect(mockPerformSync).toHaveBeenCalled();
    });
  });
});
