import {PARTIES} from '../../domain/data/parties.js';
import {FICHAS, NOTAS, OTROS} from '../../domain/data/reference.js';
import {ballotName, leadCandidate, partiesIn} from '../../domain/electoral.js';
import {annotate, esc} from '../html.js';
import {BLACKOUT_TEXT, viabilityChip, whereRow} from './shared.js';

function placeCard(place, others, showAll) {
  const note = NOTAS[place.ccaa];
  const absent = others.length ? `
    <p class="hint">No se presentan donde votas: ${others.map(p => esc(p.n)).join(', ')}.
      <button class="linkbtn" data-action="toggle-all">${showAll ? 'Ver solo los de mi papeleta' : 'Ver todas las fichas'}</button>
    </p>` : '';
  return `<div class="card">${whereRow(place)}${note ? `<p class="hint">${annotate(note)}</p>` : ''}${absent}</div>`;
}

function partyCard(party, place, runsHere, pollsHidden) {
  const f = FICHAS[party.id];
  const seen = new Set([party.id]);
  const field = (label, text) => `<div><b>${label}</b>${annotate(text, seen)}</div>`;
  return `
    <details class="party">
      <summary>
        <span class="row"><h3>${esc(ballotName(party, place))}</h3>${runsHere ? viabilityChip(party, place, pollsHidden) : '<span class="chip">No se presenta aquí</span>'}</span>
        <span class="small muted">${annotate(party.full, seen)} · ${esc(leadCandidate(party, place))}</span>
        <span class="small">${annotate(pollsHidden ? BLACKOUT_TEXT : party.poll, seen)}</span>
      </summary>
      <div class="kv">
        ${field('Qué es', f.res)}
        ${field('Programa y propuestas', f.prog)}
        ${field('Economía', f.eco)}
        ${field('Social', f.soc)}
        <div><b>Lo que dice vs. lo que vota</b><ul>${f.coh.map(c => `<li>${annotate(c, seen)}</li>`).join('')}</ul></div>
      </div>
    </details>`;
}

export function render({quiz, ui}) {
  const place = quiz.place;
  const mine = partiesIn(place);
  const others = PARTIES.filter(p => !mine.includes(p));
  const shown = ui.showAll.partidos || !place ? PARTIES : mine;
  const extras = OTROS.map(([title, text]) => `<div class="li"><span class="t">${esc(title)}</span><span class="small muted">${annotate(text)}</span></div>`).join('');
  return `
    <div class="res">
      <p class="notice">Candidaturas anunciadas a 24-oct-2026. El plazo para presentar listas acaba el 26-oct; el BOE las publica el 28-oct y se proclaman el 2-nov. Los partidos sin representación necesitan avales del 0,1 % del censo de cada provincia, así que alguno puede quedarse fuera.</p>
      ${place ? placeCard(place, others, ui.showAll.partidos) : ''}
      <div class="grid">${shown.map(p => partyCard(p, place, !place || mine.includes(p), quiz.pollsHidden)).join('')}</div>
      <div class="card"><h3>Otras opciones en la papeleta</h3>${extras}</div>
    </div>`;
}
