# Verificación del frontend · sáb 14/11/2026 (cierre de la segunda pasada)

Rama integrada: `origin/dev` de `ApogeoNavigator-Frontend` (PR 1 a 36, una rama y un worktree por bloque).

| Comprobación | Resultado |
|---|---|
| `npm run build` | En verde |
| `npm run test:run` | 183 pruebas en verde (incluye la prueba de oro de `metricas.csv`, 16 del traductor de errores y la de frases prohibidas por la validación de coherencia) |
| JS inicial (gzip) | 173,4 kB (`index-*.js`, 518,7 kB sin comprimir). Sin límite por decisión del usuario; `LazyMotion` con `domMax`, que ahora sí se usa (`layoutId` lista → ficha) |
| Chunks diferidos (gzip) | Cielo 8,4 · GestorClaves 7,1 · UploadDialog 5,8 · Sitios 5,4 · Comparar 5,3 · DiaLunar 3,6 · d3 3,4 · CifraRelato 3,1 · Ventanas 3,1 kB |
| Capturas | `docs/frontend/capturas/` (72 archivos, 1440×900 y 360×780). Regeneradas en esta pasada: inicio (acto 1), sitios, ficha, comparar (y su selector a 360), acceso, 404, día lunar, ventanas (Shackleton y Chang'e 4), cielo, cielo en proyección, cielo con datos en contexto y avisos de error (500 con código de seguimiento y red caída) |
| Desplazamiento horizontal a 360 px | 0 px en todas las rutas capturadas |
| Errores de consola | 0 en todas las capturas, salvo un 422 de una petición auxiliar en el mes proyectado (junio de 2027); ver «Pendiente» |

## Qué entró en esta pasada (PR 28 a 36)
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

## Recorridos automatizados (Playwright, API real en localhost:8080 salvo donde se indica)
- **Catálogo → ficha → cielo:** el nombre viaja de la fila al título y del título a la cabecera; captura a mitad de vuelo. Con movimiento reducido no hay viaje.
- **Cielo, datos en contexto:** `shackleton?t=2026-12-14T23:00Z`, Sol: elevación +1,69°, azimut 340,8°, «Faltan 1044 h para la puesta del Sol». Teclado: el foco abre la tarjeta y Escape la cierra (1 → 0 `role="tooltip"`).
- **Proyección:** junio de 2027 en Shackleton usa `/api/simulacion` real, con el aviso «Proyección» y la banda de incertidumbre (± 0,23°). No había respaldo de ejemplo que retirar.
- **Errores (API interceptada):** 500 con objeto `error` (título, mensaje, acción, código copiable), 500 sin cuerpo, 429 y red caída; en consola, `[API] 500 ERROR_INTERNO 9f2c1e7a4b /api/sites`.
- **Inicio:** a 0,36 y 0,55 del scroll solo se lee un acto.

## Pendiente
- **Auditoría 03:** bloque 5 (simulación en móvil y realismo: lienzo de 360–560 px, control de tiempo compacto, Sol de 8–9 px con bloom, relieve en 3 capas con paralaje, rocas), bloque 6 (CLS del inicio < 0,05), del bloque 7 aclarar «fila 13» frente a «fila de datos 12», del bloque 3 el veredicto de Comparar en una frase y dos matices, y del bloque 4 el glifo compartido (hoy viaja solo el nombre).
- **Pantalla «Cómo analizamos los datos»** (`/api/analisis/{site_id}`, contrato provisional): sin empezar.
- **HU-13 coordenadas propias** (`/api/horizons`): sin empezar.
- **Pulido:** textos de 11 px, script de contraste en el build, precarga y subconjuntos de la fuente, muestra partida por mes, relato del inicio diferido.
- **Validación de coherencia:** C5 (pie con la declaración final, a la espera del usuario) y C8 en los datos (`mision` y `agencia` de Shackleton, en `sites.csv` del backend).
- El 422 en consola durante el mes proyectado.

## No verificado
- Carga, generación, rotación y revocación contra las API reales con las claves del entorno.
- El objeto `error` real del backend (aún no publicado): el traductor se probó con respuestas simuladas.
- Dispositivo físico, Lighthouse, lector de pantalla y medición de fps.
