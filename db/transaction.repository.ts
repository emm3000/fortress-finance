import { getDatabase } from "./database";
import { SyncQueueRepository } from "./syncQueue.repository";

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  description: string | null;
  date: string;
  type: "INCOME" | "EXPENSE";
  is_synced: number;
  created_at?: string;
  updated_at: string;
  deleted_at: string | null;
}

type RemoteTransaction = {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: number | string;
  notes: string | null;
  date: string;
  type: "INCOME" | "EXPENSE";
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

interface MonthlyCategorySpend {
  categoryId: string;
  totalSpent: number;
}

interface MonthlyTotals {
  income: number;
  expense: number;
  incomeTxCount: number;
  expenseTxCount: number;
}

/**
 * Repository for Transaction operations in SQLite.
 * Follows the Offline-First pattern.
 */
export const TransactionRepository = {
  /**
   * Save a new transaction locally.
   */
  async create(transaction: Transaction) {
    const db = await getDatabase();
    const updatedAt = transaction.updated_at || new Date().toISOString();
    await db.runAsync(
      `INSERT INTO transactions (id, user_id, category_id, amount, description, date, type, is_synced, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      transaction.id,
      transaction.user_id,
      transaction.category_id,
      transaction.amount,
      transaction.description !== null ? transaction.description : "",
      transaction.date,
      transaction.type,
      transaction.is_synced || 0,
      updatedAt,
      transaction.deleted_at ?? null
    );
    await SyncQueueRepository.upsertOperation({
      userId: transaction.user_id,
      entityType: "TRANSACTION",
      entityId: transaction.id,
      operation: "UPSERT",
      payload: {
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        categoryId: transaction.category_id,
        date: transaction.date,
        notes: transaction.description,
        updatedAt,
        deletedAt: transaction.deleted_at ?? null,
      },
    });
    return transaction;
  },

  /**
   * Get transactions for a user with pagination (Offline-First).
   * @param limit Maximum number of transactions to return
   * @param offset Number of transactions to skip
   */
  async getAll(userId: string, limit: number = 20, offset: number = 0): Promise<Transaction[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Transaction>(
      "SELECT * FROM transactions WHERE user_id = ? AND deleted_at IS NULL ORDER BY date DESC LIMIT ? OFFSET ?",
      userId,
      limit,
      offset
    );
  },

  async getById(id: string, userId: string): Promise<Transaction | null> {
    const db = await getDatabase();
    return await db.getFirstAsync<Transaction>(
      "SELECT * FROM transactions WHERE id = ? AND user_id = ? LIMIT 1",
      id,
      userId
    );
  },

  /**
   * Get pending transactions for a specific user.
   */
  async getPendingSync(userId: string): Promise<Transaction[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Transaction>(
      "SELECT * FROM transactions WHERE user_id = ? AND is_synced = 0",
      userId
    );
  },

  async update(
    id: string,
    userId: string,
    input: {
      amount: number;
      type: "INCOME" | "EXPENSE";
      category_id: string;
      description: string;
      date: string;
    }
  ) {
    const db = await getDatabase();
    const updatedAt = new Date().toISOString();
    await db.runAsync(
      `UPDATE transactions
       SET amount = ?, type = ?, category_id = ?, description = ?, date = ?, is_synced = 0, updated_at = ?, deleted_at = NULL
       WHERE id = ? AND user_id = ?`,
      input.amount,
      input.type,
      input.category_id,
      input.description,
      input.date,
      updatedAt,
      id,
      userId
    );
    await SyncQueueRepository.upsertOperation({
      userId,
      entityType: "TRANSACTION",
      entityId: id,
      operation: "UPSERT",
      payload: {
        id,
        amount: input.amount,
        type: input.type,
        categoryId: input.category_id,
        date: input.date,
        notes: input.description,
        updatedAt,
        deletedAt: null,
      },
    });
  },

  async softDelete(id: string, userId: string) {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<Transaction>(
      "SELECT * FROM transactions WHERE id = ? AND user_id = ? LIMIT 1",
      id,
      userId
    );

    if (!existing) return;

    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE transactions
       SET deleted_at = ?, updated_at = ?, is_synced = 0
       WHERE id = ? AND user_id = ?`,
      now,
      now,
      id,
      userId
    );
    await SyncQueueRepository.upsertOperation({
      userId,
      entityType: "TRANSACTION",
      entityId: id,
      operation: "DELETE",
      payload: {
        id,
        amount: existing.amount,
        type: existing.type,
        categoryId: existing.category_id,
        date: existing.date,
        notes: existing.description,
        updatedAt: now,
        deletedAt: now,
      },
    });
  },

  async upsertManyFromRemote(remoteTransactions: RemoteTransaction[]) {
    if (remoteTransactions.length === 0) return;
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      for (const tx of remoteTransactions) {
        await db.runAsync(
          `INSERT INTO transactions (
            id, user_id, category_id, amount, description, date, type, is_synced, created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            user_id = excluded.user_id,
            category_id = excluded.category_id,
            amount = excluded.amount,
            description = excluded.description,
            date = excluded.date,
            type = excluded.type,
            is_synced = 1,
            updated_at = excluded.updated_at,
            deleted_at = excluded.deleted_at`,
          tx.id,
          tx.userId,
          tx.categoryId,
          Number(tx.amount),
          tx.notes ?? "",
          new Date(tx.date).toISOString(),
          tx.type,
          tx.createdAt,
          tx.updatedAt,
          tx.deletedAt
        );
      }
    });
  },

  async getMonthlyExpenseByCategory(
    userId: string,
    year: number,
    month: number
  ): Promise<MonthlyCategorySpend[]> {
    const db = await getDatabase();
    const start = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const end = new Date(Date.UTC(year, month, 1)).toISOString();

    const rows = await db.getAllAsync<{ categoryId: string; totalSpent: number }>(
      `SELECT category_id AS categoryId, SUM(amount) AS totalSpent
       FROM transactions
       WHERE user_id = ?
         AND type = 'EXPENSE'
         AND deleted_at IS NULL
         AND date >= ?
         AND date < ?
       GROUP BY category_id`,
      userId,
      start,
      end
    );

    return rows.map((row) => ({
      categoryId: row.categoryId,
      totalSpent: Number(row.totalSpent ?? 0),
    }));
  },

  async getMonthlyTotals(
    userId: string,
    year: number,
    month: number
  ): Promise<MonthlyTotals> {
    const db = await getDatabase();
    const start = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const end = new Date(Date.UTC(year, month, 1)).toISOString();

    const row = await db.getFirstAsync<{
      income: number | null;
      expense: number | null;
      incomeTxCount: number | null;
      expenseTxCount: number | null;
    }>(
      `SELECT
         SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) AS income,
         SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) AS expense,
         SUM(CASE WHEN type = 'INCOME' THEN 1 ELSE 0 END) AS incomeTxCount,
         SUM(CASE WHEN type = 'EXPENSE' THEN 1 ELSE 0 END) AS expenseTxCount
       FROM transactions
       WHERE user_id = ?
         AND deleted_at IS NULL
         AND date >= ?
         AND date < ?`,
      userId,
      start,
      end
    );

    return {
      income: Number(row?.income ?? 0),
      expense: Number(row?.expense ?? 0),
      incomeTxCount: Number(row?.incomeTxCount ?? 0),
      expenseTxCount: Number(row?.expenseTxCount ?? 0),
    };
  },

  /**
   * Mark transactions as synced.
   */
  async markAsSynced(ids: string[]) {
    if (ids.length === 0) return;
    const db = await getDatabase();
    const placeholders = ids.map(() => "?").join(",");
    await db.runAsync(
      `UPDATE transactions SET is_synced = 1 WHERE id IN (${placeholders})`,
      ...ids
    );
  },
};
