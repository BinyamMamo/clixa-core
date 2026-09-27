/* Oncology — calculator definitions.
   Bodies ported verbatim from the legacy single-file app; the golden
   snapshot in test/ proves they are byte-identical. */
import type { Calculator } from '../types';
import { fmt } from '../format';
import { R } from '../result';
import { F } from '../fields';

export const oncology: Record<string, Calculator> = {
ecog:{name:'ECOG Performance Status',icon:'user',desc:'ECOG/WHO performance status with Karnofsky equivalent.',src:'Oken MM et al., Am J Clin Oncol 1982',
 fields:[F.sel('g','Grade',[['0','0 — Fully active, no restriction'],['1','1 — Restricted in strenuous activity; ambulatory, light work possible'],['2','2 — Ambulatory, capable of self-care; up > 50% of waking hours; no work'],['3','3 — Limited self-care; confined to bed/chair > 50% of waking hours'],['4','4 — Completely disabled; no self-care; totally confined to bed/chair'],['5','5 — Dead']],{full:1})],
 compute(v){const k={0:'90–100',1:'70–80',2:'50–60',3:'30–40',4:'10–20',5:'0'};
  return R('ECOG '+v.g,+v.g<=1?'ok':+v.g===2?'warn':'bad',[['ECOG grade',v.g],['Karnofsky equivalent',k[v.g]+'%']],'ECOG 0–1 (sometimes 2) is a common eligibility threshold for systemic therapy and trials.',this.src)}},

chemodose:{name:'Chemo Dose by BSA',icon:'pill',desc:'Body-surface-area–based chemotherapy dose.',src:'Mosteller BSA; dose = BSA × prescribed mg/m²',
 fields:[F.num('wt','Weight',{units:['kg','lb'],min:10,max:300}),F.num('ht','Height',{units:['cm','in'],min:80,max:250}),F.num('dose','Prescribed dose',{min:0.1,max:10000,step:.1,unit:'mg/m²'})],
 compute(v){const bsa=Math.sqrt(v.ht*v.wt/3600),total=bsa*v.dose;
  return R('Dose '+fmt(total)+' mg','info',[['BSA (Mosteller)',fmt(bsa,2)+' m²'],['Prescribed',fmt(v.dose)+' mg/m²'],['Calculated total dose',fmt(total,1)+' mg']],'Verify against protocol banding/rounding rules and any BSA caps before prescribing.',this.src)}},

anc:{name:'Absolute Neutrophil Count',icon:'shield',desc:'ANC with CTCAE neutropenia grading.',src:'ANC = WBC × (neutrophils% + bands%) ⁄ 100; CTCAE v5 grades',
 fields:[F.num('wbc','WBC',{min:0.05,max:200,step:.01,unit:'×10⁹/L'}),F.num('neut','Neutrophils',{min:0,max:100,unit:'%'}),F.num('bands','Bands',{min:0,max:50,unit:'%',opt:1})],
 compute(v){const anc=v.wbc*1000*((v.neut+(v.bands||0))/100);
  const b=anc>=1500?['No significant neutropenia','ok']:anc>=1000?['Grade 2 — mild-moderate neutropenia','warn']:anc>=500?['Grade 3 — severe neutropenia','bad']:['Grade 4 — profound neutropenia (< 500)','bad'];
  return R('ANC '+Math.round(anc)+' /µL',b[1],[['ANC',Math.round(anc)+' cells/µL'],['CTCAE category',b[0]]],anc<500?'Febrile neutropenia risk — fever in this range is a medical emergency requiring urgent empiric antibiotics.':null,this.src)}},

calvert:{name:'Carboplatin Dose (Calvert)',icon:'flask',desc:'AUC-based carboplatin dosing.',src:'Calvert AH et al., J Clin Oncol 1989',
 fields:[F.num('auc','Target AUC',{min:1,max:8,step:.5,unit:'mg/mL·min'}),F.num('gfr','GFR / CrCl',{min:5,max:250,unit:'mL/min'})],
 compute(v){const capped=Math.min(v.gfr,125),dose=v.auc*(capped+25);
  const rows=[['Formula','Dose = AUC × (GFR + 25)'],['GFR used',capped+' mL/min'+(v.gfr>125?' (capped from '+v.gfr+')':'')],['Carboplatin dose',Math.round(dose)+' mg']];
  return R('Carboplatin '+Math.round(dose)+' mg',v.gfr>125?'warn':'info',rows,v.gfr>125?'GFR capped at 125 mL/min per FDA guidance to avoid overdosing with normalized creatinine assays.':'Many protocols cap GFR at 125 mL/min; verify with your institution.',this.src)}},
};
