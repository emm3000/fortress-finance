import { getDatabase } from "./database";

/**
 * Repository for managing sync metadata (e.g., lastSyncTimestamp).
 */
export const SyncMetaRepository = {
  async set(key: string, value: string) {
    const db = await getDatabase();
    await db.runAsync(
      "INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)",
      [key, value]
    );
  },

  async get(key: string): Promise<string | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM sync_meta WHERE key = ?",
      [key]
    );
    return result?.value || null;
  }
};
