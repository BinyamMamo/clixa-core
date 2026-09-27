/* Proves the extracted core is byte-identical to the legacy single-file app.
   snapshot.json was captured by golden/capture.mjs running the ORIGINAL
   file in jsdom. Any difference here is a port bug, never an improvement, 
   if a calculator should change, change it in a separate commit with the
   snapshot re-captured deliberately. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CALCS, TNM, STAGE_MEANING, TOOLS } from '../src/index';
import { casesFor, tnmCasesFor, FROZEN_NOW } from '../golden/matrix.mjs';

/* anthro, edd, ga and ovul read the clock, so the snapshot would rot
   overnight unless both sides run at the same instant. The capture freezes
   Date the same way inside its jsdom realm; TZ is pinned in vitest.config.ts
   because daysBetween() operates on local-midnight dates. */
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

const snapshot = JSON.parse(
  readFileSync(resolve(__dirname, '../golden/snapshot.json'), 'utf8'),
);

describe('calculator outputs match the legacy app exactly', () => {
  for (const id of Object.keys(snapshot.calcs)) {
    it(`${id}: ${snapshot.calcs[id].name}`, () => {
      const calc = CALCS[id];
      expect(calc, `tool "${id}" is missing from the port`).toBeDefined();

      const expected = snapshot.calcs[id].cases;
      const actual = casesFor(calc, id).map((c: any) => {
        let out;
        try {
          const res = calc.compute!(c.v);
          out = {
            badge: res.badge, tone: res.tone, rows: res.rows,
            note: res.note ?? null, src: res.src ?? null,
          };
        } catch (e: any) {
          out = { error: e.message };
        }
        return { label: c.label, v: c.v, out };
      });

      expect(actual).toHaveLength(expected.length);
      /* Compare case by case so a failure names the exact inputs. */
      for (let i = 0; i < expected.length; i++) {
        expect(actual[i], `${id} case ${expected[i].label} inputs=${JSON.stringify(expected[i].v)}`)
          .toEqual(expected[i]);
      }
    });
  }
});

describe('TNM stage groups match the legacy tables exactly', () => {
  for (const key of Object.keys(snapshot.tnm)) {
    it(`${key}: ${snapshot.tnm[key].label}`, () => {
      const d = TNM[key];
      expect(d, `cancer table "${key}" is missing`).toBeDefined();
      expect(d.label).toBe(snapshot.tnm[key].label);
      expect(d.stages).toEqual(snapshot.tnm[key].stages);
      expect(d.note).toBe(snapshot.tnm[key].note);

      const expected = snapshot.tnm[key].cases;
      const cases = tnmCasesFor(d);
      expect(cases).toHaveLength(expected.length);

      for (let i = 0; i < expected.length; i++) {
        const v = expected[i].v;
        let stage: any;
        try { stage = d.stage(v) ?? null; } catch (e: any) { stage = { error: e.message }; }
        expect(stage, `${key} ${JSON.stringify(v)}`).toEqual(expected[i].stage);
        if (typeof stage === 'string') {
          expect(STAGE_MEANING[stage] ?? null).toEqual(expected[i].meaning);
          expect(d.tnmEq ? d.tnmEq[stage] ?? null : null).toEqual(expected[i].tnmEq);
        }
      }
    });
  }
});

describe('registry and metadata survived the move', () => {
  it('every department lists the same tools', () => {
    expect(TOOLS).toEqual(snapshot.registry);
  });

  it('every registered tool id resolves to a calculator', () => {
    for (const mode of ['pro', 'user'] as const) {
      for (const cat of Object.keys(TOOLS[mode])) {
        for (const id of TOOLS[mode][cat]) {
          expect(CALCS[id], `${mode}/${cat} references unknown tool "${id}"`).toBeDefined();
        }
      }
    }
  });

  it('names, icons, sources and long descriptions are unchanged', () => {
    for (const id of Object.keys(snapshot.meta)) {
      const m = snapshot.meta[id];
      expect(CALCS[id].name, `${id} name`).toBe(m.name);
      expect(CALCS[id].icon, `${id} icon`).toBe(m.icon);
      expect(CALCS[id].src ?? null, `${id} src`).toBe(m.src);
      /* `about` is the long paragraph the legacy app wrote over `desc`.
         The legacy data double-escaped three characters, so pages showed a
         literal "\\u201cT\\u201d" and "PaO\\u2082". Those are fixed in the port;
         everything else must match byte for byte. */
      const legacyAbout = m.about && m.about
        .replace(/\\u201c/g, '“').replace(/\\u201d/g, '”').replace(/\\u2082/g, '₂');
      expect(CALCS[id].about ?? null, `${id} about`).toBe(legacyAbout);
    }
  });

  it('short descriptions were revived, not left equal to the long ones', () => {
    /* The legacy app clobbered every short desc at load. Compact list rows
       need a one-liner, so the port keeps them separate. */
    const ids = Object.keys(CALCS).filter((id) => CALCS[id].about);
    const shortened = ids.filter((id) => CALCS[id].desc !== CALCS[id].about);
    expect(shortened.length).toBeGreaterThan(ids.length * 0.9);
    for (const id of ids) expect(CALCS[id].desc, `${id} desc`).toBeTruthy();
  });
});
