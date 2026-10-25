import {GLOSSARY} from '../domain/data/glossary.js';

const ENTITIES = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};

export const esc = s => String(s).replace(/[&<>"']/g, c => ENTITIES[c]);

export const GLOSSARY_BY_ID = Object.fromEntries(GLOSSARY.map(g => [g.id, g]));

const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isAcronym = alias => /\p{Lu}.*\p{Lu}/u.test(alias) && alias === alias.toUpperCase();

const ALIASES = GLOSSARY
  .flatMap(term => term.a.map(alias => ({alias: esc(alias), term, caseSensitive: !!term.cs || isAcronym(alias)})))
  .sort((a, b) => b.alias.length - a.alias.length);

const BY_ALIAS = new Map();
for (const x of ALIASES) {
  const key = x.alias.toLowerCase();
  BY_ALIAS.set(key, [...(BY_ALIAS.get(key) ?? []), x]);
}

const TERM_RE = new RegExp(`(?<![\\p{L}\\p{N}])(?:${ALIASES.map(x => escapeRegExp(x.alias)).join('|')})(?![\\p{L}\\p{N}])`, 'giu');

export const termButton = (id, label) => `<span class="term" tabindex="0" role="button" data-g="${id}">${label}</span>`;

// Escapa el texto y convierte en botón los términos del glosario. Cada término se marca
// solo la primera vez que sale en un mismo bloque; si no, la pantalla se llena de subrayados.
export function annotate(text, seen = new Set()) {
  return esc(text).replace(TERM_RE, match => {
    const hit = BY_ALIAS.get(match.toLowerCase())?.find(x => !x.caseSensitive || x.alias === match);
    if (!hit || seen.has(hit.term.id)) return match;
    seen.add(hit.term.id);
    return termButton(hit.term.id, match);
  });
}
