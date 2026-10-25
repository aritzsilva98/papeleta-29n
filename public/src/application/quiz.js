import {PLANS, QUESTIONS} from '../domain/data/questions.js';
import {hasSeatChance, pollsHidden, regionById, viability} from '../domain/electoral.js';
import {isAnswered, score, sectionWeights} from '../domain/scoring.js';

const WEIGHTS = [0.5, 1, 2];
const MIN_ANSWERS = 8;
const USEFUL_VOTE_FROM = 2;
const QUESTION_IDS = new Set(QUESTIONS.map(q => q.id));

export const STEPS = [
  ...PLANS.map(plan => ({kind: 'plan', item: plan, section: 'planes'})),
  ...QUESTIONS.map(question => ({kind: 'question', item: question, section: question.s})),
];

const empty = () => ({step: 0, answers: {}, plans: {}, place: null});

// Lo que viene del almacenamiento lo puede haber tocado cualquiera, así que solo
// aceptamos lo que encaja con las preguntas y circunscripciones que existen.
export function sanitize(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const answers = {};
  for (const [id, a] of Object.entries(raw.answers ?? {})) {
    if (!QUESTION_IDS.has(id) || !a || typeof a !== 'object') continue;
    const v = a.v === null || Number.isFinite(a.v) ? a.v : undefined;
    answers[id] = {v, w: WEIGHTS.includes(a.w) ? a.w : 1};
  }

  const plans = {};
  for (const plan of PLANS) {
    const v = raw.plans?.[plan.id];
    if (plan.multi && Array.isArray(v)) plans[plan.id] = v.filter(k => plan.o.some(o => o.sec === k)).slice(0, plan.multi);
    else if (Number.isInteger(v) && v >= 0 && v < plan.o.length) plans[plan.id] = v;
  }

  const region = raw.place && regionById(raw.place.ccaa);
  const place = region ? {ccaa: region.id, prov: region.p.some(([p]) => p === raw.place.prov) ? raw.place.prov : null} : null;
  const step = place && Number.isInteger(raw.step) ? Math.max(0, Math.min(raw.step, STEPS.length - 1)) : 0;
  return {answers, plans, place, step};
}

const isDone = (step, s) => step.kind === 'plan' ? s.plans[step.item.id] != null : isAnswered(s.answers[step.item.id]);

export function createQuiz(storage) {
  let s = {...empty(), ...sanitize(storage.load())};
  const save = () => storage.save(s);
  const answerOf = id => s.answers[id] ?? {w: 1};
  const answeredCount = () => QUESTIONS.filter(q => isAnswered(s.answers[q.id])).length;
  const goTo = step => {
    s.step = Math.max(0, Math.min(step, STEPS.length - 1));
    save();
  };

  function usefulVote(ranking) {
    if ((s.plans.util ?? 0) < USEFUL_VOTE_FROM || pollsHidden()) return null;
    return {
      closest: ranking.filter(r => hasSeatChance(r.party, s.place)).slice(0, 2).map(r => r.party),
      onEdge: ranking.filter(r => viability(r.party, s.place) === 'filo').map(r => r.party),
      askProvince: !s.place.prov && regionById(s.place.ccaa).p.length > 1,
    };
  }

  return {
    get place() { return s.place; },
    get step() { return s.step; },
    get current() { return STEPS[s.step]; },
    get isLast() { return s.step === STEPS.length - 1; },
    answerOf,
    answeredCount,
    goTo,
    planOf: id => s.plans[id],

    progress() {
      const sections = [...new Set(STEPS.map(st => st.section))];
      return sections.map(section => {
        const steps = STEPS.map((st, i) => ({st, i})).filter(({st}) => st.section === section);
        return {section, first: steps[0].i, total: steps.length, done: steps.filter(({st}) => isDone(st, s)).length};
      });
    },

    choosePlace(ccaa, prov = null) {
      const region = regionById(ccaa);
      s.place = {ccaa, prov: prov ?? (region.p.length === 1 ? region.p[0][0] : null)};
      save();
    },

    answer(id, v) {
      s.answers[id] = {...answerOf(id), v};
      save();
    },

    weigh(id, w) {
      s.answers[id] = {...answerOf(id), w};
      save();
    },

    choosePlan(plan, index) {
      if (!plan.multi) s.plans[plan.id] = index;
      else {
        const picked = s.plans[plan.id] ?? [], key = plan.o[index].sec;
        if (picked.includes(key)) s.plans[plan.id] = picked.filter(k => k !== key);
        else if (picked.length < plan.multi) s.plans[plan.id] = [...picked, key];
      }
      save();
    },

    reviewAnswers: () => goTo(PLANS.length),

    reset() {
      s = empty();
      save();
    },

    results() {
      if (!s.place) return {status: 'no-place'};
      const answered = answeredCount();
      if (answered < MIN_ANSWERS) return {status: 'too-few', answered, needed: MIN_ANSWERS};
      const ranking = score(s.answers, s.plans, s.place);
      const weights = sectionWeights(s.plans);
      const boosted = Object.keys(weights).filter(k => k !== 'planes' && weights[k] > 1);
      return {status: 'ready', ranking, boosted, usefulVote: usefulVote(ranking)};
    },
  };
}
