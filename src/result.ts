import type { CalcResult, Tone } from './types';

/**
 * Build a calculator result.
 *
 * The parameter types are deliberately loose. Calculator bodies were ported
 * verbatim from the legacy app and build their tone and rows dynamically
 * (`const c = b < 25 ? ['Normal', 'ok'] : …`), which TypeScript widens to
 * `string` and `string[][]`. Tightening those call sites would mean rewriting
 * clinical math that the golden snapshot currently proves byte-identical.
 * So this function is the single adapter: loose in, `CalcResult` out.
 */
export function R(
  badge: string,
  tone: Tone | string,
  rows: ([string, string] | string[])[],
  note?: string | null,
  src?: string | null,
): CalcResult {
  return {
    badge,
    tone: tone as Tone,
    rows: rows as [string, string][],
    note,
    src,
  };
}
