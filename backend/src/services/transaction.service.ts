import prisma from '../config/db';
import { errorCatalog } from '../utils/errorCatalog';
import type { UpdateTransactionInput } from '../validations/transaction.validation';

const getOwnedTransactionOrThrow = async (userId: string, transactionId: string) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { id: true, userId: true, deletedAt: true },
  });

  if (!transaction || transaction.deletedAt) {
    throw errorCatalog.resource.notFound('Transacción no encontrada');
  }

  if (transaction.userId !== userId) {
    throw errorCatalog.resource.forbidden('No autorizado para modificar esta transacción');
  }

  return transaction;
};

export const updateTransaction = async (
  userId: string,
  transactionId: string,
  data: UpdateTransactionInput,
) => {
  await getOwnedTransactionOrThrow(userId, transactionId);

  return await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      amount: data.amount,
      type: data.type,
      categoryId: data.categoryId,
      date: data.date,
      notes: data.notes ?? null,
      updatedAt: new Date(),
    },
  });
};

export const deleteTransaction = async (userId: string, transactionId: string) => {
  await getOwnedTransactionOrThrow(userId, transactionId);

  return await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      deletedAt: new Date(),
      updatedAt: new Date(),
    },
  });
};
