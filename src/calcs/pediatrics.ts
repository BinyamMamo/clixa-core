/* Pediatrics — calculator definitions.
   Bodies ported verbatim from the legacy single-file app; the golden
   snapshot in test/ proves they are byte-identical. */
import type { Calculator } from '../types';
import { fmt } from '../format';
import { rng } from '../validate';
import { R } from '../result';
import { F } from '../fields';

export const pediatrics: Record<string, Calculator> = {
peddose:{name:'Pediatric Dose (mg/kg)',icon:'pill',desc:'Weight-based dosing with per-dose maximum cap.',src:'Standard mg/kg weight-based dosing',
 fields:[F.num('wt','Child weight',{units:['kg','lb'],min:.4,max:120}),F.num('dose','Dose',{min:.01,max:200,step:.01,unit:'mg/kg'}),F.num('freq','Doses per day',{min:1,max:6}),F.num('max','Max single dose (optional)',{min:1,max:5000,unit:'mg',opt:1})],
 compute(v){let per=v.wt*v.dose,capped=false;
  if(v.max&&per>v.max){per=v.max;capped=true}
  return R(fmt(per)+' mg per dose',capped?'warn':'info',[['Per dose',fmt(per)+' mg'+(capped?' (capped at max)':'')],['Frequency',v.freq+'× daily'],['Total daily dose',fmt(per*v.freq)+' mg/day']],'Always cross-check against the drug reference — many drugs also carry total-daily maximums and adult-dose ceilings.',this.src)}},

pedfluid:{name:'Pediatric Maintenance Fluids',icon:'droplet',desc:'Holliday–Segar daily volume and 4-2-1 hourly rate.',src:'Holliday MA & Segar WE, Pediatrics 1957',
 fields:[F.num('wt','Weight',{units:['kg','lb'],min:2,max:100})],
 compute(v){const w=v.wt;
  const daily=w<=10?100*w:w<=20?1000+50*(w-10):1500+20*(w-20);
  const hourly=w<=10?4*w:w<=20?40+2*(w-10):60+1*(w-20);
  return R(Math.round(daily)+' mL/day · '+Math.round(hourly)+' mL/h','info',[['24-hour maintenance',Math.round(daily)+' mL'],['Hourly (4-2-1 rule)',Math.round(hourly)+' mL/h']],'Maintenance only — add deficits and ongoing losses separately; reassess electrolytes with prolonged IV fluids.',this.src)}},

pedwt:{name:'Pediatric Estimated Weight',icon:'weight',desc:'Age-based weight estimate when scales are unavailable.',src:'APLS age-based formulas — estimates only',
 fields:[F.sel('band','Age band',[['inf','1–12 months'],['tod','1–5 years'],['sch','6–12 years']],{full:1}),F.num('age','Age',{min:0,max:12,step:.5,unit:'(months for infants, years otherwise)'})],
 compute(v){let w,f;
  if(v.band==='inf'){rng(v.age,1,12,'Age (months)');w=(v.age+9)/2;f='(age in months + 9) ÷ 2'}
  else if(v.band==='tod'){rng(v.age,1,5,'Age (years)');w=2*(v.age+5);f='2 × (age + 5)'}
  else{rng(v.age,6,12,'Age (years)');w=4*v.age;f='4 × age'}
  return R('≈ '+fmt(w)+' kg','warn',[['Estimated weight',fmt(w)+' kg'],['Formula',f]],'Estimate only — use a measured weight or length-based tape (e.g. Broselow) whenever available.',this.src)}},

pedbmi:{name:'Pediatric BMI',icon:'ruler',desc:'BMI for children — interpret against growth percentiles.',src:'CDC/WHO — pediatric BMI is age- and sex-percentile based',
 fields:[F.num('wt','Weight',{units:['kg','lb'],min:2,max:200}),F.num('ht','Height',{units:['cm','in'],min:40,max:210})],
 compute(v){const b=v.wt/((v.ht/100)**2);
  return R('BMI '+fmt(b)+' kg/m²','info',[['BMI',fmt(b)+' kg/m²']],'Children are classified by BMI-for-age percentile, not adult cut-offs: < 5th underweight, 5–84th healthy, 85–94th overweight, ≥ 95th obesity. Plot this value on a CDC/WHO growth chart.',this.src)}},
};
