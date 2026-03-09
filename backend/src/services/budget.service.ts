import prisma from '../config/db';
import type { BudgetInput } from '../validations/budget.validation';

/**
 * Get all budgets for a specific user
 */
export const getBudgetsByUser = async (userId: string) => {
  return await prisma.budget.findMany({
    where: { userId },
    include: {
      category: {
        select: {
          name: true,
          icon: true,
          type: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
};

/**
 * Create or update a budget for a user and category
 */
export const upsertBudget = async (userId: string, data: BudgetInput) => {
  const { categoryId, limitAmount, period } = data;

  return await prisma.budget.upsert({
    where: {
      userId_categoryId: {
        userId,
        categoryId,
      },
    },
    create: {
      userId,
      categoryId,
      limitAmount,
      period,
    },
    update: {
      limitAmount,
      period,
    },
  });
};
