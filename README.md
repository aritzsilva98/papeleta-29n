# Papeleta 29-N

Test de afinidad para las elecciones generales del 29 de noviembre de 2026. Eliges comunidad (y, si quieres, provincia) y comparas 91 preguntas con los partidos que se presentan allí. Cada posición lleva su fuente.

Es una web estática: HTML, CSS y JavaScript de navegador. No hay servidor, base de datos, dependencias ni paso de compilación.

## Arquitectura

```
public/                    ← lo que se publica, tal cual
  index.html               marcado, sin scripts ni estilos en línea
  styles.css
  _headers                 cabeceras de seguridad (Cloudflare Pages y Netlify)
  src/
    domain/                datos y reglas, sin DOM ni navegador
      sections.js          bloques temáticos y etiquetas de viabilidad
      electoral.js         circunscripciones, candidaturas, dónde se presenta cada partido, veda de encuestas
      questions.js         preguntas, opciones y posición de cada partido con su fuente
      scoring.js           cálculo de afinidad
      reference.js         fichas de partido, votaciones y fuentes
      glossary.js          glosario
    application/
      quiz.js              casos de uso del cuestionario y el puerto de almacenamiento; valida lo guardado
    infrastructure/
      storage.js           adaptador de ese puerto sobre localStorage
    interfaces/
      html.js              escapado de texto y marcado del glosario
      ui.js                pintado del DOM y eventos
    main.js                arranque: conecta almacenamiento, casos de uso e interfaz
tests/                     pruebas con Node, sin dependencias
```

Las dependencias apuntan hacia dentro: `domain` no importa nada; `application` solo importa `domain`; `interfaces` usa `application` y `domain`, nunca `infrastructure`. Solo `main.js` conoce las tres capas.

Simplificaciones deliberadas:

- Los datos son módulos JavaScript, no JSON. Así no hace falta ningún `fetch` y la CSP puede prohibir cualquier conexión (`connect-src 'none'`).
- La interfaz pinta con `innerHTML`, pero todo texto pasa antes por `esc()` o `ann()` (`interfaces/html.js`). Las pruebas comprueban que el HTML se escapa.
- La veda de encuestas depende del reloj del visitante. Basta porque solo oculta datos que ya son públicos; no es un control de acceso.

## Seguridad

Las alertas de octubre de 2026 no afectan a esta web porque no usa ninguna de esas piezas:

| Riesgo (oct. 2026) | Por qué no aplica |
|---|---|
| PHP con ejecución remota de código (INCIBE-2026-762; CVE-2026-109618 y CVE-2026-109619) | No hay PHP ni ningún servidor de aplicación |
| Node.js, fallo Brotli (CVE-2026-111497) | Node solo se usa en local para las pruebas, nunca en producción |
| Next.js, ejecución remota en Image Optimization y `use cache` | No hay framework |
| Paquetes npm troyanizados (familia Shai-Hulud, ChainDrop, Trivy) | Cero dependencias y ningún `npm install` |

Lo que sí se protege:

- **Content Security Policy estricta**: solo se cargan scripts y estilos propios, sin `unsafe-inline` ni `unsafe-eval`. No se permiten conexiones, formularios, `<base>` ni incrustar la web en otra (clickjacking). Va en `_headers` y, por si el host no permite cabeceras, también en una `<meta>` (sin `frame-ancestors`, que solo funciona como cabecera).
- **Ninguna petición a terceros**: fuentes del sistema, sin CDN ni analítica. El visitante no deja rastro fuera del host.
- **Privacidad**: las respuestas son opiniones políticas, datos especialmente protegidos por el RGPD (art. 9). No salen del navegador; no hay cookies, cuentas ni registros. Por eso no hace falta banner de cookies.
- **Entrada no confiable**: lo guardado en `localStorage` se valida contra los datos antes de usarlo (`sanitize` en `application/quiz.js`).
- **HSTS, nosniff, Referrer-Policy y Permissions-Policy** en `_headers`.

El riesgo que queda es la cuenta del hosting y, si lo hay, el dominio. Activa la verificación en dos pasos con llave de acceso (passkey) o app, nunca SMS. Si usas GitHub, no añadas GitHub Actions de terceros: la de Trivy fue una de las comprometidas en 2026.

## Ley electoral

La LOREG (art. 69.7) prohíbe difundir sondeos los cinco días anteriores a la votación. Del 24 al 29 de noviembre la web oculta sola las medias de encuestas y las etiquetas de viabilidad (`pollsHidden` en `domain/electoral.js`).

## Probar en local

```
npm test                                  # o: node tests/domain.test.js && node tests/glossary.test.js
python -m http.server 8000 -d public      # y abre http://127.0.0.1:8000
```

No funciona abriendo `index.html` con doble clic: los módulos ES necesitan servirse por HTTP.

## Publicar gratis

**Recomendado: Cloudflare Pages, subida directa.** Respeta `_headers`, el ancho de banda no tiene límite en el plan gratuito y no hace falta Git.

1. Crea una cuenta en Cloudflare y activa la verificación en dos pasos.
2. Workers y Pages → Crear → Pages → subir recursos (Direct Upload).
3. Arrastra la carpeta `public/`. Te da una dirección `*.pages.dev`.
4. Para actualizar, sube la carpeta de nuevo.

**Alternativa: GitHub Pages.** Es más sencillo si ya usas GitHub, pero ignora `_headers`: solo se aplica la CSP de la `<meta>`, sin HSTS propio ni protección contra que otra web incruste la tuya. GitHub Pages solo publica la raíz del repositorio o `/docs`, así que el contenido de `public/` tiene que ir en una de esas dos.

## Mantenimiento

- Los partidos sin representación necesitan avales y las candidaturas se proclaman el 2 de noviembre (BOE del 3): revisa entonces quién se presenta en cada provincia (`domain/electoral.js`).
- Cuando salgan los programas, actualiza posiciones y fuentes en `domain/questions.js`. Las pruebas avisan si una posición no existe o un partido deja de ganar con sus propias respuestas.
