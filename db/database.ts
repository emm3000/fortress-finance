import * as SQLite from "expo-sqlite";
import { MIGRATIONS } from "./migrations";
import { runMigrations } from "./migrations/runner";

const DATABASE_NAME = "fortaleza.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Open the local database and bring it to the latest schema version.
 * This is the foundation for the Offline-First architecture.
 */
export const initDatabase = async () => {
  // If already initializing, return the existing promise
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    try {
      await runMigrations(db, MIGRATIONS);
    } catch (error) {
      // Release the handle so a retry opens a fresh one; keep the original error.
      await db.closeAsync().catch(() => undefined);
      throw error;
    }

    dbInstance = db;
    return db;
  })().catch((error: unknown) => {
    // Let the next call retry instead of caching the failure.
    initPromise = null;
    throw error;
  });

  return initPromise;
};

/**
 * Get the database instance, ensuring it is initialized.
 */
export const getDatabase = async () => {
  if (dbInstance) return dbInstance;

  // If not initialized yet, trigger initialization or wait for existing one
  return await initDatabase();
};
