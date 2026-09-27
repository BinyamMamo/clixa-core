/** Severity of a result, driving badge colour in every UI. */
export type Tone = 'ok' | 'info' | 'warn' | 'bad';

export interface FieldBase {
  k: string;
  label: string;
  /** Span the full width of a two-column form. */
  full?: 1 | boolean;
  /** Field may be left blank; compute() receives null. */
  opt?: 1 | boolean;
}

export interface NumField extends FieldBase {
  t: 'num';
  min?: number;
  max?: number;
  step?: number | string;
  /** Static unit shown in the label, e.g. 'kg'. */
  unit?: string;
  /** Selectable units; the first is the base unit compute() expects. */
  units?: string[];
  hint?: string;
}

export interface SelField extends FieldBase {
  t: 'sel';
  opts: [string, string][];
}

export interface DateField extends FieldBase {
  t: 'date';
  hint?: string;
}

export interface ChkField extends FieldBase {
  t: 'chk';
  pts?: number;
}

export interface HeadField {
  t: 'head';
  label: string;
  k?: undefined;
}

export type Field = NumField | SelField | DateField | ChkField | HeadField;

export interface CalcResult {
  /** Headline conclusion, e.g. "BMI 22.4, Normal weight". */
  badge: string;
  tone: Tone;
  /** Label/value pairs shown beneath the badge. */
  rows: [string, string][];
  note?: string | null;
  src?: string | null;
}

export interface Calculator {
  name: string;
  icon: string;
  /** One line, for compact list rows. */
  desc: string;
  /** Full paragraph, for the tool header and generated SEO metadata. */
  about?: string;
  src?: string;
  /** Extra search terms so lay words find clinical tools ("kidney" -> eGFR). */
  synonyms?: string[];
  fields?: Field[];
  compute?: (v: Record<string, any>) => CalcResult;
  /** Tools with a bespoke UI instead of the generic field renderer. */
  custom?: 'tnm';
  preset?: string;
}
