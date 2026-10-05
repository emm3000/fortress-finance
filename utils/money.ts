export type CurrencyCode = "PEN" | "USD" | "MXN" | "COP" | "ARS" | "EUR" | "CLP";

/** ISO 4217 exponent: how many decimals separate a major unit from its Minor unit. */
export const CURRENCIES: Readonly<Record<CurrencyCode, number>> = {
  PEN: 2,
  USD: 2,
  MXN: 2,
  COP: 2,
  ARS: 2,
  EUR: 2,
  CLP: 0,
};

export const MAX_AMOUNT_MINOR = 100_000_000_000;

const DEFAULT_LOCALE = "es-PE";

/** Parses user input such as "12.5" or "12,50" into integer Minor units; null when invalid. */
export function parseAmount(input: string, currency: CurrencyCode): number | null {
  const exponent = CURRENCIES[currency];
  const match = /^(\d+)(?:[.,](\d+))?$/.exec(input.trim());
  if (!match) return null;

  const whole = match[1];
  const fraction = match[2] ?? "";
  if (fraction.length > exponent) return null;

  const minor = Number(whole + fraction.padEnd(exponent, "0"));
  if (!Number.isSafeInteger(minor) || minor <= 0 || minor > MAX_AMOUNT_MINOR) {
    return null;
  }
  return minor;
}

export function formatAmount(
  minor: number,
  currency: CurrencyCode,
  locale: string = DEFAULT_LOCALE,
): string {
  const exponent = CURRENCIES[currency];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  }).format(minor / 10 ** exponent);
}
