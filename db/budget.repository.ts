import { getDatabase } from "./database";

export interface LocalBudget {
  id: string;
  userId: string;
  categoryId: string;
  limitAmount: number;
  period: "MONTHLY";
  category: {
    name: string;
    icon: string;
    type: "INCOME" | "EXPENSE";
  };
}

type LocalBudgetRow = {
  id: string;
  userId: string;
  categoryId: string;
  limitAmount: number;
  period: "MONTHLY";
  categoryName: string;
  categoryIcon: string;
  categoryType: "INCOME" | "EXPENSE";
};

export const BudgetRepository = {
  async replaceAllForUser(
    userId: string,
    budgets: {
      id: string;
      categoryId: string;
      limitAmount: number;
      period: "MONTHLY";
    }[]
  ) {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      await db.runAsync("DELETE FROM budgets WHERE user_id = ?", userId);

      for (const budget of budgets) {
        await db.runAsync(
          `INSERT INTO budgets (id, user_id, category_id, limit_amount, period)
           VALUES (?, ?, ?, ?, ?)`,
          budget.id,
          userId,
          budget.categoryId,
          budget.limitAmount,
          budget.period
        );
      }
    });
  },

  async upsert(input: {
    id: string;
    userId: string;
    categoryId: string;
    limitAmount: number;
    period: "MONTHLY";
  }) {
    const db = await getDatabase();

    await db.runAsync(
      `INSERT INTO budgets (id, user_id, category_id, limit_amount, period)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         user_id = excluded.user_id,
         category_id = excluded.category_id,
         limit_amount = excluded.limit_amount,
         period = excluded.period`,
      input.id,
      input.userId,
      input.categoryId,
      input.limitAmount,
      input.period
    );
  },

  async getAll(userId: string): Promise<LocalBudget[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<LocalBudgetRow>(
      `SELECT
         b.id AS id,
         b.user_id AS userId,
         b.category_id AS categoryId,
         b.limit_amount AS limitAmount,
         b.period AS period,
         c.name AS categoryName,
         COALESCE(c.icon, '') AS categoryIcon,
         c.type AS categoryType
       FROM budgets b
       INNER JOIN categories c ON c.id = b.category_id
       WHERE b.user_id = ?
       ORDER BY b.id DESC`,
      userId
    );

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      categoryId: row.categoryId,
      limitAmount: Number(row.limitAmount),
      period: row.period,
      category: {
        name: row.categoryName,
        icon: row.categoryIcon,
        type: row.categoryType,
      },
    }));
  },
};
