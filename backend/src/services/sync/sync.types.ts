import type { Budget, CastleState, Prisma, Transaction, UserWallet } from '@prisma/client';
import type {
  SyncBody,
} from '../../validations/sync.validation';

export type SyncPushPayload = Pick<SyncBody, 'transactions' | 'budgets' | 'inventory'>;

export interface SyncPullChanges {
  transactions: Transaction[];
  budgets: Budget[];
  inventory: Prisma.UserInventoryGetPayload<{ include: { item: true } }>[];
  castle: CastleState | null;
  wallet: UserWallet | null;
}

export interface SyncResult {
  syncTimestamp: string;
  changes: SyncPullChanges;
}
