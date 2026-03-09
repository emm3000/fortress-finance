import { getDatabase } from "./database";

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: "INCOME" | "EXPENSE";
  is_default: number;
}

/**
 * Repository for Category operations in SQLite.
 */
export const CategoryRepository = {
  /**
   * Bulk insert/update categories (usually from server sync).
   */
  async upsertMany(categories: Category[]) {
    if (categories.length === 0) return;
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      for (const cat of categories) {
        await db.runAsync(
          `INSERT OR REPLACE INTO categories (id, name, icon, color, type, is_default)
           VALUES (?, ?, ?, ?, ?, ?)`,
          cat.id,
          cat.name,
          cat.icon !== null ? cat.icon : "",
          cat.color !== null ? cat.color : "",
          cat.type,
          cat.is_default
        );
      }
    });
  },

  /**
   * Get all categories.
   */
  async getAll(): Promise<Category[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Category>("SELECT * FROM categories ORDER BY name ASC");
  },

  /**
   * Get categories by type.
   */
  async getByType(type: "INCOME" | "EXPENSE"): Promise<Category[]> {
    const db = await getDatabase();
    return await db.getAllAsync<Category>(
      "SELECT * FROM categories WHERE type = ? ORDER BY name ASC",
      type
    );
  }
};
