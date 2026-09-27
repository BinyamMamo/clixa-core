/* Nutrition & severe acute malnutrition — Ethiopian national SAM guideline.
   Ported verbatim from the legacy app. */
import type { Calculator } from '../types';
import { daysBetween, fmt } from '../format';
import { dboth } from '../ethiopian';
import { err } from '../validate';
import { R } from '../result';
import { F, SEX } from '../fields';
import { SACHET_G, SACHET_KCAL, WHO_LMS, appetiteMin, fracS, round5, wastLabel, zWHO, zfmt } from '../who/zscore';

export const nutrition: Record<string, Calculator> = {
anthro: {name:'Anthropometry & SAM Classifier',icon:'ruler',desc:'WHO z-scores, MUAC and edema — SAM/MAM classification.',src:'Ethiopian National Guideline for Management of Acute Malnutrition (2019); WHO Child Growth Standards 2006',
 fields:[F.sel('sex','Sex',SEX),F.num('agem','Age in months (if known)',{min:0,max:60,step:.1,opt:1}),
  F.sel('cal','Calendar (for date of birth)',[['e','Ethiopian (\u12d3.\u121d.)'],['g','Gregorian']],{full:1}),
  F.date('dob','Date of birth (optional \u2014 used if age not entered)',{full:1,opt:1}),
  F.num('wt','Weight',{min:1,max:45,step:.01,unit:'kg'}),F.num('len','Length / height',{min:38,max:130,step:.1,unit:'cm'}),
  F.sel('pos','Measured',[['ly','Lying (recumbent length)'],['st','Standing (height)']]),
  F.num('muac','MUAC (optional)',{min:6,max:35,step:.1,unit:'cm; 11.5 cm = 115 mm',opt:1}),
  F.sel('ed','Bilateral pitting edema',[['0','None'],['1','+ \u2014 both feet/ankles'],['2','++ \u2014 feet + lower legs / hands / forearms'],['3','+++ \u2014 generalized, including face']],{full:1})],
 compute(v){
  let age=null,ageSrc='';
  if(v.agem!==null&&v.agem!==undefined){age=v.agem;ageSrc='entered'}
  else if(v.dob){const d=new Date(v.dob+'T00:00:00');if(d>new Date())err('Date of birth cannot be in the future.');
   age=daysBetween(d,new Date())/30.4375;ageSrc='from DOB ('+dboth(d)+')'}
  if(age!==null&&age>60.5)err('This tool covers children 0\u201359 months (WHO 2006 standards). Age exceeds 60 months.');
  const sx=v.sex==='m'?'b':'g';
  const useWfl=age!==null?age<24:v.len<87;
  let hl=v.len,adj='';
  if(useWfl&&v.pos==='st'){hl=v.len+0.7;adj=' (+0.7 cm: standing \u2192 length)'}
  if(!useWfl&&v.pos==='ly'){hl=v.len-0.7;adj=' (\u22120.7 cm: lying \u2192 height)'}
  const whz=zWHO(WHO_LMS[(useWfl?'wfl_':'wfh_')+sx],hl,v.wt);
  let wfaZ=null,hfaZ=null;
  if(age!==null){wfaZ=zWHO(WHO_LMS['wfa_'+sx],age,v.wt);
   const hl2=age<24?(v.pos==='st'?v.len+0.7:v.len):(v.pos==='ly'?v.len-0.7:v.len);
   hfaZ=zWHO(WHO_LMS['lhfa_'+sx],age,hl2)}
  const edg=+v.ed, edema=edg>0;
  const muacSAM=v.muac!==null&&v.muac<11.5,muacMAM=v.muac!==null&&v.muac>=11.5&&v.muac<12.0;
  const wSAM=whz!==null&&whz<-3, wMAM=whz!==null&&whz>=-3&&whz<-2;
  let cls,tone;
  if(edema&&wSAM){cls='SAM \u2014 marasmic-kwashiorkor';tone='bad'}
  else if(edema){cls='SAM \u2014 edematous (kwashiorkor, '+'+'.repeat(edg)+')';tone='bad'}
  else if(wSAM||muacSAM){cls='SAM \u2014 severe wasting (marasmus)';tone='bad'}
  else if(wMAM||muacMAM){cls='Moderate acute malnutrition (MAM)';tone='warn'}
  else{cls='No acute malnutrition';tone='ok'}
  const rows=[[useWfl?'Weight-for-length (WHZ)':'Weight-for-height (WHZ)',zfmt(whz)+wastLabel(whz)],
   [useWfl?'Length used':'Height used',fmt(hl)+' cm'+adj]];
  if(age!==null){rows.push(['Age',fmt(age)+' months ('+ageSrc+')'],
   ['Weight-for-age',zfmt(wfaZ)+(wfaZ===null?'':wfaZ<-3?' \u2014 severe underweight':wfaZ<-2?' \u2014 underweight':' \u2014 within normal range')],
   ['Height/length-for-age',zfmt(hfaZ)+(hfaZ===null?'':hfaZ<-3?' \u2014 severe stunting':hfaZ<-2?' \u2014 stunting':' \u2014 within normal range')])}
  if(v.muac!==null)rows.push(['MUAC',fmt(v.muac)+' cm \u2014 '+(muacSAM?'SAM (< 11.5 cm)':muacMAM?'MAM (11.5 to < 12.0 cm)':'normal (\u2265 12.0 cm)')]);
  rows.push(['Bilateral pitting edema',edg?'+'.repeat(edg):'None'],['Classification',cls]);
  rows.push(['Next step',tone==='bad'?'Do an appetite test and full clinical check. Uncomplicated SAM + passed appetite test \u2192 OTP with RUTF. Failed appetite test, medical complications, edema +++, marasmic-kwashiorkor or infant < 6 months \u2192 inpatient stabilization (F-75).':tone==='warn'?'Refer to targeted supplementary feeding (TSFP) where available; counsel on feeding and recheck in 2 weeks.':'Routine growth monitoring and IYCF counseling.']);
  let note='WHZ cutoffs (6\u201359 mo): < \u22123 SAM, \u22123 to < \u22122 MAM. MUAC: < 11.5 cm SAM, 11.5\u2013< 12.0 cm MAM. Any bilateral pitting edema = SAM. Discharge as cured after \u2265 2 weeks without edema and anthropometric recovery per protocol.';
  if(age!==null&&age<6)note='Infant < 6 months: admit for inpatient care if WFL < \u22123, any edema, recent weight loss or ineffective feeding \u2014 MUAC cutoffs and OTP/RUTF do not apply at this age. '+note;
  if(whz===null)note='Measurement outside the WHO table range (length 45\u2013110 cm lying / height 65\u2013120 cm standing) \u2014 WHZ not computable; classify by MUAC and edema. '+note;
  return R(cls,tone,rows,note,this.src)}},

appetite: {name:'RUTF Appetite Test',icon:'clipcheck',desc:'Minimum RUTF amount for a valid appetite test, with pass/fail routing (OTP vs inpatient).',src:'Ethiopian National Guideline for Management of Acute Malnutrition (2019) \u2014 CMAM appetite test',
 fields:[F.num('wt','Weight',{min:2,max:40,step:.1,unit:'kg'}),
  F.sel('res','Result of the test',[['nd','Not done yet \u2014 show the minimum amount'],['pass','PASSED \u2014 ate at least the minimum amount'],['fail','FAILED \u2014 ate less than the minimum amount']],{full:1})],
 compute(v){const[frac,grams]=appetiteMin(v.wt);
  const rows=[['Minimum amount to pass',frac+' ('+grams+')'],['Sachet reference','92 g \u2248 500 kcal (RUTF)']];
  let badge,tone,note='Do the test in a quiet corner: the caregiver offers RUTF and clean water, without forcing, for up to one hour. The child must take at least the minimum amount for their weight.';
  if(v.res==='pass'){badge='Appetite test PASSED';tone='ok';rows.push(['Routing','Uncomplicated SAM \u2192 outpatient care (OTP) with weekly RUTF ration \u2014 if no medical complications and no edema +++'])}
  else if(v.res==='fail'){badge='Appetite test FAILED';tone='bad';rows.push(['Routing','Refer for inpatient stabilization (F-75, Phase 1) \u2014 failed appetite test is an admission criterion'])}
  else{badge='Minimum: '+frac;tone='info'}
  return R(badge,tone,rows,note,this.src)}},

f75f100: {name:'F-75 / F-100 / RUTF Schedule Engine',icon:'droplet',desc:'F-75 / F-100 / RUTF volumes by weight and SAM phase.',src:'Ethiopian SAM guideline (2019); WHO management of severe acute malnutrition',
 fields:[F.num('wt','Current weight',{min:1,max:40,step:.01,unit:'kg'}),
  F.sel('ph','Phase of management',[['p1','Phase 1 \u2014 Stabilization (F-75)'],['tf','Transition \u2014 F-100'],['tr','Transition \u2014 RUTF'],['p2','Phase 2 \u2014 Rehabilitation, inpatient (F-100)'],['otp','Outpatient (OTP) \u2014 RUTF']],{full:1}),
  F.sel('feeds','Feeds per day',[['8','8 feeds (every 3 h) \u2014 standard'],['12','12 feeds (every 2 h) \u2014 hypoglycemia / very sick'],['6','6 feeds (every 4 h)'],['5','5 feeds']],{full:1}),
  F.chk('ed3','Severe bilateral edema (+++)',0,{full:1}),
  F.sel('app','Appetite test',[['nd','Not done / not applicable'],['pass','Passed'],['fail','Failed']],{full:1})],
 compute(v){const wt=v.wt,feeds=+v.feeds;let rows=[],badge,tone='info',note='';
  if(v.ph==='p1'){
   const mlkg=v.ed3?100:130,daily=mlkg*wt,per=round5(daily/feeds);
   badge='F-75 \u2014 '+Math.round(daily)+' mL/day \u00b7 '+per+' mL \u00d7 '+feeds;
   rows=[['Milk','F-75 (75 kcal / 100 mL)'],['Volume target',mlkg+' mL/kg/day'+(v.ed3?' (reduced for edema +++)':'')],['Total daily volume',Math.round(daily)+' mL'],['Per feed ('+feeds+' feeds)',per+' mL'],['Energy','\u2248 '+Math.round(daily*0.75)+' kcal/day ('+fmt(daily*0.75/wt,0)+' kcal/kg)']];
   note='Feed by cup (NG tube only if taking < 80% of feeds). Continue breastfeeding on demand. Do not aim for weight gain in Phase 1. Move to transition when appetite returns and edema is subsiding.'}
  else if(v.ph==='tf'){
   if(v.ed3)note='Edema +++ should be clearly subsiding before transition. ';
   const daily=130*wt,per=round5(daily/feeds);
   badge='F-100 \u2014 '+Math.round(daily)+' mL/day \u00b7 '+per+' mL \u00d7 '+feeds;
   rows=[['Milk','F-100 (100 kcal / 100 mL)'],['Volume','Same volume as Phase 1 F-75: 130 mL/kg/day'],['Total daily volume',Math.round(daily)+' mL'],['Per feed ('+feeds+' feeds)',per+' mL'],['Energy','\u2248 '+Math.round(daily)+' kcal/day (130 kcal/kg)']];
   note+='Transition typically lasts 1\u20133 days: energy rises \u2248 30% at unchanged volume. Watch for fluid overload and refeeding problems (\u2191RR, \u2191HR).'}
  else if(v.ph==='tr'){
   const kcal=130*wt,sd=kcal/SACHET_KCAL;
   badge='RUTF \u2014 '+fracS(Math.ceil(sd*4)/4)+' sachet/day (transition)';
   rows=[['Energy target','130 kcal/kg/day \u2192 '+Math.round(kcal)+' kcal/day'],['RUTF',fracS(Math.ceil(sd*4)/4)+' sachet/day (\u2248 '+Math.round(sd*SACHET_G)+' g)'],['Offer as','Small amounts across all '+feeds+' feeds, with safe water']];
   note='If the child does not finish the RUTF portion, top the feed up with F-75 (or F-100) to complete the energy target. Full RUTF acceptance over 2\u20133 days indicates readiness for OTP or Phase 2.'}
  else if(v.ph==='p2'){
   const kcal=200*wt,daily=kcal,per=round5(daily/feeds);
   badge='F-100 \u2014 '+Math.round(daily)+' mL/day \u00b7 '+per+' mL \u00d7 '+feeds;
   rows=[['Milk','F-100 (100 kcal / 100 mL)'],['Energy target','150\u2013220 kcal/kg/day (calculated here at 200)'],['Total daily volume',Math.round(daily)+' mL ('+Math.round(kcal)+' kcal)'],['Per feed ('+feeds+' feeds)',per+' mL'],['Expected weight gain','\u2265 10 g/kg/day on inpatient rehabilitation']];
   note='Feed to appetite within the 150\u2013220 kcal/kg/day range; add iron in Phase 2 only. Track weight daily with the weight-gain tool.'}
  else{
   const kcal=200*wt,sd=kcal/SACHET_KCAL,daily=Math.ceil(sd*4)/4,weekly=Math.ceil(kcal*7/SACHET_KCAL);
   badge='RUTF \u2014 '+fracS(daily)+' sachet/day \u00b7 '+weekly+' /week';
   rows=[['Energy target','\u2248 200 kcal/kg/day (protocol range 170\u2013200) \u2192 '+Math.round(kcal)+' kcal/day'],['RUTF per day',fracS(daily)+' sachet (\u2248 '+Math.round(sd*SACHET_G)+' g)'],['Weekly ration',weekly+' sachets'],['Sachet reference','92 g \u2248 500 kcal']];
   note='Weekly OTP follow-up: weight, MUAC, edema and clinical check. Breastfeed before RUTF; give plenty of safe water; use the program ration card for the final band. Amoxicillin at admission per protocol.'}
  if(v.app==='fail'&&(v.ph==='tr'||v.ph==='otp')){tone='bad';rows.push(['\u26a0 Appetite test failed','RUTF-based phases require a passed appetite test \u2014 manage inpatient with F-75 (Phase 1) instead'])}
  else if(v.ph==='p1'&&v.app==='pass')rows.push(['Appetite returning','Passed appetite test + subsiding edema supports moving to transition']);
  return R(badge,tone,rows,note,this.src)}},

rutf: {name:'RUTF Sachet Dosing (OTP)',icon:'flame',desc:'Outpatient RUTF ration from current weight \u2014 sachets per day and per week.',src:'Ethiopian SAM guideline (2019) \u2014 OTP; RUTF 92 g \u2248 500 kcal',
 fields:[F.num('wt','Current weight',{min:3,max:60,step:.01,unit:'kg'})],
 compute(v){const kcal=200*v.wt,sd=kcal/SACHET_KCAL,daily=Math.ceil(sd*4)/4,weekly=Math.ceil(kcal*7/SACHET_KCAL);
  return R('RUTF '+fracS(daily)+' /day \u00b7 '+weekly+' /week','info',
   [['Energy target','\u2248 200 kcal/kg/day (protocol range 170\u2013200)'],['Exact requirement',Math.round(kcal)+' kcal/day = '+fmt(sd,2)+' sachets'],['Per day (rounded \u00bc)',fracS(daily)+' sachet \u2248 '+Math.round(sd*SACHET_G)+' g'],['Weekly ration to dispense',weekly+' sachets'],['Sachet reference','92 g \u2248 500 kcal']],
   'Round to the program ration card band at distribution. Breastfeed first, then RUTF, with plenty of safe water; RUTF is the treatment food \u2014 do not share it. Weekly OTP review of weight, MUAC and edema.',this.src)}},

resomal: {name:'ReSoMal Rehydration',icon:'flask',desc:'Rehydration volumes for dehydrated SAM children (not for shock).',src:'WHO management of SAM; Ethiopian SAM guideline (2019)',
 fields:[F.num('wt','Weight',{min:2,max:40,step:.1,unit:'kg'})],
 compute(v){const dose=round5(5*v.wt);
  return R('ReSoMal '+dose+' mL every 30 min \u00d7 2 h','warn',
   [['First 2 hours','5 mL/kg every 30 minutes = '+dose+' mL per dose ('+dose*4+' mL total)'],['Next 4\u201310 hours','5\u201310 mL/kg/hour = '+round5(5*v.wt)+'\u2013'+round5(10*v.wt)+' mL/h, alternating with F-75'],['Reassess','Every 30 min for 2 h, then hourly \u2014 pulse, RR, liver size, urine, hydration signs']],
   'Oral or NG only \u2014 IV fluids in SAM are reserved for shock. STOP ReSoMal if respiratory or pulse rate rises, jugular veins engorge, or edema increases. Standard ORS is not appropriate in SAM (too much sodium, too little potassium).',this.src)}},

wtgain: {name:'Weight Gain Velocity',icon:'trend',desc:'g/kg/day weight-gain rate for nutritional rehabilitation monitoring.',src:'WHO / Ethiopian SAM guideline \u2014 rehabilitation monitoring',
 fields:[F.num('w1','Reference weight (admission / lowest)',{min:1,max:60,step:.01,unit:'kg'}),F.num('w2','Current weight',{min:1,max:60,step:.01,unit:'kg'}),F.num('days','Days between measurements',{min:1,max:120})],
 compute(v){const g=((v.w2-v.w1)*1000)/(v.w1*v.days);
  const b=v.w2<v.w1?['Weight LOSS \u2014 reassess urgently (intake, infection, protocol adherence)','bad']:g>=10?['\u2265 10 g/kg/day \u2014 good (target on F-100 rehabilitation)','ok']:g>=5?['5\u201310 g/kg/day \u2014 moderate; review intake and check for missed infection','warn']:['< 5 g/kg/day \u2014 poor; investigate (intake, TB/HIV, UTI, wrong preparation, sharing of RUTF)','warn'];
  return R(fmt(g,1)+' g/kg/day',b[1],[['Weight change',fmt((v.w2-v.w1)*1000,0)+' g over '+v.days+' day(s)'],['Velocity',fmt(g,1)+' g/kg/day'],['Interpretation',b[0]]],
  'Outpatient (RUTF) gains are typically \u2265 4\u20135 g/kg/day; inpatient Phase 2 targets \u2265 10 g/kg/day. Edematous children first lose edema fluid \u2014 interpret early trends accordingly.',this.src)}},
};
