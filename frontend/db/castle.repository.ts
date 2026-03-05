import { getDatabase } from "./database";

export interface CastleState {
  user_id: string;
  hp: number;
  max_hp: number;
  status: string;
  gold_balance: number;
  streak_days: number;
  last_updated?: string;
}

/**
 * Repository for Castle State operations in SQLite.
 */
export const CastleRepository = {
  /**
   * Save or update the castle state (fetched from server).
   */
  async upsert(state: CastleState) {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO castle_state (user_id, hp, max_hp, status, gold_balance, streak_days, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        state.user_id,
        state.hp,
        state.max_hp,
        state.status,
        state.gold_balance,
        state.streak_days
      ]
    );
  },

  /**
   * Get the current castle state.
   */
  async get(userId: string): Promise<CastleState | null> {
    const db = await getDatabase();
    return await db.getFirstAsync<CastleState>(
      "SELECT * FROM castle_state WHERE user_id = ?",
      [userId]
    );
  }
};
