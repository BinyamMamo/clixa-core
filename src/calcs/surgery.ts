/* Surgery — calculator definitions.
   Bodies ported verbatim from the legacy single-file app; the golden
   snapshot in test/ proves they are byte-identical. */
import type { Calculator } from '../types';
import { ln, r1, r2 } from '../format';
import { err } from '../validate';
import { R } from '../result';
import { F } from '../fields';

export const surgery: Record<string, Calculator> = {
asa:{name:'ASA Physical Status',icon:'clipcheck',desc:'ASA physical status classification with emergency modifier.',src:'ASA Physical Status Classification System (2020 update)',
 fields:[F.sel('cls','Classification',[
  ['1','ASA I — normal healthy patient'],['2','ASA II — mild systemic disease'],['3','ASA III — severe systemic disease'],
  ['4','ASA IV — severe systemic disease that is a constant threat to life'],['5','ASA V — moribund, not expected to survive without the operation'],['6','ASA VI — declared brain-dead, organ donor']],{full:1}),
  F.chk('e','Emergency surgery (adds "E" modifier)',0,{full:1})],
 compute(v){const d={1:'A normal healthy patient (e.g. fit non-smoker, minimal alcohol).',2:'Mild systemic disease without substantive functional limitation (e.g. well-controlled DM/HTN, current smoker, BMI 30–40).',3:'Severe systemic disease with substantive functional limitation (e.g. poorly controlled DM, COPD, BMI ≥40, ESRD on dialysis, MI/CVA >3 months ago).',4:'Severe systemic disease that is a constant threat to life (e.g. recent MI/CVA (<3 months), ongoing cardiac ischemia, sepsis, ARDS).',5:'Moribund patient not expected to survive without the operation (e.g. ruptured AAA, massive trauma).',6:'Declared brain-dead patient whose organs are being removed for donor purposes.'};
  const cls='ASA '+['','I','II','III','IV','V','VI'][+v.cls]+(v.e?'E':'');
  return R(cls,+v.cls<=2?'ok':+v.cls===3?'warn':'bad',[['Class',cls],['Definition',d[v.cls]]],v.e?'"E" denotes emergency surgery — delay would significantly increase threat to life or body part.':null,this.src)}},

rcri:{name:'RCRI — Revised Cardiac Risk Index',icon:'heartpulse',desc:'Lee index: perioperative risk of major cardiac events.',src:'Lee TH et al., Circulation 1999; risk estimates per Canadian CV Society 2017',
 fields:[F.chk('a','High-risk surgery (intraperitoneal, intrathoracic, or suprainguinal vascular)',1,{full:1}),
  F.chk('b','History of ischemic heart disease',1,{full:1}),F.chk('c','History of congestive heart failure',1,{full:1}),
  F.chk('d','History of cerebrovascular disease (stroke/TIA)',1,{full:1}),F.chk('e','Diabetes on insulin therapy',1,{full:1}),
  F.chk('f','Serum creatinine > 2.0 mg/dL (177 µmol/L)',1,{full:1})],
 compute(v){const s=['a','b','c','d','e','f'].reduce((t,k)=>t+(v[k]?1:0),0);
  const risk=s===0?['~0.4%','ok']:s===1?['~0.9%','ok']:s===2?['~6.6%','warn']:['>11%','bad'];
  return R('RCRI '+s+' — risk '+risk[0],risk[1],[['Score',s+' / 6'],['30-day risk of MI, cardiac arrest or death',risk[0]]],s>=2?'Elevated risk — consider preoperative cardiology assessment and postoperative troponin surveillance per local protocol.':null,this.src)}},

caprini:{name:'Caprini VTE Risk Score',icon:'clipboard',desc:'Surgical venous thromboembolism risk with prophylaxis tier.',src:'Caprini JA, 2005 model; tiers per CHEST 2012 guidance',
 fields:[F.sel('age','Age',[['0','≤ 40 years (0)'],['1','41–60 years (+1)'],['2','61–74 years (+2)'],['3','≥ 75 years (+3)']],{full:1}),
  F.head('1 point each'),
  F.chk('minor','Minor surgery planned',1),F.chk('bmi','BMI > 25 kg/m²',1),F.chk('legs','Swollen legs (current)',1),F.chk('var','Varicose veins',1),
  F.chk('sep','Sepsis (< 1 month)',1),F.chk('lung','Serious lung disease incl. pneumonia (< 1 month)',1),F.chk('ocp','Oral contraceptive or hormone replacement',1),F.chk('preg','Pregnancy or postpartum (< 1 month)',1),
  F.chk('obhx','History of unexplained or recurrent pregnancy loss',1),F.chk('mi','Acute myocardial infarction',1),F.chk('chf','Congestive heart failure (< 1 month)',1),F.chk('bed','Medical patient currently at bed rest',1),
  F.chk('ibd','History of inflammatory bowel disease',1),F.chk('majhx','Major surgery (< 1 month)',1),F.chk('copd','Abnormal pulmonary function (COPD)',1),
  F.head('2 points each'),
  F.chk('arth','Arthroscopic surgery',2),F.chk('major','Major open surgery (> 45 min)',2),F.chk('lap','Laparoscopic surgery (> 45 min)',2),F.chk('ca','Malignancy (present or previous)',2),F.chk('bed72','Confined to bed (> 72 h)',2),F.chk('cast','Immobilizing plaster cast',2),F.chk('cvc','Central venous access',2),
  F.head('3 points each'),
  F.chk('dvt','History of DVT or PE',3),F.chk('fam','Family history of thrombosis',3),F.chk('fvl','Factor V Leiden or prothrombin 20210A',3),F.chk('la','Lupus anticoagulant / anticardiolipin antibodies',3),F.chk('hcy','Elevated homocysteine',3),F.chk('hit','Heparin-induced thrombocytopenia',3),F.chk('thromb','Other congenital or acquired thrombophilia',3),
  F.head('5 points each'),
  F.chk('stroke','Stroke (< 1 month)',5),F.chk('arthro','Elective major lower-extremity arthroplasty',5),F.chk('fx','Hip, pelvis or leg fracture (< 1 month)',5),F.chk('sci','Acute spinal cord injury / paralysis (< 1 month)',5),F.chk('trauma','Multiple trauma (< 1 month)',5)],
 compute(v){let s=parseInt(v.age);for(const f of this.fields)if(f.t==='chk'&&v[f.k])s+=f.pts;
  const tier=s===0?['Very low','Early ambulation','ok']:s<=2?['Low','Mechanical prophylaxis (IPC)','ok']:s<=4?['Moderate','Pharmacologic prophylaxis (LMWH/UFH) or IPC','warn']:['High','Pharmacologic prophylaxis + IPC; consider extended-duration prophylaxis','bad'];
  return R('Caprini '+s+' — '+tier[0]+' risk',tier[2],[['Total score',String(s)],['Risk tier',tier[0]],['Suggested prophylaxis',tier[1]]],'Balance against bleeding risk; follow local surgical thromboprophylaxis protocol.',this.src)}},

alvarado:{name:'Alvarado Score',icon:'alert',desc:'MANTRELS score for acute appendicitis probability.',src:'Alvarado A, Ann Emerg Med 1986',
 fields:[F.chk('m','Migration of pain to the right lower quadrant',1,{full:1}),F.chk('a','Anorexia',1,{full:1}),F.chk('n','Nausea or vomiting',1,{full:1}),
  F.chk('t','Tenderness in the right lower quadrant',2,{full:1}),F.chk('r','Rebound tenderness',1,{full:1}),F.chk('e','Elevated temperature ≥ 37.3 °C',1,{full:1}),
  F.chk('l','Leukocytosis > 10 ×10⁹/L',2,{full:1}),F.chk('s','Neutrophil left shift (> 75%)',1,{full:1})],
 compute(v){let s=0;for(const f of this.fields)if(v[f.k])s+=f.pts;
  const b=s<=4?['1–4 — appendicitis unlikely; consider observation / alternative diagnoses','ok']:s<=6?['5–6 — possible appendicitis; observe, repeat exam ± imaging','warn']:s<=8?['7–8 — probable appendicitis; surgical consult','bad']:['9–10 — highly probable appendicitis; surgical consult','bad'];
  return R('Alvarado '+s+' / 10',b[1],[['Score',s+' / 10'],['Interpretation',b[0]]],null,this.src)}},

ranson:{name:"Ranson's Criteria",icon:'flask',desc:'Acute pancreatitis severity (non-gallstone) — admission + 48 h.',src:'Ranson JH et al., Surg Gynecol Obstet 1974',
 fields:[F.head('At admission'),
  F.chk('r1','Age > 55 years',1),F.chk('r2','WBC > 16 ×10⁹/L',1),F.chk('r3','Glucose > 200 mg/dL (11.1 mmol/L)',1),F.chk('r4','LDH > 350 IU/L',1),F.chk('r5','AST > 250 IU/L',1),
  F.head('Within 48 hours'),
  F.chk('r6','Hematocrit fall > 10%',1),F.chk('r7','BUN rise > 5 mg/dL',1),F.chk('r8','Calcium < 8 mg/dL',1),F.chk('r9','PaO₂ < 60 mmHg',1),F.chk('r10','Base deficit > 4 mEq/L',1),F.chk('r11','Fluid sequestration > 6 L',1)],
 compute(v){let s=0;for(const f of this.fields)if(f.t==='chk'&&v[f.k])s++;
  const b=s<=2?['~2% (historical series)','ok']:s<=4?['~15%','warn']:s<=6?['~40%','bad']:['approaching 100% in the original series','bad'];
  return R("Ranson's "+s+' / 11',b[1],[['Criteria met',s+' / 11'],['Associated mortality',b[0]],['Severe pancreatitis',s>=3?'Yes — score ≥ 3':'No']],'Full score requires 48-hour values; consider ICU-level care when ≥ 3 criteria are met.',this.src)}},

parkland:{name:'Parkland Formula',icon:'droplet',desc:'Burn fluid resuscitation — 4 mL × kg × %TBSA lactated Ringer’s.',src:'Baxter CR & Shires T, 1968 (Parkland)',
 fields:[F.num('wt','Weight',{units:['kg','lb'],min:2,max:300}),F.num('tbsa','Burn size (%TBSA, 2°/3° only)',{min:1,max:100,unit:'%'}),F.num('hrs','Hours since burn (optional)',{min:0,max:8,step:.5,opt:1})],
 compute(v){const total=4*v.wt*v.tbsa,first=total/2,second=total/2;
  const rows=[['Total first 24 h (from time of burn)',Math.round(total)+' mL LR'],['First 8 h volume',Math.round(first)+' mL'],['Rate for first 8 h',Math.round(first/8)+' mL/h'],['Next 16 h volume',Math.round(second)+' mL'],['Rate for next 16 h',Math.round(second/16)+' mL/h']];
  let note='Timed from the moment of burn, not arrival. Titrate to urine output 0.5–1 mL/kg/h; formulas are starting points only.';
  if(v.hrs&&v.hrs>0&&v.hrs<8){rows.splice(3,0,['Adjusted rate ('+v.hrs+' h elapsed, none given)',Math.round(first/(8-v.hrs))+' mL/h for remaining '+(8-v.hrs)+' h']);note='If no fluid was given pre-arrival, the remaining first-phase volume runs over the remaining '+(8-v.hrs)+' h. '+note}
  return R(Math.round(total)+' mL LR / 24 h','info',rows,note,this.src)}},

ron:{name:'Burn TBSA — Rule of Nines',icon:'flame',desc:'Adult burn surface estimation by body region.',src:'Wallace rule of nines (adult)',
 fields:[F.chk('h','Head & neck',9),F.chk('at','Anterior trunk',18),F.chk('pt','Posterior trunk',18),F.chk('ra','Right arm (entire)',9),F.chk('la','Left arm (entire)',9),F.chk('rl','Right leg (entire)',18),F.chk('ll','Left leg (entire)',18),F.chk('p','Perineum',1)],
 compute(v){let s=0;for(const f of this.fields)if(v[f.k])s+=f.pts;if(s===0)err('Select at least one burned region.');
  return R('≈ '+s+'% TBSA',s>=20?'bad':s>=10?'warn':'info',[['Estimated burn area',s+' %TBSA'],['Regions',this.fields.filter(f=>v[f.k]).map(f=>f.label).join(', ')]],'For partial regions, the patient’s palm (with fingers) ≈ 1% TBSA. Use Lund–Browder for children. Feed this value into the Parkland calculator.',this.src)}},

meldna:{name:'MELD-Na Score',icon:'calculator',desc:'Liver disease severity (2016 MELD-Na) with 3-month mortality.',src:'Kamath PS et al.; MELD-Na per OPTN 2016 policy',
 fields:[F.num('bili','Bilirubin',{min:0.1,max:60,step:.1,unit:'mg/dL'}),F.num('inr','INR',{min:0.5,max:15,step:.1}),F.num('cr','Creatinine',{min:0.1,max:15,step:.1,unit:'mg/dL'}),F.num('na','Sodium',{min:100,max:160,unit:'mEq/L'}),F.chk('dial','Dialysis ≥ 2× in the past week (creatinine set to 4.0)',0,{full:1})],
 compute(v){let cr=v.dial?4:Math.min(Math.max(v.cr,1),4),bi=Math.max(v.bili,1),inr=Math.max(v.inr,1),na=Math.min(Math.max(v.na,125),137);
  let meld=Math.round(10*(0.957*ln(cr)+0.378*ln(bi)+1.120*ln(inr)+0.643));
  let m=meld;if(meld>11)m=Math.round(meld+1.32*(137-na)-0.033*meld*(137-na));
  m=Math.min(Math.max(m,6),40);
  const b=m<=9?['~1.9%','ok']:m<=19?['~6.0%','info']:m<=29?['~19.6%','warn']:m<=39?['~52.6%','bad']:['~71.3%','bad'];
  return R('MELD-Na '+m,b[1],[['MELD (initial)',String(meld)],['MELD-Na',String(m)],['Approx. 3-month mortality (hospitalized)',b[0]]],'Lab values are floored at 1.0; creatinine capped at 4.0 (or set to 4.0 with dialysis); sodium bounded 125–137 mEq/L; final score bounded 6–40.',this.src)}},

wellsdvt:{name:'Wells Score — DVT',icon:'activity',desc:'Pre-test probability of deep vein thrombosis.',src:'Wells PS et al., NEJM 2003',
 fields:[F.chk('a','Active cancer (treatment within 6 months, or palliative)',1,{full:1}),F.chk('b','Paralysis, paresis, or recent plaster immobilization of the leg',1,{full:1}),
  F.chk('c','Recently bedridden ≥ 3 days, or major surgery within 12 weeks',1,{full:1}),F.chk('d','Localized tenderness along the deep venous system',1,{full:1}),
  F.chk('e','Entire leg swollen',1,{full:1}),F.chk('f','Calf swelling > 3 cm vs asymptomatic side',1,{full:1}),F.chk('g','Pitting edema confined to the symptomatic leg',1,{full:1}),
  F.chk('h','Collateral superficial (non-varicose) veins',1,{full:1}),F.chk('i','Previously documented DVT',1,{full:1}),F.chk('j','Alternative diagnosis at least as likely as DVT (−2)',-2,{full:1})],
 compute(v){let s=0;for(const f of this.fields)if(v[f.k])s+=f.pts;
  const b=s<=0?['Low (~5% prevalence) — D-dimer to rule out','ok']:s<=2?['Moderate (~17%) — high-sensitivity D-dimer or ultrasound','warn']:['High (~17–53%) — proceed to ultrasound','bad'];
  return R('Wells DVT '+s+' — '+b[0].split(' ')[0],b[1],[['Score',String(s)],['Pre-test probability',b[0]]],null,this.src)}},

wound:{name:'Surgical Wound Classification',icon:'cross',desc:'CDC wound class with typical surgical-site infection risk.',src:'CDC/NHSN surgical wound classification',
 fields:[F.sel('c','Wound class',[
  ['1','Class I — Clean'],['2','Class II — Clean-contaminated'],['3','Class III — Contaminated'],['4','Class IV — Dirty / infected']],{full:1})],
 compute(v){const d={1:['Uninfected operative wound; no inflammation; respiratory, alimentary, genital and urinary tracts not entered (e.g. hernia repair, thyroidectomy).','≈ 1–5%','ok'],
  2:['Tracts entered under controlled conditions without unusual contamination (e.g. elective cholecystectomy, appendectomy without perforation).','≈ 3–11%','info'],
  3:['Open fresh accidental wounds, major breaks in sterile technique, gross GI spillage, or acute non-purulent inflammation.','≈ 10–17%','warn'],
  4:['Old traumatic wounds with devitalized tissue, existing infection or perforated viscera — organisms present before operation.','> 27%','bad']}[v.c];
  return R('Class '+['','I — Clean','II — Clean-contaminated','III — Contaminated','IV — Dirty/infected'][+v.c],d[2],[['Definition',d[0]],['Typical SSI risk',d[1]]],null,this.src)}},
};
