/* Ethiopian ⇄ Gregorian calendar, via Julian Day Number.
   Algorithms ported verbatim from the legacy app, which round-trip-tests them
   across 30,000 days; see test/selftest.spec.ts. */
import { dstr } from './format';

export const ETHM = ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'];

export const ETHM_AM = ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'];

/** Gregorian y/m/d → Julian Day Number. */
export function g2jdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12), y2 = y + 4800 - a, m2 = m + 12 * a - 3;
  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}

/** Julian Day Number → [year, month, day] Gregorian. */
export function jdn2g(j: number): [number, number, number] {
  const a = j + 32044, b = Math.floor((4 * a + 3) / 146097), c = a - Math.floor(146097 * b / 4),
    dd = Math.floor((4 * c + 3) / 1461), e = c - Math.floor(1461 * dd / 4), mm = Math.floor((5 * e + 2) / 153);
  return [100 * b + dd - 4800 + Math.floor(mm / 10), mm + 3 - 12 * Math.floor(mm / 10), e - Math.floor((153 * mm + 2) / 5) + 1];
}

/** Ethiopian y/m/d → Julian Day Number. */
export function e2jdn(y: number, m: number, d: number): number {
  return 1724221 + 365 * (y - 1) + Math.floor(y / 4) + 30 * (m - 1) + d - 1;
}

/** Julian Day Number → [year, month, day] Ethiopian. */
export function jdn2e(j: number): [number, number, number] {
  const r = (j - 1723856) % 1461, n = r % 365 + 365 * Math.floor(r / 1460);
  return [4 * Math.floor((j - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460), Math.floor(n / 30) + 1, n % 30 + 1];
}

/** Ethiopian leap years carry a 6th day in Pagume. */
export function ethLeap(y: number): boolean { return y % 4 === 3; }

/** Days in an Ethiopian month (Pagume is 5, or 6 in a leap year). */
export function ethMonthDays(y: number, m: number): number {
  return m === 13 ? (ethLeap(y) ? 6 : 5) : 30;
}

/** Format a Gregorian Date as an Ethiopian date string, e.g. "1 Meskerem 2017 ዓ.ም." */
export function estr(d: Date): string {
  const [y, m, dd] = jdn2e(g2jdn(d.getFullYear(), d.getMonth() + 1, d.getDate()));
  return dd + ' ' + ETHM[m - 1] + ' ' + y + ' ዓ.ም.';
}

/** Both calendars, e.g. "11 Sep 2024 · 1 Meskerem 2017 ዓ.ም." */
export function dboth(d: Date): string { return dstr(d) + ' · ' + estr(d); }

/** Ethiopian y/m/d → the 'YYYY-MM-DD' string that compute() expects. */
export function ethToISO(y: number, m: number, d: number): string {
  const g = jdn2g(e2jdn(y, m, d));
  return g[0] + '-' + String(g[1]).padStart(2, '0') + '-' + String(g[2]).padStart(2, '0');
}
