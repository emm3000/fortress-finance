import type { Transaction } from '@prisma/client';

export type TransactionDto = Pick<
  Transaction,
  'id' | 'userId' | 'categoryId' | 'type' | 'amount' | 'date' | 'notes' | 'updatedAt' | 'deletedAt'
>;
