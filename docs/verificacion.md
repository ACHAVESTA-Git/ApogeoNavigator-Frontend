# Verificación del frontend · dom 15/11/2026 (cierre de la entrega)

Rama integrada: `origin/dev` de `ApogeoNavigator-Frontend` (PR 1 a 49, una rama y un worktree por bloque).

| Comprobación | Resultado |
|---|---|
| `npm run build` | En verde. Incluye `scripts/contraste.mjs`: 41 pares de tokens cumplen WCAG AA (el más justo, `texto-3` sobre `elevada`, 4,68:1) |
| `npm run test:run` | 222 pruebas en verde |
| JS inicial (gzip) | 177,7 kB (`index-*.js`, 530,8 kB sin comprimir). Sin límite por decisión del usuario |
| Chunks diferidos (gzip) | d3 13,1 · Cielo 9,0 · GestorClaves 7,1 · Analisis 6,5 · Sitios 6,1 · UploadDialog 5,9 · Comparar 5,4 · DiaLunar 3,7 · Ventanas 3,1 · CifraRelato 3,1 kB |
| Fuentes | Solo latino y latino extendido de Archivo y JetBrains Mono; la de texto se precarga |
| Tamaño mínimo de texto | 12 px efectivos medidos en navegador (incluidos los rótulos SVG) en Inicio, Sitios, ficha, Cielo, Día lunar, Ventanas, Comparar y Análisis, a 1440 y a 360 px |
| Capturas | `docs/frontend/capturas/` (1440×900 y 360×780). Regeneradas el 15/11 con la API real: inicio (acto 1), sitios, ficha, cielo (Shackleton y Apolo 11), cielo en proyección, día lunar, ventanas, comparar, análisis, análisis con firma no válida, mes sin datos (Ventanas y Comparar) y coordenadas propias (cielo y ventanas). `cielo-proyeccion-azimut-poco-fiable` usa la respuesta real con `azimut_solar_fiable: false` e incertidumbre de 180° añadidos por interceptación, porque el backend #28 aún no está fusionado |
| Desplazamiento horizontal a 360 px | 0 px en todas las rutas capturadas |
| Errores de consola | 0 en todas las capturas. En un mes sin datos el navegador anota el 422 de la propia petición (la interfaz lo muestra como estado vacío) |

## Qué entró en esta pasada (PR 38 a 49)
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
- **Backend #28** (`azimut_solar_fiable` e incertidumbre por punto): el frontend ya lo tolera y lo pinta; falta verlo con la respuesta real.
- **Generación, rotación y revocación de claves** contra la API real: solo se comprobó el acceso y el listado (no se crearon claves).
- **Validación de coherencia:** C5 (pie con la declaración final, a la espera del usuario) y C8 en los datos (`mision` y `agencia` de Shackleton, en `sites.csv` del backend).
- En Ventanas, un mes sin datos lanza varias peticiones que responden 422 (métricas, media del catálogo y efemérides); no se reintentan, pero se podrían evitar.

## No verificado
- Dispositivo físico, Lighthouse, lector de pantalla y medición de fps.
- La cabecera `Retry-After` real a través de CORS en producción (el 429 se probó interceptado).
- El despliegue en Cloudflare Pages con el build nuevo (el script de contraste se ejecuta con `node`, sin dependencias).
