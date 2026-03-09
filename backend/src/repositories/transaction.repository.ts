import prisma from '../config/db';
import type { Prisma } from '@prisma/client';

export const findTransactionOwnershipState = async (transactionId: string) => {
  return prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { id: true, userId: true, deletedAt: true },
  });
};

export const updateTransactionById = async (
  transactionId: string,
  data: Prisma.TransactionUncheckedUpdateInput,
) => {
  return prisma.transaction.update({
    where: { id: transactionId },
    data,
  });
};

