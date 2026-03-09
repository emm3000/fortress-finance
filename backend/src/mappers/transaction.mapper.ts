import type { Transaction } from '@prisma/client';
import type { TransactionDto } from '../dto/transaction.dto';

export const mapTransactionToDto = (transaction: Transaction): TransactionDto => ({
  id: transaction.id,
  userId: transaction.userId,
  categoryId: transaction.categoryId,
  type: transaction.type,
  amount: transaction.amount,
  date: transaction.date,
  notes: transaction.notes,
  updatedAt: transaction.updatedAt,
  deletedAt: transaction.deletedAt,
});

export const mapTransactionsToDto = (transactions: Transaction[]): TransactionDto[] => {
  return transactions.map(mapTransactionToDto);
};
