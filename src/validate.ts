/* Validation. Behaviour (and every message string) matches the legacy app so
   the golden snapshot holds; the one addition is that the error now carries
   the field key, letting a UI outline the offending input instead of printing
   a sentence at the bottom of the form. */

export class ValidationError extends Error {
  /** Key of the field that failed, when known. */
  key?: string;
  constructor(message: string, key?: string) {
    super(message);
    this.name = 'ValidationError';
    this.key = key;
  }
}

export function err(m: string, key?: string): never {
  throw new ValidationError(m, key);
}

export function need<T>(v: T, name: string, key?: string): T {
  if (v === '' || v === null || v === undefined || (typeof v === 'number' && isNaN(v))) {
    err(name + ' is required.', key);
  }
  return v;
}

export function rng(v: number, lo: number, hi: number, name: string, key?: string): number {
  need(v, name, key);
  if (v < lo || v > hi) err(name + ' must be between ' + lo + ' and ' + hi + '.', key);
  return v;
}
