import { supabase } from './supabase.client';
import { BudgetRepository } from "@/db/budget.repository";

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
  category_id: string;
  limit_amount: number | string;
  period: 'MONTHLY';
  category:
    | {
        name: string;
        icon: string;
        type: 'INCOME' | 'EXPENSE';
      }
    | {
        name: string;
        icon: string;
        type: 'INCOME' | 'EXPENSE';
      }[]
    | null;
}

const getCategory = (
  category: BudgetApiResponse['category'],
): {
    name: string;
    icon: string;
    type: 'INCOME' | 'EXPENSE';
  } => {
  if (Array.isArray(category)) {
    return category[0] ?? { name: '', icon: '', type: 'EXPENSE' };
  }

  return category ?? { name: '', icon: '', type: 'EXPENSE' };
};

const normalizeBudget = (budget: BudgetApiResponse): Budget => ({
  id: budget.id,
  categoryId: budget.category_id,
  limitAmount: Number(budget.limit_amount),
  period: budget.period,
  category: getCategory(budget.category),
});

const selectBudgetFields =
  'id,category_id,limit_amount,period,category:categories(name,icon,type)';

const assertUserId = (userId?: string): string => {
  if (!userId) {
    throw new Error('Sesion no disponible. Inicia sesion nuevamente.');
  }

  return userId;
};

export const BudgetService = {
  async getAll(userId: string): Promise<Budget[]> {
    const ensuredUserId = assertUserId(userId);

    const { data, error } = await supabase
      .from('budgets')
      .select(selectBudgetFields)
      .eq('user_id', ensuredUserId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    const budgets = (data ?? []).map((row) => normalizeBudget(row as BudgetApiResponse));
    await BudgetRepository.replaceAllForUser(
      ensuredUserId,
      budgets.map((budget) => ({
        id: budget.id,
        categoryId: budget.categoryId,
        limitAmount: budget.limitAmount,
        period: budget.period,
      }))
    );

    return budgets;
  },

  async getCachedOrRemote(userId: string, isOnline: boolean): Promise<Budget[]> {
    const ensuredUserId = assertUserId(userId);

    if (!isOnline) {
      return BudgetRepository.getAll(ensuredUserId);
    }

    try {
      return await this.getAll(ensuredUserId);
    } catch (error) {
      const localBudgets = await BudgetRepository.getAll(ensuredUserId);
      if (localBudgets.length > 0) {
        return localBudgets;
      }
      throw error;
    }
  },

  async upsert(
    userId: string,
    input: { categoryId: string; limitAmount: number; period?: 'MONTHLY' }
  ): Promise<Budget> {
    const ensuredUserId = assertUserId(userId);

    const { data, error } = await supabase
      .from('budgets')
      .upsert(
        {
          user_id: ensuredUserId,
          category_id: input.categoryId,
          limit_amount: input.limitAmount,
          period: input.period ?? 'MONTHLY',
        },
        { onConflict: 'user_id,category_id' },
      )
      .select(selectBudgetFields)
      .single();

    if (error) {
      throw error;
    }

    const budget = normalizeBudget(data as BudgetApiResponse);
    await BudgetRepository.upsert({
      id: budget.id,
      userId: ensuredUserId,
      categoryId: budget.categoryId,
      limitAmount: budget.limitAmount,
      period: budget.period,
    });

    return budget;
  },
};
