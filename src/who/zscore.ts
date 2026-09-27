/* WHO Child Growth Standards (LMS method) and Ethiopian SAM protocol helpers.
   The LMS tables live in lms.json so bundlers can split them out — only the
   anthropometry tools pull that 16 KB payload in. */
import LMS from './lms.json';

export interface LmsTable { s: number; d: number; L: number[]; M: number[]; S: number[] }
export const WHO_LMS = LMS as unknown as Record<string, LmsTable>;

export function lmsAt(t,x){const n=t.M.length,mx=t.s+(n-1)*t.d;if(x<t.s-1e-9||x>mx+1e-9)return null;
 let i=(x-t.s)/t.d,i0=Math.min(Math.floor(i),n-2);const f=Math.max(0,i-i0),g=a=>a[i0]+(a[i0+1]-a[i0])*f;
 return[g(t.L),g(t.M),g(t.S)]}
export function zWHO(t,x,meas){const p=lmsAt(t,x);if(!p)return null;const L=p[0],M=p[1],S=p[2];
 let z=(Math.pow(meas/M,L)-1)/(L*S);
 if(z>3){const sd3=M*Math.pow(1+3*L*S,1/L),sd2=M*Math.pow(1+2*L*S,1/L);z=3+(meas-sd3)/(sd3-sd2)}
 else if(z<-3){const sd3n=M*Math.pow(1-3*L*S,1/L),sd2n=M*Math.pow(1-2*L*S,1/L);z=-3+(meas-sd3n)/(sd2n-sd3n)}
 return z}
export const zfmt=z=>z===null?'not computable':(z>=0?'+':'\u2212')+Math.abs(z).toFixed(2)+' z';
export const round5=x=>Math.max(5,Math.round(x/5)*5);
export const SACHET_KCAL=500,SACHET_G=92;
export function fracS(x){x=Math.round(x*4)/4;const w=Math.floor(x+1e-9),f=Math.round((x-w)*4);
 const fs=f===1?'\u00bc':f===2?'\u00bd':f===3?'\u00be':'';return fs?(w?w+' '+fs:fs):String(w)}
export function appetiteMin(wt){return wt<4?['\u215b \u2013 \u00bc sachet','\u2248 12\u201323 g']:wt<7?['\u00bc \u2013 \u2153 sachet','\u2248 23\u201331 g']:wt<10?['\u2153 \u2013 \u00bd sachet','\u2248 31\u201346 g']:wt<15?['\u00bd \u2013 \u00be sachet','\u2248 46\u201369 g']:['\u00be \u2013 1 sachet','\u2248 69\u201392 g']}
export function wastLabel(z){return z===null?'':z<-3?' \u2014 severe wasting':z<-2?' \u2014 moderate wasting':z>2?' \u2014 possible overweight':' \u2014 within normal range'}
