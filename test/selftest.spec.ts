/* The legacy app shipped 179 hand-written assertion sites (301 checks once
   the table-driven loops expand) covering the full breast,
   lung, colorectal, gastric, prostate, cervix, ovary and endometrium stage
   tables, the WHO growth standards, the SAM protocol and the Ethiopian
   calendar. They are the most valuable thing in that file, ported verbatim,
   so they now guard the extracted core instead of only running in a console. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CALCS, TNM, STAGE_MEANING, ETHM, ETHM_AM,
  e2jdn, jdn2e, g2jdn, jdn2g, ethLeap, estr, dboth,
  fmt, r1, r2, wkd, daysBetween, addDays, dstr,
  R, err, need, rng, F, SEX, KG, IN,
} from '../src/index';
import {
  WHO_LMS, lmsAt, zWHO, zfmt, round5, fracS, appetiteMin, wastLabel,
  SACHET_KCAL, SACHET_G,
} from '../src/who/zscore';
import { FROZEN_NOW } from '../golden/matrix.mjs';

const RealDate = Date;
beforeAll(() => {
  class FrozenDate extends RealDate {
    constructor(...args: any[]) {
      // @ts-expect-error - forwarding the real constructor's overloads
      super(...(args.length ? args : [FROZEN_NOW]));
    }
    static now() { return FROZEN_NOW; }
  }
  globalThis.Date = FrozenDate as DateConstructor;
});
afterAll(() => { globalThis.Date = RealDate; });

describe('legacy self-test suite', () => {
  it('all legacy assertions hold against the extracted core', () => {
    let pass = 0, fail = 0;
    const bad: string[] = [];
    const T = (name: string, cond: any) => { if (cond) pass++; else { fail++; bad.push(name); } };
    const approx = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;


 /* ── Breast: full anatomic table ── */
 const B=(t,n,m)=>TNM.breast.stage({t,n,m});
 const breastExp={
  'Tis|N0':'0','Tis|N1mi':null,'Tis|N1':null,
  'T0|N0':null,'T0|N1mi':'IB','T0|N1':'IIA','T0|N2':'IIIA','T0|N3':'IIIC',
  'T1|N0':'IA','T1|N1mi':'IB','T1|N1':'IIA','T1|N2':'IIIA','T1|N3':'IIIC',
  'T2|N0':'IIA','T2|N1mi':'IIB','T2|N1':'IIB','T2|N2':'IIIA','T2|N3':'IIIC',
  'T3|N0':'IIB','T3|N1mi':'IIIA','T3|N1':'IIIA','T3|N2':'IIIA','T3|N3':'IIIC',
  'T4|N0':'IIIB','T4|N1mi':'IIIB','T4|N1':'IIIB','T4|N2':'IIIB','T4|N3':'IIIC'};
 for(const k in breastExp){const[t,n]=k.split('|');T('breast '+k+' M0',B(t,n,'M0')===breastExp[k])}
 T('breast any M1 → IV',B('T1','N0','M1')==='IV'&&B('T4','N3','M1')==='IV');

 /* ── Lung: full table ── */
 const L=(t,n,m)=>TNM.lung.stage({t,n,m});
 const lungN0={'TX':'Occ','Tis':'0','T1mi':'IA1','T1a':'IA1','T1b':'IA2','T1c':'IA3','T2a':'IB','T2b':'IIA','T3':'IIB','T4':'IIIA'};
 for(const t in lungN0)T('lung '+t+' N0 M0',L(t,'N0','M0')===lungN0[t]);
 for(const t of['T1mi','T1a','T1b','T1c','T2a','T2b']){
  T('lung '+t+' N1',L(t,'N1','M0')==='IIB');T('lung '+t+' N2',L(t,'N2','M0')==='IIIA');T('lung '+t+' N3',L(t,'N3','M0')==='IIIB')}
 for(const t of['T3','T4']){
  T('lung '+t+' N1',L(t,'N1','M0')==='IIIA');T('lung '+t+' N2',L(t,'N2','M0')==='IIIB');T('lung '+t+' N3',L(t,'N3','M0')==='IIIC')}
 T('lung M1a → IVA',L('T1a','N0','M1a')==='IVA');T('lung M1b → IVA',L('T3','N2','M1b')==='IVA');T('lung M1c → IVB',L('T2a','N1','M1c')==='IVB');
 T('lung TX with nodes invalid',L('TX','N1','M0')===null);T('lung Tis with nodes invalid',L('Tis','N2','M0')===null);

 /* ── Colorectal: full table ── */
 const C=(t,n,m)=>TNM.colorectal.stage({t,n,m});
 const crc={'Tis|N0':'0','T1|N0':'I','T2|N0':'I','T3|N0':'IIA','T4a|N0':'IIB','T4b|N0':'IIC'};
 for(const k in crc){const[t,n]=k.split('|');T('crc '+k,C(t,n,'M0')===crc[k])}
 for(const n of['N1a','N1b','N1c']){
  T('crc T1 '+n,C('T1',n,'M0')==='IIIA');T('crc T2 '+n,C('T2',n,'M0')==='IIIA');
  T('crc T3 '+n,C('T3',n,'M0')==='IIIB');T('crc T4a '+n,C('T4a',n,'M0')==='IIIB');T('crc T4b '+n,C('T4b',n,'M0')==='IIIC')}
 T('crc T1 N2a',C('T1','N2a','M0')==='IIIA');T('crc T2 N2a',C('T2','N2a','M0')==='IIIB');T('crc T3 N2a',C('T3','N2a','M0')==='IIIB');
 T('crc T4a N2a',C('T4a','N2a','M0')==='IIIC');T('crc T4b N2a',C('T4b','N2a','M0')==='IIIC');
 T('crc T1 N2b',C('T1','N2b','M0')==='IIIB');T('crc T2 N2b',C('T2','N2b','M0')==='IIIB');T('crc T3 N2b',C('T3','N2b','M0')==='IIIC');
 T('crc T4a N2b',C('T4a','N2b','M0')==='IIIC');T('crc T4b N2b',C('T4b','N2b','M0')==='IIIC');
 T('crc M1a/b/c',C('T1','N0','M1a')==='IVA'&&C('T3','N1a','M1b')==='IVB'&&C('T4b','N2b','M1c')==='IVC');
 T('crc Tis with nodes invalid',C('Tis','N1a','M0')===null);

 /* ── Prostate ── */
 const P=(t,n,m,psa,gg)=>TNM.prostate.stage({t,n,m,psa,gg});
 T('prostate cT2a PSA8 GG1 → I',P('cT2a','N0','M0',8,1)==='I');
 T('prostate cT1 PSA4 GG1 → I',P('cT1','N0','M0',4,1)==='I');
 T('prostate cT2b GG1 PSA5 → IIA',P('cT2b','N0','M0',5,1)==='IIA');
 T('prostate GG1 PSA 12 → IIA',P('cT1','N0','M0',12,1)==='IIA');
 T('prostate GG2 PSA15 → IIB',P('cT2a','N0','M0',15,2)==='IIB');
 T('prostate GG3 → IIC',P('cT2a','N0','M0',6,3)==='IIC');
 T('prostate GG4 → IIC',P('pT2','N0','M0',6,4)==='IIC');
 T('prostate PSA≥20 → IIIA',P('cT2a','N0','M0',25,2)==='IIIA');
 T('prostate T3a → IIIB',P('T3a','N0','M0',6,2)==='IIIB');
 T('prostate T4 → IIIB',P('T4','N0','M0',6,1)==='IIIB');
 T('prostate GG5 → IIIC',P('cT2a','N0','M0',6,5)==='IIIC');
 T('prostate GG5 + T3 → IIIC',P('T3b','N0','M0',30,5)==='IIIC');
 T('prostate N1 → IVA',P('cT2a','N1','M0',6,5)==='IVA');
 T('prostate M1 → IVB',P('T3a','N1','M1',100,5)==='IVB');

 /* ── Cervix (FIGO 2018) ── */
 const X=(size,ext,node,met)=>TNM.cervix.stage({size,ext,node,met});
 T('cervix ia1',X('ia1','none','none','no')==='IA1');
 T('cervix ia2',X('ia2','none','none','no')==='IA2');
 T('cervix b1',X('b1','none','none','no')==='IB1');
 T('cervix b2',X('b2','none','none','no')==='IB2');
 T('cervix b3',X('b3','none','none','no')==='IB3');
 T('cervix upper vagina small → IIA1',X('b1','vag','none','no')==='IIA1');
 T('cervix upper vagina >4cm → IIA2',X('b3','vag','none','no')==='IIA2');
 T('cervix parametrium → IIB',X('b2','param','none','no')==='IIB');
 T('cervix lower vagina → IIIA',X('b2','lvag','none','no')==='IIIA');
 T('cervix pelvic wall → IIIB',X('b2','wall','none','no')==='IIIB');
 T('cervix pelvic nodes → IIIC1',X('b1','param','pelvic','no')==='IIIC1');
 T('cervix para-aortic → IIIC2',X('b3','wall','pao','no')==='IIIC2');
 T('cervix mucosa → IVA',X('b3','muc','none','no')==='IVA');
 T('cervix distant mets → IVB',X('b1','none','none','yes')==='IVB');


 /* ── Gastric: full pathologic grid ── */
 const G=(t,n,m)=>TNM.gastric.stage({t,n,m});
 const gex={T1:{N0:'IA',N1:'IB',N2:'IIA',N3a:'IIB',N3b:'IIIB'},T2:{N0:'IB',N1:'IIA',N2:'IIB',N3a:'IIIA',N3b:'IIIB'},T3:{N0:'IIA',N1:'IIB',N2:'IIIA',N3a:'IIIB',N3b:'IIIC'},T4a:{N0:'IIB',N1:'IIIA',N2:'IIIA',N3a:'IIIB',N3b:'IIIC'},T4b:{N0:'IIIA',N1:'IIIB',N2:'IIIB',N3a:'IIIC',N3b:'IIIC'}};
 for(const t in gex)for(const n in gex[t])T('gastric '+t+' '+n,G(t,n,'M0')===gex[t][n]);
 T('gastric Tis N0 → 0 / M1 → IV / Tis+N invalid',G('Tis','N0','M0')==='0'&&G('T2','N1','M1')==='IV'&&G('Tis','N1','M0')===null);
 /* ── Pancreas ── */
 const PA=(t,n,m)=>TNM.pancreas.stage({t,n,m});
 T('panc T1 N0 → IA',PA('T1','N0','M0')==='IA');T('panc T2 N0 → IB',PA('T2','N0','M0')==='IB');
 T('panc T3 N0 → IIA',PA('T3','N0','M0')==='IIA');T('panc T1-3 N1 → IIB',PA('T1','N1','M0')==='IIB'&&PA('T3','N1','M0')==='IIB');
 T('panc N2 → III',PA('T1','N2','M0')==='III');T('panc T4 any N → III',PA('T4','N0','M0')==='III'&&PA('T4','N2','M0')==='III');
 T('panc M1 → IV',PA('T2','N1','M1')==='IV');T('panc Tis N0 → 0',PA('Tis','N0','M0')==='0');
 /* ── Liver (HCC) ── */
 const LI=(t,n,m)=>TNM.liver.stage({t,n,m});
 T('liver T1a → IA',LI('T1a','N0','M0')==='IA');T('liver T1b → IB',LI('T1b','N0','M0')==='IB');
 T('liver T2 → II',LI('T2','N0','M0')==='II');T('liver T3 → IIIA',LI('T3','N0','M0')==='IIIA');
 T('liver T4 → IIIB',LI('T4','N0','M0')==='IIIB');T('liver N1 → IVA',LI('T1a','N1','M0')==='IVA');
 T('liver M1 → IVB',LI('T4','N1','M1')==='IVB');
 /* ── Kidney (RCC) ── */
 const K=(t,n,m)=>TNM.kidney.stage({t,n,m});
 T('kidney T1a/b → I',K('T1a','N0','M0')==='I'&&K('T1b','N0','M0')==='I');
 T('kidney T2a/b → II',K('T2a','N0','M0')==='II'&&K('T2b','N0','M0')==='II');
 T('kidney T3a-c → III',K('T3a','N0','M0')==='III'&&K('T3c','N0','M0')==='III');
 T('kidney any T N1 → III',K('T1a','N1','M0')==='III');
 T('kidney T4 → IV',K('T4','N0','M0')==='IV'&&K('T4','N1','M0')==='IV');
 T('kidney M1 → IV',K('T1a','N0','M1')==='IV');
 /* ── Bladder ── */
 const BL=(t,n,m)=>TNM.bladder.stage({t,n,m});
 T('bladder Ta → 0a',BL('Ta','N0','M0')==='0a');T('bladder Tis → 0is',BL('Tis','N0','M0')==='0is');
 T('bladder T1 → I',BL('T1','N0','M0')==='I');T('bladder T2a/b → II',BL('T2a','N0','M0')==='II'&&BL('T2b','N0','M0')==='II');
 T('bladder T3a/T3b/T4a N0 → IIIA',BL('T3a','N0','M0')==='IIIA'&&BL('T4a','N0','M0')==='IIIA');
 T('bladder T1-4a N1 → IIIA',BL('T1','N1','M0')==='IIIA'&&BL('T4a','N1','M0')==='IIIA');
 T('bladder N2/N3 → IIIB',BL('T2a','N2','M0')==='IIIB'&&BL('T3b','N3','M0')==='IIIB');
 T('bladder T4b → IVA / M1a → IVA / M1b → IVB',BL('T4b','N0','M0')==='IVA'&&BL('T1','N0','M1a')==='IVA'&&BL('T1','N0','M1b')==='IVB');
 T('bladder Ta with nodes invalid',BL('Ta','N1','M0')===null);
 /* ── Melanoma (clinical) ── */
 const ME=(t,n,m)=>TNM.melanoma.stage({t,n,m});
 T('mel Tis → 0',ME('Tis','N0','M0')==='0');T('mel T1a → IA',ME('T1a','N0','M0')==='IA');
 T('mel T1b/T2a → IB',ME('T1b','N0','M0')==='IB'&&ME('T2a','N0','M0')==='IB');
 T('mel T2b/T3a → IIA',ME('T2b','N0','M0')==='IIA'&&ME('T3a','N0','M0')==='IIA');
 T('mel T3b/T4a → IIB',ME('T3b','N0','M0')==='IIB'&&ME('T4a','N0','M0')==='IIB');
 T('mel T4b → IIC',ME('T4b','N0','M0')==='IIC');T('mel any N+ → III',ME('T1a','N+','M0')==='III');
 T('mel M1 → IV',ME('T4b','N+','M1')==='IV');
 /* ── Thyroid (age-based) ── */
 const TH=(t,n,m,age)=>TNM.thyroid.stage({t,n,m,age});
 T('thyroid <55 M0 → I',TH('T4b','N1b','M0',40)==='I');
 T('thyroid <55 M1 → II',TH('T1a','N0','M1',40)==='II');
 T('thyroid ≥55 T1 N0 → I',TH('T1a','N0','M0',60)==='I');
 T('thyroid ≥55 T2 N1 → II',TH('T2','N1a','M0',60)==='II');
 T('thyroid ≥55 T3a → II',TH('T3a','N0','M0',60)==='II');
 T('thyroid ≥55 T4a → III',TH('T4a','N0','M0',60)==='III');
 T('thyroid ≥55 T4b → IVA',TH('T4b','N1b','M0',60)==='IVA');
 T('thyroid ≥55 M1 → IVB',TH('T1a','N0','M1',60)==='IVB');
 /* ── Ovary (FIGO 2014) ── */
 const OV=(loc,node,met)=>TNM.ovary.stage({loc,node,met});
 T('ovary IA–IC3',OV('ia','none','no')==='IA'&&OV('ib','none','no')==='IB'&&OV('ic1','none','no')==='IC1'&&OV('ic2','none','no')==='IC2'&&OV('ic3','none','no')==='IC3');
 T('ovary IIA/IIB',OV('iia','none','no')==='IIA'&&OV('iib','none','no')==='IIB');
 T('ovary nodes only → IIIA1',OV('ia','pos','no')==='IIIA1'&&OV('iib','pos','no')==='IIIA1');
 T('ovary micro peritoneal → IIIA2 (± nodes)',OV('m2','none','no')==='IIIA2'&&OV('m2','pos','no')==='IIIA2');
 T('ovary ≤2cm → IIIB / >2cm → IIIC',OV('b2','pos','no')==='IIIB'&&OV('c2','none','no')==='IIIC');
 T('ovary pleural → IVA / distant → IVB',OV('ia','none','pleural')==='IVA'&&OV('c2','pos','dist')==='IVB');
 /* ── Endometrium (FIGO 2009) ── */
 const EN=(inv,node,met)=>TNM.endometrium.stage({inv,node,met});
 T('endo IA/IB/II',EN('ia','none','no')==='IA'&&EN('ib','none','no')==='IB'&&EN('ii','none','no')==='II');
 T('endo IIIA/IIIB',EN('iiia','none','no')==='IIIA'&&EN('iiib','none','no')==='IIIB');
 T('endo pelvic nodes → IIIC1 / para-aortic → IIIC2',EN('ia','pelvic','no')==='IIIC1'&&EN('iiib','pao','no')==='IIIC2');
 T('endo mucosa → IVA / distant → IVB',EN('iva','pao','no')==='IVA'&&EN('ia','none','yes')==='IVB');

 /* ── Calculators ── */
 let r;
 r=CALCS.bmi.compute({wt:70,ht:175});T('BMI 70/175 ≈22.9',r.rows[0][1].startsWith('22.9'));
 r=CALCS.ibw.compute({sex:'m',ht:180});T('IBW male 180cm ≈75.0',approx(parseFloat(r.rows[0][1]),75.0,0.2));
 r=CALCS.bsa.compute({wt:70,ht:170});T('BSA 70/170 ≈1.82',approx(parseFloat(r.rows[0][1]),1.82,0.01));
 r=CALCS.bmr.compute({sex:'m',age:25,wt:70,ht:175});T('BMR ≈1674',approx(parseFloat(r.rows[0][1]),1674,2));
 r=CALCS.crcl.compute({sex:'m',age:60,wt:70,cr:1.0});T('CrCl ≈77.8',approx(parseFloat(r.rows[0][1]),77.8,0.2));
 r=CALCS.egfr.compute({sex:'f',age:55,cr:0.8});T('eGFR F 55 Cr0.8 ≈87',approx(parseFloat(r.rows[0][1]),87,2));
 r=CALCS.ag.compute({na:140,cl:104,hco:24,alb:null});T('AG 12',parseFloat(r.rows[0][1])===12);
 r=CALCS.osm.compute({na:140,glu:90,bun:14});T('Osm 290',approx(parseFloat(r.rows[0][1]),290,0.1));
 r=CALCS.map.compute({sbp:120,dbp:80});T('MAP 93.3',approx(parseFloat(r.rows[0][1]),93.3,0.1));
 r=CALCS.cca.compute({ca:8,alb:2});T('Corrected Ca 9.6',approx(parseFloat(r.rows[0][1]),9.6,0.01));
 r=CALCS.cna.compute({na:130,glu:400});T('Corrected Na 134.8',approx(parseFloat(r.rows[0][1]),134.8,0.01));
 r=CALCS.rcri.compute({a:true,b:true,c:false,d:false,e:false,f:false});T('RCRI 2 → 6.6%',r.rows[1][1].includes('6.6'));
 r=CALCS.alvarado.compute({m:1,a:1,n:1,t:1,r:1,e:1,l:1,s:1});T('Alvarado max 10',r.rows[0][1].startsWith('10'));
 r=CALCS.parkland.compute({wt:70,tbsa:40,hrs:null});
 T('Parkland total 11200',r.rows[0][1].startsWith('11200'));T('Parkland first-8h 5600',r.rows[1][1].startsWith('5600'));T('Parkland rate 700',r.rows[2][1].startsWith('700'));
 r=CALCS.meldna.compute({bili:2,inr:1.5,cr:1.2,na:130,dial:false});T('MELD-Na 21',r.rows[1][1]==='21');
 r=CALCS.meldna.compute({bili:.5,inr:.9,cr:.6,na:140,dial:false});T('MELD-Na floors → 6',r.rows[1][1]==='6');
 r=CALCS.anc.compute({wbc:2,neut:30,bands:5});T('ANC 700 grade 3',r.rows[0][1].startsWith('700')&&r.rows[1][1].includes('Grade 3'));
 r=CALCS.calvert.compute({auc:5,gfr:100});T('Calvert 625',r.rows[2][1].startsWith('625'));
 r=CALCS.calvert.compute({auc:5,gfr:150});T('Calvert caps GFR 125 → 750',r.rows[2][1].startsWith('750'));
 r=CALCS.chemodose.compute({wt:70,ht:170,dose:100});T('Chemo dose ≈181.8',approx(parseFloat(r.rows[2][1]),181.8,0.5));
 T('addDays LMP+280',dstr(addDays(new Date('2026-01-01T00:00:00'),280))==='8 Oct 2026');
 r=CALCS.edd.compute({meth:'lmp',d:'2026-01-01',cyc:28});T('EDD 1 Jan 2026 → 8 Oct 2026',r.rows[0][1].includes('8 Oct 2026'));
 r=CALCS.edd.compute({meth:'lmp',d:'2026-01-01',cyc:35});T('EDD cycle-35 → 15 Oct 2026',r.rows[0][1].includes('15 Oct 2026'));
 r=CALCS.ovul.compute({lmp:'2026-03-01',cyc:28});T('Ovulation 15 Mar 2026',r.rows[0][1].includes('15 Mar 2026'));
 r=CALCS.bishop.compute({dil:'3',eff:'3',sta:'3',con:'2',pos:'2'});T('Bishop max 13',r.rows[0][1].startsWith('13'));
 r=CALCS.apgar.compute({a:'2',p:'2',g:'2',ac:'2',r:'2'});T('APGAR 10',r.rows[0][1].startsWith('10'));
 let threw=false;try{CALCS.gtpal.compute({g:2,t:2,p:1,a:0,l:3})}catch(e){threw=true}T('GTPAL invalid throws',threw);
 r=CALCS.bpclass.compute({sbp:135,dbp:85});T('BP 135/85 stage 1',r.rows[1][1].includes('Stage 1'));
 r=CALCS.bpclass.compute({sbp:185,dbp:95});T('BP 185/95 crisis',r.rows[1][1].includes('crisis'));
 r=CALCS.qtc.compute({qt:400,hr:60});T('QTc Bazett 400 @HR60',r.rows[0][1].startsWith('400'));
 r=CALCS.chadsvasc.compute({c:1,h:1,age:'2',d:1,s:1,v:1,f:1});T('CHA2DS2-VASc max 9',r.rows[0][1].startsWith('9'));
 r=CALCS.shock.compute({hr:120,sbp:80});T('Shock index 1.5',parseFloat(r.rows[0][1])===1.5);
 r=CALCS.gcs.compute({e:'4',v:'5',m:'6'});T('GCS 15',r.rows[0][1].startsWith('15'));
 r=CALCS.gcs.compute({e:'3',v:'T',m:'5'});T('GCS intubated 8T',r.badge.includes('8T'));
 r=CALCS.qsofa.compute({r:1,b:1,m:1});T('qSOFA 3',r.rows[0][1].startsWith('3'));
 r=CALCS.sofa.compute({resp:'2',coag:'1',liv:'0',cv:'3',cns:'1',ren:'2'});T('SOFA 9',r.rows[0][1].startsWith('9'));
 r=CALCS.curb65.compute({c:1,u:1,r:1,b:0,a:1});T('CURB-65 4 → admit',r.rows[0][1].startsWith('4')&&r.rows[1][1].includes('admit'));
 r=CALCS.wellspe.compute({a:1,b:1,c:1,d:0,e:0,f:0,g:0});T('Wells PE 7.5 high',parseFloat(r.rows[0][1])===7.5&&r.rows[1][1].includes('High'));
 r=CALCS.pf.compute({pao2:80,fio2:40});T('P/F 200 moderate',r.rows[0][1].startsWith('200')&&r.rows[1][1].includes('Moderate'));
 r=CALCS.peddose.compute({wt:18,dose:15,freq:3,max:250});T('Ped dose capped 250',r.rows[0][1].startsWith('250'));
 r=CALCS.pedfluid.compute({wt:25});T('Ped fluids 25kg 1600/65',r.rows[0][1].startsWith('1600')&&r.rows[1][1].startsWith('65'));
 r=CALCS.pedwt.compute({band:'tod',age:4});T('Ped wt 4y ≈18',parseFloat(r.rows[0][1])===18);
 r=CALCS.hba1c.compute({a1c:7});T('eAG 154',r.rows[1][1].startsWith('154'));
 r=CALCS.homa.compute({glu:100,ins:10});T('HOMA 2.47',approx(parseFloat(r.rows[0][1]),2.47,0.01));
 r=CALCS.fena.compute({una:40,pna:140,ucr:40,pcr:1});T('FENa 0.71%',approx(parseFloat(r.rows[0][1]),0.71,0.01));
 r=CALCS.hydrate.compute({wt:70,act:'0'});T('Hydration 2100–2450',r.rows[0][1].startsWith('2100'));
 r=CALCS.caprini.compute({age:'2',ca:true,major:true,dvt:true});T('Caprini 2+2+2+3=9 high',r.rows[0][1]==='9'&&r.rows[1][1]==='High');
 r=CALCS.ranson.compute({r1:1,r2:1,r3:1,r4:0,r5:0,r6:0,r7:0,r8:0,r9:0,r10:0,r11:0});T('Ranson 3 severe',r.rows[0][1].startsWith('3')&&r.rows[2][1].includes('Yes'));
 r=CALCS.wellsdvt.compute({a:1,b:0,c:1,d:1,e:0,f:0,g:0,h:0,i:0,j:1});T('Wells DVT 1 moderate',r.rows[0][1]==='1'&&r.rows[1][1].includes('Moderate'));
 r=CALCS.ron.compute({h:1,at:1,ra:1});T('Rule of nines 36%',r.rows[0][1].startsWith('36'));

 /* ASCVD reference profiles (2013 guideline worked example, ±0.5 abs) */
 const prof={age:55,tc:213,hdl:50,sbp:120,rx:'0',smk:'0',dm:'0'};
 const risk=v=>parseFloat(CALCS.ascvd.compute(v).rows[0][1]);
 T('ASCVD white male ≈5.3%',approx(risk({...prof,sex:'m',race:'w'}),5.3,0.5));
 T('ASCVD white female ≈2.1%',approx(risk({...prof,sex:'f',race:'w'}),2.1,0.5));
 T('ASCVD black male ≈6.1%',approx(risk({...prof,sex:'m',race:'b'}),6.1,0.5));
 T('ASCVD black female ≈3.0%',approx(risk({...prof,sex:'f',race:'b'}),3.0,0.5));



 /* ── WHO growth standards + SAM suite ── */
 T('zWHO wfl boy 80 cm / 8.2 kg \u2248 \u22123.04',approx(zWHO(WHO_LMS.wfl_b,80,8.2),-3.041,0.02));
 T('zWHO tail: wfl boy 80 cm / 6.0 kg \u2248 \u22126.36',approx(zWHO(WHO_LMS.wfl_b,80,6.0),-6.363,0.03));
 T('zWHO wfh girl 95.5 cm / 11.0 kg \u2248 \u22122.83',approx(zWHO(WHO_LMS.wfh_g,95.5,11.0),-2.829,0.02));
 T('zWHO wfa girl 18 mo / 7.0 kg \u2248 \u22123.22',approx(zWHO(WHO_LMS.wfa_g,18,7.0),-3.222,0.02));
 T('zWHO lhfa boy 24 mo / 81.7 cm \u2248 \u22121.77',approx(zWHO(WHO_LMS.lhfa_b,24,81.7),-1.773,0.02));
 T('zWHO interpolation 80.25 cm / 9.0 kg \u2248 \u22121.90',approx(zWHO(WHO_LMS.wfl_b,80.25,9.0),-1.900,0.02));
 T('zWHO median \u2192 0',Math.abs(zWHO(WHO_LMS.wfh_b,87,WHO_LMS.wfh_b.M[(87-65)/0.5]))<0.005);
 T('zWHO out of range \u2192 null',zWHO(WHO_LMS.wfl_b,44,5)===null&&zWHO(WHO_LMS.wfh_b,121,20)===null);
 r=CALCS.anthro.compute({sex:'m',agem:18,dob:null,wt:8.2,len:80,pos:'ly',muac:11.2,ed:'0'});
 T('anthro: WHZ<\u22123 + MUAC 11.2 \u2192 SAM marasmic',r.badge.includes('SAM')&&r.badge.includes('marasmus')===false?r.badge.includes('severe wasting'):true);
 T('anthro: WHZ row shows \u22123.04',r.rows[0][1].includes('3.04'));
 r=CALCS.anthro.compute({sex:'f',agem:30,dob:null,wt:12.5,len:90,pos:'st',muac:13.5,ed:'2'});
 T('anthro: edema ++ \u2192 SAM edematous',r.badge.includes('edematous'));
 r=CALCS.anthro.compute({sex:'f',agem:36,dob:null,wt:11.0,len:95.5,pos:'st',muac:null,ed:'0'});
 T('anthro: WHZ \u22122.83 \u2192 MAM',r.badge.includes('MAM'));
 r=CALCS.anthro.compute({sex:'m',agem:18,dob:null,wt:8.2,len:79.3,pos:'st',muac:null,ed:'0'});
 T('anthro: standing +0.7 adjustment \u2192 same WHZ',r.rows[0][1].includes('3.04'));
 r=CALCS.anthro.compute({sex:'m',agem:4,dob:null,wt:4.0,len:58,pos:'ly',muac:null,ed:'1'});
 T('anthro: infant <6 mo note',r.note.includes('< 6 months'));
 r=CALCS.f75f100.compute({wt:5,ph:'p1',feeds:'8',ed3:false,app:'nd'});
 T('F-75 5 kg: 650 mL/day, 80 mL \u00d7 8',r.rows[2][1].startsWith('650')&&r.rows[3][1].startsWith('80'));
 r=CALCS.f75f100.compute({wt:5,ph:'p1',feeds:'8',ed3:true,app:'nd'});
 T('F-75 edema +++: 500 mL/day (100 mL/kg)',r.rows[2][1].startsWith('500'));
 r=CALCS.f75f100.compute({wt:5,ph:'tf',feeds:'8',ed3:false,app:'nd'});
 T('Transition F-100 5 kg: 650 mL/day, 130 kcal/kg',r.rows[2][1].startsWith('650')&&r.rows[4][1].includes('130 kcal/kg'));
 r=CALCS.f75f100.compute({wt:8,ph:'p2',feeds:'6',ed3:false,app:'nd'});
 T('Phase 2 F-100 8 kg @200: 1600 mL/day, 265 mL \u00d7 6',r.rows[2][1].startsWith('1600')&&r.rows[3][1].startsWith('265'));
 r=CALCS.f75f100.compute({wt:6,ph:'otp',feeds:'8',ed3:false,app:'pass'});
 T('OTP 6 kg: 2 \u00bd sachets/day, 17/week',r.badge.includes('2 \u00bd')&&r.badge.includes('17'));
 r=CALCS.f75f100.compute({wt:6,ph:'otp',feeds:'8',ed3:false,app:'fail'});
 T('OTP + failed appetite \u2192 inpatient warning',r.tone==='bad');
 r=CALCS.rutf.compute({wt:6});
 T('RUTF 6 kg: 1200 kcal, 17 sachets/week',r.rows[1][1].startsWith('1200')&&r.rows[3][1].startsWith('17'));
 r=CALCS.appetite.compute({wt:8,res:'nd'});
 T('Appetite min 7\u20139.9 kg: \u2153\u2013\u00bd sachet',r.rows[0][1].includes('\u2153')&&r.rows[0][1].includes('\u00bd'));
 r=CALCS.appetite.compute({wt:8,res:'fail'});
 T('Appetite fail \u2192 inpatient routing',r.tone==='bad'&&r.rows[2][1].includes('inpatient'));
 r=CALCS.resomal.compute({wt:8});
 T('ReSoMal 8 kg: 40 mL/dose, 40\u201380 mL/h',r.rows[0][1].includes('40 mL per dose')&&r.rows[1][1].includes('40\u201380'));
 r=CALCS.wtgain.compute({w1:6,w2:6.3,days:7});
 T('Weight gain 7.1 g/kg/day moderate',approx(parseFloat(r.rows[1][1]),7.1,0.1)&&r.rows[2][1].includes('moderate'));
 r=CALCS.wtgain.compute({w1:6,w2:5.8,days:7});
 T('Weight loss flagged',r.rows[2][1].includes('LOSS'));

 /* ── Ethiopian calendar ── */
 T('eth 1 Meskerem 2017 = 11 Sep 2024',e2jdn(2017,1,1)===g2jdn(2024,9,11));
 T('eth 1 Meskerem 2016 = 12 Sep 2023',e2jdn(2016,1,1)===g2jdn(2023,9,12));
 T('eth 1 Meskerem 2018 = 11 Sep 2025',e2jdn(2018,1,1)===g2jdn(2025,9,11));
 T('eth leap Pagume 6 2015 = 11 Sep 2023',e2jdn(2015,13,6)===g2jdn(2023,9,11));
 T('eth non-leap Pagume 5 2016 = 10 Sep 2024',e2jdn(2016,13,5)===g2jdn(2024,9,10));
 T('jdn↔eth roundtrip',(()=>{for(let j=2440000;j<2470000;j+=97){const x=jdn2e(j);if(e2jdn(x[0],x[1],x[2])!==j)return false}return true})());
 T('jdn↔greg roundtrip',(()=>{for(let j=2440000;j<2470000;j+=89){const x=jdn2g(j);if(g2jdn(x[0],x[1],x[2])!==j)return false}return true})());
 T('estr 11 Sep 2024',estr(new Date('2024-09-11T00:00:00'))==='1 Meskerem 2017 \u12d3.\u121d.');


    /* Report every failure at once, the way the original console output did. */
    expect(bad, `${fail} of ${pass + fail} legacy assertions failed`).toEqual([]);
    /* Guards against the suite silently degrading to a no-op if an import
       or a table ever goes missing. */
    expect(pass + fail).toBeGreaterThanOrEqual(301);
  });
});
