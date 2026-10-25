import {REGIONS} from '../../domain/data/regions.js';
import {hasProvinces, regionById, seatsOf} from '../../domain/electoral.js';
import {esc} from '../html.js';

function provinces(region, place) {
  const buttons = region.p.map(([name, n]) => `
    <button data-action="province" data-prov="${esc(name)}" aria-pressed="${place?.prov === name}">
      <span>${esc(name)}</span><span class="cnt">${n} escaños</span>
    </button>`).join('');
  return `
    <h2>¿En qué provincia votas?</h2>
    <p class="ctx">Cada provincia es una circunscripción con sus propios escaños: cuantos menos reparte, más difícil lo tienen los partidos pequeños. Algunas candidaturas solo se presentan en una provincia.</p>
    <div class="picker">
      ${buttons}
      <button data-action="province" data-prov=""><span>Toda la comunidad / no lo sé</span><span class="cnt">${seatsOf({ccaa: region.id})} escaños</span></button>
    </div>
    <div><button class="linkbtn" data-action="picker-back">← Elegir otra comunidad</button></div>`;
}

function regions(place) {
  const buttons = REGIONS.map(r => `
    <button data-action="region" data-ccaa="${r.id}" aria-pressed="${place?.ccaa === r.id}">
      <span>${esc(r.n)}</span><span class="cnt">${seatsOf({ccaa: r.id})} escaños</span>
    </button>`).join('');
  return `
    <h2>¿Dónde votas?</h2>
    <p class="ctx">En las generales cada comunidad tiene su propia papeleta: hay partidos que solo se presentan en Cataluña, Euskadi, Galicia, Canarias o una sola provincia, y coaliciones que cambian de nombre según el territorio. Solo compararemos tus respuestas con los partidos que se presentan donde votas. Si votas desde el extranjero, elige la provincia en la que estás inscrito.</p>
    <div class="picker">${buttons}</div>`;
}

export function render({quiz, ui}) {
  const pending = ui.pendingRegion && regionById(ui.pendingRegion);
  const answered = quiz.answeredCount();
  return `
    <section class="card">
      ${pending ? provinces(pending, quiz.place) : regions(quiz.place)}
      ${answered ? `<p class="hint">Tus ${answered} respuestas anteriores se conservan.</p>` : ''}
    </section>`;
}

function done(ctx) {
  Object.assign(ctx.ui, {pendingRegion: null, picking: false, openParty: null});
  ctx.refresh();
}

export const actions = {
  region(ctx, el) {
    const region = regionById(el.dataset.ccaa);
    if (hasProvinces(region)) {
      ctx.ui.pendingRegion = region.id;
      return ctx.refresh();
    }
    ctx.quiz.choosePlace(region.id);
    done(ctx);
  },
  province(ctx, el) {
    ctx.quiz.choosePlace(ctx.ui.pendingRegion, el.dataset.prov || null);
    done(ctx);
  },
  'picker-back'(ctx) {
    ctx.ui.pendingRegion = null;
    ctx.refresh();
  },
};
