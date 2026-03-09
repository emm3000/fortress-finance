import type { SyncPullChangesDto, SyncResultDto } from '../dto/sync.dto';
import { mapTransactionsToDto } from './transaction.mapper';
import type { SyncPullChanges, SyncResult } from '../services/sync/sync.types';

export const mapSyncPullChangesToDto = (changes: SyncPullChanges): SyncPullChangesDto => ({
  transactions: mapTransactionsToDto(changes.transactions),
  budgets: changes.budgets,
  inventory: changes.inventory,
  castle: changes.castle,
  wallet: changes.wallet,
});

export const mapSyncResultToDto = (result: SyncResult): SyncResultDto => ({
  syncTimestamp: result.syncTimestamp,
  changes: mapSyncPullChangesToDto(result.changes),
});

