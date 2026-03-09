import prisma from '../config/db';
import type { BudgetInput } from '../validations/budget.validation';

export const findBudgetsByUserId = async (userId: string) => {
  return prisma.budget.findMany({
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

export const upsertBudgetByUserAndCategory = async (
  userId: string,
  data: BudgetInput,
) => {
  return prisma.budget.upsert({
    where: {
      userId_categoryId: {
        userId,
        categoryId: data.categoryId,
      },
    },
    create: {
      userId,
      categoryId: data.categoryId,
      limitAmount: data.limitAmount,
      period: data.period,
    },
    update: {
      limitAmount: data.limitAmount,
      period: data.period,
    },
    include: {
      category: {
        select: {
          name: true,
          icon: true,
          type: true,
        },
      },
    },
  });
};
