import type { ChkField, DateField, Field, HeadField, NumField, SelField } from './types';

/** Declarative field builders used by every calculator definition. */
export const F = {
  num: (k: string, label: string, o: Partial<NumField> = {}): NumField =>
    ({ t: 'num', k, label, ...o }),
  sel: (k: string, label: string, opts: [string, string][], o: Partial<SelField> = {}): SelField =>
    ({ t: 'sel', k, label, opts, ...o }),
  date: (k: string, label: string, o: Partial<DateField> = {}): DateField =>
    ({ t: 'date', k, label, ...o }),
  chk: (k: string, label: string, pts?: number, o: Partial<ChkField> = {}): ChkField =>
    ({ t: 'chk', k, label, pts, ...o }),
  head: (label: string): HeadField => ({ t: 'head', label }),
};

export const SEX: [string, string][] = [['m', 'Male'], ['f', 'Female']];

/** Fields that hold a value (everything except section headings). */
export function inputFields(fields: Field[] = []): Exclude<Field, HeadField>[] {
  return fields.filter((f): f is Exclude<Field, HeadField> => f.t !== 'head');
}
