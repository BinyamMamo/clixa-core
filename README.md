# clixa-core

The clinical calculation engine behind Clixa Tools and Hakim Click. 63
calculators, medical scores and AJCC/FIGO cancer staging, with WHO growth
standards and the Ethiopian calendar.

Pure TypeScript. No DOM, no network, no dependencies. It computes and it
validates; drawing the form is the caller's job.

```bash
pnpm add clixa-core
```

## Two ways in

Most callers want `runTool`. It validates, coerces types, converts nothing
(inputs must already be in base units), and never throws.

```ts
import { runTool } from 'clixa-core';

const run = runTool('egfr', { sex: 'm', age: 54, cr: 1.4 });

if (run.ok) {
  run.result.badge;   // 'eGFR 60 · G3a'
  run.result.tone;    // 'warn'
  run.result.rows;    // [['eGFR', '60 mL/min/1.73 m²'], ['CKD stage', 'G3a — mild–moderately decreased']]
  run.summary;        // the whole thing as one string, for a model
} else {
  run.error;          // 'Serum creatinine must be between 0.1 and 25.'
  run.field;          // 'cr'
}
```

Bad input is an ordinary result, not an exception:

```ts
runTool('bmi', {});                 // { ok: false, error: 'Weight is required.', field: 'wt' }
runTool('bmi', { wt: 70, ht: 900 }) // { ok: false, error: 'Height must be between 30 and 250.' }
```

That matters more than it looks. Before validation existed, the second call
returned `BMI 0.9 — Severe thinness`, which is a wrong answer rather than an
error, and a model has no way to tell the difference.

## Units

`compute` only ever sees **base units**: kg, cm, mg/dL, mmHg. A field that
accepts more than one unit declares them, and the first is the base:

```ts
{ t: 'num', k: 'cr', label: 'Serum creatinine', units: ['mg/dL', 'µmol/L'] }
```

Converting is the UI's job. Use `toBase` before calling, `fromBase` to display:

```ts
import { toBase, fromBase } from 'clixa-core';

toBase(88, 'µmol/L');   // 0.995 mg/dL
fromBase(1.4, 'µmol/L') // 123.8
```

## Building a form

Every calculator carries its inputs as data, so a form is a `.map()`.

```ts
import { CALCS } from 'clixa-core';

const calc = CALCS.egfr;

calc.name;    // 'eGFR (CKD-EPI 2021)'
calc.desc;    // one line
calc.about;   // a paragraph, when there is one
calc.src;     // citation
calc.fields;
// [ { t: 'sel',  k: 'sex', label: 'Sex', opts: [['m','Male'],['f','Female']] },
//   { t: 'num',  k: 'age', label: 'Age', min: 18, max: 110, unit: 'yr' },
//   { t: 'num',  k: 'cr',  label: 'Serum creatinine', units: ['mg/dL','µmol/L'], min: 0.1, max: 25, step: 0.01 } ]
```

Field kinds:

| `t` | what it is | extra keys |
| --- | --- | --- |
| `num` | a number | `min`, `max`, `step`, `unit` or `units`, `hint` |
| `sel` | one of a list | `opts`, an array of `[value, label]` |
| `date` | a calendar date | `hint` |
| `chk` | a checkbox | `pts`, its weight when the calculator is a score |
| `head` | a section heading, not an input | has no `k` |

`opt: 1` marks a field optional. `full: 1` is a layout hint meaning the field
wants a full row.

```tsx
{calc.fields.map((f) =>
  f.t === 'head' ? <h3 key={f.label}>{f.label}</h3>
  : f.t === 'sel' ? <Select key={f.k} label={f.label} options={f.opts} />
  : f.t === 'chk' ? <Checkbox key={f.k} label={f.label} />
  : <NumberInput key={f.k} label={f.label} min={f.min} max={f.max} />
)}
```

## Giving the calculators to a model

`toolDeclarations()` returns all 63 as provider-neutral JSON Schema. Map it to
whichever shape your provider wants.

```ts
import { toolDeclarations, toolInputSchema, runTool } from 'clixa-core';

toolDeclarations();
// [ { id: 'egfr',
//     name: 'eGFR (CKD-EPI 2021)',
//     description: 'Race-free CKD-EPI creatinine eGFR with CKD G-stage.',
//     parameters: {
//       type: 'object',
//       properties: {
//         sex: { type: 'string', description: 'Sex. "m" = Male; "f" = Female', enum: ['m','f'] },
//         age: { type: 'number', description: 'Age in yr (18–110)', minimum: 18, maximum: 110 },
//         cr:  { type: 'number', description: 'Serum creatinine in mg/dL (0.1–25)', minimum: 0.1, maximum: 25 },
//       },
//       required: ['sex','age','cr'],
//       additionalProperties: false } } ]
```

Units are written into the description on purpose. The model has no form in
front of it, so if the schema does not say `mg/dL` it will cheerfully pass
µmol/L.

**Declare three tools, not sixty-three.** All 63 schemas is roughly 20k tokens
in front of every message. Give the model a way to look them up instead:

```ts
const tools = [
  { name: 'find_tool',       /* query: string */ },
  { name: 'get_tool_inputs', /* tool_id: string */ },
  { name: 'run_tool',        /* tool_id: string, inputs: object */ },
];

function call(name, args) {
  switch (name) {
    case 'find_tool':
      return searchTools(args.query, CALCS, undefined, 8)
        .map((h) => ({ tool_id: h.id, name: h.calc.name, description: h.calc.desc }));
    case 'get_tool_inputs':
      return { tool_id: args.tool_id, schema: toolInputSchema(args.tool_id) };
    case 'run_tool': {
      const run = runTool(args.tool_id, args.inputs ?? {});
      return run.ok
        ? { ok: true, result: run.summary, tone: run.result.tone }
        : { ok: false, error: run.error, field: run.field };
    }
  }
}
```

## Searching

```ts
import { searchTools, CALCS } from 'clixa-core';

searchTools('kidney', CALCS, undefined, 3);  // [{ id: 'fena' }, { id: 'egfr' }, { id: 'crcl' }]
```

Ranked id, then name prefix, then word start, then synonym, then description,
then category. Synonyms carry lay terms, so `sugar` finds the diabetes tools.

## Restricting who sees what

Calculators are grouped by department, and by audience. A `user` audience
cannot reach chemotherapy dosing.

```ts
import { TOOLS } from 'clixa-core';

TOOLS.pro;    // { 'General Medicine': ['ag','bmi','bmr',...], Oncology: [...], ... }
TOOLS.user;   // the safe subset
```

Pass the registry as `searchTools`' third argument to rank within it, and gate
`runTool` on the same set if you are exposing this to patients.

## Two things that will catch you

**`compute` is a method and uses `this`.** Do not pull it off the object.

```ts
const { compute } = CALCS.egfr;   // wrong, loses this.src
CALCS.egfr.compute(v);            // fine
runTool('egfr', v);               // better, validates first
```

**`rows` values are formatted strings, not numbers.** `'60 mL/min/1.73 m²'`,
not `60`. If you need the number, ask for a numeric channel to be added here
rather than parsing the string downstream.

## Tests

```bash
pnpm test
```

181 tests. Most of the weight is a golden snapshot of **4,717 cases across 61
calculators**, captured from the original single-file app and re-run against
this engine on every change.

A difference in the golden suite is a port bug, not an improvement. If a
calculator genuinely should change, change it in its own commit and re-capture
the snapshot deliberately:

```bash
pnpm golden:capture
```

`TZ` is pinned to UTC because several obstetric calculators work on
local-midnight dates. `edd`, `ga`, `ovul` and `anthro` read the clock, so
tests freeze `Date`.

## Releasing

```bash
pnpm build          # bundles to dist/ and emits types
pnpm test
npm version patch   # or minor, or major
npm publish
```

`prepublishOnly` runs the build and the tests, so a broken engine cannot be
published by accident.

The output is bundled rather than transpiled file by file. The source uses
extensionless relative imports, which bundlers accept and Node's own ESM
resolver does not; bundling removes the question and inlines the WHO growth
tables at the same time.
