// Integridad de los datos y del cálculo: cada partido gana (o empata) con sus propias respuestas donde se presenta.
import assert from 'node:assert';
import {SECTIONS} from '../public/src/domain/sections.js';
import {CCAA,PARTIES,partiesFor,viab,runs,pollsHidden} from '../public/src/domain/electoral.js';
import {QUESTIONS} from '../public/src/domain/questions.js';
import {options,score} from '../public/src/domain/scoring.js';
import {FICHAS,COLS,VOTES_CONG,VOTES_EU} from '../public/src/domain/reference.js';
import {sanitize,STEPS} from '../public/src/application/quiz.js';

const ids=new Set();
for(const q of QUESTIONS){
  assert(!ids.has(q.id),'dup '+q.id); ids.add(q.id); assert(SECTIONS[q.s],q.id+' section');
  const xs=options(q).map(o=>o.x);
  assert(xs.length>=6,q.id+' has '+xs.length); assert.strictEqual(new Set(xs).size,xs.length,q.id+' dup positions');
  for(const [p,[x]] of Object.entries(q.m)){ assert(PARTIES.some(z=>z.id===p),q.id+':'+p); assert(xs.includes(x),q.id+':'+p+' pos '+x); }
}
const order=QUESTIONS.map(q=>q.s); assert(order.every((s,i)=>i===0||s===order[i-1]||!order.slice(0,i).includes(s)),'sections not contiguous');
assert.strictEqual(CCAA.reduce((s,c)=>s+c.p.reduce((a,p)=>a+p[1],0),0),350,'seats != 350');
for(const [k] of COLS) assert(PARTIES.some(p=>p.id===k),'col '+k);
for(const r of [...VOTES_CONG,...VOTES_EU]) for(const k in r[3]) assert(COLS.some(c=>c[0]===k),'vote col '+k);
for(const p of PARTIES){
  assert(FICHAS[p.id],'ficha '+p.id);
  const c=CCAA.find(c=>runs(p,{ccaa:c.id})); assert(c,p.id+' runs nowhere');
  const sel={ccaa:c.id,prov:p.only?.[c.id]?.[0]||null};
  const ans={}; for(const q of QUESTIONS){ const m=q.m[p.id]; if(m) ans[q.id]={v:m[0],w:1}; }
  const r=score(ans,{},sel), own=r.find(x=>x.p.id===p.id);
  assert(r[0].p.id===p.id||Math.abs(r[0].pct-own.pct)<1e-9,`${p.id} in ${c.id} should top, got ${r.slice(0,3).map(x=>x.p.id)}`);
}
const ids_=sel=>partiesFor(sel).map(p=>p.id);
assert(ids_({ccaa:'cat'}).includes('erc')&&!ids_({ccaa:'mad'}).includes('erc'));
assert(!ids_({ccaa:'cat'}).includes('pod')&&ids_({ccaa:'mad'}).includes('pod'));
assert(ids_({ccaa:'cyl',prov:'Soria'}).includes('soria')&&!ids_({ccaa:'cyl',prov:'León'}).includes('soria'));
assert(!ids_({ccaa:'cat',prov:'Girona'}).includes('d21')&&ids_({ccaa:'cat',prov:'Barcelona'}).includes('d21'));
assert(!ids_({ccaa:'val'}).includes('fa')&&ids_({ccaa:'val'}).includes('comp'));
assert.strictEqual(viab(PARTIES.find(p=>p.id==='vox'),{ccaa:'cyl',prov:'Soria'}),'incierto');

// veda de encuestas (LOREG 69.7), en hora peninsular
assert(!pollsHidden(new Date('2026-11-23T22:30:00Z')));   // 23:30 del 23-nov en Madrid
assert(pollsHidden(new Date('2026-11-23T23:30:00Z')));    // 00:30 del 24-nov en Madrid
assert(pollsHidden(new Date('2026-11-29T20:00:00Z')));
assert(!pollsHidden(new Date('2026-11-30T00:00:00Z')));

// lo leído del navegador es entrada no confiable
assert.strictEqual(sanitize('x'),null);
const s=sanitize({answers:{smi:{v:2,w:9},hack:{v:1},iva:{v:'<img>'}},plans:{prio:['vivienda','nope'],casa:99},sel:{ccaa:'cyl',prov:'<b>'},step:1e9});
assert.deepStrictEqual(s.answers,{smi:{v:2,w:1},iva:{v:undefined,w:1}});
assert.deepStrictEqual(s.plans,{prio:['vivienda']});
assert.deepStrictEqual(s.sel,{ccaa:'cyl',prov:null});
assert.strictEqual(s.step,STEPS.length-1);
console.log(`ok: ${QUESTIONS.length} preguntas, ${PARTIES.length} partidos, ${CCAA.length} comunidades`);
