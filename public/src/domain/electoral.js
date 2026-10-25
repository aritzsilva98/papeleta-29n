import {REGIONS} from './data/regions.js';
import {PARTIES} from './data/parties.js';

// Un lugar de voto es {ccaa, prov}; prov puede ser null si el votante no la indica.

const SEAT_CHANCE = new Set(['seguro', 'probable', 'filo']);
const SMALL_CONSTITUENCY = 3;
const SAFE_IN_SMALL = new Set(['pp', 'psoe']);
const SMALL_OVERRIDE = {vox: 'incierto'};

// LOREG art. 69.7: no se pueden difundir sondeos los cinco días anteriores a la votación ni ese mismo día.
const POLL_BLACKOUT = ['2026-11-24', '2026-11-29'];

export const regionById = id => REGIONS.find(r => r.id === id);

export const hasProvinces = region => region.p.length > 1;

// En las comunidades de una sola provincia la provincia se rellena sola; en el resto
// solo se acepta si existe, y si no se queda en null («toda la comunidad»).
export function makePlace(ccaa, prov = null) {
  const region = regionById(ccaa);
  if (!region) return null;
  if (!hasProvinces(region)) return {ccaa, prov: region.p[0][0]};
  return {ccaa, prov: region.p.some(([name]) => name === prov) ? prov : null};
}

const regionSeats = region => region.p.reduce((sum, [, seats]) => sum + seats, 0);

export function seatsOf(place) {
  const region = regionById(place.ccaa);
  if (!region) return 0;
  if (!place.prov) return regionSeats(region);
  return region.p.find(([name]) => name === place.prov)?.[1] ?? 0;
}

export const totalSeats = () => REGIONS.reduce((sum, r) => sum + regionSeats(r), 0);

export function runsIn(party, place) {
  if (!place?.ccaa) return true;
  if (party.x?.includes(place.ccaa)) return false;
  if (!(place.ccaa in party.v) && !('_' in party.v)) return false;
  const provinces = party.only?.[place.ccaa];
  return !(provinces && place.prov && !provinces.includes(place.prov));
}

export const partiesIn = place => PARTIES.filter(p => runsIn(p, place));

// Compromís-FV y UPC son coaliciones nuevas sin votaciones propias. Donde se presentan,
// lo útil es ver cómo votó el Frente Amplio, del que heredan posiciones.
export const representedIn = (party, place) => runsIn(party, place) || partiesIn(place).some(p => p.base === party.id);

export function viability(party, place) {
  if (!place?.ccaa) return party.v._ ?? Object.values(party.v)[0];
  const label = (place.prov && party.vp?.[place.prov]) || party.v[place.ccaa] || party.v._;
  // En una provincia que reparte tres escaños o menos solo los dos grandes y los partidos
  // que se juegan esa provincia en concreto tienen opciones reales.
  const local = party.only || party.vp;
  if (place.prov && seatsOf(place) <= SMALL_CONSTITUENCY && !local && !SAFE_IN_SMALL.has(party.id) && label !== 'nc') {
    return SMALL_OVERRIDE[party.id] ?? 'improbable';
  }
  return label;
}

export const hasSeatChance = (party, place) => SEAT_CHANCE.has(viability(party, place));

export const ballotName = (party, place) => (place && party.al?.[place.ccaa]) || party.n;

export const leadCandidate = (party, place) => (place && party.hd?.[place.ccaa]) || party.head;

export function pollsHidden(now = new Date()) {
  const day = new Intl.DateTimeFormat('sv-SE', {timeZone: 'Europe/Madrid'}).format(now);
  return day >= POLL_BLACKOUT[0] && day <= POLL_BLACKOUT[1];
}
