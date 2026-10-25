// Casos de uso del cuestionario: estado, respuestas, planes y circunscripción. Sin DOM.
// Puerto de almacenamiento: {load(): objeto|null, save(objeto)}; lo implementa infrastructure/.
import {PLANS,QUESTIONS} from '../domain/questions.js';
import {CCAA,ccaaOf} from '../domain/electoral.js';

export const STEPS=[...PLANS.map(p=>({kind:'plan',x:p,s:'planes'})),...QUESTIONS.map(q=>({kind:'q',x:q,s:q.s}))];
const fresh=()=>({step:0,tab:'cuestionario',answers:{},plans:{},sel:null,open:null,showAll:false,pending:null,picking:false});
export let state=fresh();
let store={load:()=>null,save:()=>{}};

/* Lo guardado en el navegador lo puede editar cualquiera: solo se acepta lo que encaja con los datos. */
const QIDS=new Set(QUESTIONS.map(q=>q.id)), WEIGHTS=[.5,1,2];
export function sanitize(raw){
  if(!raw||typeof raw!=='object') return null;
  const answers={};
  for(const [id,a] of Object.entries(raw.answers||{})){
    if(!QIDS.has(id)||!a||typeof a!=='object') continue;
    const v=a.v===null||(typeof a.v==='number'&&Number.isFinite(a.v))?a.v:undefined, w=WEIGHTS.includes(a.w)?a.w:1;
    answers[id]={v,w};
  }
  const plans={};
  for(const p of PLANS){
    const v=(raw.plans||{})[p.id];
    if(p.multi&&Array.isArray(v)) plans[p.id]=v.filter(k=>p.o.some(o=>o.sec===k)).slice(0,p.multi);
    else if(Number.isInteger(v)&&v>=0&&v<p.o.length) plans[p.id]=v;
  }
  const c=raw.sel&&CCAA.find(c=>c.id===raw.sel.ccaa);
  const sel=c?{ccaa:c.id,prov:c.p.some(p=>p[0]===raw.sel.prov)?raw.sel.prov:null}:null;
  const step=sel&&Number.isInteger(raw.step)?Math.max(0,Math.min(raw.step,STEPS.length-1)):0;
  return {answers,plans,sel,step};
}

export function init(storage){store=storage; const s=sanitize(store.load()); if(s) state={...state,...s}}
function save(){store.save({step:state.step,answers:state.answers,plans:state.plans,sel:state.sel})}
export function persist(){save()}
export function setSel(ccaa,prov){const c=ccaaOf(ccaa); state.sel={ccaa,prov:prov||(c.p.length===1?c.p[0][0]:null)}; save()}
export function selLabel(sel){if(!sel) return ''; const c=ccaaOf(sel.ccaa); return sel.prov&&c.p.length>1?`${sel.prov} (${c.n})`:c.n}
export function answeredCount(){return QUESTIONS.filter(q=>typeof state.answers[q.id]?.v==='number').length}
export function setAnswer(id,v){const a=state.answers[id]||{w:1}; state.answers[id]={...a,v}; save()}
export function setWeight(id,w){const a=state.answers[id]||{v:undefined}; state.answers[id]={...a,w}; save()}
export function setPlan(p,i){
  if(p.multi){const cur=state.plans[p.id]||[]; const k=p.o[i].sec;
    state.plans[p.id]=cur.includes(k)?cur.filter(x=>x!==k):(cur.length<p.multi?[...cur,k]:cur);}
  else state.plans[p.id]=i;
  save();
}
export function reset(){state=fresh(); save()}
