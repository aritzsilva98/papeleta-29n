import {SECTIONS} from './sections.js';
import {PLANS,QUESTIONS} from './questions.js';
import {partiesFor} from './electoral.js';

/* Opciones de una pregunta, ordenadas por posición en el eje. */
function options(q){return [...q.o.map((t,i)=>({t,x:i})),...(q.e||[]).map(([x,t])=>({t,x}))].sort((a,b)=>a.x-b.x)}
function optText(q,x){const o=options(q).find(o=>o.x===x); return o?o.t:''}

function sectionWeights(plans){
  const w={}; for(const k in SECTIONS) w[k]=1;
  for(const k of (plans.prio||[])) w[k]+=1;
  for(const p of PLANS){ const i=plans[p.id]; if(typeof i==='number' && p.o[i] && p.o[i].b) for(const k in p.o[i].b) w[k]+=p.o[i].b[k]; }
  for(const k in w) w[k]=Math.min(w[k],3);
  return w;
}

// ponytail: suavizado bayesiano con K=3 para que un partido con pocas posiciones no salga arriba por casualidad
function score(answers,plans,sel){
  const sw=sectionWeights(plans), K=3;
  return partiesFor(sel).map(p=>{
    let num=0,den=0,tot=0; const rows=[];
    for(const q of QUESTIONS){
      const a=answers[q.id]; if(!a||typeof a.v!=='number') continue;
      const w=sw[q.s]*a.w; tot+=w;
      const m=q.m[p.id]; if(!m) continue;
      const xs=options(q).map(o=>o.x), span=Math.max(...xs)-Math.min(...xs);
      const d=1-Math.abs(a.v-m[0])/span;
      num+=w*d; den+=w; rows.push({q,d,w,m,u:a.v});
    }
    return {p,rows,cov:tot?den/tot:0,n:rows.length,raw:den?num/den*100:null,pct:den?(num+K*.5)/(den+K)*100:null};
  }).sort((a,b)=>(b.pct??-1)-(a.pct??-1));
}
export {options,optText,sectionWeights,score};
