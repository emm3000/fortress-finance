import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Integration suites share the same test database; run files sequentially to avoid cross-suite races.
    fileParallelism: false,
    include: ['src/**/*.test.ts'],
    exclude: ['dist/**', 'coverage/**', 'node_modules/**'],
    setupFiles: ['./src/test.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      exclude: ['dist/**', 'node_modules/**', 'src/**/*.test.ts', 'src/test.setup.ts'],
    },
  },
});
