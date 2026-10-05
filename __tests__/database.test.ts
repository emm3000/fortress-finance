import { DatabaseSync } from "node:sqlite";
import { initDatabase } from "@/db/database";
import { MIGRATIONS } from "@/db/migrations";
import { runMigrations, type Migration, type MigrationDatabase } from "@/db/migrations/runner";

type MemoryDatabase = MigrationDatabase & {
  raw: DatabaseSync;
  transactionCount: () => number;
  isInTransaction: () => boolean;
};

const mockOpenDatabaseAsync = jest.fn();

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: (...args: unknown[]) => mockOpenDatabaseAsync(...args),
}));

/** An expo-sqlite shaped adapter over a real in-memory SQLite. */
const openMemoryDatabase = (): MemoryDatabase => {
  const raw = new DatabaseSync(":memory:");
  let transactions = 0;
  let inTransaction = false;

  return {
    raw,
    transactionCount: () => transactions,
    isInTransaction: () => inTransaction,
    execAsync: async (source) => {
      raw.exec(source);
    },
    getFirstAsync: async <T>(source: string) => (raw.prepare(source).get() ?? null) as T | null,
    getAllAsync: async <T>(source: string) => raw.prepare(source).all() as T[],
    withTransactionAsync: async (task) => {
      raw.exec("BEGIN");
      transactions += 1;
      inTransaction = true;
      try {
        await task();
        raw.exec("COMMIT");
      } catch (error) {
        raw.exec("ROLLBACK");
        throw error;
      } finally {
        inTransaction = false;
      }
    },
  };
};

const userVersion = (db: MemoryDatabase): number =>
  (db.raw.prepare("PRAGMA user_version").get() as { user_version: number }).user_version;

const tableNames = (db: MemoryDatabase): string[] =>
  (
    db.raw
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all() as { name: string }[]
  ).map((row) => row.name);

const columnNames = (db: MemoryDatabase, table: string): string[] =>
  (db.raw.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(
    (column) => column.name,
  );

const createTableMigration = (version: number, calls: number[], db: MemoryDatabase): Migration => ({
  version,
  up: async (migrationDb) => {
    expect(db.isInTransaction()).toBe(true);
    calls.push(version);
    await migrationDb.execAsync(`CREATE TABLE m${version} (id INTEGER)`);
  },
});

describe("runMigrations", () => {
  it("runs pending migrations in order, each in its own transaction, and sets user_version to the last one applied", async () => {
    const db = openMemoryDatabase();
    db.raw.exec("PRAGMA user_version = 1");
    const calls: number[] = [];

    await runMigrations(db, [
      createTableMigration(3, calls, db),
      createTableMigration(1, calls, db),
      createTableMigration(2, calls, db),
    ]);

    expect(calls).toEqual([2, 3]);
    expect(db.transactionCount()).toBe(2);
    expect(userVersion(db)).toBe(3);
    expect(tableNames(db)).toEqual(["m2", "m3"]);
  });

  it("drops every existing table before migration 1 when user_version is 0", async () => {
    const db = openMemoryDatabase();
    db.raw.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE categories (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL);
      CREATE TABLE transactions (
        id TEXT PRIMARY KEY NOT NULL,
        amount REAL NOT NULL,
        category_id TEXT REFERENCES categories (id)
      );
      CREATE TABLE sync_meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
      CREATE TABLE budgets (id TEXT PRIMARY KEY NOT NULL);
      INSERT INTO categories VALUES ('cat-1', 'Comida');
      INSERT INTO transactions VALUES ('tx-1', 12.5, 'cat-1');
    `);

    await runMigrations(db, MIGRATIONS);

    expect(userVersion(db)).toBe(1);
    expect(tableNames(db)).toEqual([
      "budget_plans",
      "day_checkins",
      "sync_cursors",
      "sync_queue",
      "transactions",
    ]);
    expect(db.raw.prepare("SELECT COUNT(*) AS count FROM transactions").get()).toEqual({
      count: 0,
    });
  });

  it("leaves a database already at user_version 1 untouched", async () => {
    const db = openMemoryDatabase();
    db.raw.exec(`
      PRAGMA user_version = 1;
      CREATE TABLE transactions (id TEXT PRIMARY KEY NOT NULL);
      INSERT INTO transactions VALUES ('tx-1');
    `);

    await runMigrations(db, MIGRATIONS);

    expect(userVersion(db)).toBe(1);
    expect(db.transactionCount()).toBe(0);
    expect(tableNames(db)).toEqual(["transactions"]);
    expect(db.raw.prepare("SELECT id FROM transactions").all()).toEqual([{ id: "tx-1" }]);
  });

  it("a failing migration rolls back and leaves user_version unchanged", async () => {
    const db = openMemoryDatabase();
    db.raw.exec("PRAGMA user_version = 1");
    const calls: number[] = [];
    const failing: Migration = {
      version: 3,
      up: async (migrationDb) => {
        await migrationDb.execAsync("CREATE TABLE half_done (id INTEGER)");
        throw new Error("boom");
      },
    };

    await expect(
      runMigrations(db, [createTableMigration(2, calls, db), failing]),
    ).rejects.toThrow("boom");

    expect(userVersion(db)).toBe(2);
    expect(tableNames(db)).toEqual(["m2"]);
  });
});

describe("migration 1", () => {
  const migrate = async (): Promise<MemoryDatabase> => {
    const db = openMemoryDatabase();
    await runMigrations(db, MIGRATIONS);
    return db;
  };

  it("creates transactions with a client UUID id, integer Amount, YYYY-MM-DD day and server ordering columns", async () => {
    const db = await migrate();

    expect(columnNames(db, "transactions")).toEqual([
      "id",
      "user_id",
      "type",
      "amount",
      "category_slug",
      "day",
      "note",
      "version",
      "change_seq",
      "deleted_at",
    ]);

    const insert = db.raw.prepare(
      "INSERT INTO transactions (id, user_id, type, amount, category_slug, day) VALUES (?, 'user-1', 'EXPENSE', ?, 'food', ?)",
    );
    insert.run("tx-1", 1250, "2026-10-05");
    expect(() => insert.run("tx-2", 12.5, "2026-10-05")).toThrow(/CHECK/);
    expect(() => insert.run("tx-3", 0, "2026-10-05")).toThrow(/CHECK/);
    expect(() => insert.run("tx-4", 100_000_000_001, "2026-10-05")).toThrow(/CHECK/);
    expect(() => insert.run("tx-5", 1250, "2026-10-05T10:00:00Z")).toThrow(/CHECK/);
  });

  it("keys budget plans by user and Effective month and stores the Monthly budget total with its Category limits", async () => {
    const db = await migrate();

    expect(columnNames(db, "budget_plans")).toEqual([
      "user_id",
      "effective_month",
      "total_budget",
      "category_limits",
      "version",
      "change_seq",
      "deleted_at",
    ]);

    const insert = db.raw.prepare(
      "INSERT INTO budget_plans (user_id, effective_month, total_budget, category_limits) VALUES ('user-1', ?, 500000, ?)",
    );
    insert.run("2026-10-01", '{"food":120000}');
    expect(() => insert.run("2026-10-01", "{}")).toThrow(/UNIQUE/);
    expect(() => insert.run("2026-11-15", "{}")).toThrow(/CHECK/);
    expect(() => insert.run("2026-12-01", "not json")).toThrow(/CHECK/);
  });

  it("keys day check-ins by user and Day", async () => {
    const db = await migrate();

    expect(columnNames(db, "day_checkins")).toEqual([
      "user_id",
      "day",
      "version",
      "change_seq",
      "deleted_at",
    ]);

    const insert = db.raw.prepare("INSERT INTO day_checkins (user_id, day) VALUES (?, '2026-10-05')");
    insert.run("user-1");
    insert.run("user-2");
    expect(() => insert.run("user-1")).toThrow(/UNIQUE/);
  });

  it("keeps one sync queue row per user and entity, with a rejected status that requires a reason", async () => {
    const db = await migrate();

    const insert = db.raw.prepare(
      "INSERT INTO sync_queue (user_id, entity_type, entity_key, operation_id, payload, status, reject_reason, enqueued_at) VALUES (?, 'transaction', 'tx-1', ?, '{}', ?, ?, '2026-10-05T10:00:00Z')",
    );
    insert.run("user-1", "op-1", "pending", null);
    insert.run("user-2", "op-2", "rejected", "deleted");
    expect(() => insert.run("user-1", "op-3", "pending", null)).toThrow(/UNIQUE/);
    expect(() => insert.run("user-3", "op-4", "rejected", null)).toThrow(/CHECK/);
    expect(() => insert.run("user-3", "op-5", "rejected", "too_late")).toThrow(/CHECK/);
  });

  it("stores one Sync cursor per user id", async () => {
    const db = await migrate();

    const insert = db.raw.prepare("INSERT INTO sync_cursors (user_id, last_change_seq) VALUES (?, ?)");
    insert.run("user-1", 42);
    insert.run("user-2", 0);
    expect(() => insert.run("user-1", 43)).toThrow(/UNIQUE/);
  });
});

describe("initDatabase", () => {
  it("opens fortaleza.db and migrates it to user_version 1", async () => {
    const db = openMemoryDatabase();
    mockOpenDatabaseAsync.mockResolvedValue(db);

    await expect(initDatabase()).resolves.toBe(db);

    expect(mockOpenDatabaseAsync).toHaveBeenCalledWith("fortaleza.db");
    expect(userVersion(db)).toBe(1);
  });
});
