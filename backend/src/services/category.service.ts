import prisma from '../config/db';

export const getAllCategories = async () => {
  return await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
};
