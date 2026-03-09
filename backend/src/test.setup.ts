import { config as loadEnv } from 'dotenv';

// Load base env, then allow .env.test to override values for tests.
loadEnv({ path: '.env' });
loadEnv({ path: '.env.test', override: true });

// Ensure tests run with explicit test semantics for config-dependent middleware.
process.env.NODE_ENV = 'test';

const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
if (testDatabaseUrl) {
  // Force test runtime to use dedicated DB when provided.
  process.env.DATABASE_URL = testDatabaseUrl;
}

const dbUrl = process.env.DATABASE_URL ?? '';
const looksLikeTestDb = /(?:test|testing|_test)(?:$|[_-])/i.test(dbUrl);
const isCi = process.env.CI === 'true';
const strictTestDb = process.env.STRICT_TEST_DB === 'true';

if ((isCi || strictTestDb) && !looksLikeTestDb) {
  throw new Error(
    'Unsafe test database detected. DATABASE_URL must point to a dedicated test database.',
  );
}

if (!isCi && !looksLikeTestDb) {
  if (process.env.TEST_DB_WARNING_EMITTED !== 'true') {
    console.warn(
      '[test.setup] DATABASE_URL does not look like a test database. ' +
        'Set TEST_DATABASE_URL or use .env.test with a dedicated test DB to avoid accidental data loss.',
    );
    process.env.TEST_DB_WARNING_EMITTED = 'true';
  }
}
