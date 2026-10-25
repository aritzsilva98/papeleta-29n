import {PARTIES} from '../../domain/data/parties.js';
import {COLS, PILL, VOTES_CONG, VOTES_EU} from '../../domain/data/reference.js';
import {representedIn} from '../../domain/electoral.js';
import {annotate, esc} from '../html.js';
import {whereRow} from './shared.js';

const byId = Object.fromEntries(PARTIES.map(p => [p.id, p]));

function table(rows, columns, caption) {
  const cols = columns.filter(([id]) => rows.some(r => r[3][id]));
  const head = cols.map(([, label]) => `<th>${label}</th>`).join('');
  const body = rows.map(([date, title, outcome, votes, notes]) => {
    const seen = new Set();
    const cells = cols.map(([id]) => `<td class="v">${votes[id] ? `<span class="pill ${votes[id]}">${PILL[votes[id]]}</span>` : ''}</td>`).join('');
    return `<tr><td class="mono">${date}</td><td>${annotate(title, seen)}</td><td>${esc(outcome)}</td>${cells}<td class="muted">${annotate(notes, seen)}</td></tr>`;
  }).join('');
  return `
    <h2>${caption}</h2>
    <div class="tbl"><table>
      <thead><tr><th>Fecha</th><th>Votación</th><th>Resultado</th>${head}<th>Otros</th></tr></thead>
      <tbody>${body}</tbody>
    </table></div>`;
}

export function render({quiz, ui}) {
  const place = quiz.place;
  const cols = COLS.filter(([id]) => ui.showAll || representedIn(byId[id], place));
  const filter = place ? `
    <div class="card">
      ${whereRow(place)}
      <p class="hint">Columnas: partidos que se presentan donde votas y tienen votos registrados.
        <button class="linkbtn" data-action="toggle-all">${ui.showAll ? 'Ver solo los míos' : 'Ver todos los partidos'}</button>
      </p>
    </div>` : '';
  return `
    <div class="res">
      ${filter}
      ${table(VOTES_CONG, cols, 'Congreso de los Diputados (XV legislatura)')}
      <p class="hint">Sumar / FA = grupo Sumar en el Congreso (incluye Más Madrid, IU, Comuns, Compromís y CHA). Podemos vota aparte desde dic. 2023. Las celdas vacías son votos que no he podido verificar por partido. Fuente: El Congreso en tu mano y prensa citada en «Método».</p>
      ${table(VOTES_EU, cols, 'Parlamento Europeo (2024-2029 salvo indicación)')}
      <p class="hint">Sumar / FA = Movimiento Sumar y Comuns. ERC, Bildu y BNG comparten la candidatura europea Ahora Repúblicas (un eurodiputado cada uno). Junts solo tuvo eurodiputados en la legislatura 2019-2024. «—» = no votó o no tenía eurodiputados. Datos nominales de HowTheyVote.eu, agregados por partido español.</p>
    </div>`;
}
