// Constantes globales del frontend. Ningún número ni cadena mágica fuera de aquí y de textos.ts.
import type { TipoArchivo } from "./tipos";

// Base de la API por entorno. Vacía = mismo origen (rutas relativas /api/...). Sin barra final.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
export const API = {
  // rutas RELATIVAS; api.ts las une con API_BASE_URL
  SITES: "/api/sites",
  EFEMERIDES: (id: string) => `/api/efemerides/${encodeURIComponent(id)}`,
  METRICAS: "/api/metricas",
  PUESTAS: (id: string) => `/api/puestas/${encodeURIComponent(id)}`,
  SIMULACION: (id: string) => `/api/simulacion/${encodeURIComponent(id)}`,
  VALIDAR: (tipo: TipoArchivo) => `/api/datos/validar/${tipo}`,
  GUARDAR: (tipo: TipoArchivo) => `/api/datos/${tipo}`,
  CLAVES: "/api/admin/claves",
  CLAVE_PUBLICA: (id: string) => `/api/admin/claves/${encodeURIComponent(id)}/publica`,
  CLAVE_REVOCAR: (id: string) => `/api/admin/claves/${encodeURIComponent(id)}/revocar`,
  CLAVE_ROTAR: (id: string) => `/api/admin/claves/${encodeURIComponent(id)}/rotar`,
  CABECERA_CLAVE: "X-API-Key",
  CAMPO_ARCHIVO: "file",
  PARAM: { SITE_ID: "site_id", DESDE: "desde", HASTA: "hasta" },
  DETALLE_RUTA_INEXISTENTE: "Not Found", // 404 por defecto de FastAPI ≠ 404 de «sitio sin efemérides»
  ESTADOS_SIN_SERVICIO: [502, 503, 504],
  NO_AUTORIZADO: 401,
  PROHIBIDO: 403,
  CABECERA_SEGUIMIENTO: "X-Request-ID",
  NO_ENCONTRADO: 404,
  NO_PROCESABLE: 422,
  TIMEOUT_MS: 15_000,
} as const;

export const CARGA = {
  // docs/plan/estandar-carga-ui.md
  EXTENSION: ".csv",
  MAX_BYTES: 5 * 1024 * 1024,
  MAX_ARCHIVOS: 10,
  FILAS_VISIBLES: 3,
  ALTO_FILA_PX: 60,
  MAX_ERRORES_FILA: 5,
  ANCHO_REM: { uno: 32, varios: 44 },
  MARGEN_REM: 2,
  PLIEGUE_MS: 450,
  PLIEGUE_OPACIDAD_MS: 250,
  CHECK_MS: 600,
  CHECK_CIRCULO_MS: 350,
  CHECK_TRAZO_MS: 250,
  EASE_PLIEGUE: [0.22, 1, 0.36, 1],
  CLAVE_SESSION_STORAGE: "apogeo.claveCarga",
  ORDEN_GRUPOS: ["valido", "advertencias", "errores"],
} as const;

export const MODO_MUESTRA = (import.meta.env.VITE_USE_SAMPLE_DATA ?? "auto") as "auto" | "true" | "false";
export const RUTA_MUESTRA = "/muestra";
export const MUESTRA = {
  SITES: `${RUTA_MUESTRA}/sites.json`,
  EFEMERIDES: (id: string) => `${RUTA_MUESTRA}/efemerides/${encodeURIComponent(id)}.json`,
  REFERENCIA: `${RUTA_MUESTRA}/metricas-referencia.json`,
  FECHA_INSTANTANEA: "14/11/2026",
} as const;

export const MS_POR_HORA = 3_600_000;
export const HORAS_POR_DIA = 24;
export const GRADOS_VUELTA = 360;

export const DATOS = {
  PASO_HORAS: 1,
  RANGO_MAX_DIAS: 35, // = QUERY_MAX_RANGE_DAYS del backend
  DESDE_POR_DEFECTO: "2026-12-01T00:00Z",
  HASTA_POR_DEFECTO: "2027-01-01T00:00Z",
  T_POR_DEFECTO: "2026-12-14T23:00Z",
  // Cobertura de los CSV del 14/11/2026 (límites del selector de mes). Fuera de ella la API responde 422.
  COBERTURA: { DESDE: "2026-12-01T00:00Z", HASTA: "2027-06-01T00:00Z" },
  // Meses más allá de los datos que se pueden pedir a /api/simulacion (proyección marcada, con incertidumbre).
  PROYECCION_MESES: 1,
  SITIO_DESTACADO: "shackleton",
  // Comparación sugerida cuando aún no se ha elegido nada: polo, casi polo y ecuador.
  COMPARACION_SUGERIDA: ["shackleton", "im1_odysseus", "apollo11"],
  MIN_COMPARAR: 2,
  MAX_COMPARAR: 3, // = MAX_COMPARE_SITES
  DECIMALES_PCT: 2,
  DECIMALES_GRADOS: 4,
  TOLERANCIA_PASO: 1e-6,
  LOTE_PX_MIN: 2, // ancho mínimo de un tramo de banda en pantalla
  BLOQUE_MOVIL_HORAS: 6,
  DIA_LUNAR_DIAS: 29.5,
} as const;

export const RANGO_POR_DEFECTO = { desde: DATOS.DESDE_POR_DEFECTO, hasta: DATOS.HASTA_POR_DEFECTO } as const;

export const SEMAFORO = {
  // Decisión del usuario (14/11): en un mes ningún sitio no polar pasa de ~50 % de sol, así que la energía
  // usa umbrales propios; la comunicación mantiene 70/40. El global es el peor de los dos.
  ENERGIA: { VERDE_MIN: 45, AMARILLO_MIN: 25 }, // por % de horas de sol
  COMUNICACION: { VERDE_MIN: 70, AMARILLO_MIN: 40 }, // por % de horas con la Tierra visible
  ORDEN: ["rojo", "amarillo", "verde"],
} as const;
// El semáforo y los avisos los calcula la API. Estos umbrales existen SOLO para el respaldo con datos de
// ejemplo y la prueba de oro (deben coincidir con app/core/config.py); los componentes no los aplican.
export const UMBRAL_RASANTE_DEG = 3; // sol_el_max < 3° ⇒ aviso «sensible al relieve»
export const AVISO = { RELIEVE: "sensible_al_relieve" } as const;
export const LUPA_K_DEG = 2;
export const ELEVACION_MAX_DEG = 90;
export const INCLINACION_EJE_LUNAR_DEG = 1.54;
export const ZONA_HORARIA_LOCAL = { IANA: "America/Lima", ETIQUETA: "Lima (UTC−5)", NOMBRE: "Lima", DESFASE: "UTC−5" } as const;
export const LOCALE = "es-PE"; // fechas
// es-PE usa punto decimal en CLDR; el plan pide coma decimal en la interfaz, así que las cifras usan «es».
export const LOCALE_NUMEROS = "es";
export const REGEX = {
  SITE_ID: /^[a-z0-9][a-z0-9_-]{2,39}$/,
  UTC: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/,
  ARCHIVO: {
    sites: /^sites\.csv$/,
    metricas: /^metricas\.csv$/,
    efemerides: /^efemerides_([a-z0-9][a-z0-9_-]{2,39})\.csv$/,
  },
} as const;
export const TIPOS_ARCHIVO = ["sites", "efemerides", "metricas"] as const;
export const CATEGORIAS = ["apolo", "artemis", "clps", "internacional", "historico", "personalizado"] as const;

export const MOVIMIENTO = {
  // ms; espejo de --dur-* en index.css
  MICRO: 140,
  CORTA: 200,
  MEDIA: 320,
  LARGA: 560,
  ESCENA: 900,
  SALIDA_RUTA: 160,
  CONTEO: 700, // conteo de una cifra al aparecer (escena de una sola vez)
  VUELO_VIGENCIA_MS: 1500, // un origen de transición compartida entre rutas caduca si la ruta tarda más
  DESPLAZAMIENTO_ENTRADA_PX: 8,
  STAGGER: 60,
  HERO_CICLO: 14_000,
  DIA_LUNAR_CICLO: 12_000,
  INERCIA_MAX: 300,
  EASE_SALIDA: [0.23, 1, 0.32, 1],
  EASE_ENTRADA: [0.23, 1, 0.32, 1], // las salidas también usan ease-out: nunca ease-in en la interfaz
  EASE_ORBITA: [0.77, 0, 0.175, 1],
  // Springs (interrumpibles: conservan la velocidad al cambiar de destino).
  SPRING_SUAVE: { type: "spring", duration: 0.45, bounce: 0 }, // paneles, fichas, popup
  SPRING_VIVO: { type: "spring", duration: 0.5, bounce: 0.2 }, // solo al soltar un arrastre
  CIERRE_HOJA: { DISTANCIA: 0.4, VELOCIDAD_PX_S: 500 }, // se cierra por distancia O por velocidad
  ELASTICO: 0.2,
  REFRESCO_LECTURA_HZ: 10,
  DEBOUNCE_URL_MS: 250,
  DEBOUNCE_ANUNCIO_MS: 500,
  PASO_REDUCIDO_MS: 1000, // con movimiento reducido la reproducción salta 1 h por segundo
} as const;
/** Identidad compartida del nombre de un sitio: lista → ficha (`layoutId`) → cabecera del sitio (vuelo). */
export const ID_NOMBRE_SITIO = (siteId: string) => `nombre-sitio-${siteId}`;
export const VELOCIDADES_HORAS_POR_SEG = [1, 6, 24] as const;
export const VELOCIDAD_POR_DEFECTO = 6;

export const PANORAMA = {
  VENTANA_DEG: { movil: 120, tableta: 180, escritorio: 360 },
  GIRO_DEG: 45,
  RASTRO_HORAS: 12,
  HORIZONTE_FRACCION: 0.62,
  // Alto = fracción del alto de la ventana, acotado: el panorama y su control de tiempo caben en el primer pliegue.
  ALTO_PX: { movil: { min: 220, max: 300, fraccion: 0.36 }, escritorio: { min: 300, max: 440, fraccion: 0.42 } },
  ETIQUETA: { ANCHO_CARACTER_PX: 7.3, MARGEN_PX: 8, MARGEN_IZQ_PX: 48, SEPARACION_PX: 10, ALTO_PX: 16 },
  ZONA_TRANSPORTE_PX: 172, // franja inferior que tapa el control de tiempo flotante (≥ md): sin etiquetas ni cotas
  ZONA_SUPERIOR: { ANCHO_PX: 290, ALTO_PX: 64 }, // esquina de los botones de centrar y girar: ni etiquetas ni tarjetas
  // Tarjeta de datos en contexto de un astro; ALTO_PX es una cota para decidir si cabe arriba, no su alto real.
  CONTEXTO: { ANCHO_PX: 248, ALTO_PX: 150, SEPARACION_PX: 12, BLANCO_PX: 44, MARGEN_PX: 8 },
  DIFUMINADO_BORDE_PX: 28,
  SEPARACION_MARCAS_PX: 15,
  MARGEN_SUPERIOR_PX: 28,
  MARGEN_INFERIOR_PX: 26,
  MARCA_AZIMUT_CADA: 15,
  CARDINALES: [
    { deg: 0, letra: "N" },
    { deg: 90, letra: "E" },
    { deg: 180, letra: "S" },
    { deg: 270, letra: "O" },
  ],
  MARCAS_ELEVACION: [90, 60, 30, 10, 5, 2, 1, 0, -5, -30, -90],
  MARCAS_ELEVACION_LINEAL: [90, 60, 30, 0, -30, -60, -90],
  RADIO_SOL: 7,
  RADIO_TIERRA: 6,
  RESPLANDOR: { ANCHO_MAX_PX: 520, ANCHO_MIN_PX: 60, ALTO_PX: 10, HASTA_DEG: 15 },
} as const;

/** Escena inmersiva del cielo (lienzo). Los tamaños de los astros están ampliados; se conserva la proporción real. */
export const ESCENA = {
  DPR_MAX: 2,
  ALTO: { movil: { min: 280, max: 380, fraccion: 0.42 }, escritorio: { min: 440, max: 760, fraccion: 0.7 } },
  HORIZONTE_FRACCION: 0.56,
  // Tamaño aparente real: Sol ≈ 0,53°, Tierra ≈ 1,9° desde la Luna (unas 3,6 veces mayor).
  RADIO_SOL_PX: 5.5,
  RAZON_TIERRA_SOL: 3.6,
  ESTRELLAS: 260,
  ROCAS: 46,
  RELIEVE_PX: { lejano: 14, cercano: 18 }, // relieve ILUSTRATIVO: no sale de datos de topografía
  SOMBRA_MAX_PX: 150,
  PASO_PERFIL_PX: 4,
  CREPUSCULO_DEG: { desde: -1.2, hasta: 2.5 }, // tramo en que el suelo pasa de noche a día
  HORAS_POR_ANCHO: 96, // arrastrar el suelo de lado a lado recorre 4 días
} as const;

export const HERO = {
  PASO_HORAS: 3,
  HORIZONTE_FRACCION: { movil: 0.66, escritorio: 0.68 },
  FOTOGRAMA_REDUCIDO: "2026-12-20T00:00Z",
  INICIO_RELATO: "2026-12-12T00:00Z", // el bucle arranca poco antes de la salida de la Tierra
  CONTORNOS: 10,
  CURVATURA_PX: { movil: 12, escritorio: 26 }, // flecha del arco del limbo lunar
  LUPA_PX: { fraccionCielo: { movil: 0.32, escritorio: 0.55 }, max: 340 }, // píxeles que ocupa la escala de lupa completa (0…90°)
  MARCAS_ELEVACION: [1, 2, 5],
  TIERRA_FRACCION_X: 0.72, // dónde cae el azimut medio de la Tierra en el panorama de 360°
  BARRIDO: { MITAD: 0.16, OPACIDAD: 0.5 }, // semianchura del barrido de luz rasante (fracción del ancho)
  RADIO_SOL: { movil: 10, escritorio: 13 },
  RADIO_TIERRA: { movil: 7, escritorio: 9 },
  ROTULO_MEDIO_PX: 44, // media anchura del rótulo de un glifo
  ROTULO_ALTO_PX: 26,
  CLAVE_SESION_INTRO: "apogeo.introVista",
  // Relato con scroll: tramo del desplazamiento (0…1) de cada acto y fecha en la que termina.
  RELATO: {
    // MARGEN: fracción del scroll que dura cada entrada o salida de un acto
    ACTO: { MARGEN: 0.06, DESPLAZAMIENTO_PX: 16, DESENFOQUE_PX: 4 },
    ALTO_SVH: 340, CORTES: [0.34, 0.7], FECHAS: ["2026-12-13T00:00Z", "2026-12-28T00:00Z"], CONTEO_MS: 900, VENTANA_DEG: { movil: 150, escritorio: 360 } },
} as const;

export const MAPA = {
  LAT_BORDE: 30,
  LAT_POLO: -90,
  ANILLOS: [-80, -60, -30, 0, 20],
  ANILLO_ARTEMIS: -80,
  MERIDIANOS_CADA: 30,
  LADO: 640,
  MARGEN: 34,
  RADIO_PUNTO: 6,
  ESCALA_ACTIVO: 1.6,
  LON_CARA_OCULTA: 90,
  ANILLO_HORIZONTE: 0, // visto desde el polo sur, el limbo de la Luna es el ecuador
  RADIO_ETIQUETA_IZQ: 30, // los sitios pegados al polo se rotulan a la izquierda
  MERIDIANOS_ROTULADOS: [0, 90, 180, 270],
  SEPARADOR_NOMBRE: " - ",
  ESQUELETO_FILAS: 6,
} as const;

export const DIA_LUNAR = { ALTO_PX: { movil: 260, escritorio: 420 }, PX_POR_DIA_MOVIL: 24, MARGEN_IZQ: 44, MARGEN_SUP: 16, MARGEN_INF: 30 } as const;
export const BANDA = { ALTO_PX: { grande: 150, media: 92, compacta: 40 }, MIN_ALTO_PX: 4, MIN_ANCHO: 2, DIAS_ETIQUETA: 7, SEMANAS: 4, DIAS_SEMANA: 7 } as const;

/** Gestor de claves post-cuánticas (docs/plan/seguridad-oauth-pqc.md §7.3). */
export const CLAVES_PQC = {
  SESSION_STORAGE: "apogeo.claveAdmin", // ADMIN_API_KEY: distinta de la de carga; nunca en el bundle
  MOTIVO: { MIN: 3, MAX: 200 },
  LIMITE: 200,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  TIPOS: ["kem", "firma"],
  HUELLA_VISIBLE: 12,
} as const;
export const HORIZONTE_PUNTOS = 64;
export const HORIZONTE_COPIAS = 3; // una por sitio en Comparar; en el resto coinciden
export const TACTIL_MIN_PX = 44;
export const BREAKPOINT_PX = { sm: 480, md: 768, lg: 1024 } as const;
export const SESION = { COMPARACION: "apogeo.comparacion", BANNER_CERRADO: "apogeo.bannerMuestra" } as const;

export const RUTAS = {
  INICIO: "/",
  SITIOS: "/sitios",
  SITIO: (id: string) => `/sitios/${id}`,
  CIELO: (id: string) => `/sitios/${id}/cielo`,
  VENTANAS: (id: string) => `/sitios/${id}/ventanas`,
  DIA_LUNAR: (id: string) => `/sitios/${id}/dia-lunar`,
  COMPARAR: "/comparar",
  ACCESO: "/acceso",
  CLAVES: "/admin/claves",
} as const; // sin ruta de carga: es un popup
export const SEGMENTO = { CIELO: "cielo", VENTANAS: "ventanas", DIA_LUNAR: "dia-lunar" } as const;
export const PARAM_URL = { T: "t", DESDE: "desde", HASTA: "hasta", SITIOS: "s", VISTA: "vista", ESCALA: "escala", SITIO: "sitio", CATEGORIA: "cat", MODO: "modo", MESES: "meses" } as const;

export const ENLACES = {
  HORIZONS: "https://ssd.jpl.nasa.gov/horizons/",
  NSSDC: "https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html",
  LROC: "https://lroc.im-ldi.com/",
  LRO: "https://www.nasa.gov/missions/lro/nasas-lro-images-intuitive-machines-odysseus-lander/",
  REPO_FRONTEND: "https://github.com/ACHAVESTA-Git/ApogeoNavigator-Frontend",
  REPO_BACKEND: "https://github.com/ACHAVESTA-Git/ApogeoNavigator-Backend",
  SEGURIDAD: "https://github.com/ACHAVESTA-Git/ApogeoNavigator-Backend/tree/dev/docs",
} as const;
