import {SECTIONS} from '../../domain/data/sections.js';
import {QUESTIONS} from '../../domain/data/questions.js';
import {options} from '../../domain/scoring.js';
import {STEPS} from '../../application/quiz.js';
import {annotate} from '../html.js';
import {whereRow} from './shared.js';
import * as picker from './picker.js';

const LETTERS = 'ABCDEFGHIJ';
const IMPORTANCE = [[0.5, 'Poco'], [1, 'Normal'], [2, 'Mucho']];

const option = (attrs, pressed, key, text) =>
  `<button class="opt" aria-pressed="${pressed}" ${attrs}><span class="k">${key}</span><span>${text}</span></button>`;

function sidebar(quiz) {
  return quiz.progress().map(p => `
    <button data-action="jump" data-step="${p.first}" class="${quiz.current.section === p.section ? 'on' : ''}">
      <span>${SECTIONS[p.section]}</span><span class="cnt">${p.done}/${p.total}</span>
    </button>`).join('');
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

function importance(answer) {
  const buttons = IMPORTANCE.map(([w, label]) =>
    `<button data-action="weigh" data-weight="${w}" aria-pressed="${answer.w === w}">${label}</button>`).join('');
  return `
    <div class="row">
      <span class="hint">¿Cuánto te importa este tema?</span>
      <div class="seg" role="group" aria-label="Importancia">${buttons}</div>
    </div>`;
}

export function render(ctx) {
  const {quiz, ui} = ctx;
  if (!quiz.place || ui.picking) return picker.render(ctx);

  const {kind, item, section} = quiz.current;
  const isPlan = kind === 'plan';
  const inSection = STEPS.filter(st => st.section === section);
  const answer = quiz.answerOf(item.id);
  const seen = new Set();
  const title = annotate(item.q, seen);
  const context = item.ctx ? annotate(item.ctx, seen) : '';
  const choices = isPlan ? planOptions(item, quiz.planOf(item.id), seen) : questionOptions(item, answer, seen);
  const progress = Math.round(quiz.step / (STEPS.length - 1) * 100);

  return `
    <div class="quiz">
      <aside class="side" aria-label="Bloques">${sidebar(quiz)}</aside>
      <section class="card" aria-live="polite">
        ${whereRow(quiz.place)}
        <div class="progress" aria-hidden="true"><i data-bar="${progress}"></i></div>
        <div class="qhead">
          <span class="mono muted">${SECTIONS[section]} · ${inSection.indexOf(quiz.current) + 1} de ${inSection.length} · pregunta ${quiz.step + 1} de ${STEPS.length}</span>
          <h2>${title}</h2>
          ${context ? `<p class="ctx">${context}</p>` : ''}
        </div>
        <div class="opts">${choices}</div>
        ${isPlan ? '' : importance(answer)}
        <div class="row">
          <button class="btn" data-action="prev" ${quiz.step === 0 ? 'disabled' : ''}>← Anterior</button>
          <span class="hint">${quiz.answeredCount()} de ${QUESTIONS.length} respondidas</span>
          ${quiz.isLast
            ? '<button class="btn primary" data-action="finish">Ver resultados</button>'
            : '<button class="btn primary" data-action="next">Siguiente →</button>'}
        </div>
      </section>
    </div>`;
}

function next(ctx) {
  if (ctx.quiz.isLast) return ctx.go('resultados');
  ctx.quiz.goTo(ctx.quiz.step + 1);
  ctx.refresh();
}

export const actions = {
  ...picker.actions,
  jump(ctx, el) {
    ctx.quiz.goTo(Number(el.dataset.step));
    ctx.refresh();
  },
  plan(ctx, el) {
    const plan = ctx.quiz.current.item;
    ctx.quiz.choosePlan(plan, Number(el.dataset.index));
    plan.multi ? ctx.refresh() : next(ctx);
  },
  answer(ctx, el) {
    const v = el.dataset.v === 'na' ? null : Number(el.dataset.v);
    ctx.quiz.answer(ctx.quiz.current.item.id, v);
    next(ctx);
  },
  weigh(ctx, el) {
    ctx.quiz.weigh(ctx.quiz.current.item.id, Number(el.dataset.weight));
    ctx.refresh();
  },
  prev(ctx) {
    ctx.quiz.goTo(ctx.quiz.step - 1);
    ctx.refresh();
  },
  next,
  finish: ctx => ctx.go('resultados'),
};
