import { DashboardService } from "@/services/dashboard.service";
import { CategoryRepository } from "@/db/category.repository";
import { TransactionRepository } from "@/db/transaction.repository";
import { useAuthStore } from "@/store/auth.store";

jest.mock("@/db/category.repository", () => ({
  CategoryRepository: {
    getAll: jest.fn(),
  },
}));

jest.mock("@/db/transaction.repository", () => ({
  TransactionRepository: {
    getMonthlyTotals: jest.fn(),
    getMonthlyExpenseByCategory: jest.fn(),
  },
}));

jest.mock("@/store/auth.store", () => ({
  useAuthStore: {
    getState: jest.fn(),
  },
}));

jest.mock("@/services/supabase.client", () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

describe("DashboardService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAuthStore.getState).mockReturnValue({
      user: { id: "user-1" },
    } as unknown as ReturnType<typeof useAuthStore.getState>);
  });

  it("builds the monthly dashboard from local data when offline", async () => {
    jest.mocked(TransactionRepository.getMonthlyTotals).mockResolvedValue({
      income: 1200,
      expense: 300,
      incomeTxCount: 2,
      expenseTxCount: 3,
    });
    jest.mocked(TransactionRepository.getMonthlyExpenseByCategory).mockResolvedValue([
      { categoryId: "cat-1", totalSpent: 200 },
      { categoryId: "cat-2", totalSpent: 100 },
    ]);
    jest.mocked(CategoryRepository.getAll).mockResolvedValue([
      { id: "cat-1", name: "Comida", icon: "utensils", color: "", type: "EXPENSE", is_default: 1 },
      { id: "cat-2", name: "Transporte", icon: "car", color: "", type: "EXPENSE", is_default: 1 },
    ]);

    const result = await DashboardService.getMonthlyCachedOrRemote(2026, 3, false);

    expect(result.totals.income).toBe(1200);
    expect(result.totals.expense).toBe(300);
    expect(result.totals.balance).toBe(900);
    expect(result.topExpenseCategories[0].categoryName).toBe("Comida");
    expect(result.topExpenseCategories[1].categoryName).toBe("Transporte");
  });
});
