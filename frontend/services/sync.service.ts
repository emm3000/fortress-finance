import apiClient from "./api.client";
import { TransactionRepository } from "../db/transaction.repository";
import { CategoryRepository } from "../db/category.repository";
import { CastleRepository } from "../db/castle.repository";
import { SyncMetaRepository } from "../db/syncMeta.repository";
import { SyncQueueRepository, SyncOperation } from "../db/syncQueue.repository";

const CATEGORY_SYNC_META_KEY = "categories_last_sync";
const CATEGORY_SYNC_TTL_MS = 1000 * 60 * 60 * 6;

export type FullSyncResult = {
  status: "success";
  syncTimestamp: string;
  hasTransactionsUpdates: boolean;
  hasCastleUpdate: boolean;
  pendingQueueCount: number;
  failedQueueCount: number;
};

const BACKOFF_BASE_MS = 5_000;
const BACKOFF_MAX_MS = 15 * 60 * 1_000;

const computeBackoffRetryAt = (attempts: number) => {
  const delay = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** Math.max(attempts, 0));
  return new Date(Date.now() + delay).toISOString();
};

const toTransactionSyncPayload = (operation: SyncOperation) => {
  try {
    const payload = JSON.parse(operation.payload) as Record<string, unknown>;
    const hasRequiredFields =
      typeof payload.categoryId === "string" &&
      typeof payload.type === "string" &&
      typeof payload.date === "string";

    if (!hasRequiredFields) {
      return null;
    }

    return {
      id: String(payload.id ?? operation.entity_id),
      amount: Number(payload.amount ?? 0),
      type: (payload.type as "INCOME" | "EXPENSE") ?? "EXPENSE",
      categoryId: String(payload.categoryId ?? ""),
      date: String(payload.date ?? new Date().toISOString()),
      notes: (payload.notes as string | null | undefined) ?? null,
      updatedAt: String(payload.updatedAt ?? new Date().toISOString()),
      deletedAt:
        payload.deletedAt === null || typeof payload.deletedAt === "undefined"
          ? null
          : String(payload.deletedAt),
    };
  } catch {
    return null;
  }
};

export const SyncService = {
  /**
   * Main synchronization flow: PUSH unsynced and PULL changes.
   */
  async fullSync(userId: string): Promise<FullSyncResult> {
    try {
      // 1. Get due operations from local queue (PUSH)
      const dueOperations = await SyncQueueRepository.getDueOperations(userId);
      const transactionOperations = dueOperations.filter((op) => op.entity_type === "TRANSACTION");
      const mappedTransactionOperations = transactionOperations.map((operation) => ({
        operation,
        payload: toTransactionSyncPayload(operation),
      }));
      const transactionsPush = mappedTransactionOperations
        .filter(
          (
            item
          ): item is {
            operation: SyncOperation;
            payload: NonNullable<ReturnType<typeof toTransactionSyncPayload>>;
          } => item.payload !== null
        )
        .map((item) => ({
          operationId: item.operation.id,
          payload: item.payload,
        }));
      const invalidTransactionOperations = mappedTransactionOperations.filter(
        (item) => item.payload === null
      );

      if (invalidTransactionOperations.length > 0) {
        await Promise.all(
          invalidTransactionOperations.map((item) =>
            SyncQueueRepository.markFailed(
              item.operation.id,
              "Operación inválida en cola de sync",
              computeBackoffRetryAt(item.operation.attempts + 1)
            )
          )
        );
      }

      // 2. Get last sync timestamp
      const lastSync = await SyncMetaRepository.get("last_sync_timestamp");

      // 3. Call Backend Sync API
      const response = await apiClient.post("/sync", {
        lastSyncTimestamp: lastSync,
        transactions: transactionsPush.map((item) => item.payload),
        budgets: [], // Placeholder for now
        inventory: [], // Placeholder for now
      });

      const { syncTimestamp, changes } = response.data;
      const castleChange = changes?.castle;
      const walletChange = changes?.wallet;
      const transactionsPull = Array.isArray(changes?.transactions) ? changes.transactions : [];

      // 4. APPLY CHANGES (PULL)
      try {
        // Update local castle state when castle payload is present.
        if (castleChange) {
          // Merge castle and wallet into our local castle_state table
          await CastleRepository.upsert({
            user_id: castleChange.userId,
            hp: castleChange.hp,
            max_hp: castleChange.maxHp,
            status: castleChange.status,
            gold_balance: walletChange?.goldBalance || 0,
            streak_days: walletChange?.streakDays || 0,
          });
        }

        if (transactionsPull.length > 0) {
          await TransactionRepository.upsertManyFromRemote(transactionsPull);
        }

        // Mark pushed operations as synced
        if (transactionsPush.length > 0) {
          await SyncQueueRepository.markSucceeded(transactionsPush.map((item) => item.operationId));
          await TransactionRepository.markAsSynced(transactionsPush.map((item) => item.payload.id));
        }

        // 5. Update last sync time
        await SyncMetaRepository.set("last_sync_timestamp", syncTimestamp);
      } catch (dbError) {
        console.error("Critical error saving sync data to local DB:", dbError);
        throw dbError;
      }

      const queueStatus = await SyncQueueRepository.getQueueStatus(userId);

      return {
        status: "success",
        syncTimestamp,
        hasTransactionsUpdates: transactionsPush.length > 0 || transactionsPull.length > 0,
        hasCastleUpdate: !!castleChange,
        pendingQueueCount: queueStatus.pendingCount,
        failedQueueCount: queueStatus.failedCount,
      };
    } catch (error) {
      console.error("Sync failed:", error);
      const dueOperations = await SyncQueueRepository.getDueOperations(userId);
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido durante sincronización";

      await Promise.all(
        dueOperations.map((operation) =>
          SyncQueueRepository.markFailed(
            operation.id,
            errorMessage,
            computeBackoffRetryAt(operation.attempts + 1)
          )
        )
      );
      throw error;
    }
  },

  /**
   * Fetch and update categories. Usually done on first launch or periodicly.
   */
  async syncCategories() {
    try {
      const lastCategoriesSync = await SyncMetaRepository.get(CATEGORY_SYNC_META_KEY);
      const lastCategoriesSyncAt = lastCategoriesSync ? Date.parse(lastCategoriesSync) : NaN;
      const isCategoriesFresh =
        Number.isFinite(lastCategoriesSyncAt) &&
        Date.now() - lastCategoriesSyncAt < CATEGORY_SYNC_TTL_MS;

      if (isCategoriesFresh) {
        return [];
      }

      const response = await apiClient.get("/categories");
      const categories = response.data;
      await CategoryRepository.upsertMany(categories);
      await SyncMetaRepository.set(CATEGORY_SYNC_META_KEY, new Date().toISOString());
      return categories;
    } catch (error) {
      console.error("Category sync failed:", error);
      throw error;
    }
  }
};
