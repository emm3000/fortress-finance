import * as Sentry from '@sentry/node';
import { env } from '../config/env';
import { logger } from './logger';

let sentryEnabled = false;

export const initMonitoring = () => {
  if (!env.SENTRY_DSN) {
    logger.info('Sentry disabled: missing SENTRY_DSN');
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
  });

  sentryEnabled = true;
  logger.info('Sentry initialized');
};

export const captureException = (error: unknown, context?: Record<string, unknown>) => {
  if (!sentryEnabled) {
    return;
  }

  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => scope.setExtra(key, value));
      Sentry.captureException(error);
    });
    return;
  }

  Sentry.captureException(error);
};

