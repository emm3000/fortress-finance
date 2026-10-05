export type Day = string & { readonly __brand: "Day" };
export type Period = string & { readonly __brand: "Period" };

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const PERIOD_PATTERN = /^(\d{4})-(\d{2})$/;

const pad = (value: number, width: number): string =>
  String(value).padStart(width, "0");

/** The local calendar Day of a Date, never the UTC date. */
export function toDay(date: Date): Day {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}` as Day;
}

export function isDay(value: string): value is Day {
  const match = DAY_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || day < 1) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}

export function isPeriod(value: string): value is Period {
  const match = PERIOD_PATTERN.exec(value);
  if (!match) return false;
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

export function periodOf(day: Day): Period {
  if (!isDay(day)) throw new RangeError(`Malformed Day: ${day}`);
  return day.slice(0, 7) as Period;
}
