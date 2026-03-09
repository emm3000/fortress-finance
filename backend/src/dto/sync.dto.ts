import type { Budget, CastleState, Prisma, UserWallet } from '@prisma/client';
import type { TransactionDto } from './transaction.dto';

export type SyncBudgetDto = Budget;
export type SyncInventoryDto = Prisma.UserInventoryGetPayload<{ include: { item: true } }>;
export type SyncCastleDto = CastleState | null;
export type SyncWalletDto = UserWallet | null;

export interface SyncPullChangesDto {
  transactions: TransactionDto[];
  budgets: SyncBudgetDto[];
  inventory: SyncInventoryDto[];
  castle: SyncCastleDto;
  wallet: SyncWalletDto;
}

export interface SyncResultDto {
  syncTimestamp: string;
  changes: SyncPullChangesDto;
}

