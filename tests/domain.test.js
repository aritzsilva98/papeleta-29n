import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SECTIONS} from '../public/src/domain/data/sections.js';
import {REGIONS} from '../public/src/domain/data/regions.js';
import {PARTIES} from '../public/src/domain/data/parties.js';
import {QUESTIONS} from '../public/src/domain/data/questions.js';
import {FICHAS, COLS, VOTES_CONG, VOTES_EU} from '../public/src/domain/data/reference.js';
import {makePlace, partiesIn, pollsHidden, representedIn, runsIn, totalSeats, viability} from '../public/src/domain/electoral.js';
import {options, score, sectionWeights} from '../public/src/domain/scoring.js';

const party = id => PARTIES.find(p => p.id === id);
const idsIn = place => partiesIn(place).map(p => p.id);

test('cada pregunta tiene al menos seis respuestas y posiciones válidas', () => {
  const ids = new Set();
  for (const q of QUESTIONS) {
    assert.ok(!ids.has(q.id), `id repetido: ${q.id}`);
    ids.add(q.id);
    assert.ok(SECTIONS[q.s], `${q.id}: bloque desconocido`);
    const xs = options(q).map(o => o.x);
    assert.ok(xs.length >= 6, `${q.id} solo tiene ${xs.length} respuestas`);
    assert.equal(new Set(xs).size, xs.length, `${q.id}: posiciones repetidas`);
    for (const [id, [x]] of Object.entries(q.m)) {
      assert.ok(party(id), `${q.id}: partido desconocido ${id}`);
      assert.ok(xs.includes(x), `${q.id}: ${id} está en una posición que no existe (${x})`);
    }
  }
});

test('las preguntas de un mismo bloque van seguidas', () => {
  const order = QUESTIONS.map(q => q.s);
  assert.ok(order.every((s, i) => i === 0 || s === order[i - 1] || !order.slice(0, i).includes(s)));
});

test('el Congreso reparte 350 escaños', () => {
  assert.equal(totalSeats(), 350);
});

test('fichas y votaciones solo citan partidos que existen', () => {
  for (const [id] of COLS) assert.ok(party(id), `columna ${id}`);
  for (const row of [...VOTES_CONG, ...VOTES_EU]) {
    for (const id in row[3]) assert.ok(COLS.some(([c]) => c === id), `voto de ${id} sin columna`);
  }
  for (const p of PARTIES) assert.ok(FICHAS[p.id], `falta la ficha de ${p.id}`);
});

test('cada partido gana, o empata, si respondes exactamente lo que defiende', () => {
  for (const p of PARTIES) {
    const region = REGIONS.find(r => runsIn(p, {ccaa: r.id}));
    assert.ok(region, `${p.id} no se presenta en ninguna parte`);
    const place = {ccaa: region.id, prov: p.only?.[region.id]?.[0] ?? null};
    const answers = {};
    for (const q of QUESTIONS) if (q.m[p.id]) answers[q.id] = {v: q.m[p.id][0], w: 1};
    const ranking = score(answers, {}, place);
    const own = ranking.find(r => r.party.id === p.id);
    assert.ok(ranking[0].party.id === p.id || Math.abs(ranking[0].pct - own.pct) < 1e-9,
      `${p.id} en ${region.id} debería salir primero; salen ${ranking.slice(0, 3).map(r => r.party.id)}`);
  }
});

test('solo se comparan los partidos que se presentan donde votas', () => {
  assert.ok(idsIn({ccaa: 'cat'}).includes('erc') && !idsIn({ccaa: 'mad'}).includes('erc'));
  assert.ok(!idsIn({ccaa: 'cat'}).includes('pod') && idsIn({ccaa: 'mad'}).includes('pod'));
  assert.ok(idsIn({ccaa: 'cyl', prov: 'Soria'}).includes('soria') && !idsIn({ccaa: 'cyl', prov: 'León'}).includes('soria'));
  assert.ok(!idsIn({ccaa: 'cat', prov: 'Girona'}).includes('d21') && idsIn({ccaa: 'cat', prov: 'Barcelona'}).includes('d21'));
  assert.ok(!idsIn({ccaa: 'val'}).includes('fa') && idsIn({ccaa: 'val'}).includes('comp'));
});

test('en provincias pequeñas solo los grandes y los locales conservan opciones', () => {
  const soria = {ccaa: 'cyl', prov: 'Soria'};
  assert.equal(viability(party('vox'), soria), 'incierto');
  assert.equal(viability(party('pp'), soria), 'seguro');
  assert.equal(viability(party('soria'), soria), 'incierto');
  assert.equal(viability(party('pod'), soria), 'improbable');
});

test('la veda de encuestas va en hora peninsular', () => {
  assert.ok(!pollsHidden(new Date('2026-11-23T22:30:00Z')));
  assert.ok(pollsHidden(new Date('2026-11-23T23:30:00Z')));
  assert.ok(pollsHidden(new Date('2026-11-29T20:00:00Z')));
  assert.ok(!pollsHidden(new Date('2026-11-30T00:00:00Z')));
});

test('la provincia se rellena sola si la comunidad solo tiene una', () => {
  assert.deepEqual(makePlace('mad'), {ccaa: 'mad', prov: 'Madrid'});
  assert.deepEqual(makePlace('cyl', 'Soria'), {ccaa: 'cyl', prov: 'Soria'});
  assert.deepEqual(makePlace('cyl', 'Gotham'), {ccaa: 'cyl', prov: null});
  assert.equal(makePlace('nope'), null);
});

test('el Frente Amplio sigue contando donde va dentro de otra coalición', () => {
  assert.ok(!runsIn(party('fa'), {ccaa: 'val'}) && representedIn(party('fa'), {ccaa: 'val'}));
  assert.ok(representedIn(party('fa'), {ccaa: 'can'}));
  assert.ok(!representedIn(party('pod'), {ccaa: 'val'}));
});

test('los planes suben el peso de sus bloques sin pasar de tres', () => {
  const w = sectionWeights({prio: ['vivienda', 'fiscal'], casa: 1, curro: 1});
  assert.equal(w.vivienda, 3);
  assert.equal(w.fiscal, 3);
  assert.equal(w.trabajo, 1.5);
  assert.equal(w.sanidad, 1);
});
