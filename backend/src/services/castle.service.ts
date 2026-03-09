import prisma from '../config/db';
import { errorCatalog } from '../utils/errorCatalog';

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

export const getCastleByUserIdOrThrow = async (userId: string) => {
  const castle = await getCastleByUserId(userId);
  if (!castle) {
    throw errorCatalog.resource.notFound('Castillo no encontrado para este usuario');
  }

  return castle;
};
