/* General Medicine — calculator definitions.
   Bodies ported verbatim from the legacy single-file app; the golden
   snapshot in test/ proves they are byte-identical. */
import type { Calculator } from '../types';
import { fmt } from '../format';
import { IN, KG } from '../units';
import { err } from '../validate';
import { R } from '../result';
import { F, SEX } from '../fields';

export const general: Record<string, Calculator> = {
bmi:{name:'BMI Calculator',icon:'weight',desc:'Body mass index with WHO clinical categories.',src:'WHO classification of adult BMI',
 fields:[F.num('wt','Weight',{units:['kg','lb'],min:.5,max:400}),F.num('ht','Height',{units:['cm','in'],min:30,max:250})],
 compute(v){const b=v.wt/((v.ht/100)**2);
  const c=b<16?['Severe thinness','bad']:b<17?['Moderate thinness','warn']:b<18.5?['Mild thinness','warn']:b<25?['Normal weight','ok']:b<30?['Overweight','warn']:b<35?['Obesity class I','warn']:b<40?['Obesity class II','bad']:['Obesity class III','bad'];
  return R('BMI '+fmt(b)+' — '+c[0],c[1],[['BMI',fmt(b)+' kg/m²'],['WHO category',c[0]],['Healthy range for this height',fmt(18.5*(v.ht/100)**2)+'–'+fmt(24.9*(v.ht/100)**2)+' kg']],null,this.src)}},

ibw:{name:'Ideal Body Weight',icon:'crosshair',desc:'Devine formula ideal body weight.',src:'Devine BJ, 1974',
 fields:[F.sel('sex','Sex',SEX),F.num('ht','Height',{units:['cm','in'],min:120,max:230})],
 compute(v){const inch=v.ht/IN;const ibw=(v.sex==='m'?50:45.5)+2.3*(inch-60);
  if(inch<60)return R('IBW '+fmt(Math.max(ibw,0))+' kg (extrapolated)','warn',[['Ideal body weight',fmt(ibw)+' kg ('+fmt(ibw/KG)+' lb)']],'Devine is validated for height ≥152 cm (60 in); below that the value is an extrapolation.',this.src);
  return R('IBW '+fmt(ibw)+' kg','info',[['Ideal body weight',fmt(ibw)+' kg ('+fmt(ibw/KG)+' lb)'],['Height',fmt(inch)+' in']],null,this.src)}},

bsa:{name:'Body Surface Area',icon:'ruler',desc:'Mosteller body surface area.',src:'Mosteller RD, NEJM 1987',
 fields:[F.num('wt','Weight',{units:['kg','lb'],min:.5,max:400}),F.num('ht','Height',{units:['cm','in'],min:30,max:250})],
 compute(v){const bsa=Math.sqrt(v.ht*v.wt/3600);
  return R('BSA '+fmt(bsa,2)+' m²','info',[['Body surface area',fmt(bsa,2)+' m²'],['Formula','√(height cm × weight kg ⁄ 3600)']],null,this.src)}},

bmr:{name:'Basal Metabolic Rate',icon:'flame',desc:'Mifflin–St Jeor resting energy requirement.',src:'Mifflin MD et al., Am J Clin Nutr 1990',
 fields:[F.sel('sex','Sex',SEX),F.num('age','Age',{min:18,max:100,unit:'yr'}),F.num('wt','Weight',{units:['kg','lb'],min:20,max:400}),F.num('ht','Height',{units:['cm','in'],min:100,max:250})],
 compute(v){const b=10*v.wt+6.25*v.ht-5*v.age+(v.sex==='m'?5:-161);
  return R('BMR '+Math.round(b)+' kcal/day','info',[['Basal metabolic rate',Math.round(b)+' kcal/day'],['Per hour',fmt(b/24)+' kcal']],null,this.src)}},

tdee:{name:'Daily Calorie Needs (TDEE)',icon:'zap',desc:'Total daily energy expenditure from BMR × activity.',src:'Mifflin–St Jeor × standard activity factors',
 fields:[F.sel('sex','Sex',SEX),F.num('age','Age',{min:18,max:100,unit:'yr'}),F.num('wt','Weight',{units:['kg','lb'],min:20,max:400}),F.num('ht','Height',{units:['cm','in'],min:100,max:250}),
  F.sel('act','Activity level',[['1.2','Sedentary (little exercise)'],['1.375','Light (1–3 d/wk)'],['1.55','Moderate (3–5 d/wk)'],['1.725','Very active (6–7 d/wk)'],['1.9','Extremely active / physical job']],{full:1})],
 compute(v){const b=10*v.wt+6.25*v.ht-5*v.age+(v.sex==='m'?5:-161);const t=b*parseFloat(v.act);
  return R('TDEE ≈ '+Math.round(t)+' kcal/day','info',[['BMR',Math.round(b)+' kcal'],['Activity factor','×'+v.act],['Maintenance calories',Math.round(t)+' kcal/day'],['Mild deficit (−500)',Math.round(t-500)+' kcal/day']],null,this.src)}},

crcl:{name:'Creatinine Clearance',icon:'gauge',desc:'Cockcroft–Gault estimated creatinine clearance.',src:'Cockcroft DW & Gault MH, Nephron 1976',
 fields:[F.sel('sex','Sex',SEX),F.num('age','Age',{min:18,max:110,unit:'yr'}),F.num('wt','Weight',{units:['kg','lb'],min:20,max:300}),F.num('cr','Serum creatinine',{units:['mg/dL','µmol/L'],min:0.1,max:25,step:.01})],
 compute(v){const c=((140-v.age)*v.wt)/(72*v.cr)*(v.sex==='f'?0.85:1);
  const tone=c>=90?'ok':c>=60?'info':c>=30?'warn':'bad';
  return R('CrCl '+fmt(c)+' mL/min',tone,[['Creatinine clearance',fmt(c)+' mL/min'],['Creatinine used',fmt(v.cr,2)+' mg/dL']],'Uses actual body weight; consider adjusted weight in obesity for renal drug dosing.',this.src)}},

egfr:{name:'eGFR (CKD-EPI 2021)',icon:'filter',desc:'Race-free CKD-EPI creatinine eGFR with CKD G-stage.',src:'CKD-EPI 2021 (Inker LA et al., NEJM 2021); KDIGO stages',
 fields:[F.sel('sex','Sex',SEX),F.num('age','Age',{min:18,max:110,unit:'yr'}),F.num('cr','Serum creatinine',{units:['mg/dL','µmol/L'],min:0.1,max:25,step:.01})],
 compute(v){const k=v.sex==='f'?0.7:0.9,a=v.sex==='f'?-0.241:-0.302;
  const g=142*Math.min(v.cr/k,1)**a*Math.max(v.cr/k,1)**-1.200*0.9938**v.age*(v.sex==='f'?1.012:1);
  const s=g>=90?['G1 — normal or high','ok']:g>=60?['G2 — mildly decreased','ok']:g>=45?['G3a — mild–moderately decreased','warn']:g>=30?['G3b — moderate–severely decreased','warn']:g>=15?['G4 — severely decreased','bad']:['G5 — kidney failure','bad'];
  return R('eGFR '+Math.round(g)+' · '+s[0].split(' — ')[0],s[1],[['eGFR',Math.round(g)+' mL/min/1.73 m²'],['CKD stage',s[0]]],'G1–G2 only indicate CKD when other markers of kidney damage are present.',this.src)}},

ag:{name:'Anion Gap',icon:'flask',desc:'Serum anion gap for metabolic acidosis work-up.',src:'AG = Na − (Cl + HCO₃); reference 8–12 mEq/L',
 fields:[F.num('na','Sodium',{min:100,max:180,unit:'mEq/L'}),F.num('cl','Chloride',{min:60,max:140,unit:'mEq/L'}),F.num('hco','Bicarbonate',{min:2,max:50,unit:'mEq/L'}),F.num('alb','Albumin (optional)',{min:0.5,max:6,step:.1,unit:'g/dL',opt:1})],
 compute(v){const gap=v.na-(v.cl+v.hco);const rows=[['Anion gap',fmt(gap)+' mEq/L']];let note='Reference range ≈ 8–12 mEq/L.';
  if(v.alb){const corr=gap+2.5*(4-v.alb);rows.push(['Albumin-corrected gap',fmt(corr)+' mEq/L']);note+=' Corrected gap = AG + 2.5 × (4 − albumin).'}
  return R('Anion gap '+fmt(gap),gap>12?'warn':gap<8?'info':'ok',rows,note,this.src)}},

osm:{name:'Serum Osmolality',icon:'droplet',desc:'Calculated serum osmolality and osmolal gap basis.',src:'2Na + glucose/18 + BUN/2.8',
 fields:[F.num('na','Sodium',{min:100,max:180,unit:'mEq/L'}),F.num('glu','Glucose',{min:20,max:1500,unit:'mg/dL'}),F.num('bun','BUN',{min:1,max:200,unit:'mg/dL'})],
 compute(v){const o=2*v.na+v.glu/18+v.bun/2.8;
  return R('Osmolality '+fmt(o)+' mOsm/kg',o>=275&&o<=295?'ok':'warn',[['Calculated osmolality',fmt(o)+' mOsm/kg'],['Reference','275–295 mOsm/kg']],'Osmolal gap = measured − calculated; a gap >10 suggests unmeasured osmoles (e.g. toxic alcohols).',this.src)}},

map:{name:'Mean Arterial Pressure',icon:'activity',desc:'MAP from systolic and diastolic pressure.',src:'MAP = (SBP + 2×DBP) ⁄ 3',
 fields:[F.num('sbp','Systolic BP',{min:40,max:300,unit:'mmHg'}),F.num('dbp','Diastolic BP',{min:20,max:200,unit:'mmHg'})],
 compute(v){if(v.dbp>=v.sbp)err('Diastolic must be lower than systolic.');const m=(v.sbp+2*v.dbp)/3;
  return R('MAP '+Math.round(m)+' mmHg',m>=65?'ok':'bad',[['Mean arterial pressure',fmt(m)+' mmHg'],['Perfusion target','≥ 65 mmHg (most adults)']],m<65?'MAP below 65 mmHg — assess perfusion urgently.':null,this.src)}},

cca:{name:'Corrected Calcium',icon:'bone',desc:'Albumin-corrected total serum calcium.',src:'Corrected Ca = Ca + 0.8 × (4 − albumin)',
 fields:[F.num('ca','Total calcium',{min:2,max:20,step:.1,unit:'mg/dL'}),F.num('alb','Albumin',{min:0.5,max:6,step:.1,unit:'g/dL'})],
 compute(v){const c=v.ca+0.8*(4-v.alb);
  return R('Corrected Ca '+fmt(c)+' mg/dL',c>=8.5&&c<=10.5?'ok':'warn',[['Corrected calcium',fmt(c)+' mg/dL'],['Reference','≈ 8.5–10.5 mg/dL']],'Ionized calcium is preferred when accuracy is critical (acid–base disorders, critical illness).',this.src)}},

cna:{name:'Corrected Sodium',icon:'flask',desc:'Glucose-corrected sodium in hyperglycemia.',src:'Katz MA, NEJM 1973 (1.6 mEq per 100 mg/dL glucose)',
 fields:[F.num('na','Measured sodium',{min:100,max:180,unit:'mEq/L'}),F.num('glu','Glucose',{min:100,max:1500,unit:'mg/dL'})],
 compute(v){const c=v.na+1.6*(v.glu-100)/100;
  return R('Corrected Na '+fmt(c)+' mEq/L','info',[['Corrected sodium',fmt(c)+' mEq/L'],['Correction applied','+'+fmt(1.6*(v.glu-100)/100)+' mEq/L']],'Some use a 2.4 mEq correction factor when glucose exceeds 400 mg/dL.',this.src)}},
};
