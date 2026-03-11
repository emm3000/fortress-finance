import { DashboardService } from "@/services/dashboard.service";
import { CategoryRepository } from "@/db/category.repository";
import { TransactionRepository } from "@/db/transaction.repository";

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

jest.mock("@/services/supabase.client", () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

describe("DashboardService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    const result = await DashboardService.getMonthlyCachedOrRemote("user-1", 2026, 3, false);

    expect(result.totals.income).toBe(1200);
    expect(result.totals.expense).toBe(300);
    expect(result.totals.balance).toBe(900);
    expect(result.topExpenseCategories[0].categoryName).toBe("Comida");
    expect(result.topExpenseCategories[1].categoryName).toBe("Transporte");
  });

  it("returns the normalized fallback when user id is missing offline", async () => {
    const result = await DashboardService.getMonthlyLocal(undefined, 2026, 3);

    expect(result.totals).toEqual({
      income: 0,
      expense: 0,
      balance: 0,
    });
    expect(result.topExpenseCategories).toEqual([]);
  });
});
