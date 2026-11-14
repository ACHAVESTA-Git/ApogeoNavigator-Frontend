// Cadenas de la interfaz y plantillas generadas a partir de datos. Todo en español.
import { DATOS, SEMAFORO, ZONA_HORARIA_LOCAL } from "./constants";
import { esMesCompleto, fechaHora, fechaLarga, mesLargo, soloFecha } from "./fechas";
import { grados, horas, numero, pct } from "./formato";
import type { Astro, Categoria, EventosAstro, NivelSemaforo, Utc } from "./tipos";

export const NOMBRE_ASTRO: Record<Astro, string> = { sol: "Sol", tierra: "Tierra" };
export const ARTICULO_ASTRO: Record<Astro, string> = { sol: "el Sol", tierra: "la Tierra" };
export const DEL_ASTRO: Record<Astro, string> = { sol: "del Sol", tierra: "de la Tierra" };

export const NOMBRE_NIVEL: Record<NivelSemaforo, string> = { verde: "Viable", amarillo: "Con reservas", rojo: "Crítico" };
export const FORMA_NIVEL: Record<NivelSemaforo, string> = { verde: "círculo", amarillo: "triángulo", rojo: "cuadrado con aspa" };
export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  apolo: "Apolo", artemis: "Artemis", clps: "CLPS", internacional: "Internacional",
  historico: "Histórico", personalizado: "Personalizado",
};
export const FORMA_CATEGORIA: Record<Categoria, string> = {
  apolo: "círculo", artemis: "rombo", clps: "cuadrado", internacional: "triángulo",
  historico: "anillo", personalizado: "cruz",
};

type Umbrales = { readonly VERDE_MIN: number; readonly AMARILLO_MIN: number };
/** 'Crítico · < 40 %' */
export function umbralNivel(n: NivelSemaforo, u: Umbrales): string {
  if (n === "verde") return `≥ ${u.VERDE_MIN} %`;
  return n === "amarillo" ? `${u.AMARILLO_MIN}–${u.VERDE_MIN} %` : `< ${u.AMARILLO_MIN} %`;
}
const leyendaEje = (u: Umbrales): string =>
  `≥ ${u.VERDE_MIN} % viable · ${u.AMARILLO_MIN}–${u.VERDE_MIN} % con reservas · < ${u.AMARILLO_MIN} % crítico`;

export const T = {
  marca: "Apogeo",
  producto: "Navegador lunar",
  utc: "UTC",
  avisoHorizonte:
    "Elevación respecto a un horizonte ideal (Luna lisa, sin relieve). El relieve real puede tapar el Sol o la Tierra.",
  avisoHorizonteCorto: "Horizonte ideal: sin relieve.",
  saltar: "Saltar al contenido",
  cargando: "Cargando…",
  reintentar: "Reintentar",
  cerrar: "Cerrar",
  fuente: "Fuente",
  seAbreEnOtraPestana: "(se abre en otra pestaña)",
  sobreHorizonte: "Sobre el horizonte",
  bajoHorizonte: "Bajo el horizonte",
  sinCambio: "No cambia en el periodo con datos",
  nav: { inicio: "Inicio", sitios: "Sitios", comparar: "Comparar", acceso: "Acceso", subir: "Subir datos", subirCorto: "Subir", principal: "Navegación principal" },
  semaforo: {
    energia: "Energía",
    comunicacion: "Comunicación",
    global: "Global",
    leyenda: `Umbrales provisionales. Energía: ${leyendaEje(SEMAFORO.ENERGIA)}. Comunicación: ${leyendaEje(SEMAFORO.COMUNICACION)}.`,
    peor: "el peor de energía y comunicación",
    sensible: "sensible al relieve",
  },
  banner: {
    texto: (fecha: string) =>
      `Mostrando una instantánea de los CSV del ${fecha} porque la API no responde. Las cifras son reales, pero pueden estar desactualizadas.`,
    corto: "Datos de ejemplo activos",
    cerrar: "Ocultar el aviso de datos de ejemplo",
  },
  reloj: { rotulo: "UTC simulado", titulo: "Instante de la simulación (no es la hora actual)" },
  tiempo: {
    reproducir: "Reproducir",
    pausar: "Pausar",
    regla: "Instante",
    velocidad: "Velocidad",
    porSegundo: (h: number) => (h % 24 === 0 ? `${h / 24} d/s` : `${h} h/s`),
    menosDia: "Retroceder 1 día",
    menosHora: "Retroceder 1 hora",
    masHora: "Avanzar 1 hora",
    masDia: "Avanzar 1 día",
    sol: "Horas con Sol",
    tierra: "Horas con la Tierra visible",
  },
  inicio: {
    documento: "Inicio",
    rotulo: (coordenada: string, periodo: string) => `Cráter Shackleton · ${coordenada} · ${periodo}`,
    titular: "En el polo sur, el Sol no sale ni se pone: rueda por el horizonte.",
    apoyo: "Un paso de unos kilómetros o de unos días decide si un módulo tiene energía y línea directa con la Tierra. Compáralo en minutos.",
    explorar: "Explorar sitios",
    verCielo: "Ver el cielo de Shackleton",
    escena: "Panorama de 360° del horizonte de Shackleton. El Sol recorre el horizonte sin ponerse; la Tierra sale y se pone.",
    escala: "Escala vertical ampliada cerca del horizonte",
    regla: "Recorrer el mes en Shackleton",
    datosReales: "Datos reales de JPL Horizons, una muestra cada 3 h.",
    preguntas: {
      titulo: "Tres preguntas antes de alunizar",
      lista: [
        { astro: "sol", pregunta: "¿Hay Sol?", respuesta: "Sin Sol sobre el horizonte no hay energía. Medimos cuántas horas lo tiene cada sitio y a qué altura." },
        { astro: "tierra", pregunta: "¿Se ve la Tierra?", respuesta: "La Tierra es la línea de vida: si no está sobre el horizonte, no hay enlace directo de comunicación." },
        { astro: "puesta", pregunta: "¿Cuánto falta para la puesta?", respuesta: "Saber cuántas horas quedan antes de que uno de los dos cruce la línea decide el plan de la misión." },
      ],
    },
    polo: {
      titulo: "Por qué el polo es extremo",
      texto: (inclinacion: string) =>
        `El eje de la Luna está inclinado solo ${inclinacion} respecto a su órbita alrededor del Sol. Por eso, visto desde el polo, el Sol nunca se aleja del horizonte: da la vuelta completa en un día lunar, de unos 29,5 días terrestres, siempre rasante. Cualquier colina puede taparlo, y la Tierra asoma y se esconde por la libración.`,
      diagrama: (inclinacion: string) => `Diagrama: el eje de la Luna, inclinado ${inclinacion}, y la luz del Sol que llega casi horizontal al polo sur.`,
      eje: "Eje lunar",
      luz: "Luz del Sol",
      polo: "Polo sur",
      glosario: "Glosario",
      terminos: [
        { termino: "Azimut", definicion: "Dirección sobre el horizonte, en grados desde el norte (0°) y en sentido horario: este 90°, sur 180°, oeste 270°." },
        { termino: "Elevación", definicion: "Altura de un astro sobre el horizonte, en grados. Si es mayor que 0°, se ve; si es 0° o menos, está oculto." },
        { termino: "Horizonte ideal", definicion: "El horizonte de una Luna perfectamente lisa. Los datos no incluyen montañas ni cráteres, que en la realidad pueden tapar el Sol o la Tierra." },
        { termino: "Día lunar", definicion: "El tiempo entre dos amaneceres en el mismo punto de la Luna: unos 29,5 días terrestres." },
        { termino: "UTC", definicion: "Tiempo universal coordinado. Todas las fechas de la app están en UTC; Lima va 5 horas por detrás." },
      ],
    },
    datos: {
      titulo: "Datos NASA",
      texto: "Todas las cifras salen de fuentes públicas. Nada se inventa ni se estima a ojo.",
      fuentes: [
        { nombre: "JPL Horizons", uso: "Posición del Sol y la Tierra (azimut y elevación), hora a hora", clave: "HORIZONS" },
        { nombre: "NSSDC", uso: "Coordenadas de los sitios Apolo", clave: "NSSDC" },
        { nombre: "LROC", uso: "Coordenadas de los alunizajes recientes y de Shackleton", clave: "LROC" },
        { nombre: "Moon Trek", uso: "Contexto cartográfico de la superficie", clave: "MOON_TREK" },
      ],
      periodo: (desde: string, hasta: string, generado: string) => `Periodo con datos: ${desde} a ${hasta} (UTC). Generados el ${generado}.`,
    },
    equipo: {
      titulo: "Equipo Apogeo",
      texto: "Proyecto para el NASA Space Apps Challenge 2026.",
      roles: [
        "Análisis de datos: efemérides, validación con Horizons y métricas",
        "Interfaz: visualización del cielo, comparación y accesibilidad",
        "API y datos: lectura, carga validada de CSV y auditoría",
      ],
    },
    pie: {
      aviso: "NASA no respalda ni patrocina este proyecto ni a ninguna entidad, producto o servicio de terceros. Los datos provienen de fuentes públicas de NASA y de JPL; el análisis y la interfaz son del equipo Apogeo.",
      licencia: "Código bajo licencia MIT © 2026 Apogeo Team.",
      repoFrontend: "Repositorio del frontend",
      repoBackend: "Repositorio del backend",
      acceso: "Acceso del equipo",
    },
  },
  sitios: {
    documento: "Sitios",
    rotulo: "Catálogo",
    titulo: "Diez sitios, un polo",
    entrada: "El polo sur está en el centro y la Tierra queda hacia arriba. Cuanto más cerca del centro, más rasante es el Sol.",
    mapa: (n: number) => `Mapa polar de la Luna centrado en el polo sur con ${n} sitios de alunizaje. La lista de al lado contiene los mismos sitios.`,
    haciaTierra: "0° · hacia la Tierra",
    caraOculta: "Cara oculta: sin Tierra en el cielo",
    zonaArtemis: "zona Artemis",
    ecuador: "ecuador",
    filtro: "Filtrar por categoría",
    todas: "Todas",
    leyenda: "Leyenda de categorías",
    lista: "Lista de sitios",
    vacio: "Aún no hay sitios cargados",
    sinCategoria: "No hay sitios en esta categoría.",
    volver: "Todos los sitios",
    mision: "Misión",
    agencia: "Agencia",
    coordenadas: "Coordenadas",
    notas: "Notas",
    verCielo: "Ver su cielo",
    solPeriodo: "Horas de sol",
    tierraPeriodo: "Tierra visible",
    enPeriodo: (periodo: string) => `en ${periodo}`,
    ficha: (nombre: string) => `Ficha de ${nombre}`,
  },
  comparacion: {
    anadir: (n: number, max: number) => `Añadir a comparar (${n}/${max})`,
    quitar: (n: number, max: number) => `Quitar de comparar (${n}/${max})`,
    corto: (n: number, max: number) => `Comparar ${n}/${max}`,
    llena: (max: number) => `Ya hay ${max} sitios para comparar. Quita uno para añadir otro.`,
    bandeja: "Sitios para comparar",
    quitarDe: (nombre: string) => `Quitar ${nombre} de la comparación`,
    comparar: "Comparar",
    faltan: (min: number) => `Elige al menos ${min}`,
  },
  sitio: {
    pestanas: "Vistas del sitio",
    cielo: "Cielo",
    ventanas: "Ventanas",
    diaLunar: "Día lunar",
    periodo: "Periodo",
    mesAnterior: "Mes anterior",
    mesSiguiente: "Mes siguiente",
    desconocido: "No conocemos este sitio",
    desconocidoTexto: "El identificador no está en el catálogo. Puede que el enlace esté mal escrito o que el sitio aún no se haya cargado.",
    irASitios: "Ver el catálogo de sitios",
  },
  cielo: {
    documento: (nombre: string) => `Cielo · ${nombre}`,
    titulo: (nombre: string) => `El cielo desde ${nombre}`,
    figura: "Panorama del cielo",
    rol: "panorama del cielo",
    cargando: "Cargando efemérides…",
    escalaLupa: "Escala vertical ampliada cerca del horizonte",
    escalaLineal: "Escala vertical lineal: 1° mide lo mismo a cualquier altura",
    escala: "Escala vertical",
    lupa: "Lupa",
    lineal: "Lineal",
    vista: "Vista",
    panorama: "Panorama",
    cenital: "Cenital",
    girarIzq: (g: number) => `Girar la vista ${g}° a la izquierda`,
    girarDer: (g: number) => `Girar la vista ${g}° a la derecha`,
    centrar: (astro: string) => `Centrar la vista en ${astro}`,
    arrastra: "Arrastra para girar la mirada",
    etiqueta: (nombre: string, az: string, el: string) => `${nombre} ${az} / ${el}`,
    bajo: "(bajo el horizonte)",
    panel: "Lectura del instante",
    lima: "Lima",
    az: "az",
    el: "el",
    tabla: "Ver como tabla",
    tablaTitulo: (n: number) => `Posición del Sol y la Tierra, ${n} h antes y después del instante elegido`,
    columnas: ["UTC", "Sol · azimut (°)", "Sol · elevación (°)", "Tierra · azimut (°)", "Tierra · elevación (°)"],
    atajos: "Atajos de teclado",
    listaAtajos: [
      ["← →", "1 hora atrás o adelante"],
      ["Mayús + ← →  ·  Re Pág / Av Pág", "1 día atrás o adelante"],
      ["Inicio / Fin", "primer y último instante del periodo"],
      ["Espacio", "reproducir o pausar"],
      ["[ ]", "girar la vista 45°"],
    ],
    teclas: "ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight PageUp PageDown Home End Space [ ]",
    cenit: "cenit",
    cenitalDescripcion: "Vista cenital: el cenit en el centro, el horizonte en el anillo exterior y el norte arriba.",
    rangoAjustado: "El instante pedido queda fuera del periodo y se ajustó al más cercano.",
  },
  ventanas: {
    documento: (nombre: string) => `Ventanas · ${nombre}`,
    titulo: (nombre: string, periodo: string) => `Ventanas de luz de ${nombre} en ${periodo}`,
    energia: "Energía",
    energiaDetalle: "Horas con el Sol sobre el horizonte",
    comunicacion: "Comunicación",
    comunicacionDetalle: "Horas con la Tierra sobre el horizonte",
    deHoras: (horas: string, total: string) => `${horas} de ${total}`,
    banda: (sol: string, tierra: string) => `Bandas de luz del periodo: Sol sobre el horizonte ${sol}; Tierra sobre el horizonte ${tierra}.`,
    sinSol: "Sin Sol sobre el horizonte en todo el periodo.",
    global: (nivel: string) => `Global: ${nivel}`,
    masMetricas: "Más métricas",
    solMax: "Altura máxima del Sol",
    solMedia: "Altura media del Sol (con Sol)",
    sinMedia: "sin horas de sol",
    origen: "Origen de las cifras",
    origenes: { calculado: "Recalculadas por la API a partir de las efemérides", ejemplo: "Calculadas en el navegador con los datos de ejemplo" },
    referencia: "Referencia metricas.csv",
    coincide: "coincide",
    noCoincide: "no coincide",
    sinReferencia: "no hay fila de referencia para este rango",
    diferencia: (campo: string, calculado: string, referencia: string) => `${campo}: ${calculado} calculado frente a ${referencia} en la referencia`,
    rango: "Rango de fechas",
    desde: "Desde",
    hasta: "Hasta",
    aplicar: "Aplicar rango",
    mesCompleto: "Mes completo",
    semana: (n: number) => `Semana ${n}`,
    atajos: "Atajos de rango",
    errorOrden: "«Hasta» debe ser posterior a «Desde».",
    errorMaximo: (dias: number) => `El rango máximo es de ${dias} días.`,
    errorFormato: "Escribe una fecha y hora completas.",
    errorCobertura: (desde: string, hasta: string) => `Solo hay datos entre ${desde} y ${hasta} (UTC).`,
    cargando: "Calculando ventanas…",
  },
  carga: {
    titulo: "Subir datos",
    pasos: { elegir: "Paso 1 de 3 · Elegir", validando: "Paso 2 de 3 · Validar", revisar: "Paso 3 de 3 · Revisar", guardando: "Paso 3 de 3 · Guardar", hecho: "Hecho" },
    zona: "Arrastra uno o varios CSV aquí, o",
    elegir: "elige archivos",
    zonaMovil: "Elegir archivos",
    limites: (mb: number, n: number) => `Solo .csv · máximo ${mb} MB por archivo · hasta ${n} archivos`,
    nombres: "Nombres admitidos: sites.csv, efemerides_<id>.csv y metricas.csv.",
    tipos: { sites: "Sitios", efemerides: "Efemérides", metricas: "Métricas" },
    nombreNoReconocido: "Nombre no reconocido: usa sites.csv, efemerides_<id>.csv o metricas.csv",
    noEsCsv: "No es un archivo .csv",
    demasiadoGrande: (mb: number) => `Supera el máximo de ${mb} MB`,
    vacio: "El archivo está vacío",
    demasiados: (n: number) => `Solo se admiten ${n} archivos por carga. No se añadieron los que sobran.`,
    repetido: (nombre: string) => `${nombre} ya estaba en la lista`,
    quitar: (nombre: string) => `Quitar ${nombre}`,
    lista: "Archivos elegidos",
    validar: (n: number) => `Validar ${n}`,
    validando: (i: number, n: number) => `Validando ${i} de ${n}…`,
    validandoFila: "Validando…",
    guardandoFila: "Guardando…",
    guardar: (n: number) => `Guardar ${n}`,
    guardando: (i: number, n: number) => `Guardando ${i} de ${n}…`,
    anterior: "Anterior",
    listo: "Listo",
    revisarNoGuardados: "Revisar los no guardados",
    estados: { valido: "Válido", advertencias: "Con advertencias", errores: "Con errores", guardado: "Guardado", no_guardado: "No guardado" },
    resumen: (guardar: number, errores: number) =>
      `Se ${guardar === 1 ? "guardará" : "guardarán"} ${guardar}${errores ? ` · ${errores} con errores` : ""}`,
    resultadoValidacion: (validos: number, errores: number) => `Validación terminada: ${validos} ${validos === 1 ? "válido" : "válidos"}, ${errores} con errores`,
    exito: "Datos subidos correctamente",
    detalleExito: (guardados: number, no: number) =>
      `${guardados} ${guardados === 1 ? "archivo guardado" : "archivos guardados"}${no ? ` · ${no} no ${no === 1 ? "guardado" : "guardados"}` : ""}`,
    ningunoGuardado: "No se guardó ningún archivo. Revisa los errores.",
    errorRed: "No se pudo conectar con el servidor. No se ha perdido nada: puedes reintentar.",
    clave: "Clave de carga",
    claveAyuda: "La pide la API mientras no haya inicio de sesión. Se guarda solo en esta pestaña.",
    claveInvalida: "Clave no válida",
    verErrores: (n: number) => `ver los ${n} errores`,
    verMenos: "ver menos",
    limiteServidor: (mostrados: number, total: number) => `El servidor devuelve los primeros ${mostrados} de ${total}.`,
    detalle: (nombre: string) => `Ver el detalle de ${nombre}`,
    columnas: ["Fila", "Columna", "Mensaje"],
    errores: "Errores",
    advertencias: "Advertencias",
    archivo: "archivo",
    filas: (n: number) => `${n} ${n === 1 ? "fila" : "filas"}`,
    nErrores: (n: number) => `${n} ${n === 1 ? "error" : "errores"}`,
    nAdvertencias: (n: number) => `${n} ${n === 1 ? "advertencia" : "advertencias"}`,
  },
  noEncontrado: {
    documento: "Fuera del mapa",
    rotulo: "Error 404",
    titulo: "Fuera del mapa",
    texto: "Esta ruta no existe en nuestro mapa lunar.",
    volver: "Volver a Sitios",
  },
  errores: {
    generico: "Algo no salió como esperábamos.",
    sinServicio: "Los datos no están disponibles ahora.",
    sitioDesconocido: "No conocemos este sitio.",
    sinEfemerides: "Este sitio no tiene efemérides cargadas.",
    sinDatosRango: "No hay datos en el rango pedido.",
    fueraDeDatos: (param: string) => `'${param}' está fuera del rango de datos disponible`,
    rangoOrden: "'hasta' debe ser posterior a 'desde'",
    rangoMaximo: `El rango máximo es de ${DATOS.RANGO_MAX_DIAS} días.`,
  },
} as const;

const redondo = (v: number): string => numero(v, 0);

/** 'en 291 h' */
export const enHoras = (h: number): string => `en ${horas(Math.round(h))}`;

/** Línea del panel de lectura: qué hará el astro y cuándo. */
export function proximoCambio(e: EventosAstro): string {
  if (e.horas_restantes === null) {
    return e.visible ? "no se pone en el periodo con datos" : "no sale en el periodo con datos";
  }
  const cuando = e.visible ? e.proxima_puesta_utc : e.proxima_salida_utc;
  const verbo = e.visible ? "se pone" : "sale";
  return `${verbo} ${enHoras(e.horas_restantes)} · ${cuando ? fechaHora(cuando) : ""} ${T.utc}`.trim();
}
/** Texto vivo de la línea de tiempo: 'Faltan 9 h para la puesta del Sol'. */
export function faltanPara(astro: Astro, e: EventosAstro): string {
  if (e.horas_restantes === null) return `${NOMBRE_ASTRO[astro]}: ${T.sinCambio.toLowerCase()}`;
  const evento = e.visible ? "la puesta" : "la salida";
  if (e.horas_restantes <= 0) return `${e.visible ? "Se pone" : "Sale"} ${ARTICULO_ASTRO[astro]} ahora`;
  return `Faltan ${horas(Math.round(e.horas_restantes))} para ${evento} ${DEL_ASTRO[astro]}`;
}

const posicion = (el: number): string =>
  el > 0 ? `${grados(el, 1)} sobre el horizonte` : `${grados(Math.abs(el), 1)} bajo el horizonte`;

interface FilaCielo { sol_az_deg: number; sol_el_deg: number; tierra_az_deg: number; tierra_el_deg: number }
/** Descripción accesible del cielo en un instante (aria-describedby del panorama). */
export function describirCielo(utc: Utc, fila: FilaCielo): string {
  return (
    `El ${fechaLarga(utc)}, el Sol está a ${redondo(fila.sol_az_deg)}° de azimut y ${posicion(fila.sol_el_deg)}; ` +
    `la Tierra, a ${redondo(fila.tierra_az_deg)}° y ${posicion(fila.tierra_el_deg)}. ${T.avisoHorizonteCorto}`
  );
}
/** aria-valuetext de la regla de tiempo. */
export function describirInstante(utc: Utc, fila: FilaCielo): string {
  return `${fechaLarga(utc)}. Sol ${posicion(fila.sol_el_deg)}; Tierra ${posicion(fila.tierra_el_deg)}`;
}

export const horaLocal = (hora: string): string => `${hora} ${ZONA_HORARIA_LOCAL.NOMBRE}, ${ZONA_HORARIA_LOCAL.DESFASE}`;

export const SIN_LINEA_DIRECTA = "Sin línea directa con la Tierra: requiere satélite de retransmisión.";

export interface FilaVeredicto { nombre: string; horas_sol: number; pct_sol: number; horas_tierra_visible: number; pct_tierra: number }
const listar = (nombres: string[]): string =>
  nombres.length <= 1 ? (nombres[0] ?? "") : `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;

/** Frase de comparación generada solo con las métricas: ordena, no opina. */
export function veredicto(filas: FilaVeredicto[], periodo: string): string {
  if (filas.length < 2) return "";
  const porSol = [...filas].sort((a, b) => b.horas_sol - a.horas_sol);
  const [mejor, ...resto] = porSol;
  const ultimo = resto[resto.length - 1];
  const dif = mejor.horas_sol - ultimo.horas_sol;
  const sol =
    dif === 0
      ? `${listar(filas.map((f) => f.nombre))} tienen las mismas horas de sol (${horas(mejor.horas_sol)}) en ${periodo}`
      : `${mejor.nombre} tiene ${horas(dif)} más de sol que ${ultimo.nombre} en ${periodo}`;

  const completos = filas.filter((f) => f.pct_tierra >= 100);
  const sinTierra = filas.filter((f) => f.horas_tierra_visible === 0);
  const parciales = filas.filter((f) => f.pct_tierra < 100 && f.horas_tierra_visible > 0);
  const partes: string[] = [];
  if (completos.length) partes.push(`${listar(completos.map((f) => f.nombre))} ${completos.length > 1 ? "ven" : "ve"} la Tierra todo el periodo`);
  parciales.forEach((f) => partes.push(`${f.nombre} la ve ${horas(f.horas_tierra_visible)} (${pct(f.pct_tierra)})`));
  if (sinTierra.length) partes.push(`${listar(sinTierra.map((f) => f.nombre))} no ${sinTierra.length > 1 ? "la ven" : "la ve"} nunca`);
  return `${sol}. ${partes.join("; ")}.`.replace(/\. ([a-zñáéíóú])/u, (_, c: string) => `. ${c.toUpperCase()}`);
}

/** 'diciembre de 2026' si el rango es un mes natural completo; si no, '2026-12-01 → 2026-12-08'. */
export function periodoLegible(desde: Utc, hasta: Utc): string {
  return esMesCompleto(desde, hasta) ? mesLargo(desde) : `${soloFecha(desde)} → ${soloFecha(hasta)}`;
}
