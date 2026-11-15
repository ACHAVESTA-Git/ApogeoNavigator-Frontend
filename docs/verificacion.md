# Verificación del frontend · dom 15/11/2026 (cierre de la entrega)

Rama integrada: `origin/dev` de `ApogeoNavigator-Frontend` (PR 1 a 62, una rama y un worktree por bloque).

| Comprobación | Resultado |
|---|---|
| `npm run build` | En verde. Incluye `scripts/contraste.mjs`: 41 pares de tokens cumplen WCAG AA (el más justo, `texto-3` sobre `elevada`, 4,68:1) |
| `npm run test:run` | 241 pruebas en verde |
| JS inicial (gzip) | 192,1 kB (`index-*.js`, 570,4 kB sin comprimir). Eran 177,7 kB antes del PR 60: los textos de los dos idiomas viajan en el paquete inicial. Sin límite por decisión del usuario |
| Chunks diferidos (gzip) | d3 13,1 · Cielo 9,3 · GestorClaves 7,2 · Analisis 6,5 · Sitios 6,1 · UploadDialog 5,9 · Comparar 5,4 · DiaLunar 3,7 · Ventanas 3,1 · CifraRelato 3,1 · DialogoConfiguracion 0,5 kB |
| Fuentes | Solo latino y latino extendido de Archivo y JetBrains Mono; la de texto se precarga |
| Tamaño mínimo de texto | 12 px efectivos medidos en navegador (incluidos los rótulos SVG) en Inicio, Sitios, ficha, Cielo, Día lunar, Ventanas, Comparar y Análisis, a 1440 y a 360 px |
| Capturas | `docs/frontend/capturas/` (1440×900 y 360×780). Regeneradas el 15/11 con la API real: inicio (acto 1), sitios, ficha, cielo (Shackleton y Apolo 11), cielo en proyección, día lunar, ventanas, comparar, análisis, análisis con firma no válida, mes sin datos (Ventanas y Comparar) y coordenadas propias (cielo y ventanas). `cielo-proyeccion-azimut-poco-fiable` usa la respuesta real con `azimut_solar_fiable: false` e incertidumbre de 180° añadidos por interceptación, porque el backend #28 aún no está fusionado |
| Desplazamiento horizontal a 360 px | 0 px en todas las rutas capturadas |
| Errores de consola | 0 en todas las capturas. En un mes sin datos el navegador anota el 422 de la propia petición (la interfaz lo muestra como estado vacío) |

## Qué entró en el cierre (PR 54 a 62)
| PR | Contenido |
|---|---|
| 54 | Documentación: verificación con los PR 51 a 53 y el estado del gestor de claves |
| 55 | Ventanas de un punto propio ya no se queda cargando (crítico de Ventanas) |
| 56 | El cielo proyectado muestra los avisos del periodo que da la API (backend #28 visto con la respuesta real) |
| 57 | El pie nombra al equipo, al autor y la sede |
| 58 | La tabla de claves ya no esconde la columna de estado; flujo real del gestor |
| 59 | Etiquetas del Sol y la Tierra sin pisarse y aviso de relieve en móvil (auditoría 04) |
| 60 | Configuración en la cabecera con idioma español/inglés: `textos.en.ts`, fechas y cifras por idioma, errores del backend traducidos por código, `<html lang>` |
| 61 | El título y el mensaje del backend se muestran tal cual (aviso de error y popup de carga) |
| 62 | Identidad de marca: símbolo, logotipo, favicon, icono de 180 px y metadatos para compartir. Ver `docs/marca.md` |

## Recorridos del cierre (15/11, Playwright, API real en localhost:8080)
- **Idioma (PR 60):** con el navegador en español, Sitios → Configuración → «English»: la página se recarga en la misma ruta con `lang="en"`, el título «Sites» y la descripción en inglés; la elección queda en `localStorage`. Escape devuelve el foco al botón de ajustes. Con el navegador en francés y sin elección guardada, arranca en inglés. Capturas en inglés a 1440×900 y 360×780 de inicio, configuración, sitios, cielo, ventanas, análisis, comparar y «Upload data»: 0 px de desplazamiento horizontal y 0 errores de consola.
- **Lo que sigue en español con la interfaz en inglés:** nombres y notas de los sitios, pasos y limitaciones del análisis y los mensajes por fila y columna del informe de CSV. Vienen de los datos y de la API; el diálogo de configuración lo avisa.
- **Reglas de presentación del análisis en inglés:** con prueba unitaria (origen subido o modificado sin mencionar a NASA, R² como ajuste dentro de los datos, RMSE «optimistic; not an interval», observado y ajustado solo dentro de los datos y `cargado_por` limitado a tres categorías).
- **Error del backend (PR 61):** con un 404 `SITIO_NO_ENCONTRADO` inyectado en el Cielo, el aviso muestra «Sitio no encontrado» y el mensaje del backend, a 1440 y a 360 px. El popup de carga se comprobó con pruebas unitarias, no en navegador. La ruta «(/api/sites)» y el texto «…el informe completo va en detail» vienen del backend y se ven tal cual hasta que se corrijan allí.
- **Marca (PR 62):** inicio y sitios (español) y cielo (inglés) a 1440×900 y 360×780: la portada conserva su disposición, 0 px de desplazamiento horizontal y 0 errores de consola. En menos de 400 px la cabecera muestra el símbolo y «Apogeo».
- **Gestor de claves (pasada del PR 58):** ciclo completo contra la API real: generar → listar → rotar → revocar. Quedaron 3 claves de prueba revocadas y 0 activas, y ningún PEM en disco.

## Qué entró en la pasada anterior (PR 38 a 53)
| PR | Contenido |
|---|---|
| 38 | Simulación más alta en móvil y escena lunar más realista |
| 39 | CLS del inicio de 0,14 a 0 (precarga de fuente y altos reservados) |
| 40 | Restos de la auditoría 03: veredicto, línea del informe, 401 del gestor y 422 en proyección |
| 41, 43 | HU-13: coordenadas propias con consulta en vivo a JPL Horizons, solo contra la API real |
| 42 | Sección «Cómo analizamos los datos» |
| 44 | Proyección: banda de 2× el RMSE (cubre el 98–100 % de los puntos), nunca mayor de 30°; `azimut_solar_fiable` (opcional) o un RMSE no acotable atenúan el azimut y lo marcan «poco fiable» |
| 45 | El gestor de claves enviaba la consulta con la clave anterior (vacía) y recibía 401 con una clave válida; la dirección de análisis de un punto propio lleva a su cielo |
| 46 | Un mes sin datos (422) es un estado vacío con salida en Ventanas, Día lunar y Comparar: «No hay datos de ese mes. Elige otro mes» y botón al último mes con datos |
| 47 | Ningún texto por debajo de 12 px; gráficos del análisis al ancho real del contenedor (sin desplazamiento a 360 px); contraste en el build; subconjuntos de las fuentes |
| 48 | Etiqueta de un astro casi en el cénit y pie del relato del inicio a 360 px, que se pisaban |
| 49 | El análisis usa `/api/analisis` real en los diez sitios; se retira el ejemplo guardado; la firma del manifiesto que no valida se muestra como aviso con la nota de la API |
| 51 | Ventanas no pide la media del catálogo de un mes sin datos: de seis respuestas 422 a dos |
| 52 | La muestra de respaldo describe Shackleton como la API (C8) |
| 53 | El 404 «Usuario no encontrado» del gestor de claves ya no ofrece «Elegir otro sitio» |

## Recorridos del 15/11 (Playwright, API real en localhost:8080)
- **Carga válida:** `efemerides_slim.csv` (la semilla) con la clave de carga leída del entorno en ejecución: validar, guardar, «Tus datos (2026-11-15 UTC) alimentan este análisis» y «Ver el análisis» cierra el popup y abre el análisis del sitio con `/api/analisis/slim` en 200.
- **Aviso de proyección del Cielo:** el enlace «Cómo se calcula esta proyección» abre el análisis del sitio.
- **Coordenadas propias** (`punto_s85p5_e31p25`): estado «Consultando JPL Horizons…», cielo, ventanas y día lunar con `/api/horizons` en 200. Un 429 (interceptado, con `Retry-After: 30`) muestra «Demasiadas peticiones. Espera 30 s y reintenta».
- **Gestor de claves:** con la clave de administración, 200 y la tabla (vacía en este entorno); con la de carga, 401 y «Clave no válida».
- **Análisis:** Shackleton y Apolo 11 con las cuatro variables. En local `manifiesto.firmado` es `false` con `firma_nota` (las claves de desarrollo se regeneran con el contenedor): se ve el aviso «Manifiesto: sin firma válida» con la nota.
- **Mes sin datos:** junio de 2027 en Ventanas, Día lunar y Comparar.

## Pasada anterior (PR 28 a 36)
| PR | Contenido |
|---|---|
| 28 | KPI con relato en la ficha y en Comparar (conteo al aparecer, media de los 10 sitios como raya de referencia, consecuencia) y nombre del sitio compartido lista → ficha (`layoutId`) → cabecera del sitio (FLIP entre rutas) |
| 29 | Datos en contexto de cada astro sobre la escena del cielo: ratón con puntero fino, pulsación en táctil, foco de teclado y Escape |
| 30 | Colisiones de la escena (auditoría 03, bloque 1): horizonte bajo el contenido, actos del inicio sin solape, cabecera más opaca y zona de exclusión del control de tiempo |
| 31 | Mensajes de error estandarizados: traductor único, aviso con acción y código de seguimiento copiable, registro `[API]` en consola |
| 32 | Desplegables suaves (auditoría 03, bloque 2) |
| 34 | Textos coherentes con los datos (validación de coherencia, C1 a C14) y prueba de frases prohibidas |
| 35 | Bandas con degradado y perfil trazado; Acceso, 404 y clave del gestor en un panel centrado (auditoría 03, bloque 7, parcial) |
| 36 | Latitud cortada en el selector de Comparar a 360 px |

## Recorridos de la pasada anterior (14/11)
- **Catálogo → ficha → cielo:** el nombre viaja de la fila al título y del título a la cabecera; captura a mitad de vuelo. Con movimiento reducido no hay viaje.
- **Cielo, datos en contexto:** `shackleton?t=2026-12-14T23:00Z`, Sol: elevación +1,69°, azimut 340,8°, «Faltan 1044 h para la puesta del Sol». Teclado: el foco abre la tarjeta y Escape la cierra (1 → 0 `role="tooltip"`).
- **Proyección:** junio de 2027 en Shackleton usa `/api/simulacion` real, con el aviso «Proyección» y la banda de incertidumbre (± 0,23°). No había respaldo de ejemplo que retirar.
- **Errores (API interceptada):** 500 con objeto `error` (título, mensaje, acción, código copiable), 500 sin cuerpo, 429 y red caída; en consola, `[API] 500 ERROR_INTERNO 9f2c1e7a4b /api/sites`.
- **Inicio:** a 0,36 y 0,55 del scroll solo se lee un acto.

## Pendiente
- **Pulido sin hacer:** muestra de respaldo partida por mes (hoy un JSON de unos 180 kB por sitio con los seis meses) y relato del inicio diferido. Se dejaron fuera por riesgo de regresión en la primera pantalla y en el respaldo.
- **Reproducción a 30 fps** (auditoría 04, A3): sin hacer. `lienzoLunar.ts` lo comparte el relato del inicio, así que no se toca sin medir antes en el portátil de la demo.
- **`og:image` con dirección completa:** el HTML lleva `/marca/og.png`; falta el dominio de producción para que las redes lo recojan.
- **Idioma sin recarga:** cambiar de idioma recarga la página. Los dos idiomas viajan en el JS inicial (unos 14 kB gzip más); cargar solo el activo queda sin hacer por no arriesgar la primera pantalla.
- **Línea «Media de los 10 sitios…»** en la ficha estrecha de Ventanas, que parte en tres renglones (auditoría 04, menor).
- **Validación de coherencia:** C5 (declaración de uso de IA, a la espera del usuario; el pie ya nombra al equipo, al autor y la sede desde el PR 57). C8 resuelto: la cabecera de Shackleton dice «Región polo sur · Referencia (JPL Horizons)» con la API real y la muestra de respaldo ya coincide (PR 52).

## No verificado
- Dispositivo físico, Lighthouse, lector de pantalla y medición de fps.
- La tarjeta para compartir (`og:`) en una red real y el icono de 180 px en un iPhone.
- El cambio de idioma con el almacenamiento del navegador bloqueado (solo con prueba unitaria).
- La cabecera `Retry-After` real a través de CORS en producción (el 429 se probó interceptado).
- El despliegue en Cloudflare Pages con el build nuevo (el script de contraste se ejecuta con `node`, sin dependencias).
