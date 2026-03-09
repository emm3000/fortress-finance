type LogLevel = 'info' | 'warn' | 'error';

const REDACTED_KEYS = new Set([
  'authorization',
  'password',
  'passwordHash',
  'secret',
  'token',
  'tokenHash',
  'resetToken',
  'jwt',
]);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const sanitize = (value: unknown, depth = 0): unknown => {
  if (depth > 4) {
    return '[Truncated]';
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      ...(process.env.NODE_ENV !== 'production' && value.stack ? { stack: value.stack } : {}),
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1));
  }

  if (!isRecord(value)) {
    return value;
  }

  const output: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (REDACTED_KEYS.has(key)) {
      output[key] = '[REDACTED]';
      continue;
    }
    output[key] = sanitize(nestedValue, depth + 1);
  }

  return output;
};

const writeLog = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ? { meta: sanitize(meta) } : {}),
  };

  const line = JSON.stringify(payload);
  if (level === 'error') {
    process.stderr.write(`${line}\n`);
    return;
  }
  if (level === 'warn') {
    process.stderr.write(`${line}\n`);
    return;
  }
  process.stdout.write(`${line}\n`);
};

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    writeLog('info', message, meta);
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    writeLog('warn', message, meta);
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    writeLog('error', message, meta);
  },
};
