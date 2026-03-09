// Global test setup: load environment variables before any test runs
// This mirrors how server.ts loads dotenv in production
import 'dotenv/config';

// Ensure tests run with explicit test semantics for config-dependent middleware.
process.env.NODE_ENV = 'test';

const dbUrl = process.env.DATABASE_URL ?? '';
const looksLikeTestDb = /(?:test|testing|_test)(?:$|[_-])/i.test(dbUrl);
const isCi = process.env.CI === 'true';

if (isCi && !looksLikeTestDb) {
  throw new Error(
    'Unsafe test database detected in CI. DATABASE_URL must point to a dedicated test database.',
  );
}

if (!isCi && !looksLikeTestDb) {
  if (process.env.TEST_DB_WARNING_EMITTED !== 'true') {
    console.warn(
      '[test.setup] DATABASE_URL does not look like a test database. ' +
        'Use a dedicated test DB to avoid accidental data loss.',
    );
    process.env.TEST_DB_WARNING_EMITTED = 'true';
  }
}
