// Capa de interfaz: pinta el DOM y traduce clics en casos de uso. No contiene reglas de negocio.
import {SECTIONS,VIAB} from '../domain/sections.js';
import {CCAA,PARTIES,ccaaOf,seatsOf,runs,partiesFor,viab,nameOf,headOf,pollsHidden} from '../domain/electoral.js';
import {PLANS,QUESTIONS} from '../domain/questions.js';
import {options,optText,sectionWeights,score} from '../domain/scoring.js';
import {FICHAS,OTROS,NOTAS,COLS,VOTES_CONG,VOTES_EU,PILL,SOURCES} from '../domain/reference.js';
import {GLOSS} from '../domain/glossary.js';
import {STEPS,state,persist,setSel,selLabel,answeredCount,setAnswer,setWeight,setPlan,reset} from '../application/quiz.js';
import {esc,ann,GI} from './html.js';

const $=s=>document.querySelector(s);
const P=Object.fromEntries(PARTIES.map(p=>[p.id,p]));
export const TABS=[['cuestionario','Cuestionario'],['resultados','Resultados'],['partidos','Partidos'],['votaciones','Votaciones'],['glosario','Glosario'],['metodo','Método y fuentes']];

const LETTERS='ABCDEFGHIJ';

function renderTabs(){
  $('#tabs').innerHTML=TABS.map(([k,l])=>`<button role="tab" id="tab-${k}" aria-selected="${state.tab===k}" data-tab="${k}">${l}${k==='resultados'?` <span class="muted small">(${answeredCount()})</span>`:''}</button>`).join('');
}
function go(tab){state.tab=tab; try{history.replaceState(null,'','#'+tab)}catch(e){} render(); window.scrollTo({top:0})}

function renderPicker(){
  const pend=state.pending&&ccaaOf(state.pending), tot=c=>c.p.reduce((s,p)=>s+p[1],0), n=answeredCount();
  const body=pend
    ?`<h2>¿En qué provincia votas?</h2><p class="ctx">Cada provincia es una circunscripción con sus propios escaños: cuantos menos reparte, más difícil lo tienen los partidos pequeños. Algunas candidaturas solo se presentan en una provincia.</p>
      <div class="picker">${pend.p.map(([p,s])=>`<button data-prov="${esc(p)}" aria-pressed="${state.sel?.prov===p}"><span>${esc(p)}</span><span class="cnt">${s} escaños</span></button>`).join('')}
      <button data-prov=""><span>Toda la comunidad / no lo sé</span><span class="cnt">${tot(pend)} escaños</span></button></div>
      <div><button class="linkbtn" id="pback">← Elegir otra comunidad</button></div>`
    :`<h2>¿Dónde votas?</h2><p class="ctx">En las generales cada comunidad tiene su propia papeleta: hay partidos que solo se presentan en Cataluña, Euskadi, Galicia, Canarias o una sola provincia, y coaliciones que cambian de nombre según el territorio. Solo compararemos tus respuestas con los partidos que se presentan donde votas. Si votas desde el extranjero, elige la provincia en la que estás inscrito.</p>
      <div class="picker">${CCAA.map(c=>`<button data-ccaa="${c.id}" aria-pressed="${state.sel?.ccaa===c.id}"><span>${esc(c.n)}</span><span class="cnt">${tot(c)} escaños</span></button>`).join('')}</div>`;
  $('#view').innerHTML=`<section class="card">${body}${n?`<p class="hint">Tus ${n} respuestas anteriores se conservan.</p>`:''}</section>`;
  const done=()=>{state.pending=null;state.picking=false;state.open=null;render()};
  $('#view').querySelectorAll('[data-ccaa]').forEach(b=>b.onclick=()=>{const c=ccaaOf(b.dataset.ccaa); if(c.p.length===1){setSel(c.id);done()} else {state.pending=c.id;render()}});
  $('#view').querySelectorAll('[data-prov]').forEach(b=>b.onclick=()=>{setSel(state.pending,b.dataset.prov||null);done()});
  const pb=$('#pback'); if(pb) pb.onclick=()=>{state.pending=null;render()};
}
function whereRow(){const s=state.sel; return `<div class="row"><span class="hint">Votas en <b>${esc(selLabel(s))}</b> · ${seatsOf(s)} escaños · ${partiesFor(s).length} candidaturas comparadas</span><button class="linkbtn" data-chg>Cambiar</button></div>`}
function bindChg(){$('#view').querySelectorAll('[data-chg]').forEach(b=>b.onclick=()=>{state.picking=true;state.tab='cuestionario';render()})}

function renderQuiz(){
  if(!state.sel||state.picking) return renderPicker();
  const st=STEPS[state.step], x=st.x, isPlan=st.kind==='plan';
  const secs=[...new Set(STEPS.map(s=>s.s))];
  const side=secs.map(s=>{const idx=STEPS.map((t,i)=>[t,i]).filter(([t])=>t.s===s); const done=idx.filter(([t])=>t.kind==='plan'?state.plans[t.x.id]!=null:typeof state.answers[t.x.id]?.v==='number').length;
    return `<button data-jump="${idx[0][1]}" class="${st.s===s?'on':''}"><span>${SECTIONS[s]}</span><span class="cnt">${done}/${idx.length}</span></button>`}).join('');
  const inSec=STEPS.filter(t=>t.s===st.s), pos=inSec.indexOf(st)+1;
  const seen=new Set(), qh=ann(x.q,seen), cx=x.ctx?ann(x.ctx,seen):'';
  let opts;
  if(isPlan){
    const cur=state.plans[x.id];
    opts=x.o.map((o,i)=>{const on=x.multi?(cur||[]).includes(o.sec):cur===i; return `<button class="opt" aria-pressed="${on}" data-plan="${i}"><span class="k">${x.multi?'✓':LETTERS[i]}</span><span>${ann(o.t,seen)}</span></button>`}).join('');
  }else{
    const a=state.answers[x.id]||{};
    opts=options(x).map((o,i)=>`<button class="opt" aria-pressed="${a.v===o.x}" data-v="${o.x}"><span class="k">${LETTERS[i]}</span><span>${ann(o.t,seen)}</span></button>`).join('')+
      `<button class="opt na" aria-pressed="${a.v===null}" data-v="na">Sin opinión / no lo tengo claro (no cuenta)</button>`;
  }
  const w=(state.answers[x.id]||{}).w??1;
  const imp=isPlan?'':`<div class="row"><span class="hint">¿Cuánto te importa este tema?</span><div class="seg" role="group" aria-label="Importancia">${[[.5,'Poco'],[1,'Normal'],[2,'Mucho']].map(([v,l])=>`<button data-w="${v}" aria-pressed="${w===v}">${l}</button>`).join('')}</div></div>`;
  const pct=Math.round((state.step)/(STEPS.length-1)*100);
  $('#view').innerHTML=`<div class="quiz">
    <aside class="side" aria-label="Bloques">${side}</aside>
    <section class="card" aria-live="polite">
      ${whereRow()}
      <div class="progress" aria-hidden="true"><i data-w="${pct}"></i></div>
      <div class="qhead">
        <span class="mono muted">${SECTIONS[st.s]} · ${pos} de ${inSec.length} · pregunta ${state.step+1} de ${STEPS.length}</span>
        <h2>${qh}</h2>
        ${cx?`<p class="ctx">${cx}</p>`:''}
      </div>
      <div class="opts">${opts}</div>
      ${imp}
      <div class="row">
        <button class="btn" id="prev" ${state.step===0?'disabled':''}>← Anterior</button>
        <span class="hint">${answeredCount()} de ${QUESTIONS.length} respondidas</span>
        ${state.step<STEPS.length-1?'<button class="btn primary" id="next">Siguiente →</button>':'<button class="btn primary" id="fin">Ver resultados</button>'}
      </div>
    </section></div>`;
  bindChg();
  $('#view').querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{state.step=+b.dataset.jump;persist();render()});
  $('#view').querySelectorAll('[data-plan]').forEach(b=>b.onclick=()=>{setPlan(x,+b.dataset.plan);if(!x.multi)next();else render()});
  $('#view').querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{setAnswer(x.id,b.dataset.v==='na'?null:+b.dataset.v);next()});
  $('#view').querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{setWeight(x.id,+b.dataset.w);render()});
  $('#prev').onclick=()=>{state.step--;persist();render()};
  const n=$('#next'); if(n) n.onclick=next;
  const f=$('#fin'); if(f) f.onclick=()=>go('resultados');
}
function next(){ if(state.step<STEPS.length-1){state.step++;persist();render()} else go('resultados') }

const VEDA=pollsHidden(), VEDA_TXT='Encuestas ocultas: veda electoral del 24 al 29 de noviembre (LOREG, art. 69.7)';
function viabChip(p,sel){if(VEDA) return '<span class="chip">Sin estimación (veda electoral)</span>'; const v=viab(p,sel); return `<span class="chip ${v}">${VIAB[v]}</span>`}
function renderResults(){
  const n=answeredCount(), sel=state.sel;
  if(!sel){ $('#view').innerHTML=`<div class="card"><h2>Primero, dónde votas</h2><p class="muted">El resultado solo compara los partidos que se presentan en tu comunidad.</p><div><button class="btn primary" id="back">Elegir comunidad</button></div></div>`; $('#back').onclick=()=>go('cuestionario'); return; }
  if(n<8){ $('#view').innerHTML=`<div class="card"><h2>Aún faltan respuestas</h2><p class="muted">Llevas ${n} de ${QUESTIONS.length}. Con menos de 8 el resultado no dice nada. Las preguntas que dejes sin opinión no cuentan.</p><div><button class="btn primary" id="back">Seguir respondiendo</button></div></div>${partyStrip()}`; $('#back').onclick=()=>go('cuestionario'); return; }
  const R=score(state.answers,state.plans,sel), sw=sectionWeights(state.plans);
  const util=state.plans.util??0, boosted=Object.keys(sw).filter(k=>k!=='planes'&&sw[k]>1);
  const list=R.map(r=>{
    const p=r.p, open=state.open===p.id, low=r.cov<.35;
    const pct=r.pct==null?'—':Math.round(r.pct)+' %';
    return `<div class="pr"><button aria-expanded="${open}" data-open="${p.id}">
      <span class="nm">${esc(nameOf(p,sel))} <span class="muted small">· ${esc(headOf(p,sel))}</span></span><span class="pct">${pct}</span>
      <span class="chips">${viabChip(p,sel)}<span class="chip">${r.n} temas comparables · cobertura ${Math.round(r.cov*100)} %</span>${low?'<span class="chip improbable">Pocos datos</span>':''}</span>
      <span class="bar"><i data-w="${r.pct??0}"></i></span></button>
      ${open?detail(r):''}</div>`}).join('');
  const viable=R.filter(r=>['seguro','probable','filo'].includes(viab(r.p,sel))), close=R.filter(r=>viab(r.p,sel)==='filo').map(r=>nameOf(r.p,sel));
  $('#view').innerHTML=`<div class="res">
    <div class="card">
      ${whereRow()}
      <h2>Tu afinidad con cada partido</h2>
      <p class="muted">Porcentaje de coincidencia entre tus respuestas y las posiciones documentadas de los ${R.length} partidos que se presentan donde votas, ponderado por la importancia que diste a cada tema${boosted.length?` y por tus planes (pesan más: ${boosted.map(k=>SECTIONS[k].toLowerCase()).join(', ')})`:''}. Toca un partido para ver dónde coincidís y dónde chocáis.</p>
      ${NOTAS[sel.ccaa]?`<p class="hint">${ann(NOTAS[sel.ccaa])}</p>`:''}
      ${util>=2&&!VEDA?`<p class="notice">Te importa que tu voto cuente. Entre los partidos con opciones de escaño en ${esc(selLabel(sel))}, el más cercano a ti es <b>${esc(viable[0]?nameOf(viable[0].p,sel):'—')}</b>${viable[1]?`, seguido de <b>${esc(nameOf(viable[1].p,sel))}</b>`:''}.${close.length?` ${esc(close.join(' y '))} ${close.length>1?'están':'está'} en el filo del 3 %.`:''}${!sel.prov&&ccaaOf(sel.ccaa).p.length>1?' Indica tu provincia para afinar: en las pequeñas solo los grandes sacan escaño.':''}</p>`:''}
    </div>
    ${list}
    <p class="notice">Esto mide coincidencias con programas y votos, no te dice a quién votar. A 24-oct casi ningún partido ha publicado el programa del 29-N: lee su ficha antes de decidir, sobre todo si está arriba con «pocos datos».</p>
    <div class="row"><button class="btn" id="redo">Repasar respuestas</button><button class="btn" id="reset">Borrar todo y empezar de nuevo</button></div>
  </div>`;
  bindChg();
  $('#view').querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{state.open=state.open===b.dataset.open?null:b.dataset.open;renderResults()});
  $('#redo').onclick=()=>{state.step=PLANS.length;go('cuestionario')};
  const rs=$('#reset'); rs.onclick=()=>{ if(rs.dataset.armed){reset();go('cuestionario')} else {rs.dataset.armed=1; rs.textContent='Pulsa otra vez para borrar'} };
}
function detail(r){
  const best=r.rows.filter(x=>x.d>=.75).sort((a,b)=>b.d-a.d||b.w-a.w).slice(0,6), worst=r.rows.filter(x=>x.d<=.5).sort((a,b)=>a.d-b.d||b.w-a.w).slice(0,6);
  const seen=new Set();
  const item=x=>`<div class="li"><span class="t"><span class="dot ${x.d>=.75?'good':x.d>=.5?'mid':'bad'}"></span>${ann(x.q.t,seen)}</span>
    <span class="small">Tú: ${ann(optText(x.q,x.u),seen)}</span><span class="small muted">${esc(nameOf(r.p,state.sel))}:${ann(optText(x.q,x.m[0]),seen)} · <i>${ann(x.m[1],seen)}</i></span></div>`;
  const f=FICHAS[r.p.id];
  return `<div class="detail"><div class="cols">
    <div><h3>Donde más coincidís</h3>${best.map(item).join('')||'<p class="muted small">Ninguna coincidencia clara.</p>'}</div>
    <div><h3>Donde más chocáis</h3>${worst.map(item).join('')||'<p class="muted small">Ningún choque fuerte.</p>'}</div></div>
    <div class="kv"><div><b>Lo que dice vs. lo que vota</b><ul>${f.coh.map(c=>`<li>${ann(c,seen)}</li>`).join('')}</ul></div></div></div>`;
}
function partyStrip(){const sel=state.sel;return `<div class="card"><h3>Quién puede aparecer en tu papeleta${sel?` (${esc(selLabel(sel))})`:''}</h3><div class="chips">${partiesFor(sel).map(p=>`<span class="chip">${esc(nameOf(p,sel))}</span>`).join('')}</div><p class="hint">Las candidaturas presentadas salen en el BOE el 28 de octubre y se proclaman el 2 de noviembre.</p></div>`}

function renderParties(){
  const sel=state.sel, mine=partiesFor(sel), list=state.showAll||!sel?PARTIES:mine, others=PARTIES.filter(p=>!mine.includes(p));
  $('#view').innerHTML=`<div class="res"><p class="notice">Candidaturas anunciadas a 24-oct-2026. El plazo para presentar listas acaba el 26-oct; el BOE las publica el 28-oct y se proclaman el 2-nov. Los partidos sin representación necesitan avales del 0,1 % del censo de cada provincia, así que alguno puede quedarse fuera.</p>
  ${sel?`<div class="card">${whereRow()}${NOTAS[sel.ccaa]?`<p class="hint">${ann(NOTAS[sel.ccaa])}</p>`:''}${others.length?`<p class="hint">No se presentan donde votas: ${others.map(p=>esc(p.n)).join(', ')}. <button class="linkbtn" id="all">${state.showAll?'Ver solo los de mi papeleta':'Ver todas las fichas'}</button></p>`:''}</div>`:''}
  <div class="grid">${list.map(p=>{const f=FICHAS[p.id], s=new Set([p.id]), on=!sel||mine.includes(p);return `<details class="party"><summary><span class="row"><h3>${esc(nameOf(p,sel))}</h3>${on?viabChip(p,sel):'<span class="chip">No se presenta aquí</span>'}</span><span class="small muted">${ann(p.full,s)} · ${esc(headOf(p,sel))}</span><span class="small">${ann(VEDA?VEDA_TXT:p.poll,s)}</span></summary>
    <div class="kv"><div><b>Qué es</b>${ann(f.res,s)}</div><div><b>Programa y propuestas</b>${ann(f.prog,s)}</div><div><b>Economía</b>${ann(f.eco,s)}</div><div><b>Social</b>${ann(f.soc,s)}</div><div><b>Lo que dice vs. lo que vota</b><ul>${f.coh.map(c=>`<li>${ann(c,s)}</li>`).join('')}</ul></div></div></details>`}).join('')}</div>
  <div class="card"><h3>Otras opciones en la papeleta</h3>${OTROS.map(([t,d])=>`<div class="li"><span class="t">${esc(t)}</span><span class="small muted">${ann(d)}</span></div>`).join('')}</div></div>`;
  bindChg(); const a=$('#all'); if(a) a.onclick=()=>{state.showAll=!state.showAll;renderParties()};
}
function voteTable(rows,cols,cap){
  cols=cols.filter(([k])=>rows.some(r=>r[3][k]));
  return `<h2>${cap}</h2><div class="tbl"><table><thead><tr><th>Fecha</th><th>Votación</th><th>Resultado</th>${cols.map(c=>`<th>${c[1]}</th>`).join('')}<th>Otros</th></tr></thead><tbody>
  ${rows.map(([d,t,r,v,o])=>{const s=new Set();return `<tr><td class="mono">${d}</td><td>${ann(t,s)}</td><td>${esc(r)}</td>${cols.map(([k])=>`<td class="v">${v[k]?`<span class="pill ${v[k]}">${PILL[v[k]]}</span>`:''}</td>`).join('')}<td class="muted">${ann(o,s)}</td></tr>`}).join('')}</tbody></table></div>`;
}
function renderGlossary(){
  const cats=[...new Set(GLOSS.map(g=>g.c))];
  $('#view').innerHTML=`<div class="res"><div class="card"><h2>Glosario</h2><p class="muted">${GLOSS.length} siglas, leyes y términos técnicos con su fuente. En el resto de la página aparecen subrayados con puntos: tócalos para ver la explicación.</p><input id="gq" type="search" placeholder="Buscar: IRPF, zona tensionada, Frontex…" aria-label="Buscar en el glosario"></div><div class="res" id="gl"></div></div>`;
  const draw=q=>{q=q.trim().toLowerCase();
    $('#gl').innerHTML=cats.map(c=>{const items=GLOSS.filter(g=>g.c===c&&(!q||(g.k+' '+g.d+' '+g.a.join(' ')).toLowerCase().includes(q))).sort((a,b)=>a.k.localeCompare(b.k,'es'));
      return items.length?`<div class="card"><h3>${esc(c)}</h3><div>${items.map(g=>`<div class="li"><span class="t">${esc(g.k)}</span><span class="small">${esc(g.d)}</span><span class="small muted">Fuente: <a href="${g.s[1]}" target="_blank" rel="noopener">${esc(g.s[0])}</a></span></div>`).join('')}</div></div>`:''}).join('')||'<p class="muted">Ningún término coincide con la búsqueda.</p>'};
  draw(''); $('#gq').oninput=e=>draw(e.target.value);
}

/* Burbuja de información: una sola, reutilizada */
const bubble=document.createElement('div'); bubble.id='bubble'; bubble.setAttribute('role','dialog'); bubble.hidden=true; document.body.appendChild(bubble);
let bubbleFor=null;
function showBubble(t){
  const g=GI[t.dataset.g]; if(!g) return;
  if(bubbleFor===t&&!bubble.hidden) return hideBubble();
  bubbleFor=t;
  bubble.innerHTML=`<div class="bh"><b>${esc(g.k)}</b><button class="bx" aria-label="Cerrar">×</button></div><p>${esc(g.d)}</p><p class="bs">Fuente: <a href="${g.s[1]}" target="_blank" rel="noopener">${esc(g.s[0])}</a></p>`;
  bubble.hidden=false;
  const r=t.getBoundingClientRect(), w=bubble.offsetWidth, hh=bubble.offsetHeight;
  bubble.style.left=Math.max(scrollX+12,Math.min(r.left+scrollX,scrollX+innerWidth-w-12))+'px';
  bubble.style.top=(r.bottom+8+hh<innerHeight||r.top<hh+8?r.bottom+scrollY+8:r.top+scrollY-hh-8)+'px';
  bubble.querySelector('.bx').onclick=hideBubble;
}
function hideBubble(){bubble.hidden=true; bubbleFor=null}
// fase de captura: un término dentro de un botón (respuesta, partido) abre la burbuja sin activar el botón
document.addEventListener('click',e=>{const t=e.target.closest('.term'); if(t){e.preventDefault();e.stopPropagation();showBubble(t);return} if(!e.target.closest('#bubble')) hideBubble()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape') return hideBubble(); const t=e.target.closest&&e.target.closest('.term'); if(t&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();showBubble(t)}},true);
addEventListener('resize',hideBubble);
function renderVotes(){
  const sel=state.sel, P=Object.fromEntries(PARTIES.map(p=>[p.id,p]));
  // ponytail: la columna Sumar / FA se mantiene en Valencia y Canarias porque Compromís y Sumar votan dentro de ese grupo
  const cols=COLS.filter(([k])=>state.showAll||!sel||runs(P[k],sel)||k==='fa');
  $('#view').innerHTML=`<div class="res">${sel?`<div class="card">${whereRow()}<p class="hint">Columnas: partidos que se presentan donde votas y tienen votos registrados. <button class="linkbtn" id="all">${state.showAll?'Ver solo los míos':'Ver todos los partidos'}</button></p></div>`:''}
  ${voteTable(VOTES_CONG,cols,'Congreso de los Diputados (XV legislatura)')}
  <p class="hint">Sumar / FA = grupo Sumar en el Congreso (incluye Más Madrid, IU, Comuns, Compromís y CHA). Podemos vota aparte desde dic. 2023. Las celdas vacías son votos que no he podido verificar por partido. Fuente: El Congreso en tu mano y prensa citada en «Método».</p>
  ${voteTable(VOTES_EU,cols,'Parlamento Europeo (2024-2029 salvo indicación)')}
  <p class="hint">Sumar / FA = Movimiento Sumar y Comuns. ERC, Bildu y BNG comparten la candidatura europea Ahora Repúblicas (un eurodiputado cada uno). Junts solo tuvo eurodiputados en la legislatura 2019-2024. «—» = no votó o no tenía eurodiputados. Datos nominales de HowTheyVote.eu, agregados por partido español.</p></div>`;
  bindChg(); const a=$('#all'); if(a) a.onclick=()=>{state.showAll=!state.showAll;renderVotes()};
}
function renderMethod(){
  $('#view').innerHTML=`<div class="card prose">
  <h2>Cómo funciona</h2>
  <ul>
   <li>Cada pregunta tiene entre 6 y 8 respuestas colocadas sobre un mismo eje, de un extremo a otro. Hay posturas intermedias y extremos más radicales que los de cualquier partido. A cada partido lo sitúo en la respuesta más cercana a su programa o, si no lo tiene, a sus declaraciones y votos. Cada posición indica su fuente.</li>
   <li>Coincidencia por pregunta: 100 % si elegís la misma respuesta; baja en proporción a la distancia en el eje y llega a 0 % en los extremos opuestos. Elegir un extremo más radical que el de cualquier partido te aleja un poco de todos.</li>
   <li>Peso de cada pregunta = importancia que le das (×0,5, ×1, ×2) × peso del bloque. Tus prioridades y planes suben el peso del bloque hasta ×3.</li>
   <li>Si un partido no tiene posición en un tema, esa pregunta no cuenta para él. Para que un partido con pocas posiciones no salga arriba por azar, su resultado se acerca al 50 % cuanto menos datos tiene. La «cobertura» indica qué parte de tus respuestas se pudo comparar.</li>
   <li>Antes de responder eliges comunidad y, si quieres, provincia. Solo se puntúan los partidos que se presentan ahí: ERC y Junts solo en Cataluña, PNV en Euskadi, EH Bildu en Euskadi y Navarra, BNG en Galicia, CC, UPC y Drago en Canarias, Compromís-FV en la Comunitat Valenciana, Adelante en Andalucía, Existe en Aragón, Soria ¡Ya! en Soria, Democracia 21 en Madrid y Barcelona, Iustitia Europa en Madrid. Las preguntas son las mismas en todas partes.</li>
   <li>La viabilidad («escaño casi seguro», «probable»…) es una estimación a partir de la media de encuestas del 24-oct y de los resultados de 2023. En provincias de 1 a 3 escaños solo PP, PSOE y las candidaturas provinciales conservan su etiqueta.</li>
   <li>Las respuestas y tu circunscripción se guardan solo en este navegador (localStorage). No hay servidor, cuentas, cookies ni analítica: nadie, tampoco quien mantiene la web, puede ver lo que respondes. Para borrarlo, usa «Borrar todo» en Resultados.</li>
   <li>Del 24 al 29 de noviembre la ley electoral (LOREG, art. 69.7) prohíbe difundir sondeos: esos días se ocultan las medias de encuestas y las etiquetas de viabilidad, que salen de ellas.</li>
  </ul>
  <h2>Límites</h2>
  <ul>
   <li>A 24-oct-2026 casi ningún partido ha publicado su programa del 29-N. El PP tiene su «Contrato con España» y Vox difundió diez propuestas; para el resto uso el último programa (2023 o europeas 2024), documentos de 2025-2026, declaraciones y votos. Revisa los programas cuando salgan (la campaña empieza el 13-nov).</li>
   <li>UPC (Canarias) y Compromís-FV (Valencia) no tienen programa propio: donde no tienen una posición propia uso la del Frente Amplio, porque Movimiento Sumar, IU y Podemos van dentro de ellas. Lo indico en cada fuente («Como Frente Amplio»).</li>
   <li>Democracia 21, Iustitia Europa, Existe, Soria ¡Ya!, Drago, Falange y Democracia Nacional tienen muy pocas posiciones documentadas. En Democracia 21 relleno huecos con posiciones de Ciudadanos, su socio de coalición. Las de Adelante Andalucía salen de su discurso público, no de un programa.</li>
   <li>En Navarra el PP va con UPN: puntúo las posiciones del PP.</li>
   <li>Algunas preguntas de valores («¿Qué es España para ti?», «¿Qué te parece más justo?») sitúan a los partidos por deducción a partir de su programa.</li>
   <li>No incluyo votaciones de parlamentos autonómicos: en las generales votas a quién va al Congreso.</li>
   <li>Cuando una fuente secundaria contradecía el registro oficial, me quedo con el registro (por ejemplo, el voto de Alvise sobre el rearme).</li>
  </ul>
  <h2>Fuentes principales</h2>
  <ul>${SOURCES.map(([t,u])=>`<li><a href="${u}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('')}</ul>
  </div>`;
}
export function render(){
  hideBubble(); renderTabs();
  const s=state.sel; $('#circ').innerHTML=s?`Congreso · <b>${esc(selLabel(s))}</b> · <b>${seatsOf(s)}</b> escaños`:'Congreso · <b>350</b> escaños en 52 circunscripciones';
  ({cuestionario:renderQuiz,resultados:renderResults,partidos:renderParties,votaciones:renderVotes,glosario:renderGlossary,metodo:renderMethod}[state.tab]||renderQuiz)();
  $('#tabs').querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>go(b.dataset.tab));
}
