import prisma from '../config/db';

export const findMonthlyTransactions = async (userId: string, from: Date, to: Date) => {
  return prisma.transaction.findMany({
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
};

export const findCategoriesByIds = async (categoryIds: string[]) => {
  if (categoryIds.length === 0) {
    return [];
  }

  return prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, icon: true },
  });
};

