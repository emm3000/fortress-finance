interface ParseIntOptions {
  fallback: number;
  min?: number;
  max?: number;
}

export const parseBoundedInt = (value: unknown, options: ParseIntOptions): number => {
  const parsed = typeof value === 'number' ? value : Number(value ?? options.fallback);

  if (!Number.isFinite(parsed)) {
    return options.fallback;
  }

  if (typeof options.min === 'number' && parsed < options.min) {
    return options.min;
  }

  if (typeof options.max === 'number' && parsed > options.max) {
    return options.max;
  }

  return Math.trunc(parsed);
};

