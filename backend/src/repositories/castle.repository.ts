import prisma from '../config/db';

export const findCastleByUserId = async (userId: string) => {
  return prisma.castleState.findUnique({
    where: { userId },
  });
};

