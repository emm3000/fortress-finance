import prisma from '../config/db';

interface MonthlyDashboardInput {
  userId: string;
  year?: number;
  month?: number;
}

const toMonthRange = (year?: number, month?: number) => {
  const now = new Date();
  const resolvedYear = year ?? now.getUTCFullYear();
  const resolvedMonth = month ?? now.getUTCMonth() + 1;

  const from = new Date(Date.UTC(resolvedYear, resolvedMonth - 1, 1));
  const to = new Date(Date.UTC(resolvedYear, resolvedMonth, 1));

  return { resolvedYear, resolvedMonth, from, to };
};

export const getMonthlyDashboard = async ({ userId, year, month }: MonthlyDashboardInput) => {
  const { resolvedYear, resolvedMonth, from, to } = toMonthRange(year, month);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      deletedAt: null,
      date: {
        gte: from,
        lt: to,
      },
    },
    select: {
      type: true,
      amount: true,
      categoryId: true,
    },
  });

  let incomeTotal = 0;
  let expenseTotal = 0;
  let incomeTxCount = 0;
  let expenseTxCount = 0;
  const expenseByCategory = new Map<string, { totalSpent: number; txCount: number }>();

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

  const sortedExpenseCategories = [...expenseByCategory.entries()]
    .sort((a, b) => b[1].totalSpent - a[1].totalSpent)
    .slice(0, 5);

  const categoryIds = sortedExpenseCategories.map(([categoryId]) => categoryId);
  const categories =
    categoryIds.length > 0
      ? await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true, icon: true },
        })
      : [];

  const categoriesById = new Map(categories.map((category) => [category.id, category]));

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
