import { supabase } from './supabase.client';

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

const requireAuthUserId = async (): Promise<string> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user.id;
  if (!userId) {
    throw new Error('Sesion no disponible. Inicia sesion nuevamente.');
  };

  return userId;
};

export const BudgetService = {
  async getAll(): Promise<Budget[]> {
    const userId = await requireAuthUserId();

    const { data, error } = await supabase
      .from('budgets')
      .select(selectBudgetFields)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => normalizeBudget(row as BudgetApiResponse));
  },

  async upsert(input: { categoryId: string; limitAmount: number; period?: 'MONTHLY' }): Promise<Budget> {
    const userId = await requireAuthUserId();

    const { data, error } = await supabase
      .from('budgets')
      .upsert(
        {
          user_id: userId,
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

    return normalizeBudget(data as BudgetApiResponse);
  },
};
