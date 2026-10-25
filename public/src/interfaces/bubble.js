import {GLOSSARY} from '../domain/data/glossary.js';
import {esc, sourceLink} from './html.js';

const GLOSSARY_BY_ID = Object.fromEntries(GLOSSARY.map(g => [g.id, g]));

const GAP = 8, MARGIN = 12;

export function createGlossaryBubble() {
  const bubble = document.createElement('div');
  bubble.id = 'bubble';
  bubble.setAttribute('role', 'dialog');
  bubble.hidden = true;
  document.body.append(bubble);
  let anchor = null;

  function hide() {
    bubble.hidden = true;
    anchor = null;
  }

  function place(rect) {
    const {offsetWidth: w, offsetHeight: h} = bubble;
    const left = Math.min(rect.left + scrollX, scrollX + innerWidth - w - MARGIN);
    const fitsBelow = rect.bottom + GAP + h < innerHeight || rect.top < h + GAP;
    bubble.style.left = Math.max(scrollX + MARGIN, left) + 'px';
    bubble.style.top = (fitsBelow ? rect.bottom + scrollY + GAP : rect.top + scrollY - h - GAP) + 'px';
  }

  function toggle(term) {
    const entry = GLOSSARY_BY_ID[term.dataset.g];
    if (!entry) return;
    if (anchor === term && !bubble.hidden) return hide();
    anchor = term;
    bubble.innerHTML = `
      <div class="bh"><b>${esc(entry.k)}</b><button class="bx" aria-label="Cerrar">×</button></div>
      <p>${esc(entry.d)}</p>
      <p class="bs">Fuente: ${sourceLink(entry.s)}</p>`;
    bubble.hidden = false;
    place(term.getBoundingClientRect());
    bubble.querySelector('.bx').onclick = hide;
  }

  // En fase de captura: un término dentro de un botón (una respuesta, un partido)
  // tiene que abrir su explicación sin que el botón reciba el clic.
  document.addEventListener('click', e => {
    const term = e.target.closest('.term');
    if (term) {
      e.preventDefault();
      e.stopPropagation();
      return toggle(term);
    }
    if (!e.target.closest('#bubble')) hide();
  }, true);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') return hide();
    const term = e.target.closest?.('.term');
    if (term && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      e.stopPropagation();
      toggle(term);
    }
  }, true);

  addEventListener('resize', hide);
  return {hide};
}
