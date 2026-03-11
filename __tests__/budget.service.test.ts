import { BudgetService } from "@/services/budget.service";
import { BudgetRepository } from "@/db/budget.repository";

jest.mock("@/db/budget.repository", () => ({
  BudgetRepository: {
    replaceAllForUser: jest.fn(),
    upsert: jest.fn(),
    getAll: jest.fn(),
  },
}));

jest.mock("@/services/supabase.client", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(async () => ({
        data: { session: { user: { id: "user-1" } } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: "budget-1",
            category_id: "cat-1",
            limit_amount: 200,
            period: "MONTHLY",
            category: { name: "Comida", icon: "", type: "EXPENSE" },
          },
        ],
        error: null,
      }),
      upsert: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: "budget-1",
          category_id: "cat-1",
          limit_amount: 200,
          period: "MONTHLY",
          category: { name: "Comida", icon: "", type: "EXPENSE" },
        },
        error: null,
      }),
    })),
  },
}));

describe("BudgetService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns local budgets when offline", async () => {
    jest.mocked(BudgetRepository.getAll).mockResolvedValue([
      {
        id: "budget-1",
        userId: "user-1",
        categoryId: "cat-1",
        limitAmount: 200,
        period: "MONTHLY",
        category: { name: "Comida", icon: "", type: "EXPENSE" },
      },
    ]);

    const budgets = await BudgetService.getCachedOrRemote(false);

    expect(BudgetRepository.getAll).toHaveBeenCalledWith("user-1");
    expect(budgets).toHaveLength(1);
    expect(budgets[0].category.name).toBe("Comida");
  });
});
