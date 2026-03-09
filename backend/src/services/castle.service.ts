import prisma from '../config/db';
import * as castleRepository from '../repositories/castle.repository';
import { assertExists } from '../utils/domainAssertions';

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
  return castleRepository.findCastleByUserId(userId);
};

export const getCastleByUserIdOrThrow = async (userId: string) => {
  const castle = await getCastleByUserId(userId);
  assertExists(castle, 'Castillo no encontrado para este usuario');

  return castle;
};
