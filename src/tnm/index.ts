/* AJCC 8th edition / FIGO stage-grouping tables for 14 cancers.
   Ported verbatim; test/golden.spec.ts enumerates every T/N/M combination. */
import type { Tone } from '../types';

export interface TnmPicker { k: string; label: string; opts: [string, string][] }
export interface TnmExtra {
  k: string; label: string; type?: 'num' | 'sel';
  min?: number; max?: number; opts?: [string, string][];
  /** Truthy when the value must be parsed as an integer (written as `int:1`). */
  int?: boolean | 1;
}
export interface CancerTable {
  label: string;
  stages: string[];
  note: string;
  T?: [string, string][];
  N?: [string, string][];
  M?: [string, string][];
  pickers?: TnmPicker[];
  extra?: TnmExtra[];
  tnmEq?: Record<string, string>;
  stage: (v: Record<string, any>) => string | null | undefined;
}

export const TNM: Record<string, CancerTable> = {
breast:{label:'Breast (AJCC 8th — anatomic)',stages:['0','IA','IB','IIA','IIB','IIIA','IIIB','IIIC','IV'],
 T:[['Tis','Tis — carcinoma in situ (DCIS / Paget without tumor)'],['T0','T0 — no evidence of primary tumor'],['T1','T1 — ≤ 20 mm'],['T2','T2 — > 20 mm to ≤ 50 mm'],['T3','T3 — > 50 mm'],['T4','T4 — chest wall / skin involvement, incl. inflammatory carcinoma']],
 N:[['N0','N0 — no regional node metastasis'],['N1mi','N1mi — micrometastases (> 0.2 mm to ≤ 2 mm)'],['N1','N1 — movable ipsilateral level I–II axillary nodes'],['N2','N2 — fixed/matted axillary, or internal mammary without axillary'],['N3','N3 — infraclavicular, supraclavicular, or IM + axillary nodes']],
 M:[['M0','M0 — no distant metastasis'],['M1','M1 — distant metastasis']],
 stage(v){const{t,n,m}=v;
  if(m==='M1')return'IV';
  if(n==='N3')return'IIIC';
  if(t==='T4')return'IIIB';
  if(n==='N2')return'IIIA';
  if(t==='T3')return n==='N1'||n==='N1mi'?'IIIA':'IIB';
  if(t==='T2')return n==='N1'||n==='N1mi'?'IIB':'IIA';
  if(t==='T1'||t==='T0'){if(n==='N1')return'IIA';if(n==='N1mi')return'IB';return t==='T1'?'IA':null}
  if(t==='Tis')return n==='N0'?'0':null;
  return null},
 note:'Anatomic stage — prognostic staging additionally requires tumor grade and ER/PR/HER2 status. T3 N1mi is grouped with N1 (IIIA).'},

lung:{label:'Lung — NSCLC (AJCC 8th)',stages:['Occ','0','IA1','IA2','IA3','IB','IIA','IIB','IIIA','IIIB','IIIC','IVA','IVB'],
 T:[['TX','TX — primary not assessable / occult (positive cytology only)'],['Tis','Tis — carcinoma in situ'],['T1mi','T1mi — minimally invasive adenocarcinoma'],['T1a','T1a — ≤ 1 cm'],['T1b','T1b — > 1 to 2 cm'],['T1c','T1c — > 2 to 3 cm'],['T2a','T2a — > 3 to 4 cm (or main bronchus / visceral pleura / atelectasis)'],['T2b','T2b — > 4 to 5 cm'],['T3','T3 — > 5 to 7 cm, or chest wall / pericardium / phrenic nerve, or separate nodule same lobe'],['T4','T4 — > 7 cm, or mediastinum / diaphragm / heart / great vessels / carina, or nodule in different ipsilateral lobe']],
 N:[['N0','N0 — no regional node metastasis'],['N1','N1 — ipsilateral peribronchial / hilar nodes'],['N2','N2 — ipsilateral mediastinal / subcarinal nodes'],['N3','N3 — contralateral or scalene / supraclavicular nodes']],
 M:[['M0','M0 — no distant metastasis'],['M1a','M1a — contralateral-lobe nodule, pleural/pericardial nodules or malignant effusion'],['M1b','M1b — single extrathoracic metastasis'],['M1c','M1c — multiple extrathoracic metastases']],
 stage(v){const{t,n,m}=v;
  if((t==='TX'||t==='Tis')&&n!=='N0')return null;
  if(m==='M1c')return'IVB';
  if(m==='M1a'||m==='M1b')return'IVA';
  const t12=['T1mi','T1a','T1b','T1c','T2a','T2b'].includes(t);
  if(n==='N3')return t12?'IIIB':'IIIC';
  if(n==='N2')return t12?'IIIA':'IIIB';
  if(n==='N1')return t12?'IIB':'IIIA';
  if(t==='TX')return'Occ';
  if(t==='Tis')return'0';
  if(t==='T1mi'||t==='T1a')return'IA1';
  if(t==='T1b')return'IA2';
  if(t==='T1c')return'IA3';
  if(t==='T2a')return'IB';
  if(t==='T2b')return'IIA';
  if(t==='T3')return'IIB';
  if(t==='T4')return'IIIA';
  return null},
 note:'"Occ" = occult carcinoma (TX N0 M0). TX or Tis with nodal disease cannot be stage-grouped — assign the T category first.'},

colorectal:{label:'Colorectal (AJCC 8th)',stages:['0','I','IIA','IIB','IIC','IIIA','IIIB','IIIC','IVA','IVB','IVC'],
 T:[['Tis','Tis — intramucosal carcinoma'],['T1','T1 — invades submucosa'],['T2','T2 — invades muscularis propria'],['T3','T3 — through muscularis propria into pericolorectal tissues'],['T4a','T4a — penetrates visceral peritoneum'],['T4b','T4b — invades / adherent to adjacent organs']],
 N:[['N0','N0 — no regional node metastasis'],['N1a','N1a — 1 regional node'],['N1b','N1b — 2–3 regional nodes'],['N1c','N1c — tumor deposits without nodal metastasis'],['N2a','N2a — 4–6 regional nodes'],['N2b','N2b — ≥ 7 regional nodes']],
 M:[['M0','M0 — no distant metastasis'],['M1a','M1a — one site/organ, no peritoneal metastasis'],['M1b','M1b — ≥ 2 sites/organs, no peritoneal metastasis'],['M1c','M1c — peritoneal metastasis ± other sites']],
 stage(v){const{t,n,m}=v;
  if(m==='M1a')return'IVA';if(m==='M1b')return'IVB';if(m==='M1c')return'IVC';
  const n1=['N1a','N1b','N1c'].includes(n);
  if(n==='N0'){if(t==='Tis')return'0';if(t==='T1'||t==='T2')return'I';if(t==='T3')return'IIA';if(t==='T4a')return'IIB';if(t==='T4b')return'IIC';return null}
  if(t==='Tis')return null;
  if(n1){if(t==='T1'||t==='T2')return'IIIA';if(t==='T3'||t==='T4a')return'IIIB';return'IIIC'}
  if(n==='N2a'){if(t==='T1')return'IIIA';if(t==='T2'||t==='T3')return'IIIB';return'IIIC'}
  if(n==='N2b'){if(t==='T1'||t==='T2')return'IIIB';return'IIIC'}
  return null},
 note:'Tis with nodal disease is not a valid combination — re-review pathology.'},

prostate:{label:'Prostate (AJCC 8th — prognostic)',stages:['I','IIA','IIB','IIC','IIIA','IIIB','IIIC','IVA','IVB'],
 T:[['cT1','cT1 (a–c) — not palpable; incidental or biopsy-detected'],['cT2a','cT2a — palpable, ≤ half of one lobe'],['cT2b','cT2b — palpable, > half of one lobe'],['cT2c','cT2c — palpable, both lobes'],['pT2','pT2 — organ-confined (pathologic)'],['T3a','T3a — extraprostatic extension / bladder-neck invasion'],['T3b','T3b — seminal vesicle invasion'],['T4','T4 — fixed, or invades adjacent structures (other than seminal vesicles)']],
 N:[['N0','N0 — no regional node metastasis'],['N1','N1 — regional lymph node metastasis']],
 M:[['M0','M0 — no distant metastasis'],['M1','M1 — distant metastasis (non-regional nodes, bone, viscera)']],
 extra:[{k:'psa',type:'num',label:'PSA (ng/mL)',min:0,max:10000},
        {k:'gg',type:'sel',int:1,label:'Biopsy Grade Group',opts:[['1','Grade Group 1 (Gleason ≤ 6)'],['2','Grade Group 2 (3+4=7)'],['3','Grade Group 3 (4+3=7)'],['4','Grade Group 4 (Gleason 8)'],['5','Grade Group 5 (Gleason 9–10)']]}],
 stage(v){const{t,n,m,psa,gg}=v;
  if(m==='M1')return'IVB';
  if(n==='N1')return'IVA';
  if(gg===5)return'IIIC';
  if(t==='T3a'||t==='T3b'||t==='T4')return'IIIB';
  if(psa>=20)return'IIIA';
  if(gg===3||gg===4)return'IIC';
  if(gg===2)return'IIB';
  if(psa>=10)return'IIA';
  if(t==='cT2b'||t==='cT2c')return'IIA';
  return'I'},
 note:'Prognostic stage groups (AJCC 8th) — require PSA and biopsy Grade Group. Rules evaluated top-down: M → N → GG5 → T3/T4 → PSA ≥ 20 → GG.'},

gastric:{label:'Stomach — gastric carcinoma (AJCC 8th, pathologic)',stages:['0','IA','IB','IIA','IIB','IIIA','IIIB','IIIC','IV'],
 T:[['Tis','Tis — carcinoma in situ / high-grade dysplasia'],['T1','T1 — lamina propria, muscularis mucosae or submucosa'],['T2','T2 — muscularis propria'],['T3','T3 — subserosal connective tissue'],['T4a','T4a — penetrates serosa (visceral peritoneum)'],['T4b','T4b — invades adjacent structures/organs']],
 N:[['N0','N0 — no regional node metastasis'],['N1','N1 — 1–2 regional nodes'],['N2','N2 — 3–6 regional nodes'],['N3a','N3a — 7–15 regional nodes'],['N3b','N3b — ≥ 16 regional nodes']],
 M:[['M0','M0 — no distant metastasis'],['M1','M1 — distant metastasis']],
 stage(v){const{t,n,m}=v;
  if(m==='M1')return'IV';
  if(t==='Tis')return n==='N0'?'0':null;
  const g={T1:{N0:'IA',N1:'IB',N2:'IIA',N3a:'IIB',N3b:'IIIB'},
           T2:{N0:'IB',N1:'IIA',N2:'IIB',N3a:'IIIA',N3b:'IIIB'},
           T3:{N0:'IIA',N1:'IIB',N2:'IIIA',N3a:'IIIB',N3b:'IIIC'},
           T4a:{N0:'IIB',N1:'IIIA',N2:'IIIA',N3a:'IIIB',N3b:'IIIC'},
           T4b:{N0:'IIIA',N1:'IIIB',N2:'IIIB',N3a:'IIIC',N3b:'IIIC'}};
  return(g[t]||{})[n]||null},
 note:'Pathologic (pTNM) stage groups after resection. Clinical (cTNM) and post-neoadjuvant (ypTNM) groupings differ.'},

pancreas:{label:'Pancreas — exocrine (AJCC 8th)',stages:['0','IA','IB','IIA','IIB','III','IV'],
 T:[['Tis','Tis — carcinoma in situ (incl. high-grade PanIN)'],['T1','T1 — ≤ 2 cm'],['T2','T2 — > 2 to ≤ 4 cm'],['T3','T3 — > 4 cm'],['T4','T4 — involves celiac axis, SMA and/or common hepatic artery']],
 N:[['N0','N0 — no regional node metastasis'],['N1','N1 — 1–3 regional nodes'],['N2','N2 — ≥ 4 regional nodes']],
 M:[['M0','M0 — no distant metastasis'],['M1','M1 — distant metastasis']],
 stage(v){const{t,n,m}=v;
  if(m==='M1')return'IV';
  if(t==='Tis')return n==='N0'?'0':null;
  if(t==='T4')return'III';
  if(n==='N2')return'III';
  if(n==='N1')return'IIB';
  return{T1:'IA',T2:'IB',T3:'IIA'}[t]||null},
 note:'T is defined by size regardless of extra-pancreatic extension; T4 (arterial involvement) is stage III at any N.'},

liver:{label:'Liver — hepatocellular carcinoma (AJCC 8th)',stages:['IA','IB','II','IIIA','IIIB','IVA','IVB'],
 T:[['T1a','T1a — solitary ≤ 2 cm'],['T1b','T1b — solitary > 2 cm without vascular invasion'],['T2','T2 — solitary > 2 cm with vascular invasion, or multiple ≤ 5 cm'],['T3','T3 — multiple, at least one > 5 cm'],['T4','T4 — major portal/hepatic vein branch, or adjacent organs (other than gallbladder), or perforated visceral peritoneum']],
 N:[['N0','N0 — no regional node metastasis'],['N1','N1 — regional lymph node metastasis']],
 M:[['M0','M0 — no distant metastasis'],['M1','M1 — distant metastasis']],
 stage(v){const{t,n,m}=v;
  if(m==='M1')return'IVB';
  if(n==='N1')return'IVA';
  return{T1a:'IA',T1b:'IB',T2:'II',T3:'IIIA',T4:'IIIB'}[t]||null},
 note:'TNM staging complements, but does not replace, functional systems (BCLC, Child-Pugh) in HCC treatment planning.'},

kidney:{label:'Kidney — renal cell carcinoma (AJCC 8th)',stages:['I','II','III','IV'],
 T:[['T1a','T1a — ≤ 4 cm, confined to kidney'],['T1b','T1b — > 4 to 7 cm, confined'],['T2a','T2a — > 7 to 10 cm, confined'],['T2b','T2b — > 10 cm, confined'],['T3a','T3a — renal vein, pelvicalyceal system, or perinephric/sinus fat (within Gerota)'],['T3b','T3b — IVC below the diaphragm'],['T3c','T3c — IVC above the diaphragm or IVC wall invasion'],['T4','T4 — beyond Gerota fascia (incl. contiguous adrenal)']],
 N:[['N0','N0 — no regional node metastasis'],['N1','N1 — regional lymph node metastasis']],
 M:[['M0','M0 — no distant metastasis'],['M1','M1 — distant metastasis']],
 stage(v){const{t,n,m}=v;
  if(m==='M1')return'IV';
  if(t==='T4')return'IV';
  if(n==='N1')return'III';
  if(t[1]==='3')return'III';
  if(t[1]==='2')return'II';
  return'I'},
 note:'Any-T N1 M0 disease is stage III; T4 or M1 is stage IV.'},

bladder:{label:'Bladder — urothelial carcinoma (AJCC 8th)',stages:['0a','0is','I','II','IIIA','IIIB','IVA','IVB'],
 T:[['Ta','Ta — non-invasive papillary carcinoma'],['Tis','Tis — carcinoma in situ ("flat tumor")'],['T1','T1 — subepithelial connective tissue (lamina propria)'],['T2a','T2a — inner half of muscularis propria'],['T2b','T2b — outer half of muscularis propria'],['T3a','T3a — microscopic perivesical tissue invasion'],['T3b','T3b — macroscopic perivesical mass'],['T4a','T4a — prostatic stroma, seminal vesicles, uterus or vagina'],['T4b','T4b — pelvic or abdominal wall']],
 N:[['N0','N0 — no regional node metastasis'],['N1','N1 — single node in true pelvis'],['N2','N2 — multiple nodes in true pelvis'],['N3','N3 — common iliac node(s)']],
 M:[['M0','M0 — no distant metastasis'],['M1a','M1a — non-regional lymph nodes only'],['M1b','M1b — other distant metastasis']],
 stage(v){const{t,n,m}=v;
  if(m==='M1b')return'IVB';
  if(m==='M1a')return'IVA';
  if(t==='T4b')return'IVA';
  const inv=['T1','T2a','T2b','T3a','T3b','T4a'].includes(t);
  if(n==='N2'||n==='N3')return inv?'IIIB':null;
  if(n==='N1')return inv?'IIIA':null;
  if(t==='Ta')return'0a';
  if(t==='Tis')return'0is';
  if(t==='T1')return'I';
  if(t==='T2a'||t==='T2b')return'II';
  if(t==='T3a'||t==='T3b'||t==='T4a')return'IIIA';
  return null},
 note:'Ta/Tis with nodal disease is not a valid grouping. N-positive disease requires an invasive T category (T1–T4a) for stage III.'},

melanoma:{label:'Melanoma — cutaneous (AJCC 8th, clinical)',stages:['0','IA','IB','IIA','IIB','IIC','III','IV'],
 T:[['Tis','Tis — melanoma in situ'],['T1a','T1a — < 0.8 mm, no ulceration'],['T1b','T1b — < 0.8 mm ulcerated, or 0.8–1.0 mm'],['T2a','T2a — > 1 to 2 mm, no ulceration'],['T2b','T2b — > 1 to 2 mm, ulcerated'],['T3a','T3a — > 2 to 4 mm, no ulceration'],['T3b','T3b — > 2 to 4 mm, ulcerated'],['T4a','T4a — > 4 mm, no ulceration'],['T4b','T4b — > 4 mm, ulcerated']],
 N:[['N0','N0 — no regional metastasis'],['N+','N+ — any nodal, in-transit, satellite or microsatellite metastasis']],
 M:[['M0','M0 — no distant metastasis'],['M1','M1 — distant metastasis (skin, nodes, lung, viscera, CNS)']],
 stage(v){const{t,n,m}=v;
  if(m==='M1')return'IV';
  if(n==='N+')return t==='Tis'?null:'III';
  if(t==='Tis')return'0';
  if(t==='T1a')return'IA';
  if(t==='T1b'||t==='T2a')return'IB';
  if(t==='T2b'||t==='T3a')return'IIA';
  if(t==='T3b'||t==='T4a')return'IIB';
  if(t==='T4b')return'IIC';
  return null},
 note:'Clinical stage groups. Pathologic stage III is subdivided (IIIA–IIID) using sentinel-node tumor burden and T category.'},

thyroid:{label:'Thyroid — differentiated (papillary / follicular, AJCC 8th)',stages:['I','II','III','IVA','IVB'],
 T:[['T1a','T1a — ≤ 1 cm, intrathyroidal'],['T1b','T1b — > 1 to 2 cm, intrathyroidal'],['T2','T2 — > 2 to 4 cm, intrathyroidal'],['T3a','T3a — > 4 cm, intrathyroidal'],['T3b','T3b — gross extrathyroidal extension into strap muscles'],['T4a','T4a — invades subcutaneous tissue, larynx, trachea, esophagus or recurrent laryngeal nerve'],['T4b','T4b — invades prevertebral fascia, carotid artery or mediastinal vessels']],
 N:[['N0','N0 — no regional node metastasis'],['N1a','N1a — level VI/VII (central compartment) nodes'],['N1b','N1b — lateral cervical or retropharyngeal nodes']],
 M:[['M0','M0 — no distant metastasis'],['M1','M1 — distant metastasis']],
 extra:[{k:'age',type:'num',label:'Age at diagnosis (years)',min:1,max:120}],
 stage(v){const{t,n,m,age}=v;
  if(age<55)return m==='M1'?'II':'I';
  if(m==='M1')return'IVB';
  if(t==='T4b')return'IVA';
  if(t==='T4a')return'III';
  if(t==='T3a'||t==='T3b')return'II';
  if(n==='N1a'||n==='N1b')return'II';
  return'I'},
 note:'Differentiated thyroid carcinoma only — age at diagnosis (< 55 vs ≥ 55) is central to AJCC 8th staging. Medullary and anaplastic carcinoma use different groupings.'},

cervix:{label:'Cervix (FIGO 2018)',stages:['IA1','IA2','IB1','IB2','IB3','IIA1','IIA2','IIB','IIIA','IIIB','IIIC1','IIIC2','IVA','IVB'],
 pickers:[
  {k:'size',label:'Tumor size / depth of invasion',opts:[['ia1','Microscopic — depth of invasion < 3 mm'],['ia2','Microscopic — depth of invasion 3 to < 5 mm'],['b1','Invasive — greatest dimension ≤ 2 cm'],['b2','Invasive — > 2 to ≤ 4 cm'],['b3','Invasive — > 4 cm']]},
  {k:'ext',label:'Local extension',opts:[['none','Confined to the cervix (no extension)'],['vag','Upper two-thirds of vagina (no parametrium)'],['param','Parametrial involvement (not to pelvic wall)'],['lvag','Lower third of vagina'],['wall','Pelvic sidewall and/or hydronephrosis / non-functioning kidney'],['muc','Bladder or rectal mucosa (biopsy-proven)']]},
  {k:'node',label:'Lymph nodes',opts:[['none','No lymph node involvement'],['pelvic','Pelvic lymph nodes'],['pao','Para-aortic lymph nodes']]},
  {k:'met',label:'Distant metastasis',opts:[['no','No distant metastasis'],['yes','Distant metastasis (beyond pelvis / non-nodal)']]}],
 stage(v){const{size,ext,node,met}=v;
  if(met==='yes')return'IVB';
  if(ext==='muc')return'IVA';
  if(node==='pao')return'IIIC2';
  if(node==='pelvic')return'IIIC1';
  if(ext==='wall')return'IIIB';
  if(ext==='lvag')return'IIIA';
  if(ext==='param')return'IIB';
  if(ext==='vag')return size==='b3'?'IIA2':'IIA1';
  return{ia1:'IA1',ia2:'IA2',b1:'IB1',b2:'IB2',b3:'IB3'}[size]},
 tnmEq:{IA1:'T1a1 N0 M0',IA2:'T1a2 N0 M0',IB1:'T1b1 N0 M0',IB2:'T1b2 N0 M0',IB3:'T1b3 N0 M0',IIA1:'T2a1 N0 M0',IIA2:'T2a2 N0 M0',IIB:'T2b N0 M0',IIIA:'T3a N0 M0',IIIB:'T3b N0 M0',IIIC1:'any T N1 M0',IIIC2:'any T N2 M0',IVA:'T4 any N M0',IVB:'any T any N M1'},
 note:'FIGO 2018 — nodal involvement (IIIC) overrides lower local stages; distant metastasis overrides everything. Imaging or pathology may be used to assign stage (annotate r/p).'},

ovary:{label:'Ovary, fallopian tube & primary peritoneal (FIGO 2014)',stages:['IA','IB','IC1','IC2','IC3','IIA','IIB','IIIA1','IIIA2','IIIB','IIIC','IVA','IVB'],
 pickers:[
  {k:'loc',label:'Tumor extent',opts:[['ia','One ovary/tube — capsule intact, no surface tumor, negative washings'],['ib','Both ovaries/tubes — capsule intact, no surface tumor'],['ic1','Confined to ovaries/tubes — intraoperative surgical spill'],['ic2','Confined — capsule rupture before surgery, or tumor on surface'],['ic3','Confined — malignant cells in ascites or peritoneal washings'],['iia','Pelvic extension to uterus and/or tubes/ovaries'],['iib','Extension to other pelvic intraperitoneal tissues'],['m2','Microscopic extrapelvic peritoneal involvement'],['b2','Macroscopic extrapelvic peritoneal metastasis ≤ 2 cm'],['c2','Macroscopic extrapelvic peritoneal metastasis > 2 cm (incl. liver/spleen capsule)']]},
  {k:'node',label:'Retroperitoneal lymph nodes',opts:[['none','Negative / not involved'],['pos','Positive (cytologically or histologically proven)']]},
  {k:'met',label:'Distant disease',opts:[['no','None'],['pleural','Malignant pleural effusion (positive cytology)'],['dist','Parenchymal liver/spleen or extra-abdominal metastasis (incl. inguinal nodes)']]}],
 stage(v){const{loc,node,met}=v;
  if(met==='dist')return'IVB';
  if(met==='pleural')return'IVA';
  if(loc==='c2')return'IIIC';
  if(loc==='b2')return'IIIB';
  if(loc==='m2')return'IIIA2';
  if(node==='pos')return'IIIA1';
  return{ia:'IA',ib:'IB',ic1:'IC1',ic2:'IC2',ic3:'IC3',iia:'IIA',iib:'IIB'}[loc]},
 note:'FIGO 2014 — positive retroperitoneal nodes without peritoneal spread are IIIA1; peritoneal disease beyond the pelvis stages by lesion size regardless of nodes.'},

endometrium:{label:'Uterus — endometrial carcinoma (FIGO 2009)',stages:['IA','IB','II','IIIA','IIIB','IIIC1','IIIC2','IVA','IVB'],
 pickers:[
  {k:'inv',label:'Local invasion / extent',opts:[['ia','Confined to corpus — < 50% myometrial invasion'],['ib','Confined to corpus — ≥ 50% myometrial invasion'],['ii','Cervical stromal invasion (still within uterus)'],['iiia','Invades serosa and/or adnexa'],['iiib','Vaginal and/or parametrial involvement'],['iva','Bladder and/or bowel mucosa invasion']]},
  {k:'node',label:'Lymph nodes',opts:[['none','Negative'],['pelvic','Pelvic nodes positive'],['pao','Para-aortic nodes positive (± pelvic)']]},
  {k:'met',label:'Distant metastasis',opts:[['no','None'],['yes','Distant metastasis (incl. intra-abdominal beyond pelvis, inguinal nodes)']]}],
 stage(v){const{inv,node,met}=v;
  if(met==='yes')return'IVB';
  if(inv==='iva')return'IVA';
  if(node==='pao')return'IIIC2';
  if(node==='pelvic')return'IIIC1';
  return{ia:'IA',ib:'IB',ii:'II',iiia:'IIIA',iiib:'IIIB'}[inv]},
 note:'FIGO 2009 anatomic staging — peritoneal cytology alone no longer changes the stage. The 2023 FIGO system adds histologic and molecular criteria.'},
};

export const STAGE_MEANING: Record<string, string> = {
 '0':'In-situ disease — no invasion beyond the epithelium/basement membrane.',
 '0a':'Non-invasive papillary tumor.','0is':'Carcinoma in situ — flat, non-invasive disease.',
 'IC1':'Ovary-confined disease with intraoperative surgical spill.','IC2':'Ovary-confined disease with capsule rupture or surface involvement.','IC3':'Ovary-confined disease with malignant cells in washings or ascites.',
 'IIIA1':'Regional disease — retroperitoneal nodes only.','IIIA2':'Microscopic disease beyond the pelvis.',
 'Occ':'Occult carcinoma — malignant cells identified but no primary tumor localized.',
 'I':'Early-stage, localized disease.','IA':'Early-stage, small localized tumor.','IA1':'Earliest invasive disease.','IA2':'Very early invasive disease.','IA3':'Early localized disease.','IB':'Early-stage disease, slightly more advanced than IA.','IB1':'Early invasive disease.','IB2':'Early invasive disease, larger tumor.','IB3':'Localized but large tumor.',
 'IIA':'Locally confined disease with limited spread.','IIA1':'Local extension, smaller tumor.','IIA2':'Local extension, larger tumor.','IIB':'Locally advanced disease.','IIC':'Locally advanced disease with deeper local invasion.',
 'IIIA':'Locally advanced disease — regional involvement.','IIIB':'Locally advanced disease with greater regional extension.','IIIC':'Advanced regional disease.','IIIC1':'Regional disease with pelvic nodal involvement.','IIIC2':'Regional disease with para-aortic nodal involvement.',
 'IV':'Metastatic disease.','IVA':'Advanced disease — adjacent-organ invasion or limited distant spread.','IVB':'Widespread metastatic disease.','IVC':'Metastatic disease with peritoneal involvement.'};

/** Stage groups drive badge colour: IV is bad, III warns, the rest read ok. */
export function stageTone(stage: string): Tone {
  return /^IV/.test(stage) ? 'bad' : /^III/.test(stage) ? 'warn' : 'ok';
}
