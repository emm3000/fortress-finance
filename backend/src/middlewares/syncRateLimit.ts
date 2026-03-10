import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const SYNC_WINDOW_MS = 15 * 60 * 1000;
const SYNC_MAX_REQUESTS = 120;

export const syncRateLimiter = rateLimit({
  windowMs: SYNC_WINDOW_MS,
  max: SYNC_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    error: {
      message: 'Demasiadas solicitudes de sincronización. Inténtalo más tarde.',
    },
  },
});

