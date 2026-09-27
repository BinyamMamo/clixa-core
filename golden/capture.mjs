/* Captures the exact output of every calculator in the legacy single-file app,
   so the extracted core can be proven byte-identical afterwards.
   Run: node legacy/golden/capture.mjs */
process.env.TZ = 'UTC'; // must precede any Date use; see FROZEN_TZ in matrix.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { casesFor, tnmCasesFor, FROZEN_NOW } from './matrix.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(here, '../clinical-tools.html'), 'utf8');

/* runScripts executes the inline app script. External resources stay off, so
   the Telegram SDK never loads and the app takes its plain-browser path. */
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: undefined,
  url: 'https://tools.clixahealthcare.com/',
  pretendToBeVisual: true,
});

/* Freeze the clock inside the jsdom realm before any calculator runs. */
dom.window.eval(`
  (function () {
    var RealDate = Date;
    function FrozenDate() {
      if (arguments.length === 0) return new RealDate(${FROZEN_NOW});
      return new (Function.prototype.bind.apply(RealDate, [null].concat([].slice.call(arguments))))();
    }
    FrozenDate.prototype = RealDate.prototype;
    FrozenDate.now = function () { return ${FROZEN_NOW}; };
    FrozenDate.parse = RealDate.parse;
    FrozenDate.UTC = RealDate.UTC;
    globalThis.Date = FrozenDate;
  })();
`);

/* const/let at the top level of a classic script live in the global lexical
   environment, not on window — eval inside the realm is how we reach them. */
const { CALCS, TNM, STAGE_MEANING, TOOLS, DESC, R, fmt } = dom.window.eval(
  '({CALCS,TNM,STAGE_MEANING,TOOLS,DESC,R,fmt})',
);

const snapshot = { calcs: {}, tnm: {} };
let cases = 0, errors = 0;

for (const id of Object.keys(CALCS).sort()) {
  const calc = CALCS[id];
  if (calc.custom === 'tnm') continue;

  const rows = [];
  for (const c of casesFor(calc, id)) {
    let out;
    try {
      const res = calc.compute(c.v);
      out = {
        badge: res.badge,
        tone: res.tone,
        rows: res.rows,
        note: res.note ?? null,
        src: res.src ?? null,
      };
    } catch (e) {
      out = { error: e.message };
      errors++;
    }
    rows.push({ label: c.label, v: c.v, out });
    cases++;
  }
  snapshot.calcs[id] = { name: calc.name, cases: rows };
}

/* TNM: capture the raw stage-group decision, exhaustively. */
for (const key of Object.keys(TNM).sort()) {
  const d = TNM[key];
  const rows = [];
  for (const v of tnmCasesFor(d)) {
    let stage;
    try { stage = d.stage(v) ?? null; } catch (e) { stage = { error: e.message }; }
    rows.push({
      v,
      stage,
      meaning: typeof stage === 'string' ? STAGE_MEANING[stage] ?? null : null,
      tnmEq: typeof stage === 'string' && d.tnmEq ? d.tnmEq[stage] ?? null : null,
    });
    cases++;
  }
  snapshot.tnm[key] = { label: d.label, stages: d.stages, note: d.note, cases: rows };
}

/* Registry + descriptions travel with the snapshot so the port cannot quietly
   drop a tool from a department or reword a description. */
snapshot.registry = TOOLS;
snapshot.meta = Object.fromEntries(
  Object.keys(CALCS).sort().map((id) => [id, {
    name: CALCS[id].name,
    icon: CALCS[id].icon,
    desc: CALCS[id].desc,
    src: CALCS[id].src ?? null,
    about: DESC[id] ?? null,
    custom: CALCS[id].custom ?? null,
    preset: CALCS[id].preset ?? null,
    fields: (CALCS[id].fields || []).map((f) => ({ ...f })),
  }]),
);

writeFileSync(resolve(here, 'snapshot.json'), JSON.stringify(snapshot, null, 1));

const calcCount = Object.keys(snapshot.calcs).length;
const tnmCount = Object.keys(snapshot.tnm).length;
console.log(`captured ${cases} cases — ${calcCount} calculators, ${tnmCount} TNM tables (${errors} validation errors recorded)`);
