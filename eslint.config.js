// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const sqliteBoundary = {
  name: 'expo-sqlite',
  message: 'Access SQLite through the repositories in db/.',
};

const supabaseBoundary = {
  name: '@supabase/supabase-js',
  message: 'Call Supabase through a service in services/ (client lives in services/supabase.client.ts).',
};

const supabaseClientOwners = ['services/supabase.client.ts', 'store/auth.store.ts'];

// Flat config replaces rule options per file, so each file set gets exactly one no-restricted-imports entry.
module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['db/**', ...supabaseClientOwners],
    rules: {
      'no-restricted-imports': ['error', { paths: [sqliteBoundary, supabaseBoundary] }],
    },
  },
  {
    files: ['db/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { paths: [supabaseBoundary] }],
    },
  },
  {
    files: supabaseClientOwners,
    rules: {
      'no-restricted-imports': ['error', { paths: [sqliteBoundary] }],
    },
  },
]);
