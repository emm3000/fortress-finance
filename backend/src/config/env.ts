import { z } from 'zod';
import { config } from 'dotenv';
import { logger } from '../utils/logger';

// Load .env before validating — makes this module self-contained
// regardless of import order (e.g., in tests)
config();

const envSchema = z.object({
  DATABASE_URL: z.url('DATABASE_URL debe ser una URL válida'),
  TEST_DATABASE_URL: z.url('TEST_DATABASE_URL debe ser una URL válida').optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGINS: z.string().default(''),
  ENABLE_CRON: z.coerce.boolean().default(false),
  API_RESPONSE_ENVELOPE: z.coerce.boolean().default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error('Invalid environment variables', {
    issues: z.treeifyError(parsed.error),
  });
  process.exit(1);
}

export const env = parsed.data;
