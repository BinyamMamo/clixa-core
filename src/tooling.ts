/* Function-calling surface for the 63 calculators.
   The chat declares three functions to the model rather than 63 tool schemas
   (which would cost ~20k tokens on every message): find_tool, get_tool_inputs
   and run_tool. This module supplies the schema and the executor for them. */

import { CALCS } from './index';
import { TNM, STAGE_MEANING, stageTone } from './tnm';
import { ValidationError } from './validate';
import type { CalcResult, Field } from './types';

export interface JsonSchemaProp {
  type: 'number' | 'string' | 'boolean';
  description: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
}

export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, JsonSchemaProp>;
  required: string[];
  /* Gemini honours this and it keeps the model from inventing keys. */
  additionalProperties: false;
}

export interface ToolDeclaration {
  id: string;
  name: string;
  description: string;
  parameters: ToolInputSchema;
}

/** Narrows a schema where one field's value determines the others (TNM). */
export interface SchemaContext { cancer?: string }

/* ── Field -> JSON Schema ─────────────────────────────────────────────── */

/**
 * compute() always works in base units, kg, cm, mg/dL, because the UI
 * converts before calling it. The model has no UI, so every unit-bearing
 * field must say so in its description or it will happily pass pounds.
 */
function describeNum(f: any): string {
  const parts = [f.label];
  const unit = f.units ? f.units[0] : f.unit;
  if (unit) parts.push(`in ${unit}`);
  if (f.min !== undefined && f.max !== undefined) parts.push(`(${f.min}–${f.max})`);
  if (f.hint) parts.push(`(${f.hint})`);
  return parts.join(' ');
}

function propFor(f: Field): JsonSchemaProp | null {
  switch (f.t) {
    case 'head':
      return null;
    case 'num':
      return {
        type: 'number',
        description: describeNum(f),
        ...(f.min !== undefined ? { minimum: f.min } : {}),
        ...(f.max !== undefined ? { maximum: f.max } : {}),
      };
    case 'sel':
      return {
        type: 'string',
        description: `${f.label}. ${f.opts.map(([v, l]) => `"${v}" = ${l}`).join('; ')}`,
        enum: f.opts.map(([v]) => v),
      };
    case 'date':
      return { type: 'string', description: `${f.label}, as YYYY-MM-DD (Gregorian)` };
    case 'chk':
      return { type: 'boolean', description: f.label };
  }
}

/** Fields the model should fill. Excludes headings and the UI-only calendar
    picker, which drives which date widget renders and is never read by
    compute(). */
function modelFields(calc: { fields?: Field[] }): Field[] {
  return (calc.fields || []).filter((f) => f.t !== 'head' && f.k !== 'cal');
}

/* ── TNM ──────────────────────────────────────────────────────────────── */

const CANCERS = Object.keys(TNM);

function tnmSchema(ctx?: SchemaContext): ToolInputSchema {
  const properties: Record<string, JsonSchemaProp> = {
    cancer: {
      type: 'string',
      description: 'Cancer type. ' + CANCERS.map((k) => `"${k}" = ${TNM[k].label}`).join('; '),
      enum: CANCERS,
    },
  };
  const required = ['cancer'];

  const d = ctx?.cancer ? TNM[ctx.cancer] : undefined;
  if (!d) {
    /* Without a cancer chosen the category codes differ per table, so ask for
       a second look rather than inventing a union of every code. */
    properties.t = { type: 'string', description: 'T category, e.g. "T2". Call get_tool_inputs again with the cancer set to see the valid codes.' };
    properties.n = { type: 'string', description: 'N category, e.g. "N1".' };
    properties.m = { type: 'string', description: 'M category, "M0" or "M1".' };
    return { type: 'object', properties, required, additionalProperties: false };
  }

  if (d.pickers) {
    for (const p of d.pickers) {
      properties[p.k] = {
        type: 'string',
        description: `${p.label}. ${p.opts.map(([v, l]) => `"${v}" = ${l}`).join('; ')}`,
        enum: p.opts.map(([v]) => v),
      };
      required.push(p.k);
    }
    return { type: 'object', properties, required, additionalProperties: false };
  }

  const cat = (key: 'T' | 'N' | 'M', label: string) => ({
    type: 'string' as const,
    description: `${label}. ${d[key]!.map(([v, l]) => `"${v}" = ${l}`).join('; ')}`,
    enum: d[key]!.map(([v]) => v),
  });
  properties.t = cat('T', 'Primary tumour');
  properties.n = cat('N', 'Regional nodes');
  properties.m = cat('M', 'Distant metastasis');
  required.push('t', 'n', 'm');

  for (const ex of d.extra || []) {
    properties[ex.k] = ex.type === 'num'
      ? { type: 'number', description: `${ex.label} (${ex.min}–${ex.max})`, minimum: ex.min, maximum: ex.max }
      : { type: 'string', description: `${ex.label}. ${ex.opts!.map(([v, l]) => `"${v}" = ${l}`).join('; ')}`, enum: ex.opts!.map(([v]) => v) };
    required.push(ex.k);
  }
  return { type: 'object', properties, required, additionalProperties: false };
}

/* ── Validation ───────────────────────────────────────────────────────── */

/*
 * Every input check lived in the UI's Form.read(). compute() itself assumes
 * it is handed clean, in-range, base-unit values, so a caller with no UI
 * (this one) got silent nonsense rather than an error:
 *
 *   runTool('bmi', {})              -> "BMI NaN - Obesity class III"
 *   runTool('bmi', {wt:70, ht:900}) -> "BMI 0.9 - Severe thinness"
 *   runTool('ibw', {sex:'banana'})  -> quietly computed as female
 *
 * A model would report any of those to a user as a finding. So the same rules
 * run here, in declared field order, with wording identical to the UI's.
 */
function validateInputs(calc: { fields?: Field[] }, v: Record<string, any>): void {
  for (const f of modelFields(calc)) {
    const raw = v[f.k!];
    const missing = raw === undefined || raw === null || raw === '';

    if ((f as any).opt && missing) continue;
    if (missing) throw new ValidationError(`${f.label} is required.`, f.k);

    if (f.t === 'num') {
      const n = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isFinite(n)) throw new ValidationError(`${f.label} is required.`, f.k);
      if (f.min !== undefined && f.max !== undefined && (n < f.min || n > f.max)) {
        throw new ValidationError(`${f.label} must be between ${f.min} and ${f.max}.`, f.k);
      }
      v[f.k!] = n;
    } else if (f.t === 'sel') {
      const allowed = f.opts.map(([o]) => o);
      if (!allowed.includes(String(raw))) {
        throw new ValidationError(
          `${f.label}: "${raw}" is not valid. Choose one of: ${allowed.join(', ')}.`, f.k);
      }
      v[f.k!] = String(raw);
    } else if (f.t === 'date') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(raw))) {
        throw new ValidationError(`${f.label} must be a date as YYYY-MM-DD.`, f.k);
      }
    } else if (f.t === 'chk') {
      v[f.k!] = raw === true || raw === 'true';
    }
  }
}

/* ── Public API ───────────────────────────────────────────────────────── */

/** JSON Schema for one tool's inputs. */
export function toolInputSchema(id: string, ctx?: SchemaContext): ToolInputSchema {
  const calc = CALCS[id];
  if (!calc) throw new Error(`Unknown tool "${id}".`);
  if (calc.custom === 'tnm') return tnmSchema({ cancer: ctx?.cancer ?? calc.preset });

  const properties: Record<string, JsonSchemaProp> = {};
  const required: string[] = [];
  for (const f of modelFields(calc)) {
    const prop = propFor(f);
    if (!prop) continue;
    properties[f.k!] = prop;
    if (!(f as any).opt) required.push(f.k!);
  }
  return { type: 'object', properties, required, additionalProperties: false };
}

/** Declarations for every tool, or a chosen subset. */
export function toolDeclarations(ids: string[] = Object.keys(CALCS)): ToolDeclaration[] {
  return ids.filter((id) => CALCS[id]).map((id) => ({
    id,
    name: CALCS[id].name,
    description: CALCS[id].about || CALCS[id].desc,
    parameters: toolInputSchema(id),
  }));
}

export interface ToolRunOk {
  ok: true;
  tool: string;
  result: CalcResult;
  /** Flattened for a model that just needs to read the answer back. */
  summary: string;
}
export interface ToolRunError {
  ok: false;
  tool: string;
  error: string;
  /** Which input was at fault, when known, so the model can fix just that one. */
  field?: string;
}
export type ToolRun = ToolRunOk | ToolRunError;

function summarise(calc: { name: string }, r: CalcResult): string {
  return [
    `${calc.name}: ${r.badge}`,
    ...r.rows.map(([k, v]) => `${k}: ${v}`),
    r.note ? `Note: ${r.note}` : null,
    r.src ? `Source: ${r.src}` : null,
  ].filter(Boolean).join('\n');
}

/**
 * Run a tool by id. Never throws, a bad input comes back as a structured
 * error the model can act on, because an exception across a function-call
 * boundary is just a dead turn.
 */
export function runTool(id: string, inputs: Record<string, any>): ToolRun {
  const calc = CALCS[id];
  if (!calc) return { ok: false, tool: id, error: `Unknown tool "${id}".` };

  try {
    if (calc.custom === 'tnm') return runStaging(id, calc, inputs);
    /* Copy: validation coerces in place ("70" -> 70) and a caller's object is
       not ours to mutate. */
    const v = { ...inputs };
    validateInputs(calc, v);
    const result = calc.compute!(v);
    return { ok: true, tool: id, result, summary: summarise(calc, result) };
  } catch (e) {
    const err = e as ValidationError;
    return { ok: false, tool: id, error: err.message, ...(err.key ? { field: err.key } : {}) };
  }
}

function runStaging(id: string, calc: any, v: Record<string, any>): ToolRun {
  const key = v.cancer ?? calc.preset ?? 'breast';
  const d = TNM[key];
  if (!d) return { ok: false, tool: id, error: `Unknown cancer type "${key}".`, field: 'cancer' };

  const rows: [string, string][] = [];
  if (d.pickers) {
    for (const p of d.pickers) {
      const opt = p.opts.find(([o]) => o === v[p.k]);
      if (!opt) {
        return { ok: false, tool: id, field: p.k,
          error: `${p.label}: "${v[p.k]}" is not valid. Choose one of: ${p.opts.map(([o]) => o).join(', ')}.` };
      }
      rows.push([p.label, opt[1]]);
    }
  } else {
    for (const [field, table, label] of [['t', d.T!, 'T'], ['n', d.N!, 'N'], ['m', d.M!, 'M']] as const) {
      if (!table.some(([code]) => code === v[field])) {
        return { ok: false, tool: id, field,
          error: `${label}: "${v[field]}" is not valid for ${d.label}. Choose one of: ${table.map(([c]) => c).join(', ')}.` };
      }
      rows.push([label, v[field]]);
    }
    for (const ex of d.extra || []) {
      if (v[ex.k] === undefined || v[ex.k] === null) {
        return { ok: false, tool: id, error: `${ex.label} is required for ${d.label}.`, field: ex.k };
      }
      rows.push([ex.label, String(v[ex.k])]);
    }
  }

  const stage = d.stage(v);
  if (!stage) {
    return { ok: false, tool: id,
      error: 'That combination is not a valid stage group. Re-check the category assignment (for example, in-situ disease cannot have nodal metastasis).' };
  }

  const disp = stage === 'Occ' ? 'Occult' : `Stage ${stage}`;
  if (d.tnmEq?.[stage]) rows.push(['TNM equivalent', d.tnmEq[stage]]);
  const result: CalcResult = {
    badge: `${d.label.split(' (')[0].split(' — ')[0]} · ${disp}`,
    tone: stageTone(stage),
    rows: [...rows, ['Stage group', disp], ['What this stage reflects', STAGE_MEANING[stage] || 'Not described']],
    note: `${d.note} Staging output is decision support only. Final staging integrates pathology, biomarkers and multidisciplinary review.`,
    src: calc.src,
  };
  return { ok: true, tool: id, result, summary: summarise(calc, result) };
}
