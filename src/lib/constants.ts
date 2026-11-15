// Constantes globales del frontend. Ningún número ni cadena mágica fuera de aquí y de textos.ts.
import { IDIOMA } from "./idioma";
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
  ANALISIS: (id: string) => `/api/analisis/${encodeURIComponent(id)}`,
  PARAM_VARIABLE: "variable",
  VALIDAR: (tipo: TipoArchivo) => `/api/datos/validar/${tipo}`,
  GUARDAR: (tipo: TipoArchivo) => `/api/datos/${tipo}`,
  HORIZONS: "/api/horizons",
  PARAM_HORIZONS: { LAT: "lat", LON: "lon" },
  CABECERA_REINTENTO: "Retry-After",
  CLAVES: "/api/admin/claves",
  CLAVE_PUBLICA: (id: string) => `/api/admin/claves/${encodeURIComponent(id)}/publica`,
  CLAVE_REVOCAR: (id: string) => `/api/admin/claves/${encodeURIComponent(id)}/revocar`,
  CLAVE_ROTAR: (id: string) => `/api/admin/claves/${encodeURIComponent(id)}/rotar`,
  CABECERA_CLAVE: "X-API-Key",
  // Sesión (cookie httpOnly que pone el backend): las peticiones con sesión llevan credenciales y esta cabecera.
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_ME: "/api/auth/me",
  CABECERA_PETICION: "X-Requested-With",
  VALOR_PETICION: "XMLHttpRequest",
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
  // Respuesta real de /api/analisis guardada como ejemplo (solo de este sitio). Se quita cuando el endpoint esté desplegado.
  FECHA_INSTANTANEA: "14/11/2026",
} as const;

export const MS_POR_HORA = 3_600_000;
export const HORAS_POR_DIA = 24;
export const GRADOS_VUELTA = 360;

// Lectura de la incertidumbre de /api/simulacion (RMSE por componente).
export const PROYECCION = {
  // 2× el RMSE cubre el 98–100 % de los puntos proyectados: esa es la banda que se cita y se dibuja.
  FACTOR_BANDA: 2,
  // Más allá de esta banda ± un azimut ya no orienta (cerca del cénit o del nadir el RMSE llega a 180°): «no acotable».
  BANDA_MAX_DEG: 30,
  // Código del aviso general de /api/simulacion: la pantalla ya lo dice con su propio aviso fijo.
  AVISO_GENERAL: "proyeccion_estadistica",
} as const;

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
/** Marca. El nombre es propio y no se traduce; el símbolo reserva su tamaño para no mover nada al cargar. */
export const MARCA = { NOMBRE: "Apogeo Navigator", NOMBRE_1: "Apogeo", NOMBRE_2: "Navigator", SIMBOLO_PX: 28 } as const;
export const ZONA_HORARIA_LOCAL = { IANA: "America/Lima", ETIQUETA: "Lima (UTC−5)", NOMBRE: "Lima", DESFASE: "UTC−5" } as const;
export const LOCALE = IDIOMA === "en" ? "en-GB" : "es-PE"; // fechas (día antes que mes en los dos idiomas)
// es-PE usa punto decimal en CLDR; el plan pide coma decimal en la interfaz, así que las cifras usan «es».
export const LOCALE_NUMEROS = IDIOMA === "en" ? "en-US" : "es";
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
  FUNDIDO_ANILLO: 160, // el anillo del mapa se apaga al entrar al lienzo del Cielo (no hace morph sobre la escena)
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
  SPRING_PARALAJE: { stiffness: 170, damping: 19, mass: 0.5, restDelta: 0.004 }, // paralaje decorativo del suelo: casi crítico, se asienta en ~0,3 s
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
  ETIQUETA: { ANCHO_CARACTER_PX: 7.3, MARGEN_PX: 8, MARGEN_IZQ_PX: 48, SEPARACION_PX: 10, ALTO_PX: 16, SEPARACION_ENTRE_PX: 4 },
  ZONA_TRANSPORTE_PX: 172, // franja inferior que tapa el control de tiempo flotante (≥ md): sin etiquetas ni cotas
  ZONA_NOTA_ALTO_PX: 36, // franja superior donde vive la nota de la escala: una etiqueta ahí la pisaría o rozaría el borde
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
  // Mientras la escena se mueve (reproducción, arrastre, cambio de tamaño) se pinta a menos resolución y, al
  // parar, se vuelve a pintar nítida: el ojo no distingue el detalle en movimiento y cada fotograma cuesta menos.
  DPR_MOVIMIENTO: 1.25, MOVIMIENTO_SI_MS: 90, NITIDEZ_TRAS_MS: 150,
  // Alto de la escena en la página. En móvil acaba donde empieza el control de tiempo, para que el suelo no
  // quede tapado y el horizonte caiga hacia la mitad de lo que se ve: se descuenta lo que queda encima (barra,
  // cabecera del sitio, pestañas y conmutadores: 271 px) y debajo (control de tiempo, 127 px, y barra inferior,
  // 56 px). Desde 768 px llega hasta el borde inferior de la ventana (se descuenta lo que queda encima).
  ALTO: { movil: { min: 280, max: 560, descuento: 454 }, escritorio: { min: 460, max: 1100, descuento: 256 } },
  // Pantalla completa: muelle sin rebote que se puede invertir a medio camino.
  INMERSION: { type: "spring", duration: 0.6, bounce: 0 },
  HORIZONTE_FRACCION: 0.56,
  // Tamaño aparente real: Sol ≈ 0,53°, Tierra ≈ 1,9° desde la Luna (unas 3,6 veces mayor).
  RADIO_SOL_PX: 8.5,
  // Resplandor del Sol: [radio en px, opacidad]. El halo ancho no crece con el disco; el bloom de dos capas sí.
  HALO_SOL: { RADIO_PX: 250, OPACIDAD: 0.1, OPACIDAD_RASANTE: 0.1 },
  BLOOM_SOL: [[7, 0.3], [2.6, 0.8]], // [radios del disco, opacidad]
  RAZON_TIERRA_SOL: 3.6,
  ESTRELLAS: 260,
  ROCAS: 46,
  // Relieve ILUSTRATIVO (no sale de datos de topografía): tres capas, de la más lejana a la más cercana.
  // `asoma` = px que la cresta puede subir sobre el horizonte ideal (poco, para no tapar un Sol rasante);
  // `fondo` = dónde cae su base en el suelo (0 horizonte … 1 borde inferior); `paralaje` = cuánto más deprisa
  // que el cielo se desplaza al girar (entero: el perfil sigue siendo periódico en 360°).
  RELIEVE: {
    lejano: { px: 28, asoma: 10, paralaje: 1 },
    medio: { px: 34, fondo: 0.42, paralaje: 2, opacidad: 0.5 },
    cercano: { px: 40, fondo: 1.08, paralaje: 3, opacidad: 0.88 },
  },
  GRANO: { TESELA_PX: 128, OPACIDAD: 0.07 }, // grano de regolito precalculado una vez
  SOMBRA_MAX_PX: 150,
  PASO_PERFIL_PX: 4,
  CREPUSCULO_DEG: { desde: -1.2, hasta: 2.5 }, // tramo en que el suelo pasa de noche a día
  HORAS_POR_ANCHO: 96, // arrastrar el suelo de lado a lado recorre 4 días
  // Escena realista (vista del cielo). La portada no la usa: allí el suelo se pinta como siempre.
  REALISTA: {
    // Luz general del suelo: irradiancia de Lambert sobre un plano horizontal, E ∝ sin(elevación), llevada a
    // brillo percibido con un exponente. `LUZ_MAX` deja legibles los rótulos que van sobre el suelo.
    LUZ_MAX: 0.44, LUZ_MIN: 0.004, GAMMA: 0.45,
    CONTRALUZ: 0.55,        // con luz rasante, cuánto se apaga el suelo al mirar hacia el Sol (se ven las caras en sombra)
    OPOSICION: { BRILLO: 0.1, ANCHO_DEG: 28 }, // realce del suelo con el Sol a la espalda (efecto de oposición)
    // Laderas según miren o no al Sol: `realce` amplía la pendiente del perfil; la luz alcanza `alcance` alturas
    // de loma hacia abajo, repartida en `franjas` cada vez más tenues.
    LADERA: { base: 0.12, rasante: 0.36, sombra: 0.7, realce: 2.2, alcance: 1.6, franjas: 9 },
    FILO: { OPACIDAD: 0.45, ANCHO_DEG: 20, HASTA_FONDO: 0.3 }, // crestas lejanas a contraluz, junto al azimut del Sol
    PASO_SOMBREADO_PX: 24,
    // Ondulaciones intermedias (entre las capas lejana, media y cercana del relieve ilustrativo).
    ONDAS: [{ px: 18, fondo: 0.17, paralaje: 1 }, { px: 46, fondo: 0.72, paralaje: 2 }],
    VOLUMEN: 0.42,          // oscurecimiento hacia el pie de cada loma (la siguiente la tapa)
    CRATERES: 18, MOTAS: 150,
    // Sombras: largo = alto / tan(elevación), con tope en razón (40 ≈ Sol a 1,4°) y en fracción del ancho.
    SOMBRA: { RAZON_MAX: 40, FRACCION_ANCHO: 0.26, OPACIDAD: 0.8, PUNTA: 0.4, PUNTA_CERCA: 1.5 },
    PERSPECTIVA: { horizonte: 0.1, pie: 0.5 }, // cuánto se acortan las distancias en profundidad
    // Resplandor del horizonte: polvo levitado que dispersa la luz del Sol rasante (ilustrativo).
    POLVO: { ALTO_PX: 26, ANCHO_DEG: 46, HASTA_DEG: 7, OPACIDAD: 0.42 },
    GRANO_GRUESO_DESDE: 0.4,                   // desde esta profundidad el grano es el doble de grueso (perspectiva)
    PARALAJE_PX: { lejos: 0, cerca: 18, rocas: 12 }, // desplazamiento de las capas al mover el puntero
  },
} as const;

/** Pantalla Comparar: horizontes de las filas en el mismo instante. */
export const COMPARAR = {
  HORIZONTE_FRACCION: 0.6, // dónde cae el horizonte en cada escena pequeña
  AZIMUT_CENTRO: 180,      // el sur en el centro: el mismo encuadre de 360° en todas las filas
  MARGEN_PX: 8,
  PASO_MS: 50,             // reproducción: 1 h cada 50 ms (un mes en unos 37 s)
  FONDO_MAX: 0.7, UNA_DE_CADA: 2, // rocas y cráteres que se dibujan en la escena pequeña: los lejanos, uno de cada dos
} as const;

/** Espera de un 429 (Retry-After): hasta 90 s se dice en segundos; por encima, en minutos (redondeando hacia arriba). */
export const ESPERA = { EN_MINUTOS_DESDE_S: 90, S_POR_MINUTO: 60 } as const;

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
  // Encuadre de la escena de la portada: grados de azimut que caben en pantalla y separación del rótulo de cada astro
  // (encima si está visible, bajo su fantasma si no).
  RELATO: { VENTANA_DEG: { movil: 150, escritorio: 360 }, ROTULO: { SOBRE_PX: 30, BAJO_PX: 8 } },
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
  INTERLINEA_ROTULO_MOVIL: 28, // unidades del viewBox entre las dos líneas de un rótulo de anillo en móvil (texto de 24)
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
  ANALISIS: (id: string) => `/sitios/${id}/analisis`,
  COMPARAR: "/comparar",
  ACCESO: "/acceso",
  CLAVES: "/admin/claves",
  PERFIL: "/perfil",
} as const; // sin ruta de carga: es un popup
export const SEGMENTO = { CIELO: "cielo", VENTANAS: "ventanas", DIA_LUNAR: "dia-lunar", ANALISIS: "analisis" } as const;
/** Coordenadas propias (HU-13): contrato de GET /api/horizons. */
export const PUNTO_PROPIO = {
  PREFIJO: "punto_",
  LAT: { MIN: -90, MAX: 90 },
  LON: { MIN: -180, MAX: 180 },
  DECIMALES: 4,
  RANGO_MAX_DIAS: 35,
  CACHE_MAX: 6, // respuestas de /api/horizons que se guardan en memoria (una por punto y periodo)
} as const;

export const PARAM_URL = { T: "t", DESDE: "desde", HASTA: "hasta", SITIOS: "s", VISTA: "vista", ESCALA: "escala", SITIO: "sitio", CATEGORIA: "cat", MODO: "modo", MESES: "meses", VARIABLE: "variable" } as const;

export const ENLACES = {
  HORIZONS: "https://ssd.jpl.nasa.gov/horizons/",
  NSSDC: "https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html",
  LROC: "https://lroc.im-ldi.com/",
  LRO: "https://www.nasa.gov/missions/lro/nasas-lro-images-intuitive-machines-odysseus-lander/",
  REPO_FRONTEND: "https://github.com/ACHAVESTA-Git/ApogeoNavigator-Frontend",
  REPO_BACKEND: "https://github.com/ACHAVESTA-Git/ApogeoNavigator-Backend",
  SEGURIDAD: "https://github.com/ACHAVESTA-Git/ApogeoNavigator-Backend/tree/dev/docs",
} as const;

/** Gráficos de «Cómo analizamos los datos» (unidades del viewBox). */
export const ANALISIS_GRAFICO = {
  // El viewBox se dibuja al ancho real del contenedor (una unidad = un píxel): los rótulos de 12 se leen a 12 px
  // en cualquier pantalla y el gráfico no obliga a desplazarse. ANCHO es solo el valor previo a medir.
  SERIE: { ANCHO: 720, RAZON: 0.42, ALTO_MIN: 230, ALTO_MAX: 320, MARGEN: { sup: 18, der: 16, inf: 30, izq: 44 }, MARGEN_COMPACTO: { sup: 18, der: 8, inf: 30, izq: 40 } },
  ESPECTRO: { ANCHO: 720, RAZON: 0.3, ALTO_MIN: 210, ALTO_MAX: 240, MARGEN: { sup: 24, der: 20, inf: 42, izq: 44 }, MARGEN_COMPACTO: { sup: 24, der: 10, inf: 42, izq: 30 } },
  ANCHO_COMPACTO: 480, // por debajo, márgenes estrechos y menos marcas en el eje
  ANCHO_MIN: 280,
  MARCAS_X: { amplio: 6, compacto: 3 },
  PERIODO_MIN_DIAS: 5,
  DECIMALES_HUELLA: 12, // caracteres de la huella SHA3-256 que se enseñan antes de la elipsis
} as const;

/** Primitivas del rediseño «Lujo inmersivo» (src/components/lujo). Duraciones en ms; espejo de --dur-lujo-* en index.css. */
// Portada (Inicio): la escena recorre el día real en bucle y debajo van las cifras del catálogo y el recorrido.
export const PORTADA = {
  // El día (24 h) avanza a 1 h por segundo, se detiene y vuelve al inicio con una curva suave.
  CICLO: { AVANCE_MS: 24_000, PAUSA_MS: 1_600, RETORNO_MS: 900 },
  SALTO_MAX_MS: 100, // tras un cuadro largo (pestaña en segundo plano) el día no da un salto
  HOLGURA_VENTANA: 0.7, // el Sol y la Tierra se centran juntos si su separación cabe en esta fracción de la ventana
  HORIZONTE_FRACCION: { movil: 0.74, escritorio: 0.7 }, // altura del horizonte en la escena
  TIERRA_FRACCION_X: { movil: 0.72, escritorio: 0.7 }, // dónde cae la Tierra cuando no se centra con el Sol
  LUPA_MAX_PX: 320,
  ROTULO_MARGEN_PX: 70, // el rótulo de un astro no se sale de la pantalla
  HUELLA_CARACTERES: 8, // caracteres de la huella SHA3-256 que se muestran como cifra
  REVELADO_MARGEN: "0px 0px -12% 0px", // un bloque se revela cuando ha entrado un 12 % en pantalla
} as const;

export const LUJO = {
  CONTEO_MS: 600, // una cifra héroe cuenta hacia su valor UNA vez; techo del plan (≤ 600 ms)
  COPIADO_MS: 2000, // cuánto se mantiene el aviso «Huella copiada»
  // Medidor: unidades del viewBox. El arco abre 270° y deja el hueco abajo (empieza a las 7:30 y acaba a las 4:30).
  MEDIDOR: { LADO: 120, RADIO: 50, GROSOR: 8, ARCO_DEG: 270, INICIO_DEG: 135, MARCA: 7 },
} as const;
