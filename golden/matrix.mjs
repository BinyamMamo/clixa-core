/* Deterministic input-matrix generation, shared by the legacy capture script
   and the core golden test so both drive the calculators identically. */

/* Four calculators (anthro, edd, ga, ovul) read the current date, so both the
   capture and the golden test must run against the same frozen instant or the
   snapshot silently rots overnight. TZ is pinned too — daysBetween() works on
   local-midnight dates, so the offset changes the answers. */
export const FROZEN_NOW = Date.UTC(2026, 8, 12, 9, 0, 0); // 2026-09-12T09:00:00Z
export const FROZEN_TZ = 'UTC';

/* Small LCG — we need the same "random" combinations on every run, in every
   process, forever. Math.random() would make the snapshot meaningless. */
export function lcg(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/* Dates are generated relative to the frozen clock, not hard-coded: the
   obstetric tools reject anything more than ~45 weeks from "today", so fixed
   calendar dates silently degrade to 100% error cases as the years pass. */
function isoOffset(days) {
  const d = new Date(FROZEN_NOW + days * 86400000);
  return d.toISOString().slice(0, 10);
}
const FIXED_DATES = [
  isoOffset(-280), isoOffset(-140), isoOffset(-56), isoOffset(-14), isoOffset(120),
];

/* Candidate values for one field, in base units (kg, cm, mg/dL). */
export function samplesFor(f) {
  if (f.t === 'chk') return [false, true];
  if (f.t === 'sel') return f.opts.map((o) => o[0]);
  if (f.t === 'date') return f.opt ? [...FIXED_DATES, null] : FIXED_DATES;

  const lo = f.min, hi = f.max;
  let vals;
  if (lo !== undefined && hi !== undefined) {
    const span = hi - lo;
    vals = [lo, lo + span * 0.05, lo + span * 0.25, lo + span * 0.5, lo + span * 0.75, hi]
      .map((x) => Math.round(x * 1000) / 1000);
    /* Counting fields (gravida, parity, GCS points) reject fractions outright,
       so fractional samples would only ever exercise the error path. */
    if (Number.isInteger(lo) && Number.isInteger(hi) && !hasFractionalStep(f)) {
      vals = [...new Set(vals.map(Math.round))];
    }
  } else {
    vals = [0.5, 1, 4.5, 12, 37, 140];
  }
  if (f.opt) vals.push(null);
  return vals;
}

function hasFractionalStep(f) {
  return f.step !== undefined && f.step !== 'any' && Number(f.step) % 1 !== 0;
}

/* Some tools have cross-field constraints that random sampling almost never
   satisfies (GTPAL requires term+preterm+abortions <= gravida). Without these
   the suite would only ever prove the error messages, never the arithmetic. */
const SEEDS = {
  gtpal: [
    { g: 1, t: 0, p: 0, a: 0, l: 0 },
    { g: 3, t: 2, p: 0, a: 0, l: 2 },
    { g: 5, t: 2, p: 1, a: 1, l: 3 },
    { g: 8, t: 3, p: 2, a: 3, l: 5 },
    { g: 25, t: 10, p: 10, a: 5, l: 20 },
  ],
};

/* Baseline = every field at a middle-ish value. Sweeps vary one field at a
   time off that baseline; random combos then probe interactions the sweeps
   cannot reach (branching on two fields at once, e.g. sex x age). */
export function casesFor(calc, id = '', seed = 12345) {
  const fields = (calc.fields || []).filter((f) => f.t !== 'head');
  if (!fields.length) return [];

  const samples = fields.map(samplesFor);
  const baseline = {};
  fields.forEach((f, i) => {
    const s = samples[i];
    baseline[f.k] = s[Math.min(3, s.length - 1)];
  });

  const cases = [{ label: 'baseline', v: { ...baseline } }];

  fields.forEach((f, i) => {
    samples[i].forEach((val, j) => {
      cases.push({ label: `sweep:${f.k}[${j}]`, v: { ...baseline, [f.k]: val } });
    });
  });

  for (const [i, v] of (SEEDS[id] || []).entries()) {
    cases.push({ label: `seed:${i}`, v: { ...v } });
  }

  const rnd = lcg(seed);
  for (let n = 0; n < 60; n++) {
    const v = {};
    fields.forEach((f, i) => {
      const s = samples[i];
      v[f.k] = s[Math.floor(rnd() * s.length)];
    });
    cases.push({ label: `combo:${n}`, v });
  }
  return cases;
}

/* TNM is enumerated exhaustively rather than sampled — the stage tables are
   the whole point, and the full cross product is only a few thousand rows. */
export function tnmCasesFor(d) {
  const out = [];
  if (d.pickers) {
    const keys = d.pickers.map((p) => p.k);
    const opts = d.pickers.map((p) => p.opts.map((o) => o[0]));
    const walk = (i, acc) => {
      if (i === keys.length) { out.push({ ...acc }); return; }
      for (const val of opts[i]) walk(i + 1, { ...acc, [keys[i]]: val });
    };
    walk(0, {});
    return out;
  }

  const extras = d.extra || [];
  const extraSamples = extras.map((ex) =>
    ex.type === 'num'
      ? [ex.min, Math.round((ex.min + ex.max) / 2), ex.max, 10, 20]
      : ex.opts.map((o) => (ex.int ? o[0] : o[0])),
  );

  for (const [t] of d.T) for (const [n] of d.N) for (const [m] of d.M) {
    if (!extras.length) { out.push({ t, n, m }); continue; }
    const walk = (i, acc) => {
      if (i === extras.length) { out.push({ ...acc }); return; }
      for (const val of extraSamples[i]) {
        walk(i + 1, { ...acc, [extras[i].k]: extras[i].int ? parseInt(val) : val });
      }
    };
    walk(0, { t, n, m });
  }
  return out;
}
