import * as dashboardRepository from '../repositories/dashboard.repository';

export interface MonthlyDashboardInput {
  userId: string;
  year?: number;
  month?: number;
}

interface DashboardCategoryStats {
  totalSpent: number;
  txCount: number;
}

export interface MonthlyDashboardSummary {
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

const toMonthRange = (year?: number, month?: number) => {
  const now = new Date();
  const resolvedYear = year ?? now.getUTCFullYear();
  const resolvedMonth = month ?? now.getUTCMonth() + 1;

  const from = new Date(Date.UTC(resolvedYear, resolvedMonth - 1, 1));
  const to = new Date(Date.UTC(resolvedYear, resolvedMonth, 1));

  return { resolvedYear, resolvedMonth, from, to };
};

const loadMonthlyTransactions = async (userId: string, from: Date, to: Date) => {
  return dashboardRepository.findMonthlyTransactions(userId, from, to);
};

const aggregateMonthlyStats = (
  transactions: Awaited<ReturnType<typeof loadMonthlyTransactions>>,
): {
  incomeTotal: number;
  expenseTotal: number;
  incomeTxCount: number;
  expenseTxCount: number;
  expenseByCategory: Map<string, DashboardCategoryStats>;
} => {
  let incomeTotal = 0;
  let expenseTotal = 0;
  let incomeTxCount = 0;
  let expenseTxCount = 0;
  const expenseByCategory = new Map<string, DashboardCategoryStats>();

  for (const tx of transactions) {
    const amount = Number(tx.amount);

    if (tx.type === 'INCOME') {
      incomeTotal += amount;
      incomeTxCount += 1;
      continue;
    }

    expenseTotal += amount;
    expenseTxCount += 1;

    const currentCategory = expenseByCategory.get(tx.categoryId) ?? {
      totalSpent: 0,
      txCount: 0,
    };

    expenseByCategory.set(tx.categoryId, {
      totalSpent: currentCategory.totalSpent + amount,
      txCount: currentCategory.txCount + 1,
    });
  }

  return {
    incomeTotal,
    expenseTotal,
    incomeTxCount,
    expenseTxCount,
    expenseByCategory,
  };
};

const getTopExpenseCategories = (
  expenseByCategory: Map<string, DashboardCategoryStats>,
): [string, DashboardCategoryStats][] => {
  return [...expenseByCategory.entries()]
    .sort((a, b) => b[1].totalSpent - a[1].totalSpent)
    .slice(0, 5);
};

const loadCategoriesById = async (categoryIds: string[]) => {
  const categories = await dashboardRepository.findCategoriesByIds(categoryIds);

  return new Map(categories.map((category) => [category.id, category]));
};

export const getMonthlyDashboard = async ({
  userId,
  year,
  month,
}: MonthlyDashboardInput): Promise<MonthlyDashboardSummary> => {
  const { resolvedYear, resolvedMonth, from, to } = toMonthRange(year, month);

  const transactions = await loadMonthlyTransactions(userId, from, to);
  const { incomeTotal, expenseTotal, incomeTxCount, expenseTxCount, expenseByCategory } =
    aggregateMonthlyStats(transactions);

  const sortedExpenseCategories = getTopExpenseCategories(expenseByCategory);

  const categoryIds = sortedExpenseCategories.map(([categoryId]) => categoryId);
  const categoriesById = await loadCategoriesById(categoryIds);

  return {
    period: {
      year: resolvedYear,
      month: resolvedMonth,
      from: from.toISOString(),
      to: to.toISOString(),
    },
    totals: {
      income: incomeTotal,
      expense: expenseTotal,
      balance: incomeTotal - expenseTotal,
    },
    txCount: {
      income: incomeTxCount,
      expense: expenseTxCount,
    },
    topExpenseCategories: sortedExpenseCategories.map(([categoryId, stats]) => {
      const category = categoriesById.get(categoryId);
      return {
        categoryId,
        categoryName: category?.name ?? 'Categoría',
        categoryIcon: category?.icon ?? '',
        totalSpent: stats.totalSpent,
        txCount: stats.txCount,
      };
    }),
  };
};
