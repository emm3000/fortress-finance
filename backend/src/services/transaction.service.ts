import type { TransactionDto } from '../dto/transaction.dto';
import { mapTransactionToDto } from '../mappers/transaction.mapper';
import * as transactionRepository from '../repositories/transaction.repository';
import { errorCatalog } from '../utils/errorCatalog';
import type { UpdateTransactionInput } from '../validations/transaction.validation';

const getOwnedTransactionOrThrow = async (userId: string, transactionId: string) => {
  const transaction = await transactionRepository.findTransactionOwnershipState(transactionId);

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
): Promise<TransactionDto> => {
  await getOwnedTransactionOrThrow(userId, transactionId);

  const updatedTransaction = await transactionRepository.updateTransactionById(transactionId, {
    amount: data.amount,
    type: data.type,
    categoryId: data.categoryId,
    date: data.date,
    notes: data.notes ?? null,
    updatedAt: new Date(),
  });

  return mapTransactionToDto(updatedTransaction);
};

export const deleteTransaction = async (userId: string, transactionId: string) => {
  await getOwnedTransactionOrThrow(userId, transactionId);

  return transactionRepository.updateTransactionById(transactionId, {
    deletedAt: new Date(),
    updatedAt: new Date(),
  });
};
