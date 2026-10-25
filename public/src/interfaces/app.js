import {STEPS} from '../application/quiz.js';
import {seatsOf, totalSeats} from '../domain/electoral.js';
import {esc} from './html.js';
import {createGlossaryBubble} from './bubble.js';
import {placeLabel} from './views/shared.js';
import * as quizView from './views/quiz.js';
import * as resultsView from './views/results.js';
import * as partiesView from './views/parties.js';
import * as votesView from './views/votes.js';
import * as glossaryView from './views/glossary.js';
import * as methodView from './views/method.js';

const TABS = [
  {id: 'cuestionario', label: 'Cuestionario', view: quizView},
  {id: 'resultados', label: 'Resultados', view: resultsView},
  {id: 'partidos', label: 'Partidos', view: partiesView},
  {id: 'votaciones', label: 'Votaciones', view: votesView},
  {id: 'glosario', label: 'Glosario', view: glossaryView},
  {id: 'metodo', label: 'Método y fuentes', view: methodView},
];

const SHARED_ACTIONS = {
  'change-place'(ctx) {
    ctx.ui.picking = true;
    ctx.go('cuestionario');
  },
  'toggle-all'(ctx) {
    ctx.ui.showAll[ctx.ui.tab] = !ctx.ui.showAll[ctx.ui.tab];
    ctx.refresh();
  },
};

const tabById = id => TABS.find(t => t.id === id) ?? TABS[0];

export function mount(quiz) {
  const root = document.querySelector('#view');
  const nav = document.querySelector('#tabs');
  const header = document.querySelector('#circ');
  const bubble = createGlossaryBubble();
  const ui = {
    tab: tabById(location.hash.slice(1)).id,
    picking: false,
    pendingRegion: null,
    openParty: null,
    showAll: {},
    glossaryQuery: '',
  };
  const ctx = {quiz, ui, refresh, go};

  function paintTabs() {
    nav.innerHTML = TABS.map(({id, label}) => {
      const count = id === 'resultados' ? ` <span class="muted small">(${quiz.answeredCount()})</span>` : '';
      return `<button role="tab" id="tab-${id}" aria-selected="${ui.tab === id}" data-tab="${id}">${label}${count}</button>`;
    }).join('');
  }

  function paintHeader() {
    const place = quiz.place;
    header.innerHTML = place
      ? `Congreso · <b>${esc(placeLabel(place))}</b> · <b>${seatsOf(place)}</b> escaños`
      : `Congreso · <b>${totalSeats()}</b> escaños en 52 circunscripciones`;
  }

  function refresh() {
    bubble.hide();
    paintTabs();
    paintHeader();
    root.innerHTML = tabById(ui.tab).view.render(ctx);
    // La CSP no deja usar style="" en el HTML, así que el ancho de las barras se pone desde aquí.
    root.querySelectorAll('[data-bar]').forEach(el => { el.style.width = el.dataset.bar + '%'; });
  }

  function go(tab) {
    ui.tab = tab;
    try { history.replaceState(null, '', '#' + tab); } catch {}
    refresh();
    scrollTo({top: 0});
  }

  root.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = tabById(ui.tab).view.actions?.[el.dataset.action] ?? SHARED_ACTIONS[el.dataset.action];
    action?.(ctx, el);
  });

  root.addEventListener('input', e => {
    const el = e.target.closest('[data-input]');
    if (el) tabById(ui.tab).view.inputs?.[el.dataset.input]?.(ctx, el);
  });

  nav.addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (tab) go(tab.dataset.tab);
  });

  document.querySelector('#nq').textContent = STEPS.length;
  refresh();
}
