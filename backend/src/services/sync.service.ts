import prisma from '../config/db';
import type { SyncResultDto } from '../dto/sync.dto';
import { mapSyncResultToDto } from '../mappers/sync.mapper';
import type { SyncBody } from '../validations/sync.validation';
import { pullServerChanges } from './sync/sync.pull';
import { applyPushChanges } from './sync/sync.push';
import type { SyncResult } from './sync/sync.types';

export const synchronize = async (userId: string, data: SyncBody): Promise<SyncResultDto> => {
  const { lastSyncTimestamp, transactions, budgets, inventory } = data;

  // Execute PUSH and PULL atomically to prevent race conditions
  const result: SyncResult = await prisma.$transaction(async (tx) => {
    await applyPushChanges(tx, userId, { transactions, budgets, inventory });

    const changes = await pullServerChanges(tx, userId, lastSyncTimestamp);

    return {
      syncTimestamp: new Date().toISOString(),
      changes,
    };
  });

  return mapSyncResultToDto(result);
};
