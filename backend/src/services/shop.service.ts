import prisma from '../config/db';

/**
 * Get all available shop items
 */
export const getAllShopItems = async () => {
  return await prisma.shopItem.findMany({
    orderBy: { price: 'asc' },
  });
};

/**
 * Get a specific shop item
 */
export const getShopItemById = async (id: string) => {
  return await prisma.shopItem.findUnique({
    where: { id },
  });
};
