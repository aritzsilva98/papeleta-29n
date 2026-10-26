import {PARTIES} from '../../domain/data/parties.js';
import {REGIONS} from '../../domain/data/regions.js';
import {SOURCES} from '../../domain/data/reference.js';
import {runsIn} from '../../domain/electoral.js';
import {esc, sourceLink} from '../html.js';

const list = new Intl.ListFormat('es');

function localParties() {
  return list.format(PARTIES.flatMap(p => {
    const where = REGIONS.filter(r => runsIn(p, {ccaa: r.id}));
    if (where.length > REGIONS.length / 2) return [];
    return `${p.n} en ${list.format(where.map(r => p.only?.[r.id] ? list.format(p.only[r.id]) : r.n))}`;
  }));
}

export const render = () => `
    <div class="card prose">
    <h2>Cómo funciona</h2>
    <ul>
     <li>Cada pregunta tiene entre 6 y 9 respuestas colocadas sobre un mismo eje, de un extremo a otro. Hay posturas intermedias y extremos más radicales que los de cualquier partido. A cada partido lo sitúo en la respuesta más cercana a su programa o, si no lo tiene, a sus declaraciones y votos. Cada posición indica su fuente.</li>
     <li>Coincidencia por pregunta: 100 % si elegís la misma respuesta; baja en proporción a la distancia en el eje y llega a 0 % en los extremos opuestos. Elegir un extremo más radical que el de cualquier partido te aleja un poco de todos.</li>
     <li>Peso de cada pregunta = importancia que le das (×0,5, ×1, ×2) × peso del bloque. Tus prioridades y planes suben el peso del bloque hasta ×3.</li>
     <li>Si un partido no tiene posición en un tema, esa pregunta no cuenta para él. Para que un partido con pocas posiciones no salga arriba por azar, su resultado se acerca al 50 % cuanto menos datos tiene. La «cobertura» indica qué parte de tus respuestas se pudo comparar.</li>
     <li>Antes de responder eliges comunidad y, si quieres, provincia. Solo se puntúan los partidos que se presentan ahí. Los que solo van en algunos sitios: ${esc(localParties())}. Las preguntas son las mismas en todas partes.</li>
     <li>La viabilidad («escaño casi seguro», «probable»…) es una estimación a partir de la media de encuestas del 24-oct y de los resultados de 2023. En provincias de 1 a 3 escaños solo PP, PSOE y las candidaturas provinciales conservan su etiqueta.</li>
     <li>Las respuestas y tu circunscripción se guardan solo en este navegador (localStorage). No hay servidor, cuentas, cookies ni analítica: nadie, tampoco quien mantiene la web, puede ver lo que respondes. Para borrarlo, usa «Borrar todo» en Resultados.</li>
     <li>Del 24 al 29 de noviembre la ley electoral (LOREG, art. 69.7) prohíbe difundir sondeos: esos días se ocultan las medias de encuestas y las etiquetas de viabilidad, que salen de ellas.</li>
    </ul>
    <h2>Límites</h2>
    <ul>
     <li>A 24-oct-2026 casi ningún partido ha publicado su programa del 29-N. El PP tiene su «Contrato con España» y Vox difundió diez propuestas; para el resto uso el último programa (2023 o europeas 2024), documentos de 2025-2026, declaraciones y votos. Revisa los programas cuando salgan (la campaña empieza el 13-nov).</li>
     <li>UPC (Canarias) y Compromís-FV (Valencia) no tienen programa propio: donde no tienen una posición propia uso la del Frente Amplio, porque Movimiento Sumar, IU y Podemos van dentro de ellas. Lo indico en cada fuente («Como Frente Amplio»).</li>
     <li>Democracia 21, Iustitia Europa, Existe, Soria ¡Ya!, Drago, Falange y Democracia Nacional tienen muy pocas posiciones documentadas. En Democracia 21 relleno huecos con posiciones de Ciudadanos, su socio de coalición. Las de Adelante Andalucía salen de su discurso público, no de un programa.</li>
     <li>En Navarra el PP va con UPN: puntúo las posiciones del PP.</li>
     <li>Algunas preguntas de valores («¿Qué es España para ti?», «¿Qué te parece más justo?») sitúan a los partidos por deducción a partir de su programa.</li>
     <li>No incluyo votaciones de parlamentos autonómicos: en las generales votas a quién va al Congreso.</li>
     <li>Cuando una fuente secundaria contradecía el registro oficial, me quedo con el registro (por ejemplo, el voto de Alvise sobre el rearme).</li>
    </ul>
    <h2>Fuentes principales</h2>
    <ul>${SOURCES.map(s => `<li>${sourceLink(s)}</li>`).join('')}</ul>
    </div>`;
