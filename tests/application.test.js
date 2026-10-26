import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PLANS, QUESTIONS} from '../public/src/domain/data/questions.js';
import {createQuiz, sanitize, STEPS} from '../public/src/application/quiz.js';

function memoryStore() {
  let data = null;
  return {load: () => data, save: d => { data = structuredClone(d); }};
}

test('descarta lo guardado que no encaja con los datos', () => {
  assert.equal(sanitize('x'), null);
  const s = sanitize({
    answers: {smi: {v: 2, w: 9}, hack: {v: 1}, iva: {v: '<img>'}, irpf: {v: 1e308}},
    plans: {prio: ['vivienda', 'vivienda', 'nope'], casa: 99},
    place: {ccaa: 'cyl', prov: '<b>'},
    step: 1e9,
  });
  assert.deepEqual(s.answers, {smi: {v: 2, w: 1}, iva: {v: undefined, w: 1}, irpf: {v: undefined, w: 1}});
  assert.deepEqual(s.plans, {prio: ['vivienda']});
  assert.deepEqual(s.place, {ccaa: 'cyl', prov: null});
  assert.equal(s.step, STEPS.length - 1);
  assert.deepEqual(sanitize({plans: {prio: 1}}).plans, {}, 'un número en una pregunta múltiple rompía la página');
});

test('recuerda las respuestas entre visitas', () => {
  const store = memoryStore();
  const quiz = createQuiz(store);
  quiz.choosePlace('mad');
  quiz.answer('smi', 1);
  quiz.weigh('smi', 2);
  const again = createQuiz(store);
  assert.deepEqual(again.place, {ccaa: 'mad', prov: 'Madrid'});
  assert.deepEqual(again.answerOf('smi'), {v: 1, w: 2});
});

test('las prioridades no pasan del máximo y se desmarcan al repetir', () => {
  const quiz = createQuiz(memoryStore());
  const prio = PLANS.find(p => p.multi);
  for (let i = 0; i <= prio.multi; i++) quiz.choosePlan(prio.id, i);
  assert.equal(quiz.planOf(prio.id).length, prio.multi);
  quiz.choosePlan(prio.id, 0);
  assert.equal(quiz.planOf(prio.id).length, prio.multi - 1);
});

test('sin lugar de voto o con menos de ocho respuestas no hay resultado', () => {
  const quiz = createQuiz(memoryStore());
  assert.equal(quiz.results().status, 'no-place');
  quiz.choosePlace('and', 'Sevilla');
  QUESTIONS.slice(0, 7).forEach(q => quiz.answer(q.id, 0));
  assert.equal(quiz.results().status, 'too-few');
  quiz.answer(QUESTIONS[7].id, null);
  assert.equal(quiz.results().status, 'too-few', '«sin opinión» no cuenta');
  quiz.answer(QUESTIONS[8].id, 0);
  const res = quiz.results();
  assert.equal(res.status, 'ready');
  assert.ok(!res.ranking.some(r => r.party.id === 'erc'));
});

test('borrar lo deja todo como al principio', () => {
  const store = memoryStore();
  const quiz = createQuiz(store);
  quiz.choosePlace('mad');
  quiz.goTo(5);
  quiz.reset();
  assert.equal(quiz.place, null);
  assert.equal(quiz.step, 0);
  assert.equal(createQuiz(store).answeredCount(), 0);
});
