import {SECTIONS} from './data/sections.js';
import {PLANS, QUESTIONS} from './data/questions.js';
import {partiesIn} from './electoral.js';

const MAX_SECTION_WEIGHT = 3;
// Cada partido arranca con tres preguntas imaginarias al 50 %. Así uno con dos o tres
// posiciones documentadas no se cuela arriba solo porque coincidan por casualidad.
const PRIOR = 3;
const MATCH = 0.75;
const CLASH = 0.5;
const LOW_COVERAGE = 0.35;

export const isAnswered = answer => typeof answer?.v === 'number';

export function options(question) {
  const base = question.o.map((t, x) => ({t, x}));
  const extra = (question.e ?? []).map(([x, t]) => ({t, x}));
  return [...base, ...extra].sort((a, b) => a.x - b.x);
}

export const optionText = (question, x) => options(question).find(o => o.x === x)?.t ?? '';

export function sectionWeights(plans) {
  const weights = Object.fromEntries(Object.keys(SECTIONS).map(k => [k, 1]));
  for (const plan of PLANS) {
    const picked = plans[plan.id];
    if (plan.multi) for (const section of picked ?? []) weights[section] += 1;
    else for (const [section, extra] of Object.entries(plan.o[picked]?.b ?? {})) weights[section] += extra;
  }
  for (const k in weights) weights[k] = Math.min(weights[k], MAX_SECTION_WEIGHT);
  return weights;
}

function scoreParty(party, answers, weights) {
  let agreement = 0, compared = 0, answered = 0;
  const rows = [];
  for (const question of QUESTIONS) {
    const answer = answers[question.id];
    if (!isAnswered(answer)) continue;
    const weight = weights[question.s] * answer.w;
    answered += weight;
    const position = question.m[party.id];
    if (!position) continue;
    const xs = options(question).map(o => o.x);
    const closeness = 1 - Math.abs(answer.v - position[0]) / (Math.max(...xs) - Math.min(...xs));
    agreement += weight * closeness;
    compared += weight;
    rows.push({question, closeness, weight, position, answer: answer.v});
  }
  return {
    party,
    rows,
    coverage: answered ? compared / answered : 0,
    pct: compared ? (agreement + PRIOR * 0.5) / (compared + PRIOR) * 100 : null,
  };
}

export function score(answers, plans, place) {
  const weights = sectionWeights(plans);
  return partiesIn(place)
    .map(party => scoreParty(party, answers, weights))
    .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
}

export const hasLowCoverage = result => result.coverage < LOW_COVERAGE;

export function highlights(result, limit = 6) {
  const byWeight = (a, b) => b.weight - a.weight;
  return {
    matches: result.rows.filter(r => r.closeness >= MATCH).sort((a, b) => b.closeness - a.closeness || byWeight(a, b)).slice(0, limit),
    clashes: result.rows.filter(r => r.closeness <= CLASH).sort((a, b) => a.closeness - b.closeness || byWeight(a, b)).slice(0, limit),
  };
}

export function agreementLevel(closeness) {
  if (closeness >= MATCH) return 'good';
  return closeness >= CLASH ? 'mid' : 'bad';
}
