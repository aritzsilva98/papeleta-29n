import {SECTIONS} from '../../domain/data/sections.js';
import {FICHAS, NOTAS} from '../../domain/data/reference.js';
import {ballotName, leadCandidate, partiesIn} from '../../domain/electoral.js';
import {agreementLevel, hasLowCoverage, highlights, optionText} from '../../domain/scoring.js';
import {annotate, esc} from '../html.js';
import {placeLabel, viabilityChip, whereRow} from './shared.js';

const prompt = (title, text, button) => `
  <div class="card">
    <h2>${title}</h2>
    <p class="muted">${text}</p>
    <div><button class="btn primary" data-action="back-to-quiz">${button}</button></div>
  </div>`;

function ballotStrip(place) {
  const names = partiesIn(place).map(p => `<span class="chip">${esc(ballotName(p, place))}</span>`).join('');
  return `
    <div class="card">
      <h3>Quién puede aparecer en tu papeleta (${esc(placeLabel(place))})</h3>
      <div class="chips">${names}</div>
      <p class="hint">Las candidaturas presentadas salen en el BOE el 28 de octubre y se proclaman el 2 de noviembre.</p>
    </div>`;
}

function breakdown(result, place) {
  const {matches, clashes} = highlights(result);
  const seen = new Set();
  const item = row => `
    <div class="li">
      <span class="t"><span class="dot ${agreementLevel(row.closeness)}"></span>${annotate(row.question.t, seen)}</span>
      <span class="small">Tú: ${annotate(optionText(row.question, row.answer), seen)}</span>
      <span class="small muted">${esc(ballotName(result.party, place))}: ${annotate(optionText(row.question, row.position[0]), seen)} · <i>${annotate(row.position[1], seen)}</i></span>
    </div>`;
  const list = (rows, empty) => rows.map(item).join('') || `<p class="muted small">${empty}</p>`;
  const coherence = FICHAS[result.party.id].coh.map(c => `<li>${annotate(c, seen)}</li>`).join('');
  return `
    <div class="detail">
      <div class="cols">
        <div><h3>Donde más coincidís</h3>${list(matches, 'Ninguna coincidencia clara.')}</div>
        <div><h3>Donde más chocáis</h3>${list(clashes, 'Ningún choque fuerte.')}</div>
      </div>
      <div class="kv"><div><b>Lo que dice vs. lo que vota</b><ul>${coherence}</ul></div></div>
    </div>`;
}

function partyRow(result, place, open, pollsHidden) {
  const {party, pct, rows, coverage} = result;
  return `
    <div class="pr">
      <button aria-expanded="${open}" data-action="toggle-party" data-party="${party.id}">
        <span class="nm">${esc(ballotName(party, place))} <span class="muted small">· ${esc(leadCandidate(party, place))}</span></span>
        <span class="pct">${pct == null ? '—' : Math.round(pct) + ' %'}</span>
        <span class="chips">
          ${viabilityChip(party, place, pollsHidden)}
          <span class="chip">${rows.length} temas comparables · cobertura ${Math.round(coverage * 100)} %</span>
          ${hasLowCoverage(result) ? '<span class="chip improbable">Pocos datos</span>' : ''}
        </span>
        <span class="bar"><i data-bar="${pct ?? 0}"></i></span>
      </button>
      ${open ? breakdown(result, place) : ''}
    </div>`;
}

function usefulVoteNotice({closest, onEdge, askProvince}, place) {
  const name = p => esc(ballotName(p, place));
  const [first, second] = closest;
  const edge = onEdge.map(p => ballotName(p, place));
  const sentences = [
    `Te importa que tu voto cuente. Entre los partidos con opciones de escaño en ${esc(placeLabel(place))}, el más cercano a ti es <b>${first ? name(first) : '—'}</b>${second ? `, seguido de <b>${name(second)}</b>` : ''}.`,
  ];
  if (edge.length) sentences.push(`${esc(edge.join(' y '))} ${edge.length > 1 ? 'están' : 'está'} en el filo del 3 %.`);
  if (askProvince) sentences.push('Indica tu provincia para afinar: en las pequeñas solo los grandes sacan escaño.');
  return `<p class="notice">${sentences.join(' ')}</p>`;
}

export function render({quiz, ui}) {
  const place = quiz.place;
  const res = quiz.results();
  if (res.status === 'no-place') {
    return prompt('Primero, dónde votas', 'El resultado solo compara los partidos que se presentan en tu comunidad.', 'Elegir comunidad');
  }
  if (res.status === 'too-few') {
    return prompt('Aún faltan respuestas',
      `Llevas ${res.answered} de ${res.total}. Con menos de ${res.needed} el resultado no dice nada. Las preguntas que dejes sin opinión no cuentan.`,
      'Seguir respondiendo') + ballotStrip(place);
  }

  const boosted = res.boosted.length ? ` y por tus planes (pesan más: ${res.boosted.map(k => SECTIONS[k].toLowerCase()).join(', ')})` : '';
  const note = NOTAS[place.ccaa];
  return `
    <div class="res">
      <div class="card">
        ${whereRow(place)}
        <h2>Tu afinidad con cada partido</h2>
        <p class="muted">Porcentaje de coincidencia entre tus respuestas y las posiciones documentadas de los ${res.ranking.length} partidos que se presentan donde votas, ponderado por la importancia que diste a cada tema${boosted}. Toca un partido para ver dónde coincidís y dónde chocáis.</p>
        ${note ? `<p class="hint">${annotate(note)}</p>` : ''}
        ${res.usefulVote ? usefulVoteNotice(res.usefulVote, place) : ''}
      </div>
      ${res.ranking.map(r => partyRow(r, place, ui.openParty === r.party.id, quiz.pollsHidden)).join('')}
      <p class="notice">Esto mide coincidencias con programas y votos, no te dice a quién votar. A 24-oct casi ningún partido ha publicado el programa del 29-N: lee su ficha antes de decidir, sobre todo si está arriba con «pocos datos».</p>
      <div class="row">
        <button class="btn" data-action="review">Repasar respuestas</button>
        <button class="btn" data-action="reset">Borrar todo y empezar de nuevo</button>
      </div>
    </div>`;
}

export const actions = {
  'back-to-quiz': ctx => ctx.go('cuestionario'),
  'toggle-party'(ctx, el) {
    ctx.ui.openParty = ctx.ui.openParty === el.dataset.party ? null : el.dataset.party;
    ctx.refresh();
  },
  review(ctx) {
    ctx.quiz.reviewAnswers();
    ctx.go('cuestionario');
  },
  reset(ctx, el) {
    if (!el.dataset.armed) {
      el.dataset.armed = '1';
      el.textContent = 'Pulsa otra vez para borrar';
      return;
    }
    ctx.quiz.reset();
    Object.assign(ctx.ui, {openParty: null, picking: false, pendingRegion: null, showAll: {}});
    ctx.go('cuestionario');
  },
};
