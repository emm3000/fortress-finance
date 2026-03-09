import type { Prisma } from '@prisma/client';
import * as syncRepository from '../../repositories/sync.repository';
import type { SyncPullChanges } from './sync.types';

export const pullServerChanges = async (
  tx: Prisma.TransactionClient,
  userId: string,
  lastSyncTimestamp: Date,
): Promise<SyncPullChanges> => {
  const transactions = await syncRepository.pullTransactionsSince(tx, userId, lastSyncTimestamp);
  const budgets = await syncRepository.pullBudgetsSince(tx, userId, lastSyncTimestamp);
  const inventory = await syncRepository.pullInventorySince(tx, userId, lastSyncTimestamp);
  const castle = await syncRepository.findCastleStateForSync(tx, userId);
  const wallet = await syncRepository.findWalletForSync(tx, userId);

  return {
    transactions,
    budgets,
    inventory,
    castle,
    wallet,
  };
};
