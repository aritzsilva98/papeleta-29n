import {SECTIONS} from '../../domain/data/sections.js';
import {QUESTIONS} from '../../domain/data/questions.js';
import {isAnswered, options, optionText} from '../../domain/scoring.js';
import {STEPS} from '../../application/quiz.js';
import {annotate, esc} from '../html.js';
import {whereRow} from './shared.js';
import * as picker from './picker.js';

const LETTERS = 'ABCDEFGHIJ';
const IMPORTANCE = [[0.5, 'Poco'], [1, 'Normal'], [2, 'Mucho']];
const RETURN_LABEL = {repaso: '← Volver al repaso', resultados: '← Volver a resultados'};

const option = (attrs, pressed, key, text) =>
  `<button class="opt" aria-pressed="${pressed}" ${attrs}><span class="k">${key}</span><span>${text}</span></button>`;

function sidebar(quiz, progress) {
  return progress.map(p => `
    <button data-action="jump" data-step="${p.first}" class="${quiz.current.section === p.section ? 'on' : ''}">
      <span>${SECTIONS[p.section]}</span><span class="cnt">${p.done}/${p.total}</span>
    </button>`).join('');
}

function blockSelect(quiz, progress) {
  const opts = progress.map(p =>
    `<option value="${p.first}" ${quiz.current.section === p.section ? 'selected' : ''}>${SECTIONS[p.section]} · ${p.done}/${p.total}</option>`).join('');
  return `<select class="blocksel" data-input="block" aria-label="Ir a un bloque">${opts}</select>`;
}

function planOptions(plan, picked, seen) {
  return plan.o.map((o, i) => {
    const on = plan.multi ? (picked ?? []).includes(o.sec) : picked === i;
    return option(`data-action="plan" data-index="${i}"`, on, plan.multi ? '✓' : LETTERS[i], annotate(o.t, seen));
  }).join('');
}

function questionOptions(question, answer, seen) {
  const choices = options(question).map((o, i) =>
    option(`data-action="answer" data-v="${o.x}"`, answer.v === o.x, LETTERS[i], annotate(o.t, seen))).join('');
  return choices + `<button class="opt na" aria-pressed="${answer.v === null}" data-action="answer" data-v="na">Sin opinión / no lo tengo claro (no cuenta)</button>`;
}

const weightButtons = (answer, id = '') => IMPORTANCE.map(([w, label]) =>
  `<button data-action="weigh" data-weight="${w}" ${id ? `data-id="${id}"` : ''} aria-pressed="${answer.w === w}">${label}</button>`).join('');

const importance = answer => `
  <div class="imp">
    <span>¿Cuánto te importa este tema?</span>
    <div class="seg" role="group" aria-label="Importancia">${weightButtons(answer)}</div>
  </div>`;

function answerSummary(quiz, step) {
  const {kind, item} = step;
  if (kind === 'plan') {
    const picked = quiz.planOf(item.id);
    if (item.multi) return picked?.length ? picked.map(k => SECTIONS[k]).join(', ') : null;
    return item.o[picked]?.t ?? null;
  }
  const answer = quiz.answerOf(item.id);
  if (answer.v === null) return 'Sin opinión';
  return isAnswered(answer) ? optionText(item, answer.v) : null;
}

function reviewRow(quiz, step) {
  const summary = answerSummary(quiz, step);
  const answer = quiz.answerOf(step.item.id);
  const weigh = step.kind === 'question' && isAnswered(answer)
    ? `<div class="seg" role="group" aria-label="Importancia: ${esc(step.item.t)}">${weightButtons(answer, step.item.id)}</div>` : '';
  return `
    <div class="rv" id="rv-${step.item.id}">
      <button class="rv-q" data-action="edit" data-q="${step.item.id}">
        <span class="t">${esc(step.item.t)}</span>
        <span class="small ${summary ? 'muted' : 'todo'}">${esc(summary ?? 'Sin responder')}</span>
      </button>
      ${weigh}
    </div>`;
}

function review(quiz) {
  const blocks = quiz.progress().map(p => `
    <h3>${SECTIONS[p.section]} <span class="muted small">${p.done}/${p.total}</span></h3>
    ${STEPS.slice(p.first, p.first + p.total).map(st => reviewRow(quiz, st)).join('')}`).join('');
  return `
    <section class="card review">
      ${whereRow(quiz.place)}
      <h2>Tus respuestas</h2>
      <p class="muted">Toca una pregunta para cambiar la respuesta; al elegir otra vuelves aquí. La importancia se cambia directamente en cada fila.</p>
      <div class="row">
        <button class="btn" data-action="close-review">Seguir el cuestionario</button>
        <button class="btn primary" data-action="finish">Ver resultados</button>
      </div>
      ${blocks}
    </section>`;
}

export function render(ctx) {
  const {quiz, ui} = ctx;
  if (!quiz.place || ui.picking) return picker.render(ctx);
  if (ui.reviewing) return review(quiz);

  const {kind, item, section} = quiz.current;
  const isPlan = kind === 'plan';
  const progress = quiz.progress();
  const here = progress.find(p => p.section === section);
  const answer = quiz.answerOf(item.id);
  const seen = new Set();
  const title = annotate(item.q, seen);
  const context = item.ctx ? annotate(item.ctx, seen) : '';
  const choices = isPlan ? planOptions(item, quiz.planOf(item.id), seen) : questionOptions(item, answer, seen);
  const done = Math.round(quiz.step / (STEPS.length - 1) * 100);

  return `
    <div class="quiz">
      <aside class="side" aria-label="Bloques">${sidebar(quiz, progress)}</aside>
      <section class="card" aria-live="polite">
        ${ui.returnTo ? `<div><button class="btn" data-action="return">${RETURN_LABEL[ui.returnTo]}</button></div>` : ''}
        ${whereRow(quiz.place)}
        ${blockSelect(quiz, progress)}
        <div class="progress" aria-hidden="true"><i data-bar="${done}"></i></div>
        <div class="qhead">
          <span class="mono muted">${SECTIONS[section]} · ${quiz.step - here.first + 1} de ${here.total} · pregunta ${quiz.step + 1} de ${STEPS.length}</span>
          <h2>${title}</h2>
          ${context ? `<p class="ctx">${context}</p>` : ''}
        </div>
        ${isPlan ? '' : importance(answer)}
        <div class="opts">${choices}</div>
        <div class="row">
          <button class="btn" data-action="prev" ${quiz.step === 0 ? 'disabled' : ''}>← Anterior</button>
          <button class="linkbtn" data-action="open-review">${quiz.answeredCount()} de ${QUESTIONS.length} respondidas · ver todas</button>
          ${quiz.isLast
            ? '<button class="btn primary" data-action="finish">Ver resultados</button>'
            : '<button class="btn primary" data-action="next">Siguiente →</button>'}
        </div>
      </section>
    </div>`;
}

function openReview(ctx, focusId = null) {
  ctx.ui.reviewing = true;
  ctx.refresh();
  const row = focusId && document.querySelector(`#rv-${focusId} .rv-q`);
  if (!row) return scrollTo({top: 0});
  row.scrollIntoView({block: 'center'});
  row.focus({preventScroll: true});
}

function back(ctx) {
  const to = ctx.ui.returnTo, id = ctx.quiz.current.item.id;
  ctx.ui.returnTo = null;
  if (to === 'repaso') return openReview(ctx, id);
  ctx.go('resultados');
  document.querySelector(`[data-q="${id}"]`)?.scrollIntoView({block: 'center'});
}

function moveTo(ctx, step) {
  ctx.ui.returnTo = null;
  ctx.quiz.goTo(step);
  ctx.refresh();
}

function next(ctx) {
  if (ctx.quiz.isLast) return ctx.go('resultados');
  moveTo(ctx, ctx.quiz.step + 1);
}

const afterAnswer = ctx => ctx.ui.returnTo ? back(ctx) : next(ctx);

export const actions = {
  ...picker.actions,
  jump: (ctx, el) => moveTo(ctx, Number(el.dataset.step)),
  plan(ctx, el) {
    const plan = ctx.quiz.current.item;
    ctx.quiz.choosePlan(plan.id, Number(el.dataset.index));
    if (plan.multi) ctx.refresh();
    else afterAnswer(ctx);
  },
  answer(ctx, el) {
    const v = el.dataset.v === 'na' ? null : Number(el.dataset.v);
    ctx.quiz.answer(ctx.quiz.current.item.id, v);
    afterAnswer(ctx);
  },
  weigh(ctx, el) {
    const {id, weight} = el.dataset;
    ctx.quiz.weigh(id ?? ctx.quiz.current.item.id, Number(weight));
    ctx.refresh();
    const scope = id ? `[data-id="${id}"]` : ':not([data-id])';
    document.querySelector(`[data-action="weigh"][data-weight="${weight}"]${scope}`)?.focus({preventScroll: true});
  },
  prev: ctx => moveTo(ctx, ctx.quiz.step - 1),
  next,
  return: back,
  'open-review': ctx => openReview(ctx),
  'close-review'(ctx) {
    ctx.ui.reviewing = false;
    ctx.ui.returnTo = null;
    ctx.refresh();
  },
  finish(ctx) {
    ctx.ui.reviewing = false;
    ctx.go('resultados');
  },
};

export const inputs = {
  block: (ctx, el) => moveTo(ctx, Number(el.value)),
};
