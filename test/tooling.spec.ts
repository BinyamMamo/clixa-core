/* The function-calling surface. These matter more than usual: a model has no
   UI to convert units or validate, so anything the schema fails to say is a
   wrong answer waiting to happen. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CALCS, TNM, toolDeclarations, toolInputSchema, runTool } from '../src/index';
import { FROZEN_NOW } from '../golden/matrix.mjs';
import { casesFor } from '../golden/matrix.mjs';

const RealDate = Date;
beforeAll(() => {
  class FrozenDate extends RealDate {
    constructor(...args: any[]) {
      // @ts-expect-error - forwarding the real constructor's overloads
      super(...(args.length ? args : [FROZEN_NOW]));
    }
    static now() { return FROZEN_NOW; }
  }
  globalThis.Date = FrozenDate as DateConstructor;
});
afterAll(() => { globalThis.Date = RealDate; });

const ids = Object.keys(CALCS);

describe('input schemas', () => {
  it('covers every tool', () => {
    expect(toolDeclarations()).toHaveLength(ids.length);
  });

  it('is well-formed JSON Schema for every tool', () => {
    for (const id of ids) {
      const s = toolInputSchema(id);
      expect(s.type, id).toBe('object');
      expect(s.additionalProperties, id).toBe(false);
      expect(Object.keys(s.properties).length, `${id} has no properties`).toBeGreaterThan(0);
      for (const key of s.required) {
        expect(s.properties[key], `${id}: required "${key}" is not a property`).toBeDefined();
      }
      for (const [key, prop] of Object.entries(s.properties)) {
        expect(['number', 'string', 'boolean'], `${id}.${key}`).toContain(prop.type);
        expect(prop.description, `${id}.${key} needs a description`).toBeTruthy();
        if (prop.enum) expect(prop.enum.length, `${id}.${key} empty enum`).toBeGreaterThan(0);
      }
    }
  });

  it('names the base unit, since the model has no unit selector', () => {
    /* The UI converts lb to kg before compute() sees it. The model does not. */
    expect(toolInputSchema('bmi').properties.wt.description).toContain('kg');
    expect(toolInputSchema('bmi').properties.ht.description).toContain('cm');
    expect(toolInputSchema('egfr').properties.cr.description).toMatch(/mg\/dL/);
  });

  it('carries ranges through so the model can self-correct', () => {
    const ht = toolInputSchema('bmi').properties.ht;
    expect(ht.minimum).toBe(30);
    expect(ht.maximum).toBe(250);
  });

  it('spells out what each enum value means', () => {
    const sex = toolInputSchema('ibw').properties.sex;
    expect(sex.enum).toEqual(['m', 'f']);
    expect(sex.description).toContain('Male');
  });

  it('omits the calendar picker, which is a UI concern compute() never reads', () => {
    expect(toolInputSchema('edd').properties.cal).toBeUndefined();
    expect(toolInputSchema('anthro').properties.cal).toBeUndefined();
  });

  it('marks optional fields as not required', () => {
    const s = toolInputSchema('anthro');
    expect(s.properties.agem).toBeDefined();
    expect(s.required).not.toContain('agem');
  });

  it('asks for dates in an unambiguous format', () => {
    expect(toolInputSchema('edd').properties.d.description).toContain('YYYY-MM-DD');
  });
});

describe('staging schema', () => {
  it('offers every cancer type', () => {
    expect(toolInputSchema('tnm').properties.cancer.enum).toEqual(Object.keys(TNM));
  });

  it('narrows T/N/M to the chosen cancer, rather than a union of every code', () => {
    const breast = toolInputSchema('tnm', { cancer: 'breast' });
    expect(breast.properties.t.enum).toEqual(TNM.breast.T!.map(([c]) => c));
    const lung = toolInputSchema('tnm', { cancer: 'lung' });
    expect(lung.properties.t.enum).not.toEqual(breast.properties.t.enum);
  });

  it('uses pickers where the table has them', () => {
    const cx = toolInputSchema('tnm', { cancer: 'cervix' });
    for (const p of TNM.cervix.pickers!) expect(cx.properties[p.k]).toBeDefined();
  });

  it('includes the extra inputs some tables need', () => {
    expect(toolInputSchema('tnm', { cancer: 'prostate' }).properties.psa).toBeDefined();
    expect(toolInputSchema('tnm', { cancer: 'thyroid' }).properties.age).toBeDefined();
  });

  it('defaults the cervix preset tool to cervix, which is picker-driven', () => {
    const s = toolInputSchema('tnmcx');
    expect(s.properties.cancer.enum).toContain('cervix');
    expect(s.properties.t, 'cervix uses FIGO pickers, not T/N/M').toBeUndefined();
    for (const p of TNM.cervix.pickers!) expect(s.properties[p.k]).toBeDefined();
  });
});

describe('runTool agrees with calling compute() directly', () => {
  for (const id of ids.filter((i) => CALCS[i].compute)) {
    it(id, () => {
      /* Same deterministic matrix the golden snapshot uses. Where runTool
         accepts the input, the result must be exactly what compute() returns
, runTool adds validation, never arithmetic. Where it rejects, that is
         the validation doing its job on input compute() would have taken
         silently, so no equivalence is claimed. */
      let accepted = 0;
      /* Spread across the whole matrix rather than taking a prefix: gtpal's
         valid combinations are the seed cases at the end, so the first 25 are
         all legitimate cross-field rejections. */
      const all = casesFor(CALCS[id], id);
      const step = Math.max(1, Math.floor(all.length / 30));
      for (const c of all.filter((_: unknown, i: number) => i % step === 0)) {
        const run = runTool(id, { ...c.v });
        if (!run.ok) continue;
        accepted++;
        expect((run as any).result, `${id} ${c.label}`).toEqual(CALCS[id].compute!({ ...c.v }));
      }
      expect(accepted, `${id}: every case was rejected: validation is too strict`).toBeGreaterThan(0);
    });
  }
});

describe('runTool never throws', () => {
  it('reports an unknown tool', () => {
    const r = runTool('not-a-tool', {});
    expect(r.ok).toBe(false);
    expect((r as any).error).toContain('not-a-tool');
  });

  it('reports missing input as a structured error naming the field', () => {
    const r = runTool('bmi', {});
    expect(r.ok).toBe(false);
    expect((r as any).error).toMatch(/required/i);
  });

  it('reports an out-of-range value with the field key, so one input gets fixed', () => {
    const r = runTool('bmi', { wt: 70, ht: 900 });
    expect(r.ok).toBe(false);
    expect((r as any).field).toBe('ht');
    expect((r as any).error).toContain('between 30 and 250');
  });

  it('survives junk of the wrong type', () => {
    for (const junk of [{ wt: 'heavy', ht: null }, { wt: NaN, ht: undefined }, {}]) {
      expect(() => runTool('bmi', junk as any)).not.toThrow();
      expect(runTool('bmi', junk as any).ok).toBe(false);
    }
  });
});

describe('runTool: staging', () => {
  it('stages breast cancer', () => {
    const r = runTool('tnm', { cancer: 'breast', t: 'T2', n: 'N1', m: 'M0' });
    expect(r.ok).toBe(true);
    expect((r as any).result.badge).toContain('Stage IIB');
    expect((r as any).summary).toContain('Stage group');
  });

  it('lists the valid codes when given a bad one', () => {
    const r = runTool('tnm', { cancer: 'breast', t: 'T9', n: 'N0', m: 'M0' });
    expect(r.ok).toBe(false);
    expect((r as any).field).toBe('t');
    expect((r as any).error).toContain('Tis');
  });

  it('rejects a combination that is not a stage group', () => {
    const r = runTool('tnm', { cancer: 'breast', t: 'Tis', n: 'N1', m: 'M0' });
    expect(r.ok).toBe(false);
    expect((r as any).error).toContain('not a valid stage group');
  });

  it('requires the extras a table depends on', () => {
    /* Thyroid stage grouping is age-dependent; T1a is a real thyroid code. */
    const r = runTool('tnm', { cancer: 'thyroid', t: 'T1a', n: 'N0', m: 'M0' });
    expect(r.ok).toBe(false);
    expect((r as any).field).toBe('age');
  });

  it('handles picker-driven tables', () => {
    const d = TNM.cervix;
    const v: Record<string, string> = { cancer: 'cervix' };
    for (const p of d.pickers!) v[p.k] = p.opts[0][0];
    expect(runTool('tnm', v).ok).toBe(true);
  });
});

describe('summary is what the model reads back', () => {
  it('flattens the result into plain lines', () => {
    const r = runTool('bmi', { wt: 70, ht: 175 }) as any;
    expect(r.summary).toContain('BMI Calculator');
    expect(r.summary).toContain('22.9');
    expect(r.summary).toContain('Source:');
  });
});
