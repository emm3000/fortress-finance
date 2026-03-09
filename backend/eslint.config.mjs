import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));
const typedFiles = ['src/**/*.ts', 'prisma/**/*.ts', 'vitest.config.ts'];
const withTsFiles = (configs) => configs.map((config) => ({ ...config, files: typedFiles }));

export default [
  { ignores: ['dist/**', 'src/generated/**'] },
  pluginJs.configs.recommended,
  ...withTsFiles(tseslint.configs.recommendedTypeChecked),
  ...withTsFiles(tseslint.configs.strictTypeChecked),
  ...withTsFiles(tseslint.configs.stylisticTypeChecked),
  eslintConfigPrettier,
  {
    files: typedFiles,
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir,
      },
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.test.ts', 'src/test.setup.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
];
