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
  VALIDAR: (tipo: TipoArchivo) => `/api/datos/validar/${tipo}`,
  GUARDAR: (tipo: TipoArchivo) => `/api/datos/${tipo}`,
  CLAVES: "/api/admin/claves",
  CLAVE: (id: string) => `/api/admin/claves/${encodeURIComponent(id)}`,
  CABECERA_CLAVE: "X-API-Key",
  CAMPO_ARCHIVO: "file",
  PARAM: { SITE_ID: "site_id", DESDE: "desde", HASTA: "hasta" },
  DETALLE_RUTA_INEXISTENTE: "Not Found", // 404 por defecto de FastAPI ≠ 404 de «sitio sin efemérides»
  ESTADOS_SIN_SERVICIO: [502, 503, 504],
  NO_AUTORIZADO: 401,
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
  SITIO_DESTACADO: "shackleton",
  MIN_COMPARAR: 2,
  MAX_COMPARAR: 3, // = MAX_COMPARE_SITES
  DECIMALES_PCT: 2,
  DECIMALES_GRADOS: 4,
  TOLERANCIA_PASO: 1e-6,
  LOTE_PX_MIN: 2, // ancho mínimo de un tramo de banda en pantalla
  BLOQUE_MOVIL_HORAS: 6,
  DIA_LUNAR_DIAS: 29.5,
} as const;

export const SEMAFORO = {
  // Decisión del usuario (14/11): en un mes ningún sitio no polar pasa de ~50 % de sol, así que la energía
  // usa umbrales propios; la comunicación mantiene 70/40. El global es el peor de los dos.
  ENERGIA: { VERDE_MIN: 45, AMARILLO_MIN: 25 }, // por % de horas de sol
  COMUNICACION: { VERDE_MIN: 70, AMARILLO_MIN: 40 }, // por % de horas con la Tierra visible
  ORDEN: ["rojo", "amarillo", "verde"],
} as const;
export const UMBRAL_RASANTE_DEG = 3; // sol_el_max < 3° ⇒ aviso «sensible al relieve»
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
  MICRO: 120,
  CORTA: 200,
  MEDIA: 320,
  LARGA: 560,
  ESCENA: 900,
  SALIDA_RUTA: 160,
  DESPLAZAMIENTO_ENTRADA_PX: 8,
  STAGGER: 60,
  HERO_CICLO: 14_000,
  DIA_LUNAR_CICLO: 12_000,
  INERCIA_MAX: 300,
  EASE_SALIDA: [0.22, 1, 0.36, 1],
  EASE_ENTRADA: [0.64, 0, 0.78, 0],
  EASE_ORBITA: [0.65, 0, 0.35, 1],
  REFRESCO_LECTURA_HZ: 10,
  DEBOUNCE_URL_MS: 250,
  DEBOUNCE_ANUNCIO_MS: 500,
  PASO_REDUCIDO_MS: 1000, // con movimiento reducido la reproducción salta 1 h por segundo
} as const;
export const VELOCIDADES_HORAS_POR_SEG = [1, 6, 24] as const;
export const VELOCIDAD_POR_DEFECTO = 6;

export const PANORAMA = {
  VENTANA_DEG: { movil: 120, tableta: 180, escritorio: 360 },
  GIRO_DEG: 45,
  RASTRO_HORAS: 12,
  HORIZONTE_FRACCION: 0.62,
  ALTO_PX: { movil: 300, escritorio: 480 },
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

export const HERO = {
  PASO_HORAS: 3,
  HORIZONTE_FRACCION: { movil: 0.6, escritorio: 0.68 },
  FOTOGRAMA_REDUCIDO: "2026-12-20T00:00Z",
  CONTORNOS: 10,
  CURVATURA_PX: 26, // flecha del arco del limbo lunar
  CIELO_UTIL: 0.8, // fracción del cielo que usa la escala de lupa
  ELEVACION_TOPE_DEG: 20,
  RADIO_SOL: 13,
  RADIO_TIERRA: 9,
  CLAVE_SESION_INTRO: "apogeo.introVista",
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
} as const;

export const DIA_LUNAR = { ALTO_PX: { movil: 260, escritorio: 420 }, PX_POR_DIA_MOVIL: 24, MARGEN_IZQ: 44, MARGEN_SUP: 16, MARGEN_INF: 30 } as const;
export const BANDA = { ALTO_PX: { grande: 96, compacta: 44 }, MIN_ALTO_PX: 5, DIAS_ETIQUETA: 7 } as const;

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
export const PARAM_URL = { T: "t", DESDE: "desde", HASTA: "hasta", SITIOS: "s", VISTA: "vista" } as const;

export const ENLACES = {
  HORIZONS: "https://ssd.jpl.nasa.gov/horizons/",
  NSSDC: "https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html",
  LROC: "https://lroc.im-ldi.com/",
  MOON_TREK: "https://trek.nasa.gov/moon/",
  REPO_FRONTEND: "https://github.com/ACHAVESTA-Git/ApogeoNavigator-Frontend",
  REPO_BACKEND: "https://github.com/ACHAVESTA-Git/ApogeoNavigator-Backend",
} as const;
