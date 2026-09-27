/* Emergency & Critical Care — calculator definitions.
   Bodies ported verbatim from the legacy single-file app; the golden
   snapshot in test/ proves they are byte-identical. */
import type { Calculator } from '../types';
import { fmt } from '../format';
import { R } from '../result';
import { F } from '../fields';

export const emergency: Record<string, Calculator> = {
gcs:{name:'Glasgow Coma Scale',icon:'eye',desc:'Eye, verbal, motor assessment with severity band.',src:'Teasdale G & Jennett B, Lancet 1974',
 fields:[F.sel('e','Eye opening',[['4','Spontaneous (4)'],['3','To voice (3)'],['2','To pain (2)'],['1','None (1)']],{full:1}),
  F.sel('v','Verbal response',[['5','Oriented (5)'],['4','Confused (4)'],['3','Inappropriate words (3)'],['2','Incomprehensible sounds (2)'],['1','None (1)'],['T','Intubated (T)']],{full:1}),
  F.sel('m','Motor response',[['6','Obeys commands (6)'],['5','Localizes pain (5)'],['4','Withdraws from pain (4)'],['3','Abnormal flexion (3)'],['2','Extension (2)'],['1','None (1)']],{full:1})],
 compute(v){const intub=v.v==='T';const s=+v.e+(intub?1:+v.v)+ +v.m;
  const label=intub?'GCS '+(+v.e+ +v.m)+'T (E'+v.e+'V-T M'+v.m+')':'GCS '+s+' (E'+v.e+'V'+v.v+'M'+v.m+')';
  const sev=s>=13?['Mild (13–15)','ok']:s>=9?['Moderate (9–12)','warn']:['Severe (≤ 8) — airway protection concern','bad'];
  return R(label,sev[1],[['Total',intub?(+v.e+ +v.m)+'T (verbal untestable)':s+' / 15'],['Severity',sev[0]]],intub?'Intubated patients: verbal is scored "T"; total shown is E + M with a floor verbal score of 1 for severity banding.':null,this.src)}},

qsofa:{name:'qSOFA Score',icon:'alert',desc:'Quick sepsis screen outside the ICU.',src:'Singer M et al., Sepsis-3, JAMA 2016',
 fields:[F.chk('r','Respiratory rate ≥ 22 /min',1,{full:1}),F.chk('b','Systolic BP ≤ 100 mmHg',1,{full:1}),F.chk('m','Altered mentation (GCS < 15)',1,{full:1})],
 compute(v){const s=(v.r?1:0)+(v.b?1:0)+(v.m?1:0);
  return R('qSOFA '+s+' / 3',s>=2?'bad':'ok',[['Score',s+' / 3'],['Interpretation',s>=2?'≥ 2 — higher risk of poor outcome in suspected infection; assess for organ dysfunction (full SOFA), escalate care':'< 2 — lower risk, but does not exclude sepsis']],null,this.src)}},

sofa:{name:'SOFA Score',icon:'clipboard',desc:'Sequential organ failure assessment across six systems.',src:'Vincent JL et al., Intensive Care Med 1996; Sepsis-3',
 fields:[F.sel('resp','Respiration — PaO₂/FiO₂',[['0','≥ 400 (0)'],['1','< 400 (+1)'],['2','< 300 (+2)'],['3','< 200 with respiratory support (+3)'],['4','< 100 with respiratory support (+4)']],{full:1}),
  F.sel('coag','Coagulation — platelets ×10³/µL',[['0','≥ 150 (0)'],['1','< 150 (+1)'],['2','< 100 (+2)'],['3','< 50 (+3)'],['4','< 20 (+4)']],{full:1}),
  F.sel('liv','Liver — bilirubin mg/dL',[['0','< 1.2 (0)'],['1','1.2–1.9 (+1)'],['2','2.0–5.9 (+2)'],['3','6.0–11.9 (+3)'],['4','≥ 12.0 (+4)']],{full:1}),
  F.sel('cv','Cardiovascular',[['0','MAP ≥ 70 mmHg (0)'],['1','MAP < 70 mmHg (+1)'],['2','Dopamine ≤ 5 or any dobutamine (+2)'],['3','Dopamine > 5 or epi/norepi ≤ 0.1 µg/kg/min (+3)'],['4','Dopamine > 15 or epi/norepi > 0.1 µg/kg/min (+4)']],{full:1}),
  F.sel('cns','CNS — Glasgow Coma Scale',[['0','15 (0)'],['1','13–14 (+1)'],['2','10–12 (+2)'],['3','6–9 (+3)'],['4','< 6 (+4)']],{full:1}),
  F.sel('ren','Renal — creatinine mg/dL (or urine output)',[['0','< 1.2 (0)'],['1','1.2–1.9 (+1)'],['2','2.0–3.4 (+2)'],['3','3.5–4.9 or UOP < 500 mL/d (+3)'],['4','≥ 5.0 or UOP < 200 mL/d (+4)']],{full:1})],
 compute(v){const s=+v.resp + +v.coag + +v.liv + +v.cv + +v.cns + +v.ren;
  const m=s<=6?['< 10%','ok']:s<=9?['≈ 15–20%','warn']:s<=12?['≈ 40–50%','bad']:['> 50–80%','bad'];
  return R('SOFA '+s+' / 24',m[1],[['Total score',s+' / 24'],['Approx. ICU mortality (initial score)',m[0]]],'An acute rise of ≥ 2 points with suspected infection meets the Sepsis-3 definition of sepsis. Trend matters more than a single value.',this.src)}},

curb65:{name:'CURB-65',icon:'wind',desc:'Community-acquired pneumonia severity & disposition.',src:'Lim WS et al., Thorax 2003',
 fields:[F.chk('c','Confusion (new disorientation)',1,{full:1}),F.chk('u','Urea > 7 mmol/L (BUN > 19 mg/dL)',1,{full:1}),F.chk('r','Respiratory rate ≥ 30 /min',1,{full:1}),F.chk('b','SBP < 90 or DBP ≤ 60 mmHg',1,{full:1}),F.chk('a','Age ≥ 65 years',1,{full:1})],
 compute(v){const s=['c','u','r','b','a'].reduce((t,k)=>t+(v[k]?1:0),0);
  const b=s<=1?['~1.5% 30-day mortality — outpatient care usually appropriate','ok']:s===2?['~9% — consider short inpatient stay or supervised outpatient care','warn']:['~22% — admit; assess for ICU if score 4–5','bad'];
  return R('CURB-65 '+s+' / 5',b[1],[['Score',s+' / 5'],['Interpretation',b[0]]],null,this.src)}},

wellspe:{name:'Wells Score — PE',icon:'wind',desc:'Pre-test probability of pulmonary embolism.',src:'Wells PS et al., Thromb Haemost 2000',
 fields:[F.chk('a','Clinical signs and symptoms of DVT (+3)',3,{full:1}),F.chk('b','PE is the most likely diagnosis (+3)',3,{full:1}),F.chk('c','Heart rate > 100 bpm (+1.5)',1.5,{full:1}),
  F.chk('d','Immobilization ≥ 3 days or surgery in previous 4 weeks (+1.5)',1.5,{full:1}),F.chk('e','Previous objectively diagnosed DVT/PE (+1.5)',1.5,{full:1}),F.chk('f','Hemoptysis (+1)',1,{full:1}),F.chk('g','Malignancy (treated within 6 months or palliative) (+1)',1,{full:1})],
 compute(v){let s=0;for(const f of this.fields)if(v[f.k])s+=f.pts;
  const three=s<2?'Low (~1.3%)':s<=6?'Moderate (~16%)':'High (~38%)';
  const two=s<=4?'PE unlikely — D-dimer to rule out (consider PERC first in low-risk patients)':'PE likely — proceed to CTPA';
  return R('Wells PE '+fmt(s),s>6?'bad':s>=2?'warn':'ok',[['Score',fmt(s)],['Three-tier probability',three],['Two-tier pathway',two]],null,this.src)}},

pf:{name:'PaO₂ / FiO₂ Ratio',icon:'wind',desc:'Oxygenation index with Berlin ARDS severity.',src:'Berlin definition, JAMA 2012',
 fields:[F.num('pao2','PaO₂',{min:20,max:700,unit:'mmHg'}),F.num('fio2','FiO₂',{min:21,max:100,unit:'%'})],
 compute(v){const r=v.pao2/(v.fio2/100);
  const b=r>300?['Normal / no ARDS-range hypoxemia','ok']:r>200?['Mild ARDS range (200–300)','warn']:r>100?['Moderate ARDS range (100–200)','bad']:['Severe ARDS range (≤ 100)','bad'];
  return R('P/F ratio '+Math.round(r),b[1],[['PaO₂/FiO₂',Math.round(r)+' mmHg'],['Berlin category',b[0]]],'Berlin ARDS criteria also require acute onset, bilateral opacities, non-cardiogenic edema, and PEEP/CPAP ≥ 5 cmH₂O.',this.src)}},
};
