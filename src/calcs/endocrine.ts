/* Endocrinology & Nephrology — calculator definitions.
   Bodies ported verbatim from the legacy single-file app; the golden
   snapshot in test/ proves they are byte-identical. */
import type { Calculator } from '../types';
import { fmt } from '../format';
import { R } from '../result';
import { F } from '../fields';

export const endocrine: Record<string, Calculator> = {
hba1c:{name:'HbA1c ↔ Average Glucose',icon:'droplet',desc:'Estimated average glucose from HbA1c.',src:'Nathan DM et al. (ADAG), Diabetes Care 2008',
 fields:[F.num('a1c','HbA1c',{min:3,max:20,step:.1,unit:'%'})],
 compute(v){const eag=28.7*v.a1c-46.7;
  const cat=v.a1c<5.7?['Normal','ok']:v.a1c<6.5?['Prediabetes range','warn']:['Diabetes range','bad'];
  return R('eAG '+Math.round(eag)+' mg/dL — '+cat[0],cat[1],[['HbA1c',fmt(v.a1c)+'%'],['Estimated average glucose',Math.round(eag)+' mg/dL ('+fmt(eag/18,1)+' mmol/L)'],['ADA category',cat[0]]],'Diagnosis requires confirmatory testing; HbA1c is unreliable with hemoglobinopathies, recent transfusion, and altered red-cell turnover.',this.src)}},

homa:{name:'HOMA-IR',icon:'gauge',desc:'Insulin resistance from fasting glucose and insulin.',src:'Matthews DR et al., Diabetologia 1985',
 fields:[F.num('glu','Fasting glucose',{min:40,max:400,unit:'mg/dL'}),F.num('ins','Fasting insulin',{min:.5,max:300,step:.1,unit:'µU/mL'})],
 compute(v){const h=(v.glu*v.ins)/405;
  return R('HOMA-IR '+fmt(h,2),h>2.9?'warn':'ok',[['HOMA-IR',fmt(h,2)],['Reference','< 2.0 typical insulin sensitivity; > 2.9 suggests significant insulin resistance (population-dependent cut-offs)']],'Requires a true fasting sample; not valid on insulin therapy.',this.src)}},

fena:{name:'FENa',icon:'filter',desc:'Fractional excretion of sodium — AKI work-up.',src:'FENa = (UNa × PCr) ⁄ (PNa × UCr) × 100',
 fields:[F.num('una','Urine sodium',{min:1,max:300,unit:'mEq/L'}),F.num('pna','Plasma sodium',{min:100,max:180,unit:'mEq/L'}),F.num('ucr','Urine creatinine',{min:1,max:500,unit:'mg/dL'}),F.num('pcr','Plasma creatinine',{min:.1,max:25,step:.01,unit:'mg/dL'})],
 compute(v){const f=(v.una*v.pcr)/(v.pna*v.ucr)*100;
  const b=f<1?['< 1% — suggests prerenal azotemia','info']:f<=2?['1–2% — indeterminate','warn']:['> 2% — suggests intrinsic renal injury (ATN)','warn'];
  return R('FENa '+fmt(f,2)+'%',b[1],[['FENa',fmt(f,2)+'%'],['Interpretation',b[0]]],'Diuretics invalidate FENa — use FEUrea (< 35% suggests prerenal) instead. Interpret with the full clinical picture.',this.src)}},

hydrate:{name:'Daily Water Intake',icon:'droplet',desc:'Baseline daily fluid guide by body weight.',src:'Common guideline ≈ 30–35 mL/kg/day for healthy adults',
 fields:[F.num('wt','Weight',{units:['kg','lb'],min:30,max:250}),F.sel('act','Activity / climate',[['0','Typical day'],['500','Active or hot climate (+500 mL)'],['1000','Very active / very hot (+1000 mL)']],{full:1})],
 compute(v){const lo=30*v.wt+ +v.act,hi=35*v.wt+ +v.act;
  return R(fmt(lo/1000,1)+'–'+fmt(hi/1000,1)+' L/day','info',[['Suggested intake',Math.round(lo)+'–'+Math.round(hi)+' mL/day'],['In glasses (250 mL)',Math.round(lo/250)+'–'+Math.round(hi/250)]],'General guide for healthy adults — needs differ with heart, kidney and liver disease, pregnancy and breastfeeding; food supplies ~20% of fluid.',this.src)}},
};
