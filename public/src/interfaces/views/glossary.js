import {GLOSSARY} from '../../domain/data/glossary.js';
import {esc, sourceLink} from '../html.js';

const CATEGORIES = [...new Set(GLOSSARY.map(g => g.c))];

const matches = (term, query) => !query || `${term.k} ${term.d} ${term.a.join(' ')}`.toLowerCase().includes(query);

function list(rawQuery) {
  const query = rawQuery.trim().toLowerCase();
  const cards = CATEGORIES.map(category => {
    const terms = GLOSSARY.filter(g => g.c === category && matches(g, query)).sort((a, b) => a.k.localeCompare(b.k, 'es'));
    if (!terms.length) return '';
    const items = terms.map(g => `
      <div class="li">
        <span class="t">${esc(g.k)}</span>
        <span class="small">${esc(g.d)}</span>
        <span class="small muted">Fuente: ${sourceLink(g.s)}</span>
      </div>`).join('');
    return `<div class="card"><h3>${esc(category)}</h3><div>${items}</div></div>`;
  }).join('');
  return cards || '<p class="muted">Ningún término coincide con la búsqueda.</p>';
}

export function render({ui}) {
  return `
    <div class="res">
      <div class="card">
        <h2>Glosario</h2>
        <p class="muted">${GLOSSARY.length} siglas, leyes y términos técnicos con su fuente. En el resto de la página aparecen subrayados con puntos: tócalos para ver la explicación.</p>
        <input id="gq" type="search" data-input="search" value="${esc(ui.glossaryQuery)}" placeholder="Buscar: IRPF, zona tensionada, Frontex…" aria-label="Buscar en el glosario">
      </div>
      <div class="res" id="gl">${list(ui.glossaryQuery)}</div>
    </div>`;
}

export const inputs = {
  // Repaint only the list so the search box keeps focus while typing.
  search(ctx, el) {
    ctx.ui.glossaryQuery = el.value;
    document.getElementById('gl').innerHTML = list(el.value);
  },
};
