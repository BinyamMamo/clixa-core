/* Cardiology — calculator definitions.
   Bodies ported verbatim from the legacy single-file app; the golden
   snapshot in test/ proves they are byte-identical. */
import type { Calculator } from '../types';
import { fmt, ln } from '../format';
import { err, need } from '../validate';
import { R } from '../result';
import { F, SEX } from '../fields';

export const cardiology: Record<string, Calculator> = {
ascvd:{name:'ASCVD Risk (Pooled Cohort)',icon:'percent',desc:'10-year atherosclerotic cardiovascular disease risk, ages 40–79.',src:'Goff DC et al., 2013 ACC/AHA Pooled Cohort Equations',
 fields:[F.sel('sex','Sex',SEX),F.sel('race','Race (equation set)',[['w','White / other'],['b','African American']]),F.num('age','Age',{min:40,max:79,unit:'yr'}),
  F.num('tc','Total cholesterol',{min:130,max:320,unit:'mg/dL'}),F.num('hdl','HDL cholesterol',{min:20,max:100,unit:'mg/dL'}),F.num('sbp','Systolic BP',{min:90,max:200,unit:'mmHg'}),
  F.sel('rx','On BP treatment?',[['0','No'],['1','Yes']]),F.sel('smk','Current smoker?',[['0','No'],['1','Yes']]),F.sel('dm','Diabetes?',[['0','No'],['1','Yes']])],
 compute(v){
  const la=ln(v.age),lt=ln(v.tc),lh=ln(v.hdl),ls=ln(v.sbp),rx=+v.rx,sm=+v.smk,dm=+v.dm;
  let sum,mean,s0;
  if(v.race==='w'&&v.sex==='m'){sum=12.344*la+11.853*lt-2.664*la*lt-7.990*lh+1.769*la*lh+(rx?1.797:1.764)*ls+7.837*sm-1.795*la*sm+0.658*dm;mean=61.18;s0=0.9144}
  else if(v.race==='w'&&v.sex==='f'){sum=-29.799*la+4.884*la*la+13.540*lt-3.114*la*lt-13.578*lh+3.149*la*lh+(rx?2.019:1.957)*ls+7.574*sm-1.665*la*sm+0.661*dm;mean=-29.18;s0=0.9665}
  else if(v.race==='b'&&v.sex==='m'){sum=2.469*la+0.302*lt-0.307*lh+(rx?1.916:1.809)*ls+0.549*sm+0.645*dm;mean=19.54;s0=0.8954}
  else{sum=17.114*la+0.940*lt-18.920*lh+4.475*la*lh+(rx?29.291:27.820)*ls+(rx?-6.432:-6.087)*la*ls+0.691*sm+0.874*dm;mean=86.61;s0=0.9533}
  const risk=(1-Math.pow(s0,Math.exp(sum-mean)))*100;
  const b=risk<5?['Low (< 5%)','ok']:risk<7.5?['Borderline (5 – 7.4%)','info']:risk<20?['Intermediate (7.5 – 19.9%)','warn']:['High (≥ 20%)','bad'];
  return R('10-yr ASCVD risk '+fmt(risk)+'%',b[1],[['Estimated 10-year risk',fmt(risk)+'%'],['Risk category',b[0]]],'For primary prevention only (no prior ASCVD, LDL < 190 mg/dL). Statin and risk-enhancer discussion per 2018/2019 ACC/AHA guidance.',this.src)}},

bpclass:{name:'BP Classification',icon:'gauge',desc:'ACC/AHA 2017 blood pressure categories.',src:'Whelton PK et al., 2017 ACC/AHA hypertension guideline',
 fields:[F.num('sbp','Systolic BP',{min:50,max:300,unit:'mmHg'}),F.num('dbp','Diastolic BP',{min:30,max:200,unit:'mmHg'})],
 compute(v){if(v.dbp>=v.sbp)err('Diastolic must be lower than systolic.');
  const c=(v.sbp>180||v.dbp>120)?['Hypertensive crisis — evaluate urgently','bad']:(v.sbp>=140||v.dbp>=90)?['Stage 2 hypertension','bad']:(v.sbp>=130||v.dbp>=80)?['Stage 1 hypertension','warn']:v.sbp>=120?['Elevated','info']:['Normal','ok'];
  return R(v.sbp+'/'+v.dbp+' — '+c[0].split(' — ')[0],c[1],[['Reading',v.sbp+'/'+v.dbp+' mmHg'],['Category',c[0]]],'Classification is based on the average of ≥ 2 careful readings on ≥ 2 occasions.',this.src)}},

qtc:{name:'QTc Calculator',icon:'activity',desc:'Corrected QT by Bazett and Fridericia.',src:'Bazett 1920; Fridericia 1920; AHA thresholds',
 fields:[F.num('qt','QT interval',{min:200,max:700,unit:'ms'}),F.num('hr','Heart rate',{min:30,max:220,unit:'bpm'})],
 compute(v){const rr=60/v.hr,baz=v.qt/Math.sqrt(rr),fri=v.qt/Math.cbrt(rr);
  const lim=v.hr>=60&&v.hr<=100?'':' (correction formulas are least reliable at extremes of heart rate)';
  const prolonged=baz>450;
  return R('QTc (Bazett) '+Math.round(baz)+' ms',baz>500?'bad':baz>450?'warn':'ok',[['QTc — Bazett',Math.round(baz)+' ms'],['QTc — Fridericia',Math.round(fri)+' ms'],['RR interval',fmt(rr,2)+' s']],'Prolonged if > 450 ms (men) or > 460 ms (women); > 500 ms carries elevated torsades risk.'+lim,this.src)}},

chadsvasc:{name:'CHA₂DS₂-VASc Score',icon:'clipboard',desc:'Stroke risk in non-valvular atrial fibrillation.',src:'Lip GY et al., Chest 2010; annual rates per Friberg 2012',
 fields:[F.chk('c','Congestive heart failure / LV dysfunction',1,{full:1}),F.chk('h','Hypertension',1,{full:1}),
  F.sel('age','Age',[['0','< 65 (0)'],['1','65–74 (+1)'],['2','≥ 75 (+2)']],{full:1}),
  F.chk('d','Diabetes mellitus',1,{full:1}),F.chk('s','Prior stroke / TIA / thromboembolism (+2)',2,{full:1}),
  F.chk('v','Vascular disease (MI, PAD, aortic plaque)',1,{full:1}),F.chk('f','Female sex',1,{full:1})],
 compute(v){const s=(v.c?1:0)+(v.h?1:0)+(+v.age)+(v.d?1:0)+(v.s?2:0)+(v.v?1:0)+(v.f?1:0);
  const rates={0:'0.2%',1:'0.6%',2:'2.2%',3:'3.2%',4:'4.8%',5:'7.2%',6:'9.7%',7:'11.2%',8:'10.8%',9:'12.2%'};
  const male=!v.f;
  const anticoag=(male&&s>=2)||(!male&&s>=3)?['Oral anticoagulation recommended','bad']:(male&&s===1)||(!male&&s===2)?['Consider oral anticoagulation','warn']:['Anticoagulation generally not indicated','ok'];
  return R('CHA₂DS₂-VASc '+s,anticoag[1],[['Score',s+' / 9'],['Approx. annual stroke risk',rates[s]],['Guideline direction',anticoag[0]]],'Female sex is a risk modifier — a score of 1 from sex alone is treated as 0 for treatment decisions.',this.src)}},

hasbled:{name:'HAS-BLED Score',icon:'droplet',desc:'Major bleeding risk on anticoagulation in AF.',src:'Pisters R et al., Chest 2010',
 fields:[F.chk('h','Hypertension (uncontrolled, SBP > 160 mmHg)',1,{full:1}),F.chk('a1','Abnormal renal function (dialysis, transplant, Cr > 2.26 mg/dL)',1,{full:1}),
  F.chk('a2','Abnormal liver function (cirrhosis, bilirubin > 2×, AST/ALT > 3× normal)',1,{full:1}),F.chk('s','Stroke history',1,{full:1}),
  F.chk('b','Bleeding history or predisposition',1,{full:1}),F.chk('l','Labile INR (TTR < 60%)',1,{full:1}),F.chk('e','Elderly (age > 65)',1,{full:1}),
  F.chk('d1','Drugs predisposing to bleeding (antiplatelets, NSAIDs)',1,{full:1}),F.chk('d2','Alcohol ≥ 8 drinks/week',1,{full:1})],
 compute(v){let s=0;for(const f of this.fields)if(v[f.k])s+=1;
  return R('HAS-BLED '+s,s>=3?'warn':'ok',[['Score',s+' / 9'],['Interpretation',s>=3?'High bleeding risk — caution, address modifiable factors, review regularly':'Lower bleeding risk']],'A high HAS-BLED score flags modifiable bleeding risks — it is not by itself a reason to withhold anticoagulation.',this.src)}},

shock:{name:'Shock Index',icon:'alert',desc:'Heart rate ÷ systolic BP — occult shock screen.',src:'Allgöwer & Burri 1967; SI > 0.9 associated with instability',
 fields:[F.num('hr','Heart rate',{min:20,max:250,unit:'bpm'}),F.num('sbp','Systolic BP',{min:40,max:300,unit:'mmHg'})],
 compute(v){const si=v.hr/v.sbp;
  return R('Shock index '+fmt(si,2),si>1.3?'bad':si>0.9?'warn':'ok',[['Shock index',fmt(si,2)],['Reference','Normal ≈ 0.5–0.7; > 0.9 concerning']],si>0.9?'Elevated shock index — associated with hemodynamic instability and transfusion need even with normal-appearing vitals.':null,this.src)}},

hrzone:{name:'Heart Rate Zones',icon:'heartpulse',desc:'Training zones by the Karvonen (heart-rate reserve) method.',src:'Karvonen MJ, 1957',
 fields:[F.num('age','Age',{min:10,max:100,unit:'yr'}),F.num('rhr','Resting heart rate',{min:30,max:120,unit:'bpm'})],
 compute(v){const max=220-v.age,res=max-v.rhr;
  const z=p=>Math.round(v.rhr+res*p);
  return R('Max HR ≈ '+max+' bpm','info',[['Estimated max HR',max+' bpm'],['Zone 1 — very light (50–60%)',z(.5)+'–'+z(.6)+' bpm'],['Zone 2 — light (60–70%)',z(.6)+'–'+z(.7)+' bpm'],['Zone 3 — moderate (70–80%)',z(.7)+'–'+z(.8)+' bpm'],['Zone 4 — hard (80–90%)',z(.8)+'–'+z(.9)+' bpm'],['Zone 5 — maximum (90–100%)',z(.9)+'–'+max+' bpm']],null,this.src)}},
};
