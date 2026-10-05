import {
  CURRENCIES,
  MAX_AMOUNT_MINOR,
  formatAmount,
  parseAmount,
} from "@/utils/money";
import type { CurrencyCode } from "@/utils/money";

const TWO_DECIMALS: CurrencyCode[] = ["PEN", "USD", "MXN", "COP", "ARS", "EUR"];

describe("money", () => {
  it("parses a decimal input into integer minor units using the currency exponent", () => {
    for (const currency of TWO_DECIMALS) {
      expect(parseAmount("12.34", currency)).toBe(1234);
      expect(parseAmount("12,5", currency)).toBe(1250);
      expect(parseAmount("7", currency)).toBe(700);
    }
    expect(parseAmount("1500", "CLP")).toBe(1500);
    expect(CURRENCIES.CLP).toBe(0);
    for (const currency of TWO_DECIMALS) expect(CURRENCIES[currency]).toBe(2);
  });

  it("rejects zero, negative amounts, more decimals than the currency allows and anything above 100_000_000_000 minor units", () => {
    expect(parseAmount("0", "PEN")).toBeNull();
    expect(parseAmount("0.00", "PEN")).toBeNull();
    expect(parseAmount("-5", "PEN")).toBeNull();
    expect(parseAmount("1.234", "PEN")).toBeNull();
    expect(parseAmount("10.5", "CLP")).toBeNull();
    expect(parseAmount("", "PEN")).toBeNull();
    expect(parseAmount("abc", "PEN")).toBeNull();
    expect(parseAmount("1.2.3", "PEN")).toBeNull();
    expect(MAX_AMOUNT_MINOR).toBe(100_000_000_000);
    expect(parseAmount("1000000000", "PEN")).toBe(MAX_AMOUNT_MINOR);
    expect(parseAmount("1000000000.01", "PEN")).toBeNull();
    expect(parseAmount("100000000001", "CLP")).toBeNull();
  });

  it("formats minor units with Intl.NumberFormat for the currency", () => {
    for (const currency of TWO_DECIMALS) {
      const expected = new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(12.34);
      expect(formatAmount(1234, currency)).toBe(expected);
      expect(formatAmount(1234, currency)).toContain("12.34");
    }
    const clp = new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(1500);
    expect(formatAmount(1500, "CLP")).toBe(clp);
    expect(formatAmount(1500, "CLP")).toContain("1,500");
    expect(formatAmount(1500, "CLP")).not.toMatch(/[.,]\d{2}$/);
    expect(formatAmount(1234, "PEN", "es-AR")).toContain("12,34");
  });
});
