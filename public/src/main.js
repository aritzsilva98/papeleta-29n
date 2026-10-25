// Punto de arranque: conecta el almacenamiento del navegador con los casos de uso y pinta la interfaz.
import {init,STEPS,state} from './application/quiz.js';
import {browserStorage} from './infrastructure/storage.js';
import {render,TABS} from './interfaces/ui.js';

init(browserStorage);
const view=document.querySelector('#view');
// La CSP prohíbe estilos en línea en el HTML; los anchos de las barras van en data-w y se aplican por CSSOM.
new MutationObserver(()=>view.querySelectorAll('[data-w]').forEach(e=>{e.style.width=e.dataset.w+'%'})).observe(view,{childList:true,subtree:true});
document.querySelector('#nq').textContent=STEPS.length;
const h=location.hash.slice(1); if(TABS.some(t=>t[0]===h)) state.tab=h;
render();
