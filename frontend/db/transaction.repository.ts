import { getDatabase } from "./database";

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
    await db.runAsync(
      `INSERT INTO transactions (id, user_id, category_id, amount, description, date, type, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      transaction.id,
      transaction.user_id,
      transaction.category_id,
      transaction.amount,
      transaction.description !== null ? transaction.description : "",
      transaction.date,
      transaction.type,
      transaction.is_synced || 0
    );
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
      "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT ? OFFSET ?",
      userId, 
      limit, 
      offset
    );
  },

  /**
   * Get transactions pending synchronization.
   */
  async getPendingSync(): Promise<Transaction[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Transaction>(
      "SELECT * FROM transactions WHERE is_synced = 0"
    );
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
  }
};
