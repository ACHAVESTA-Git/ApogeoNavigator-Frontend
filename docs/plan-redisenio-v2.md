# Plan de rediseño v2 · «Rasante, con profundidad»

Lunar Landing Site Navigator · frontend · sáb 14/11/2026
Origen: crítica directa del usuario («parece HTML y CSS sin más», líneas y botones muy rectos, despliegues bruscos, KPI estáticos sin relato; quiere un toque *luxury*, más interacción directa y la simulación más grande y realista).
Método: diagnóstico con las skills `improve-animations` y `find-animation-opportunities` (auditoría de solo lectura sobre `src/`), criterios de `emil-design-eng`, `apple-design`, `gestures`, `choreograph`, `animation-performance` y `ui-ux-pro-max`, y la disciplina de `docs/frontend/referencia-software-academy/README.md`.

Se conserva: la paleta de regolito, las dos luces (Sol `#FFB547`, Tierra `#5AA9FF`), Archivo + JetBrains Mono, el horizonte como idea central, los datos reales y la accesibilidad AA.
Se revoca del plan v1: radios de 2 px, «cero sombras», «sin estrellas», techo único de 320 ms y el descarte de `layoutId`.

## 1. Diagnóstico (improve-animations)

Reconocimiento: React 18 + `motion` 14 (LazyMotion `domAnimation`) + CSS. Tokens en `src/styles/index.css` (`--ease-*`, `--dur-*`) y `MOVIMIENTO` en `src/lib/constants.ts`. Personalidad: instrumento de precisión, no app lúdica. Frecuencia: arrastrar el tiempo y girar el cielo se usan decenas de veces por sesión; fichas, popup y cambio de pestaña, ocasionales; hero e inicio, primera vez.

| # | Sev. | Categoría | Dónde | Hallazgo | Corrección |
|---|---|---|---|---|---|
| 1 | Alta | Física y origen | `ui/Popup.tsx`, `ui/HojaInferior.tsx` (keyframes CSS sobre `<dialog>`) | Entradas y salidas con keyframes: no son interrumpibles y la hoja no se puede arrastrar para cerrarla | Hoja con `drag="y"` de `motion`, seguimiento 1:1, cierre por distancia (> 40 %) o velocidad (> 500 px/s), `spring` `{duration: .5, bounce: .2}` sembrado con la velocidad; velo ligado al mismo `MotionValue` |
| 2 | Alta | Cohesión | `index.css` (`--ease-salida` 0.22,1,0.36,1; `--ease-entrada` 0.64,0,0.78,0) | Hay una curva `ease-in` para salidas de interfaz: retrasa justo lo que el usuario mira | Familia única: `--ease-out: cubic-bezier(0.23,1,0.32,1)` para entrar y salir, `--ease-in-out: cubic-bezier(0.77,0,0.175,1)` para lo que se mueve en pantalla (morph), `--ease-drawer: cubic-bezier(0.32,0.72,0,1)` para hojas sin spring |
| 3 | Alta | Oportunidad perdida | `routes/Sitios.tsx` → `SitioLayout` → `Cielo` | El sitio elegido «salta» de la lista a la ficha y de la ficha al cielo: no hay elemento compartido | `layoutId` en el nombre y el glifo del sitio (requiere `domMax`), 350 ms `spring` sin rebote |
| 4 | Alta | Relato | `ventanas/CifraMetrica.tsx`, `mapa/FichaSitio.tsx`, hero | Las cifras aparecen estáticas y sin contexto | Cifra que cuenta al entrar en pantalla (una vez) y al cambiar, 600 ms `ease-out`, `tabular-nums`; debajo, comparación («2,1 × Apolo 11») y consecuencia («sin enlace directo 453 h») |
| 5 | Media | Interrupción | `cielo/PanoramaCielo.tsx` (arrastre con `animate()` de duración fija) | La inercia tiene duración fija: todos los gestos «aterrizan» igual | Inercia con `spring` sembrado con la velocidad del gesto; arrastre vertical del horizonte = arrastrar el tiempo |
| 6 | Media | Rendimiento | `hero/EscenaHero.tsx`, `PanoramaCielo.tsx` (filtros SVG `feGaussianBlur` animados) | El halo desenfocado se recalcula en cada fotograma | Escena en `<canvas>` 2D con degradados radiales precalculados; DPR acotado a 2 |
| 7 | Media | Accesibilidad | `index.css` (`prefers-reduced-motion` pone todo a 0,01 ms) | Reducido = nada: se pierde también el fundido que orienta | Reducido «más suave, no cero»: se quitan desplazamientos y escalas, se mantienen opacidad y color (120 ms) |
| 8 | Media | Hover | utilidades `hover:` | Los `hover:` se disparan en táctil (quedan pegados) | Variante `hover` de Tailwind limitada a `(hover: hover) and (pointer: fine)` |
| 9 | Baja | Tokens | `transition-colors` sueltos | Varias duraciones escritas a mano | Todo a `--dur-*`; pulsación 140 ms |

## 2. Oportunidades (find-animation-opportunities, máximo 7, todas pasan la puerta de frecuencia, propósito, velocidad y función)

1. **Horizonte arrastrable = tiempo** (decenas/día → movimiento directo, sin animación añadida). Arrastrar en horizontal sobre la escena mueve la hora 1:1; al soltar, inercia con spring. Propósito: manipulación directa.
2. **Ficha que nace de su fila** (ocasional). `layoutId` del nombre y el glifo; el resto entra con stagger de 40 ms. Propósito: consistencia espacial.
3. **Cifras con relato** (primera vez por pantalla). Conteo único al entrar en pantalla y barra de comparación que crece con `scaleX`. Propósito: explicar.
4. **Inicio en tres actos con scroll** (primera vez). Escena fija y texto que avanza; el progreso del scroll mueve el tiempo de la escena. Propósito: explicar.
5. **Día → noche continuo** (ocasional, en la simulación). El cielo, el suelo y las sombras interpolan con la elevación del Sol; no es un fundido temporizado, sale del dato. Propósito: indicar estado.
6. **Selección en el mapa con respuesta inmediata** (decenas/día → casi imperceptible). El punto se hunde a 0,92 en 120 ms y su anillo de latitud se dibuja en 200 ms.
7. **Popup y hoja interrumpibles** (ocasional). Nacen de su botón / de abajo y vuelven por donde entraron; la hoja se puede atrapar a medio cerrar.

Rechazadas: animar el cambio de pestaña Cielo/Ventanas/Día lunar (navegación central, decenas/día → solo fundido de 120 ms) y cualquier bucle decorativo en las tarjetas del catálogo.

## 3. Sistema de diseño v2

| Tema | v1 | v2 |
|---|---|---|
| Radios | 2 px en todo | Controles 12 px (`--radius-control`), botones de acción tipo píldora, paneles 18 px (`--radius-panel`), popup y hoja 20 px |
| Profundidad | Escalones planos y líneas | Capas: `vacio` → `regolito` → `superficie` → `elevada`, borde tenue `rgb(237 235 228 / .08)`, brillo superior interior de 1 px y sombra suave en lo que flota (`0 24px 60px -20px rgb(0 0 0 / .7)`) |
| Material | Sin transparencias | Translúcido solo en la cabecera, la barra inferior y los controles sobre la escena (`backdrop-filter: blur(16px) saturate(1.2)` sobre `rgb(10 10 9 / .6)`), nunca bajo cifras |
| Tipografía | Tracking 0 | Display −0,03em, títulos −0,015em, rótulos +0,1em; cifras con `tabular-nums` y peso 500 |
| Botón primario | Rectángulo claro | Píldora clara con sombra interior; secundario translúcido con borde tenue; pulsación 0,97 en 140 ms |
| Color | Sol y Tierra | Sin cambios. El ámbar sigue siendo solo el Sol |

## 4. Sistema de movimiento

- Curvas: las tres de §1.2. Springs: `SUAVE {duration: .45, bounce: 0}` (paneles, layout), `VIVO {duration: .5, bounce: .2}` (solo al soltar un arrastre), `LECTURA {stiffness: 170, damping: 26}` (valores ligados al puntero).
- Duraciones: pulsación 140 ms · tooltips 160 ms · desplegables 220 ms · popup y fichas 280–350 ms · hojas hasta 500 ms · escenas (trazo, morph, conteos, día/noche) lo que pida el dato.
- Reglas: todo despliegue nace de su origen y sale por donde entró; nada desde `scale(0)` (mínimo 0,96); solo `transform`, `opacity` y `clip-path`; hover solo con puntero fino; teclado sin animación de entrada.
- `prefers-reduced-motion`: sin desplazamientos ni escalas; se mantienen fundidos cortos; la simulación no se reproduce sola y salta de hora en hora.

## 5. Relato de datos (tres actos por pantalla)

| Pantalla | Problema | Exploración | Decisión |
|---|---|---|---|
| Inicio | «En el polo, el Sol no se pone en todo diciembre» (Sol +0,73° a +1,74°) | «pero la Tierra sí se esconde»: 291 de 744 h de enlace, y el 27/01/2027 el Sol también baja | «Elige dónde aterrizar»: 10 sitios, CTA al catálogo |
| Sitios | Dónde está cada sitio respecto al polo y a la Tierra | Hover y selección con cifras en contexto | «Ver su cielo» / comparar |
| Cielo (simulación) | Qué hay ahora sobre el horizonte | Arrastrar el tiempo, girar la mirada | Cuánto falta para la puesta |
| Ventanas | Cuánta energía y enlace hay | Bandas y cifras con comparación | Semáforo con su porqué |
| Comparar | Mismo periodo, destinos distintos | Cursor compartido | Veredicto |

Cada KPI lleva: qué significa (una línea), con qué se compara (media de los 10 sitios o el otro eje) y por qué importa (consecuencia operativa). Solo cifras de la API o de los CSV.

## 6. Bloque propio: simulación inmersiva (pedido 3 del usuario)

Objetivo: que la simulación sea la protagonista, casi a pantalla completa, como una ventana al paisaje lunar. Datos de `/api/efemerides` (y de `/api/simulacion` cuando se fusione, con la proyección marcada y su banda de incertidumbre).

- **Lienzo** `<canvas>` 2D a pantalla casi completa (alto `calc(100svh − cabeceras)`), DPR ≤ 2, un solo `requestAnimationFrame` gobernado por el reloj; se detiene fuera de pantalla y con la pestaña oculta.
- **Cielo** negro con estrellas sutiles (campo fijo y determinista; se atenúan con el Sol alto). Decisión nueva del usuario: sí hay estrellas.
- **Sol**: disco de 0,5° de tamaño aparente a escala del panorama (con un mínimo visible), resplandor por capas y destello rasante cuando está bajo.
- **Tierra**: 2° de tamaño aparente (cuatro veces el Sol), con su **fase** calculada con la separación angular real Sol–Tierra en el cielo del sitio (es la opuesta a la de la Luna vista desde la Tierra).
- **Terreno**: perfil estilizado del relieve (ruido determinista por sitio, sin datos de topografía), varias capas en paralaje al girar. **Aviso visible y permanente:** «Relieve ilustrativo. Las cifras son de horizonte ideal (sin relieve).» La línea del horizonte ideal se sigue dibujando sobre el perfil.
- **Luz**: brillo del suelo según la elevación del Sol; sombras largas rasantes (longitud ∝ 1/tan(elevación)) proyectadas desde el azimut del Sol; transición día/noche continua.
- **Interacción**: arrastre horizontal = girar la mirada (inercia con spring); arrastre sobre la franja de tiempo = mover la hora; rueda horizontal; pellizco no. Control de tiempo grande y táctil superpuesto (material translúcido), velocidades 1 h/s, 6 h/s, 1 d/s.
- **Etiquetas** que siguen a los astros en capa HTML, con anticolisión (las de hoy).
- **Accesibilidad**: `role="img"` con descripción generada, panel de lectura con las cifras, tabla alternativa, teclado (←/→, Mayús, Inicio/Fin, Espacio, `[` `]`). Con movimiento reducido: sin reproducción automática ni paralaje.
- **Hecho cuando**: 60 fps en un portátil medio durante la reproducción, sin errores de consola, capturas a 1440 y 360 px y las cifras del panel iguales a la fila del CSV.

## 7. Orden de ramas

| # | Rama | Contenido |
|---|---|---|
| 1 | `feature/front-sistema-v2` | Tokens (radios, capas, sombras, material, tracking), curvas y springs, botones y controles, popup y hoja con spring, hover solo con puntero |
| 2 | `feature/front-simulacion-inmersiva` | §6 |
| 3 | `feature/front-inicio-tres-actos` | Relato con scroll y cifras con contexto en el inicio |
| 4 | `feature/front-kpi-relato` | Cifras con conteo, comparación y consecuencia en Ventanas, ficha y Comparar; `layoutId` catálogo → ficha |
| 5 | `feature/front-dia-lunar` | HU-09 con el transporte único |
| 6 | `feature/front-acceso` y pulido final | Marcador de login, capturas y verificación |
| 7 | `feature/front-gestor-claves` | Pantalla de administración (en cola) |

Antes de cada PR: revisión del diff con los diez criterios de `review-animations` (motivo, frecuencia, easing, < 300 ms en interfaz, origen, interrupción, GPU, accesibilidad, asimetría y cohesión).
