// El marcado del glosario respeta mayúsculas y límites de palabra, y escapa el HTML.
import assert from 'node:assert';
import {ann,esc} from '../public/src/interfaces/html.js';

assert(ann('El IRPF y el Patrimonio cultural').includes('data-g="irpf"'));
assert(!ann('patrimonio cultural').includes('data-g'),'Patrimonio must be case-sensitive');
assert(!ann('PACMA').includes('data-g="pac"'),'PAC must not match inside PACMA');
assert.strictEqual(esc(`<script>"'&`),'&lt;script&gt;&quot;&#39;&amp;');
assert(!ann('<img src=x onerror=alert(1)> IRPF').includes('<img'),'ann must escape before marking');
console.log('ok: glosario');
