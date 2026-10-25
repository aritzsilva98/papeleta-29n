// Escapado de texto y marcado de términos del glosario. Todo texto que acaba en innerHTML pasa por aquí.
import {GLOSS} from '../domain/glossary.js';

export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const GI=Object.fromEntries(GLOSS.map(g=>[g.id,g]));
const reEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const ALIASES=GLOSS.flatMap(g=>g.a.map(a=>({a:esc(a),g,cs:!!g.cs||(/\p{Lu}.*\p{Lu}/u.test(a)&&a===a.toUpperCase())}))).sort((x,y)=>y.a.length-x.a.length);
const AMAP=new Map(); for(const x of ALIASES){const k=x.a.toLowerCase(); if(!AMAP.has(k)) AMAP.set(k,[]); AMAP.get(k).push(x)}
const TERM_RE=new RegExp('(?<![\\p{L}\\p{N}])(?:'+ALIASES.map(x=>reEsc(x.a)).join('|')+')(?![\\p{L}\\p{N}])','giu');
// ponytail: cada término se marca solo la primera vez por bloque (seen) para no llenar la pantalla de subrayados
export function ann(text,seen=new Set()){
  return esc(text).replace(TERM_RE,m=>{
    const c=(AMAP.get(m.toLowerCase())||[]).find(x=>!x.cs||x.a===m);
    if(!c||seen.has(c.g.id)) return m;
    seen.add(c.g.id); return `<span class="term" tabindex="0" role="button" data-g="${c.g.id}">${m}</span>`;
  });
}
