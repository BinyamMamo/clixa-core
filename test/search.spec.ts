/* The search ranking and unit conversion are new code, so the golden snapshot
   says nothing about them. */
import { describe, expect, it } from 'vitest';
import { CALCS, TOOLS, searchTools, toBase, fromBase, ValidationError, rng, need } from '../src/index';

const pro = TOOLS.pro;
const ids = (q: string) => searchTools(q, CALCS, pro).map((h) => h.id);

describe('search ranking', () => {
  it('ranks the exact tool above tools that merely mention it', () => {
    expect(ids('bmi')[0]).toBe('bmi');
    expect(ids('bmi')).toContain('pedbmi');
  });

  it('finds tools by lay synonym, which the legacy substring search could not', () => {
    expect(ids('kidney')).toContain('egfr');
    expect(ids('sugar')).toContain('hba1c');
    expect(ids('due date')).toContain('edd');
    expect(ids('clot')).toContain('caprini');
    expect(ids('plumpy nut')).toContain('rutf');
  });

  it('requires every term to match, so multi-word queries narrow', () => {
    expect(ids('wells pe')).toContain('wellspe');
    expect(ids('wells pe')).not.toContain('wellsdvt');
  });

  it('matches department names', () => {
    expect(ids('oncology')).toContain('ecog');
  });

  it('returns nothing for an empty or unmatched query', () => {
    expect(ids('')).toEqual([]);
    expect(ids('   ')).toEqual([]);
    expect(ids('zzzzqqq')).toEqual([]);
  });

  it('handles regex metacharacters in the query without throwing', () => {
    expect(() => ids('c(a[b')).not.toThrow();
  });

  it('respects the result limit', () => {
    expect(searchTools('a', CALCS, pro, 5)).toHaveLength(5);
  });
});

describe('unit conversion', () => {
  it('converts to the base units compute() expects', () => {
    expect(toBase(154, 'lb')).toBeCloseTo(69.85, 2);
    expect(toBase(70, 'in')).toBeCloseTo(177.8, 2);
    expect(toBase(88.4, 'µmol/L')).toBeCloseTo(1, 6);
    expect(toBase(70, 'kg')).toBe(70);
    expect(toBase(70, undefined)).toBe(70);
  });

  it('round-trips', () => {
    for (const u of ['lb', 'in', 'µmol/L', 'kg']) {
      expect(fromBase(toBase(12.34, u), u)).toBeCloseTo(12.34, 9);
    }
  });
});

describe('validation errors carry the field key', () => {
  it('rng reports the offending field so the UI can outline it', () => {
    try {
      rng(500, 0, 100, 'Weight', 'wt');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).key).toBe('wt');
      expect((e as Error).message).toBe('Weight must be between 0 and 100.');
    }
  });

  it('need rejects blank, null and NaN with the legacy wording', () => {
    for (const v of ['', null, undefined, NaN]) {
      expect(() => need(v, 'Age', 'age')).toThrow('Age is required.');
    }
    expect(need(0, 'Age')).toBe(0);
  });
});
