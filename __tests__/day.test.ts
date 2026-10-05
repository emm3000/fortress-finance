import type { Day } from "@/utils/day";
import { isDay, isPeriod, periodOf, toDay } from "@/utils/day";

describe("day", () => {
  it("maps a Date at 23:30 local time to that local Day, never the UTC date", () => {
    expect(toDay(new Date(2026, 9, 5, 23, 30))).toBe("2026-10-05");
    expect(toDay(new Date(2026, 0, 1, 0, 5))).toBe("2026-01-01");
  });

  it("derives the Period YYYY-MM from a Day", () => {
    expect(periodOf("2026-10-05" as Day)).toBe("2026-10");
    expect(periodOf("2024-02-29" as Day)).toBe("2024-02");
  });

  it("rejects a malformed Day or Period", () => {
    expect(isDay("2026-10-05")).toBe(true);
    for (const bad of ["2026-1-5", "2026-02-30", "2026-13-01", "2026-00-05", "2026-10-00", "2026-10-05T10:00:00Z", "", "20261005"]) {
      expect(isDay(bad)).toBe(false);
    }
    expect(isPeriod("2026-10")).toBe(true);
    for (const bad of ["2026-13", "2026-00", "2026-1", "2026-10-05", ""]) {
      expect(isPeriod(bad)).toBe(false);
    }
    expect(() => periodOf("2026-02-30" as Day)).toThrow(RangeError);
  });
});
