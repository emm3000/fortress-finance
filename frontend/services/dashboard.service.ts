import apiClient from './api.client';

export interface MonthlyDashboardResponse {
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
  topExpenseCategories: {
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    totalSpent: number;
    txCount: number;
  }[];
}

export const DashboardService = {
  async getMonthly(year: number, month: number): Promise<MonthlyDashboardResponse> {
    const response = await apiClient.get<MonthlyDashboardResponse>('/dashboard/monthly', {
      params: { year, month },
    });

    return response.data;
  },
};
