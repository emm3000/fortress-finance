import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "fortaleza.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const ensureTransactionsColumns = async (db: SQLite.SQLiteDatabase) => {
  type TableInfoRow = { name: string };
  const tableInfo = await db.getAllAsync<TableInfoRow>("PRAGMA table_info(transactions)");
  const columnNames = new Set(tableInfo.map((column) => column.name));

  if (!columnNames.has("updated_at")) {
    await db.execAsync("ALTER TABLE transactions ADD COLUMN updated_at TEXT");
  }

  if (!columnNames.has("deleted_at")) {
    await db.execAsync("ALTER TABLE transactions ADD COLUMN deleted_at TEXT");
  }

  await db.execAsync(
    "UPDATE transactions SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)"
  );
};

const ensureBudgetsColumns = async (db: SQLite.SQLiteDatabase) => {
  type TableInfoRow = { name: string };
  const tableInfo = await db.getAllAsync<TableInfoRow>("PRAGMA table_info(budgets)");
  const columnNames = new Set(tableInfo.map((column) => column.name));

  if (!columnNames.has("user_id")) {
    await db.execAsync("ALTER TABLE budgets ADD COLUMN user_id TEXT");
  }
};

/**
 * Initialize the local database and create tables if they don't exist.
 * This is the foundation for the Offline-First architecture.
 */
export const initDatabase = async () => {
  // If already initializing, return the existing promise
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    // We use a transaction to ensure all tables are created atomically
    await db.execAsync(`
      PRAGMA foreign_keys = ON;

      -- Categories table (mirrors backend)
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        type TEXT CHECK(type IN ('INCOME', 'EXPENSE')) NOT NULL,
        is_default INTEGER DEFAULT 0
      );

      -- Transactions table (Offline-First source of truth)
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        category_id TEXT,
        amount REAL NOT NULL,
        description TEXT,
        date TEXT NOT NULL, -- ISO string
        type TEXT CHECK(type IN ('INCOME', 'EXPENSE')) NOT NULL,
        is_synced INTEGER DEFAULT 0, -- 0: Pending, 1: Synced
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      );

      -- Budgets table
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY NOT NULL,
        category_id TEXT NOT NULL,
        limit_amount REAL NOT NULL,
        period TEXT DEFAULT 'MONTHLY',
        FOREIGN KEY (category_id) REFERENCES categories (id)
      );

      -- Castle State (Local cache of game progress)
      CREATE TABLE IF NOT EXISTS castle_state (
        user_id TEXT PRIMARY KEY NOT NULL,
        hp INTEGER NOT NULL,
        max_hp INTEGER NOT NULL,
        status TEXT NOT NULL,
        gold_balance INTEGER DEFAULT 0,
        streak_days INTEGER DEFAULT 0,
        last_updated TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Sync Metadata (To track last successful pull from server)
      CREATE TABLE IF NOT EXISTS sync_meta (
         key TEXT PRIMARY KEY NOT NULL,
         value TEXT NOT NULL
      );

      -- Sync Operations Queue (Offline-first retries with backoff)
      CREATE TABLE IF NOT EXISTS sync_operations (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | FAILED
        attempts INTEGER NOT NULL DEFAULT 0,
        next_retry_at TEXT,
        last_error TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, entity_type, entity_id)
      );

      -- Performance Indexes
      CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_sync ON transactions(is_synced);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_sync ON transactions(user_id, is_synced);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_deleted_date ON transactions(user_id, deleted_at, date DESC);
      CREATE INDEX IF NOT EXISTS idx_sync_operations_user_status_retry ON sync_operations(user_id, status, next_retry_at);
    `);

    await ensureTransactionsColumns(db);
    await ensureBudgetsColumns(db);

    dbInstance = db;
    return db;
  })();

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
