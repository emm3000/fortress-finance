import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';

export type SyncEntityType = 'TRANSACTION';
export type SyncOperationType = 'UPSERT' | 'DELETE';

export interface SyncOperation {
  id: string;
  user_id: string;
  entity_type: SyncEntityType;
  entity_id: string;
  operation: SyncOperationType;
  payload: string;
  status: 'PENDING' | 'FAILED';
  attempts: number;
  next_retry_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

const toIsoNow = () => new Date().toISOString();

export const SyncQueueRepository = {
  async upsertOperation(input: {
    userId: string;
    entityType: SyncEntityType;
    entityId: string;
    operation: SyncOperationType;
    payload: unknown;
  }) {
    const db = await getDatabase();
    const now = toIsoNow();
    const payload = JSON.stringify(input.payload);

    await db.runAsync(
      `INSERT INTO sync_operations (
        id, user_id, entity_type, entity_id, operation, payload, status, attempts, next_retry_at, last_error, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 0, NULL, NULL, ?, ?)
      ON CONFLICT(user_id, entity_type, entity_id)
      DO UPDATE SET
        operation = excluded.operation,
        payload = excluded.payload,
        status = 'PENDING',
        attempts = 0,
        next_retry_at = NULL,
        last_error = NULL,
        updated_at = excluded.updated_at`,
      Crypto.randomUUID(),
      input.userId,
      input.entityType,
      input.entityId,
      input.operation,
      payload,
      now,
      now
    );
  },

  async getDueOperations(userId: string, limit: number = 100): Promise<SyncOperation[]> {
    const db = await getDatabase();
    const now = toIsoNow();
    return db.getAllAsync<SyncOperation>(
      `SELECT *
       FROM sync_operations
       WHERE user_id = ?
         AND (
           status = 'PENDING'
           OR (status = 'FAILED' AND (next_retry_at IS NULL OR next_retry_at <= ?))
         )
       ORDER BY created_at ASC
       LIMIT ?`,
      userId,
      now,
      limit
    );
  },

  async markSucceeded(operationIds: string[]) {
    if (operationIds.length === 0) return;
    const db = await getDatabase();
    const placeholders = operationIds.map(() => '?').join(',');
    await db.runAsync(`DELETE FROM sync_operations WHERE id IN (${placeholders})`, ...operationIds);
  },

  async markFailed(operationId: string, errorMessage: string, nextRetryAt: string) {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE sync_operations
       SET status = 'FAILED',
           attempts = attempts + 1,
           next_retry_at = ?,
           last_error = ?,
           updated_at = ?
       WHERE id = ?`,
      nextRetryAt,
      errorMessage,
      toIsoNow(),
      operationId
    );
  },

  async getQueueStatus(userId: string): Promise<{
    pendingCount: number;
    failedCount: number;
    nextRetryAt: string | null;
    lastError: string | null;
  }> {
    const db = await getDatabase();

    const [countsRow] = await db.getAllAsync<{ pendingCount: number; failedCount: number }>(
      `SELECT
         SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pendingCount,
         SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failedCount
       FROM sync_operations
       WHERE user_id = ?`,
      userId
    );

    const nextRetry = await db.getFirstAsync<{ next_retry_at: string | null }>(
      `SELECT next_retry_at
       FROM sync_operations
       WHERE user_id = ?
         AND status = 'FAILED'
         AND next_retry_at IS NOT NULL
       ORDER BY next_retry_at ASC
       LIMIT 1`,
      userId
    );

    const lastFailed = await db.getFirstAsync<{ last_error: string | null }>(
      `SELECT last_error
       FROM sync_operations
       WHERE user_id = ?
         AND status = 'FAILED'
         AND last_error IS NOT NULL
       ORDER BY updated_at DESC
       LIMIT 1`,
      userId
    );

    return {
      pendingCount: Number(countsRow?.pendingCount ?? 0),
      failedCount: Number(countsRow?.failedCount ?? 0),
      nextRetryAt: nextRetry?.next_retry_at ?? null,
      lastError: lastFailed?.last_error ?? null,
    };
  },
};
