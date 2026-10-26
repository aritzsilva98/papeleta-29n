import {GLOSSARY} from '../domain/data/glossary.js';

const ENTITIES = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};

export const esc = s => String(s).replace(/[&<>"']/g, c => ENTITIES[c]);

export const sourceLink = ([label, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`;

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

// No lookbehind on purpose: Safari before iOS 16.4 fails to parse it and the page would render blank.
const TERM_RE = new RegExp(`(^|[^\\p{L}\\p{N}])(${ALIASES.map(x => escapeRegExp(x.alias)).join('|')})(?![\\p{L}\\p{N}])`, 'giu');

const termButton = (id, label) => `<span class="term" tabindex="0" role="button" data-g="${id}">${label}</span>`;

// Each term is marked only on its first appearance per block (`seen`), or the screen fills with underlines.
export function annotate(text, seen = new Set()) {
  return esc(text).replace(TERM_RE, (whole, before, match) => {
    const hit = BY_ALIAS.get(match.toLowerCase())?.find(x => !x.caseSensitive || x.alias === match);
    if (!hit || seen.has(hit.term.id)) return whole;
    seen.add(hit.term.id);
    return before + termButton(hit.term.id, match);
  });
}
