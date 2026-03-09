export interface DashboardTopExpenseCategoryDto {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  totalSpent: number;
  txCount: number;
}

export interface MonthlyDashboardSummaryDto {
  period: {
    year: number;
    month: number;
    from: string;
    to: string;
  };
  totals: {
    income: number;
    expense: number;
    balance: number;
  };
  txCount: {
    income: number;
    expense: number;
  };
  topExpenseCategories: DashboardTopExpenseCategoryDto[];
}

