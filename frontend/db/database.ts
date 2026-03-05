import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "fortaleza.db";

/**
 * Initialize the local database and create tables if they don't exist.
 * This is the foundation for the Offline-First architecture.
 */
export const initDatabase = async () => {
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
  `);

  console.log("Local database initialized successfully 🏰");
  return db;
};

/**
 * Get the database instance.
 */
export const getDatabase = async () => {
  return await SQLite.openDatabaseAsync(DATABASE_NAME);
};
