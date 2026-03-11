import { supabase } from './supabase.client';
import { CategoryRepository } from "@/db/category.repository";
import { TransactionRepository } from "@/db/transaction.repository";

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

const getUtcMonthRange = (year: number, month: number) => {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));
  return { from, to };
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeMonthlyDashboard = (
  payload: unknown,
  year: number,
  month: number,
): MonthlyDashboardResponse => {
  const fallbackRange = getUtcMonthRange(year, month);
  const fallback: MonthlyDashboardResponse = {
    period: {
      year,
      month,
      from: fallbackRange.from.toISOString(),
      to: fallbackRange.to.toISOString(),
    },
    totals: {
      income: 0,
      expense: 0,
      balance: 0,
    },
    txCount: {
      income: 0,
      expense: 0,
    },
    topExpenseCategories: [],
  };

  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const raw = payload as Record<string, unknown>;
  const rawPeriod =
    raw.period && typeof raw.period === 'object' ? (raw.period as Record<string, unknown>) : {};
  const rawTotals =
    raw.totals && typeof raw.totals === 'object' ? (raw.totals as Record<string, unknown>) : {};
  const rawTxCount =
    raw.txCount && typeof raw.txCount === 'object' ? (raw.txCount as Record<string, unknown>) : {};
  const rawTopCategories = Array.isArray(raw.topExpenseCategories)
    ? (raw.topExpenseCategories as Record<string, unknown>[])
    : [];

  return {
    period: {
      year: toNumber(rawPeriod.year) || fallback.period.year,
      month: toNumber(rawPeriod.month) || fallback.period.month,
      from: typeof rawPeriod.from === 'string' ? rawPeriod.from : fallback.period.from,
      to: typeof rawPeriod.to === 'string' ? rawPeriod.to : fallback.period.to,
    },
    totals: {
      income: toNumber(rawTotals.income),
      expense: toNumber(rawTotals.expense),
      balance: toNumber(rawTotals.balance),
    },
    txCount: {
      income: toNumber(rawTxCount.income),
      expense: toNumber(rawTxCount.expense),
    },
    topExpenseCategories: rawTopCategories.map((item) => ({
      categoryId: typeof item.categoryId === 'string' ? item.categoryId : '',
      categoryName: typeof item.categoryName === 'string' ? item.categoryName : 'Categoría',
      categoryIcon: typeof item.categoryIcon === 'string' ? item.categoryIcon : '',
      totalSpent: toNumber(item.totalSpent),
      txCount: toNumber(item.txCount),
    })),
  };
};

export const DashboardService = {
  async getMonthly(year: number, month: number): Promise<MonthlyDashboardResponse> {
    const { data, error } = await supabase.rpc('get_monthly_dashboard', {
      p_year: year,
      p_month: month,
    });

    if (error) {
      throw error;
    }

    return normalizeMonthlyDashboard(data, year, month);
  },

  async getMonthlyCachedOrRemote(
    userId: string,
    year: number,
    month: number,
    isOnline: boolean
  ): Promise<MonthlyDashboardResponse> {
    if (!isOnline) {
      return this.getMonthlyLocal(userId, year, month);
    }

    try {
      return await this.getMonthly(year, month);
    } catch {
      return this.getMonthlyLocal(userId, year, month);
    }
  },

  async getMonthlyLocal(
    userId: string | undefined,
    year: number,
    month: number
  ): Promise<MonthlyDashboardResponse> {
    if (!userId) {
      return normalizeMonthlyDashboard(null, year, month);
    }

    const [totals, expenseByCategory, categories] = await Promise.all([
      TransactionRepository.getMonthlyTotals(userId, year, month),
      TransactionRepository.getMonthlyExpenseByCategory(userId, year, month),
      CategoryRepository.getAll(),
    ]);

    const categoriesById = new Map(categories.map((category) => [category.id, category]));
    const topExpenseCategories = expenseByCategory
      .map((item) => {
        const category = categoriesById.get(item.categoryId);
        return {
          categoryId: item.categoryId,
          categoryName: category?.name ?? "Categoria",
          categoryIcon: category?.icon ?? "",
          totalSpent: item.totalSpent,
          txCount: 0,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return normalizeMonthlyDashboard(
      {
        period: {
          year,
          month,
        },
        totals: {
          income: totals.income,
          expense: totals.expense,
          balance: totals.income - totals.expense,
        },
        txCount: {
          income: totals.incomeTxCount,
          expense: totals.expenseTxCount,
        },
        topExpenseCategories,
      },
      year,
      month
    );
  },
};
