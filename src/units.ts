/* Unit handling. In the legacy app this was buried inside the DOM reader
   (readVals), which made it impossible to test or reuse. Every compute()
   expects base units: kg, cm, mg/dL. */

export const KG = 0.45359237;
export const IN = 2.54;

/** Convert a displayed value in `unit` to the base unit compute() expects. */
export function toBase(value: number, unit: string | undefined): number {
  switch (unit) {
    case 'lb': return value * KG;
    case 'in': return value * IN;
    case 'µmol/L': return value / 88.4;
    default: return value;
  }
}

/** Convert a base-unit value back out for display in `unit`. */
export function fromBase(value: number, unit: string | undefined): number {
  switch (unit) {
    case 'lb': return value / KG;
    case 'in': return value / IN;
    case 'µmol/L': return value * 88.4;
    default: return value;
  }
}
