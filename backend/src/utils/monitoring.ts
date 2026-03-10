import * as Sentry from '@sentry/node';
import type { Request } from 'express';
import { env } from '../config/env';
import { logger } from './logger';

let sentryEnabled = false;
let initialized = false;

const getTraceSampleRate = () => {
  if (env.NODE_ENV === 'production') {
    return 0.2;
  }

  if (env.NODE_ENV === 'test') {
    return 0;
  }

  return 1;
};

export const initMonitoring = () => {
  if (initialized) {
    return sentryEnabled;
  }
  initialized = true;

  if (!env.SENTRY_DSN) {
    logger.info('Sentry disabled: missing SENTRY_DSN');
    return false;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: getTraceSampleRate(),
    integrations: [Sentry.httpIntegration(), Sentry.expressIntegration(), Sentry.prismaIntegration()],
  });

  sentryEnabled = true;
  logger.info('Sentry initialized', {
    environment: env.NODE_ENV,
    tracesSampleRate: getTraceSampleRate(),
  });
  return true;
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

export const setRequestMonitoringContext = (req: Request) => {
  if (!sentryEnabled) {
    return;
  }
  const route = req.route as { path?: string } | undefined;
  const routeName = typeof route?.path === 'string' ? route.path : req.path;

  Sentry.setTag('http.method', req.method);
  Sentry.setTag('http.route', routeName);

  const requestIdHeader = req.headers['x-request-id'];
  const requestId = typeof requestIdHeader === 'string' ? requestIdHeader : null;
  if (requestId) {
    Sentry.setTag('request_id', requestId);
  }

  if (req.user?.userId) {
    Sentry.setUser({ id: req.user.userId });
    return;
  }

  Sentry.setUser(null);
};

export const isMonitoringEnabled = () => sentryEnabled;
