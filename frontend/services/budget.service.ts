import apiClient from './api.client';

export interface Budget {
  id: string;
  categoryId: string;
  limitAmount: number;
  period: 'MONTHLY';
  category: {
    name: string;
    icon: string;
    type: 'INCOME' | 'EXPENSE';
  };
}

interface BudgetApiResponse {
  id: string;
  categoryId: string;
  limitAmount: number | string;
  period: 'MONTHLY';
  category: {
    name: string;
    icon: string;
    type: 'INCOME' | 'EXPENSE';
  };
}

const normalizeBudget = (budget: BudgetApiResponse): Budget => ({
  id: budget.id,
  categoryId: budget.categoryId,
  limitAmount: Number(budget.limitAmount),
  period: budget.period,
  category: budget.category,
});

export const BudgetService = {
  async getAll(): Promise<Budget[]> {
    const response = await apiClient.get<BudgetApiResponse[]>('/budgets');
    return response.data.map(normalizeBudget);
  },

  async upsert(input: { categoryId: string; limitAmount: number; period?: 'MONTHLY' }): Promise<Budget> {
    const response = await apiClient.post<BudgetApiResponse>('/budgets', {
      categoryId: input.categoryId,
      limitAmount: input.limitAmount,
      period: input.period ?? 'MONTHLY',
    });
    return normalizeBudget(response.data);
  },
};
