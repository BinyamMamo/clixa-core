/* Which tools appear under which department, per audience. */
export const TOOLS: Record<'pro' | 'user', Record<string, string[]>> = {
 pro:{
  'Most Used':['tnm','anthro','edd','ga','ovul','f75f100','bmi','bpclass','egfr','gcs','ascvd','apgar'],
  'General Medicine':['bmi','ibw','bsa','bmr','crcl','egfr','ag','osm','map','cca','cna'],
  'Surgery':['tnm','asa','rcri','caprini','alvarado','ranson','parkland','ron','meldna','wellsdvt','wound'],
  'Oncology':['tnm','ecog','chemodose','anc','calvert'],
  'Obstetrics':['edd','ga','ovul','fundal','pwg','bishop','apgar'],
  'Gynecology':['tnmcx','ovul','gtpal'],
  'Cardiology':['ascvd','bpclass','qtc','chadsvasc','hasbled','shock','map'],
  'Pediatrics':['anthro','peddose','apgar','pedfluid','pedwt','pedbmi','rutf','f75f100'],
  'Nutrition & SAM':['anthro','appetite','f75f100','rutf','resomal','wtgain'],
  'Emergency & Critical Care':['gcs','qsofa','sofa','curb65','wellsdvt','wellspe','pf','ron','parkland'],
  'Endocrinology & Nephrology':['hba1c','homa','fena','egfr','crcl','cca'],
 },
 user:{
  'Most Used':['bmi','edd','ovul','bpclass'],
  'General Health':['bmi','tdee','hydrate'],
  'Pregnancy':['edd','ga','ovul'],
  'Heart Health':['bpclass','hrzone'],
 }

};

/* Tools listed under more than one professional department get a cross-listed
   tag, so a duplicate in search results reads as deliberate. */
export const XLIST: Set<string> = (() => {
  const c: Record<string, number> = {};
  for (const cat in TOOLS.pro) for (const id of TOOLS.pro[cat]) c[id] = (c[id] || 0) + 1;
  const s = new Set(Object.keys(c).filter((id) => c[id] > 1));
  s.add('tnmcx');
  return s;
})();
