/* Number and date formatting shared by every calculator.
   Ported verbatim from the legacy single-file app, the golden snapshot
   depends on these producing byte-identical strings. */

export const r1 = (x: number) => Math.round(x * 10) / 10;
export const r2 = (x: number) => Math.round(x * 100) / 100;

export function ln(x: number) { return Math.log(x); }
export function fmt(x: number, d = 1) { return Number(x).toFixed(d); }

export function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function dstr(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Days as obstetric "32w 4d" notation. */
export function wkd(days: number) {
  return Math.floor(days / 7) + 'w ' + (days % 7) + 'd';
}
