/* Public API of the calculation core.
   Nothing here touches the DOM, the extension, the PWA and any future mobile
   shell all import this same module. */
import type { Calculator } from './types';
import { ABOUT } from './descriptions';
import { general } from './calcs/general';
import { surgery } from './calcs/surgery';
import { oncology } from './calcs/oncology';
import { obstetrics } from './calcs/obstetrics';
import { cardiology } from './calcs/cardiology';
import { pediatrics } from './calcs/pediatrics';
import { emergency } from './calcs/emergency';
import { endocrine } from './calcs/endocrine';
import { nutrition } from './calcs/nutrition';
import { SYNONYMS } from './synonyms';

/* Tools with a bespoke UI rather than the generic field renderer. */
const staging: Record<string, Calculator> = {
  tnm: {name:'TNM Cancer Staging',icon:'target',desc:'AJCC 8th / FIGO stage grouping for 14 cancer types.',src:'AJCC Cancer Staging Manual, 8th ed.; FIGO 2018 (cervix)',custom:'tnm'},
  tnmcx: {name:'Cervical Cancer Staging',icon:'flower',desc:'FIGO 2018 cervical cancer staging with TNM equivalents.',src:'FIGO 2018; AJCC 8th ed.',custom:'tnm',preset:'cervix'},
};

export const CALCS: Record<string, Calculator> = {
  ...general, ...surgery, ...oncology, ...obstetrics, ...cardiology,
  ...pediatrics, ...emergency, ...endocrine, ...nutrition, ...staging,
};

/* The legacy app overwrote each calculator's short `desc` with the long
   paragraph, so compact list rows had nowhere to get a one-liner. Keep them
   separate: `desc` stays short, `about` carries the paragraph. */
for (const id of Object.keys(CALCS)) {
  if (ABOUT[id]) CALCS[id].about = ABOUT[id];
  if (SYNONYMS[id]) CALCS[id].synonyms = SYNONYMS[id];
}

export const TOOL_IDS = Object.keys(CALCS);

export * from './types';
export * from './format';
export * from './units';
export * from './ethiopian';
export * from './validate';
export * from './result';
export * from './fields';
export * from './registry';
export * from './search';
export * from './tooling';
export { TNM, STAGE_MEANING, stageTone } from './tnm';
export type { CancerTable, TnmExtra, TnmPicker } from './tnm';
export { ABOUT } from './descriptions';
