/* Obstetrics — calculator definitions.
   Bodies ported verbatim from the legacy single-file app; the golden
   snapshot in test/ proves they are byte-identical. */
import type { Calculator } from '../types';
import { addDays, daysBetween, dstr, fmt, wkd } from '../format';
import { dboth } from '../ethiopian';
import { err, need } from '../validate';
import { R } from '../result';
import { F } from '../fields';

export const obstetrics: Record<string, Calculator> = {
edd:{name:'Estimated Due Date',icon:'calendar',desc:'Naegele’s rule with cycle adjustment, or from conception date.',src:'Naegele’s rule; ACOG Committee Opinion 700',
 fields:[F.sel('cal','Calendar',[['e','Ethiopian (\u12d3.\u121d.)'],['g','Gregorian']],{full:1}),F.sel('meth','Method',[['lmp','From last menstrual period'],['conc','From conception date']],{full:1}),F.date('d','Date',{full:1}),F.num('cyc','Cycle length (LMP method)',{min:20,max:45,unit:'days',opt:1})],
 compute(v){need(v.d,'Date');const d=new Date(v.d+'T00:00:00');if(d>new Date())err('Date cannot be in the future.');
  let due,label;if(v.meth==='lmp'){const adj=(v.cyc||28)-28;due=addDays(d,280+adj);label='LMP + 280 days'+(adj?' '+(adj>0?'+':'')+adj+' (cycle '+v.cyc+' d)':'')}else{due=addDays(d,266);label='Conception + 266 days'}
  const ga=daysBetween(v.meth==='lmp'?addDays(d,(v.cyc||28)-28):addDays(d,-14),new Date());
  const rows=[['Estimated due date',dboth(due)],['Basis',label]];
  if(ga>=0&&ga<310)rows.push(['Gestational age today',wkd(ga)]);
  return R('EDD '+dstr(due),'info',rows,'First-trimester ultrasound is the most accurate dating method and takes precedence when discrepant with LMP dating.',this.src)}},

ga:{name:'Gestational Age Calculator',icon:'clock',desc:'GA in weeks + days from LMP or from a known EDD.',src:'ACOG/AAP term definitions (Obstet Gynecol 2013)',
 fields:[F.sel('cal','Calendar',[['e','Ethiopian (\u12d3.\u121d.)'],['g','Gregorian']],{full:1}),F.sel('meth','Method',[['lmp','From LMP'],['edd','From known EDD']],{full:1}),F.date('d','Date',{full:1})],
 compute(v){need(v.d,'Date');const d=new Date(v.d+'T00:00:00');let ga;
  if(v.meth==='lmp'){if(d>new Date())err('LMP cannot be in the future.');ga=daysBetween(d,new Date())}
  else ga=280-daysBetween(new Date(),d);
  if(ga<0)err('Calculated GA is negative — check the dates.');if(ga>320)err('Calculated GA exceeds 45 weeks — check the dates.');
  const w=Math.floor(ga/7);
  const tri=w<14?'First trimester':w<28?'Second trimester':'Third trimester';
  const term=w<37?['Preterm','warn']:w<39?['Early term','info']:w<41?['Full term','ok']:w<42?['Late term','info']:['Post-term','warn'];
  return R(wkd(ga)+' — '+tri,term[1],[['Gestational age',wkd(ga)],['Trimester',tri],['Term category (if delivering now)',term[0]],['Estimated due date',dboth(v.meth==='lmp'?addDays(d,280):d)]],null,this.src)}},

ovul:{name:'Ovulation & Fertile Window',icon:'flower',desc:'Predicted ovulation and six-day fertile window.',src:'Calendar method — ovulation ≈ 14 days before next menses',
 fields:[F.sel('cal','Calendar',[['e','Ethiopian (\u12d3.\u121d.)'],['g','Gregorian']],{full:1}),F.date('lmp','First day of last period',{full:1}),F.num('cyc','Average cycle length',{min:20,max:45,unit:'days'})],
 compute(v){need(v.lmp,'LMP');const d=new Date(v.lmp+'T00:00:00');if(d>new Date())err('LMP cannot be in the future.');
  const ov=addDays(d,v.cyc-14);
  return R('Ovulation ≈ '+dstr(ov),'info',[['Predicted ovulation',dboth(ov)],['Fertile window',dstr(addDays(ov,-5))+' – '+dstr(addDays(ov,1))],['Next period expected',dboth(addDays(d,v.cyc))]],'Calendar estimates vary — ovulation predictor kits or cycle tracking improve precision, especially with irregular cycles.',this.src)}},

fundal:{name:'Fundal Height Check',icon:'ruler',desc:'Symphysis–fundal height vs gestational age (after 20 weeks).',src:'SFH in cm ≈ GA in weeks (±3 cm), 20–36 weeks',
 fields:[F.num('gaw','Gestational age',{min:20,max:42,unit:'weeks'}),F.num('sfh','Measured fundal height',{min:10,max:50,unit:'cm'})],
 compute(v){const diff=v.sfh-v.gaw;
  const b=Math.abs(diff)<=3?['Concordant with dates','ok']:diff>3?['Larger than expected — consider ultrasound (macrosomia, polyhydramnios, twins, dating error)','warn']:['Smaller than expected — consider ultrasound (growth restriction, oligohydramnios, dating error)','warn'];
  return R('SFH '+v.sfh+' cm at '+v.gaw+' wk',b[1],[['Expected range',(v.gaw-3)+'–'+(v.gaw+3)+' cm'],['Difference',(diff>0?'+':'')+fmt(diff)+' cm'],['Assessment',b[0]]],null,this.src)}},

pwg:{name:'Pregnancy Weight-Gain Guide',icon:'trend',desc:'IOM recommended total gestational weight gain by pre-pregnancy BMI.',src:'IOM (National Academies) 2009 guidelines — singleton pregnancy',
 fields:[F.num('wt','Pre-pregnancy weight',{units:['kg','lb'],min:30,max:250}),F.num('ht','Height',{units:['cm','in'],min:120,max:220})],
 compute(v){const b=v.wt/((v.ht/100)**2);
  const g=b<18.5?['Underweight','12.5–18 kg (28–40 lb)']:b<25?['Normal weight','11.5–16 kg (25–35 lb)']:b<30?['Overweight','7–11.5 kg (15–25 lb)']:['Obese','5–9 kg (11–20 lb)'];
  return R(g[0]+' — gain '+g[1].split(' (')[0],'info',[['Pre-pregnancy BMI',fmt(b)+' kg/m² ('+g[0]+')'],['Recommended total gain',g[1]]],'Singleton pregnancy ranges. Twin pregnancy targets are higher — discuss individualized goals antenatally.',this.src)}},

bishop:{name:'Bishop Score',icon:'clipcheck',desc:'Cervical favorability for induction of labour.',src:'Bishop EH, Obstet Gynecol 1964',
 fields:[F.sel('dil','Dilation',[['0','Closed (0)'],['1','1–2 cm (+1)'],['2','3–4 cm (+2)'],['3','≥ 5 cm (+3)']]),
  F.sel('eff','Effacement',[['0','0–30% (0)'],['1','40–50% (+1)'],['2','60–70% (+2)'],['3','≥ 80% (+3)']]),
  F.sel('sta','Station',[['0','−3 (0)'],['1','−2 (+1)'],['2','−1 / 0 (+2)'],['3','+1 / +2 (+3)']]),
  F.sel('con','Consistency',[['0','Firm (0)'],['1','Medium (+1)'],['2','Soft (+2)']]),
  F.sel('pos','Position',[['0','Posterior (0)'],['1','Mid-position (+1)'],['2','Anterior (+2)']])],
 compute(v){const s=+v.dil + +v.eff + +v.sta + +v.con + +v.pos;
  const b=s>=8?['Favorable — high likelihood of successful vaginal delivery with induction','ok']:s>=6?['Intermediate — induction may succeed; consider clinical context','warn']:['Unfavorable (≤5) — cervical ripening usually indicated before induction','warn'];
  return R('Bishop '+s+' / 13',b[1],[['Score',s+' / 13'],['Interpretation',b[0]]],null,this.src)}},

apgar:{name:'APGAR Score',icon:'baby',desc:'Newborn condition at 1 and 5 minutes.',src:'Apgar V, 1953; AAP/ACOG interpretation',
 fields:[F.sel('a','Appearance (color)',[['0','Blue or pale all over (0)'],['1','Body pink, extremities blue (+1)'],['2','Completely pink (+2)']],{full:1}),
  F.sel('p','Pulse',[['0','Absent (0)'],['1','< 100 bpm (+1)'],['2','≥ 100 bpm (+2)']],{full:1}),
  F.sel('g','Grimace (reflex irritability)',[['0','No response (0)'],['1','Grimace (+1)'],['2','Cry or active withdrawal (+2)']],{full:1}),
  F.sel('ac','Activity (tone)',[['0','Limp (0)'],['1','Some flexion (+1)'],['2','Active motion (+2)']],{full:1}),
  F.sel('r','Respiration',[['0','Absent (0)'],['1','Weak, irregular / gasping (+1)'],['2','Good cry (+2)']],{full:1})],
 compute(v){const s=+v.a + +v.p + +v.g + +v.ac + +v.r;
  const b=s>=7?['7–10 — reassuring','ok']:s>=4?['4–6 — moderately abnormal; support and reassess','warn']:['0–3 — low; immediate resuscitation per NRP','bad'];
  return R('APGAR '+s+' / 10',b[1],[['Score',s+' / 10'],['Interpretation',b[0]]],'Score at 1 and 5 minutes; if the 5-minute score is < 7, repeat every 5 minutes up to 20 minutes. APGAR does not guide the decision to start resuscitation.',this.src)}},

gtpal:{name:'GTPAL Obstetric History',icon:'hash',desc:'Formats obstetric history in GTPAL notation.',src:'Standard GTPAL nomenclature',
 fields:[F.num('g','Gravida (total pregnancies incl. current)',{min:0,max:25}),F.num('t','Term births (≥ 37 wk)',{min:0,max:25}),F.num('p','Preterm births (20–36⁶ wk)',{min:0,max:25}),F.num('a','Abortions / losses < 20 wk',{min:0,max:25}),F.num('l','Living children',{min:0,max:30})],
 compute(v){for(const k of['g','t','p','a','l'])if(!Number.isInteger(v[k]))err('All values must be whole numbers.');
  if(v.t+v.p+v.a>v.g)err('Term + preterm + abortions cannot exceed gravida.');
  return R('G'+v.g+' T'+v.t+' P'+v.p+' A'+v.a+' L'+v.l,'info',[['Notation','G'+v.g+'T'+v.t+'P'+v.p+'A'+v.a+'L'+v.l],['Reading',v.g+' pregnancies · '+v.t+' term · '+v.p+' preterm · '+v.a+' losses <20 wk · '+v.l+' living']],'Multiple gestations count as one birth for T/P but each child counts toward L.',this.src)}},
};
