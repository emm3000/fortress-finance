/** The slice of expo-sqlite's SQLiteDatabase that migrations use. */
export interface MigrationDatabase {
  execAsync(source: string): Promise<void>;
  getFirstAsync<T>(source: string): Promise<T | null>;
  getAllAsync<T>(source: string): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

export interface Migration {
  /** The `user_version` the database is at once this migration has run. */
  version: number;
  up(db: MigrationDatabase): Promise<void>;
}

const readUserVersion = async (db: MigrationDatabase): Promise<number> => {
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  return row?.user_version ?? 0;
};

/**
 * Runs every migration above the database's `user_version` in ascending order.
 * Each one runs in its own transaction together with its `user_version` bump,
 * so a failure rolls that migration back and keeps the earlier ones.
 */
export const runMigrations = async (
  db: MigrationDatabase,
  migrations: readonly Migration[],
): Promise<void> => {
  const current = await readUserVersion(db);
  const pending = migrations
    .filter((migration) => migration.version > current)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
};
