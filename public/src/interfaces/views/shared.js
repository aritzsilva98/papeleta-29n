import {VIABILITY} from '../../domain/data/sections.js';
import {partiesIn, pollsHidden, regionById, seatsOf, viability} from '../../domain/electoral.js';
import {esc} from '../html.js';

export const BLACKOUT = pollsHidden();
export const BLACKOUT_TEXT = 'Encuestas ocultas: veda electoral del 24 al 29 de noviembre (LOREG, art. 69.7)';

export function placeLabel(place) {
  if (!place) return '';
  const region = regionById(place.ccaa);
  return place.prov && region.p.length > 1 ? `${place.prov} (${region.n})` : region.n;
}

export const whereRow = place => `
  <div class="row">
    <span class="hint">Votas en <b>${esc(placeLabel(place))}</b> · ${seatsOf(place)} escaños · ${partiesIn(place).length} candidaturas comparadas</span>
    <button class="linkbtn" data-action="change-place">Cambiar</button>
  </div>`;

export function viabilityChip(party, place) {
  if (BLACKOUT) return '<span class="chip">Sin estimación (veda electoral)</span>';
  const v = viability(party, place);
  return `<span class="chip ${v}">${VIABILITY[v]}</span>`;
}

export const sourceLink = ([label, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`;
