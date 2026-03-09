// Global test setup: load environment variables before any test runs
// This mirrors how server.ts loads dotenv in production
import 'dotenv/config';

// Ensure tests run with explicit test semantics for config-dependent middleware.
process.env.NODE_ENV = 'test';
