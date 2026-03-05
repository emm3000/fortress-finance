import apiClient from "./api.client";
import { TransactionRepository } from "../db/transaction.repository";
import { CategoryRepository } from "../db/category.repository";
import { CastleRepository } from "../db/castle.repository";
import { SyncMetaRepository } from "../db/syncMeta.repository";

export const SyncService = {
  /**
   * Main synchronization flow: PUSH unsynced and PULL changes.
   */
  async fullSync() {
    try {
      // 1. Get local pending transactions (PUSH)
      const pendingTransactions = await TransactionRepository.getPendingSync();
      
      // Map to backend schema (notes, updatedAt)
      const transactionsPush = pendingTransactions.map(t => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        categoryId: t.category_id,
        date: t.date,
        notes: t.description,
        updatedAt: new Date().toISOString(), // In a real app, use record's updatedAt
      }));

      // 2. Get last sync timestamp
      const lastSync = await SyncMetaRepository.get("last_sync_timestamp");

      // 3. Call Backend Sync API
      const response = await apiClient.post("/sync", {
        lastSyncTimestamp: lastSync,
        transactions: transactionsPush,
        budgets: [], // Placeholder for now
        inventory: [], // Placeholder for now
      });

      const { syncTimestamp, changes } = response.data;

      // 4. APPLY CHANGES (PULL)
      
      // Update Castle/Wallet
      if (changes.castle || changes.wallet) {
        // Merge castle and wallet into our local castle_state table
        await CastleRepository.upsert({
          user_id: changes.castle.userId,
          hp: changes.castle.hp,
          max_hp: changes.castle.maxHp,
          status: changes.castle.status,
          gold_balance: changes.wallet?.goldBalance || 0,
          streak_days: changes.wallet?.streakDays || 0,
        });
      }

      // Mark pushed transactions as synced
      if (pendingTransactions.length > 0) {
        await TransactionRepository.markAsSynced(pendingTransactions.map(t => t.id));
      }

      // 5. Update last sync time
      await SyncMetaRepository.set("last_sync_timestamp", syncTimestamp);

      return { status: "success", syncTimestamp };
    } catch (error) {
      console.error("Sync failed:", error);
      throw error;
    }
  },

  /**
   * Fetch and update categories. Usually done on first launch or periodicly.
   */
  async syncCategories() {
    try {
      const response = await apiClient.get("/categories");
      const categories = response.data;
      await CategoryRepository.upsertMany(categories);
      return categories;
    } catch (error) {
      console.error("Category sync failed:", error);
      throw error;
    }
  }
};
