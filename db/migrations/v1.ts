import { CATEGORIES, type CategoryType } from "@/constants/categories";
import { MAX_AMOUNT_MINOR } from "@/utils/money";
import type { Migration, MigrationDatabase } from "./runner";

/** A real `YYYY-MM-DD` date; `IS` because a NULL from date() would pass a CHECK. */
const calendarDay = (column: string): string => `date(${column}) IS ${column}`;

/** The (category_slug, type) pairs of the shipped Categories. */
const categoryOfType = (): string =>
  (["EXPENSE", "INCOME"] as const satisfies readonly CategoryType[])
    .map((type) => {
      const slugs = CATEGORIES.filter((category) => category.type === type)
        .map((category) => `'${category.slug}'`)
        .join(", ");
      return `(type = '${type}' AND category_slug IN (${slugs}))`;
    })
    .join(" OR ");

const minorUnits = (column: string): string =>
  `typeof(${column}) = 'integer' AND ${column} > 0 AND ${column} <= ${MAX_AMOUNT_MINOR}`;

/** Server-assigned on each accepted write; NULL until the first one is applied. */
const SERVER_ORDERING_COLUMNS = `
  version INTEGER CHECK (version IS NULL OR version > 0),
  change_seq INTEGER CHECK (change_seq IS NULL OR change_seq > 0),
  deleted_at TEXT`;

const dropAllTables = async (db: MigrationDatabase): Promise<void> => {
  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
  );
  // Old installs enforce foreign keys; deferring them lets parents drop first.
  await db.execAsync("PRAGMA defer_foreign_keys = ON");
  for (const { name } of tables) {
    await db.execAsync(`DROP TABLE "${name.replace(/"/g, '""')}"`);
  }
};

/**
 * v1 baseline (ADR 0005, Local schema). It only runs at user_version 0, so it
 * first drops every table an older install left behind; no data is migrated.
 * Synced columns mirror supabase/migrations/202603110012_v1_baseline.sql.
 */
export const v1Baseline: Migration = {
  version: 1,
  up: async (db) => {
    await dropAllTables(db);
    await db.execAsync(`
      CREATE TABLE transactions (
        id TEXT PRIMARY KEY NOT NULL, -- client-generated UUID v4
        user_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
        amount INTEGER NOT NULL CHECK (${minorUnits("amount")}),
        category_slug TEXT NOT NULL,
        day TEXT NOT NULL CHECK (${calendarDay("day")}), -- local calendar Day
        note TEXT,${SERVER_ORDERING_COLUMNS},
        CHECK (${categoryOfType()})
      );

      CREATE INDEX idx_transactions_user_day
        ON transactions (user_id, day)
        WHERE deleted_at IS NULL;

      -- One Budget plan document per user and Effective month.
      CREATE TABLE budget_plans (
        user_id TEXT NOT NULL,
        effective_month TEXT NOT NULL
          CHECK (${calendarDay("effective_month")} AND substr(effective_month, 9) = '01'),
        total_budget INTEGER NOT NULL CHECK (${minorUnits("total_budget")}),
        -- Category limits as a JSON object of category slug to minor units.
        category_limits TEXT NOT NULL DEFAULT '{}'
          CHECK (json_valid(category_limits) AND json_type(category_limits) = 'object'),${SERVER_ORDERING_COLUMNS},
        PRIMARY KEY (user_id, effective_month)
      );

      -- "Hoy sin gastos": one per user and Day.
      CREATE TABLE day_checkins (
        user_id TEXT NOT NULL,
        day TEXT NOT NULL CHECK (${calendarDay("day")}),${SERVER_ORDERING_COLUMNS},
        PRIMARY KEY (user_id, day)
      );

      -- One pending or rejected operation per user and entity; a new local
      -- write replaces it with a new operation_id.
      CREATE TABLE sync_queue (
        user_id TEXT NOT NULL,
        entity_type TEXT NOT NULL
          CHECK (entity_type IN ('transaction', 'budget_plan', 'day_checkin')),
        entity_key TEXT NOT NULL,
        operation_id TEXT NOT NULL UNIQUE,
        payload TEXT NOT NULL CHECK (json_valid(payload)),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rejected')),
        reject_reason TEXT CHECK (reject_reason IN ('invalid', 'deleted', 'forbidden')),
        attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
        next_retry_at TEXT,
        enqueued_at TEXT NOT NULL,
        PRIMARY KEY (user_id, entity_type, entity_key),
        CHECK ((status = 'rejected') = (reject_reason IS NOT NULL))
      );

      -- Sync cursor: the last change_seq pulled, per user.
      CREATE TABLE sync_cursors (
        user_id TEXT PRIMARY KEY NOT NULL,
        last_change_seq INTEGER NOT NULL DEFAULT 0 CHECK (last_change_seq >= 0)
      );
    `);
  },
};
