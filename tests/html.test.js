import {test} from 'node:test';
import assert from 'node:assert/strict';
import {annotate, esc} from '../public/src/interfaces/html.js';

test('escapa el HTML antes de marcar nada', () => {
  assert.equal(esc(`<script>"'&`), '&lt;script&gt;&quot;&#39;&amp;');
  assert.ok(!annotate('<img src=x onerror=alert(1)> IRPF').includes('<img'));
});

test('marca términos del glosario respetando mayúsculas y límites de palabra', () => {
  assert.ok(annotate('El IRPF y el Patrimonio cultural').includes('data-g="irpf"'));
  assert.ok(!annotate('patrimonio cultural').includes('data-g'));
  assert.ok(!annotate('PACMA').includes('data-g="pac"'));
});

test('cada término se marca una sola vez por bloque', () => {
  assert.equal(annotate('IRPF, IRPF e IRPF').match(/data-g="irpf"/g).length, 1);
});
