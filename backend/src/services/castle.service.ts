import prisma from '../config/db';

/**
 * Initialize a castle for a new user
 */
export const initializeCastle = async (userId: string) => {
  return await prisma.castleState.create({
    data: {
      userId,
      hp: 100,
      maxHp: 100,
      level: 1,
      status: 'HEALTHY',
    },
  });
};

/**
 * Get the castle state for a user
 */
export const getCastleByUserId = async (userId: string) => {
  return await prisma.castleState.findUnique({
    where: { userId },
  });
};
