import type { TransactionDto } from '../dto/transaction.dto';
import { mapTransactionToDto } from '../mappers/transaction.mapper';
import * as transactionRepository from '../repositories/transaction.repository';
import { assertExists, assertNotDeleted, assertOwnedByUser } from '../utils/domainAssertions';
import type { UpdateTransactionInput } from '../validations/transaction.validation';

const getOwnedTransactionOrThrow = async (userId: string, transactionId: string) => {
  const transaction = await transactionRepository.findTransactionOwnershipState(transactionId);
  assertExists(transaction, 'Transacción no encontrada');
  assertNotDeleted(transaction.deletedAt, 'Transacción no encontrada');
  assertOwnedByUser(transaction.userId, userId, 'No autorizado para modificar esta transacción');

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
