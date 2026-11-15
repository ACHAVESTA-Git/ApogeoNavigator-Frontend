// Interface strings in English. Same keys and signatures as `textos.es.ts` (the `Textos` type and a test enforce it).
// The five presentation rules of the analysis hold here too: uploaded or modified data is never called NASA data,
// R² is the in-sample fit, the RMSE is "optimistic; not an interval", observed/fitted exist only inside the data,
// and `cargado_por` is shown as one of three categories, never as an identity.
import { DATOS, MARCA, SEMAFORO, UMBRAL_RASANTE_DEG, ZONA_HORARIA_LOCAL } from "./constants";
import { diaCorto, esMesCompleto, fechaHora, fechaLarga, mesLargo, soloFecha, soloHora } from "./fechas";
import { grados, horas, numero, pct } from "./formato";
import { decidir, diferencias, type Diferencia, type FraseRacha, type LineaComparada } from "./comparar";
import type { FilaVeredicto, PartesVeredicto, Textos, TextosApiAnalisis } from "./textos.es";
import type { Astro, Categoria, EventosAstro, NivelSemaforo, Utc } from "./tipos";

export const NOMBRE_ASTRO: Record<Astro, string> = { sol: "Sun", tierra: "Earth" };
export const ARTICULO_ASTRO: Record<Astro, string> = { sol: "the Sun", tierra: "the Earth" };
export const DEL_ASTRO: Record<Astro, string> = { sol: "of the Sun", tierra: "of the Earth" };

export const NOMBRE_NIVEL: Record<NivelSemaforo, string> = { verde: "Viable", amarillo: "With caveats", rojo: "Critical" };
export const FORMA_NIVEL: Record<NivelSemaforo, string> = { verde: "circle", amarillo: "triangle", rojo: "crossed square" };
export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  apolo: "Apollo", artemis: "South pole region", clps: "CLPS", internacional: "International",
  historico: "Historic", personalizado: "Custom",
};
export const FORMA_CATEGORIA: Record<Categoria, string> = {
  apolo: "circle", artemis: "diamond", clps: "square", internacional: "triangle",
  historico: "ring", personalizado: "cross",
};

type Umbrales = { readonly VERDE_MIN: number; readonly AMARILLO_MIN: number };
/** 'Critical · < 40%' */
export function umbralNivel(n: NivelSemaforo, u: Umbrales): string {
  if (n === "verde") return `≥ ${u.VERDE_MIN}%`;
  return n === "amarillo" ? `${u.AMARILLO_MIN}–${u.VERDE_MIN}%` : `< ${u.AMARILLO_MIN}%`;
}
const leyendaEje = (u: Umbrales): string =>
  `≥ ${u.VERDE_MIN}% viable · ${u.AMARILLO_MIN}–${u.VERDE_MIN}% with caveats · < ${u.AMARILLO_MIN}% critical`;
const plural = (n: number, uno: string, varios: string): string => (n === 1 ? uno : varios);
const mayuscula = (texto: string): string => texto.charAt(0).toUpperCase() + texto.slice(1);

export const T: Textos = {
  marca: MARCA.NOMBRE,
  producto: "Lunar landing sites",
  descripcion: "Compare lunar landing sites: where the Sun and the Earth sit above the horizon, how many hours of power and direct link there are, and when they set. Data from JPL Horizons.",
  utc: "UTC",
  oeste: "W",
  config: {
    abrir: "Settings",
    titulo: "Settings",
    idioma: "Language",
    idiomas: { es: "Español", en: "English" },
    nota: "Dates and figures follow the chosen language. The page reloads when you change it.",
    notaDatos: "Site names, their notes and the analysis steps come from the dataset and are shown in Spanish in both languages.",
    sinAlmacenamiento: "This browser does not allow saving the preference, so the language cannot be changed here.",
  },
  avisoHorizonte:
    "Elevation relative to an ideal horizon (a smooth Moon, no terrain). Real terrain can hide the Sun or the Earth.",
  avisoHorizonteCorto: "Ideal horizon: no terrain.",
  saltar: "Skip to content",
  cargando: "Loading…",
  reintentar: "Retry",
  cerrar: "Close",
  fuente: "Source",
  seAbreEnOtraPestana: "(opens in a new tab)",
  sobreHorizonte: "Above the horizon",
  bajoHorizonte: "Below the horizon",
  sinCambio: "No change within the period with data",
  nav: { inicio: "Home", sitios: "Sites", comparar: "Compare", acceso: "Sign in", subir: "Upload data", subirCorto: "Upload", principal: "Main navigation" },
  semaforo: {
    energia: "Power",
    comunicacion: "Communication",
    global: "Overall",
    leyenda: `Provisional thresholds. Power: ${leyendaEje(SEMAFORO.ENERGIA)}. Communication: ${leyendaEje(SEMAFORO.COMUNICACION)}.`,
    peor: "the worse of power and communication",
    sensible: "terrain-sensitive",
    avisoRelieve: `Terrain-sensitive: the Sun stays below ${UMBRAL_RASANTE_DEG}° above the ideal horizon, so a hill can hide it and the real hours of sunlight may be fewer`,
  },
  banner: {
    texto: (fecha: string) =>
      `Showing a snapshot of the CSV files from ${fecha} because the API is not responding. The figures are real, but may be out of date.`,
    corto: "Sample data in use",
    cerrar: "Hide the sample data notice",
  },
  reloj: { utcLargo: "Coordinated Universal Time", rotulo: "Simulated UTC", titulo: "Simulation instant (not the current time)" },
  tiempo: {
    reproducir: "Play",
    pausar: "Pause",
    regla: "Instant",
    velocidad: "Speed",
    porSegundo: (h: number) => (h % 24 === 0 ? `${h / 24} d/s` : `${h} h/s`),
    reiniciar: "Back to the start of the period",
    menosDia: "Go back 1 day",
    menosHora: "Go back 1 hour",
    masHora: "Go forward 1 hour",
    masDia: "Go forward 1 day",
    sol: "Hours with Sun",
    tierra: "Hours with the Earth in view",
  },
  inicio: {
    documento: "Home",
    // Colour accent only on "the Sun". True for the whole data period: by the pole the Sun never strays from the
    // horizon, and with more months it does set (27 Jan 2027), so the copy never says it "never" sets.
    titular: { antes: "By the Moon's south\u00a0pole, ", acento: "the Sun", despues: " barely rises: it rolls along the horizon." },
    apoyo: "A small change of place or date decides whether a lander has power and a direct line to Earth.",
    cta: "Choose a site",
    hero: {
      lugar: (dia: string) => `Shackleton crater · ${dia}`,
      escena: (dia: string) => `Panorama of the horizon at Shackleton on ${dia} (UTC): the Sun and the Earth move through the day following their ephemeris, hour by hour.`,
      hoy: "Today's sky, hour by hour.",
      fuera: {
        antes: (hoy: string, dia: string) => `Today (${hoy}) has no data yet: showing the first day with data, ${dia}.`,
        despues: (hoy: string, dia: string) => `Today (${hoy}) is past the data: showing the last day with data, ${dia}.`,
      },
      sinEfemeride: "The ephemeris for this day could not be loaded.",
    },
    actos: {
      uno: { contexto: (min: string, max: string) => `In December the Sun never climbs above ${max} nor drops below ${min}: it circles the horizon without setting. Real terrain can hide it.` },
      dos: { contexto: (salida: string, puesta: string, sin: string) => `It rises on ${salida} and sets on ${puesta} (UTC). For the rest of the month, ${sin} with no direct line to Earth.` },
      tres: { contexto: (puesta: string) => `A change of place or date changes everything: on ${puesta} (UTC) the Sun at Shackleton sets too. Compare power and link before you decide.` },
      // Day and time of a crossing inside a sentence of the story: "14 Dec at 23:00".
      momento: (utc: Utc) => `${diaCorto(utc)} at ${soloHora(utc)}`,
    },
    cifras: {
      titulo: "The catalogue in three figures",
      sitios: { rotulo: "Sites", contexto: "landing sites to explore and compare" },
      horas: { rotulo: "Ephemeris", contexto: (desde: string, hasta: string) => `of Sun and Earth positions at Shackleton, hour by hour, from ${desde} to ${hasta} (UTC)` },
      huella: { rotulo: "File fingerprint", contexto: (firma: string) => `SHA3-256 of the Shackleton ephemeris · ${firma}`, completa: (huella: string) => `SHA3-256 fingerprint starting with ${huella}` },
    },
    recorrido: {
      titulo: "Three steps to decide",
      paso: (n: number, nombre: string) => `Step ${n} · ${nombre}`,
      cielo: {
        nombre: "Sky", titulo: "See where the Sun and the Earth are", enlace: "See the sky at Shackleton",
        instante: (cuando: string) => `Shackleton · ${cuando} UTC`, tierra: "The Earth does hide.",
        elevacion: (astro: string) => `Elevation · ${astro}`, sobre: "above the horizon", bajo: "below the horizon",
      },
      comparar: {
        nombre: "Compare", titulo: "Compare power and link across sites", enlace: "Open the comparison",
        periodo: (mes: string) => `Viability in ${mes}`,
        fila: (sol: string, tierra: string) => `${sol} of Sun · ${tierra} with the Earth in view`,
      },
      analisis: {
        nombre: "Analysis", titulo: "Check where every figure comes from", enlace: "Open the Shackleton analysis",
        texto: "Every ephemeris file carries its fingerprint and the signature of the manifest. The analysis shows the path of the data, from the CSV to the chart, and the error of the fit.",
      },
      sinDatos: "These data could not be loaded. Try again in a moment.",
    },
    polo: {
      titulo: "Why the pole is extreme",
      texto: (inclinacion: string) =>
        `The Moon's axis is tilted only ${inclinacion} from the ecliptic, the plane of the Earth's orbit around the Sun. So, seen from the pole, the Sun never strays far from the horizon: it goes all the way round in one lunar day, about 29.5 Earth days, always grazing. Any hill can hide it, and the Earth peeks out and hides because of libration.`,
      diagrama: (inclinacion: string) => `Diagram: the Moon's axis, tilted ${inclinacion}, and sunlight arriving almost horizontally at the south pole.`,
      eje: "Lunar axis",
      luz: "Sunlight",
      polo: "South pole",
      glosario: "Glossary",
      terminos: [
        { termino: "Azimuth", definicion: "Direction along the horizon, in degrees from north (0°) going clockwise: east 90°, south 180°, west 270°." },
        { termino: "Elevation", definicion: "Height of a body above the horizon, in degrees. Above 0° it is visible; at 0° or below it is hidden." },
        { termino: "Ideal horizon", definicion: "The horizon of a perfectly smooth Moon. The data does not include mountains or craters, which in reality can hide the Sun or the Earth." },
        { termino: "Lunar day", definicion: "The time between two sunrises at the same point on the Moon: about 29.5 Earth days." },
        { termino: "UTC", definicion: "Coordinated Universal Time. Every date in the app is in UTC; Lima is 5 hours behind." },
      ],
    },
    datos: {
      titulo: "NASA data",
      texto: "The figures come from public NASA sources and reproducible calculations. Whatever is not NASA data is labelled: the projections, the traffic-light thresholds and the illustrative terrain.",
      fuentes: [
        { nombre: "JPL Horizons", uso: "Position of the Sun and the Earth (azimuth and elevation), hour by hour", clave: "HORIZONS" },
        { nombre: "NSSDC", uso: "Coordinates of the Apollo sites", clave: "NSSDC" },
        { nombre: "LROC", uso: "Coordinates of the recent landings and of Shackleton", clave: "LROC" },
        { nombre: "NASA/LRO", uso: "Coordinates of IM-1 Odysseus", clave: "LRO" },
      ],
      periodo: (desde: string, hasta: string, generado: string) => `Period with data: ${desde} to ${hasta} (UTC). Generated on ${generado}.`,
    },
    equipo: {
      titulo: "Apogeo Team",
      texto: "A project for the NASA Space Apps Challenge 2026.",
      roles: [] as string[],
    },
    pie: {
      aviso: "NASA does not endorse or sponsor this project or any third-party entity, product or service. The data comes from public NASA and JPL sources.",
      // Proper names: not translated.
      autoria: "Apogeo Team · Anthony Chavesta Pisfil · NASA Space Apps Chiclayo 2026",
      licencia: "Code under the MIT licence © 2026 Apogeo Team.",
      repoFrontend: "Frontend repository",
      repoBackend: "Backend repository",
      acceso: "Team sign-in",
    },
  },
  sitios: {
    documento: "Sites",
    rotulo: "Catalogue",
    titulo: "Ten sites, seen from the south pole",
    entrada: "The south pole is at the centre and the Earth lies towards the top. The closer to the centre, the lower the Sun grazes.",
    mapa: (n: number) => `Polar map of the Moon centred on the south pole with ${n} landing sites. The list beside it holds the same sites.`,
    haciaTierra: "0° · towards Earth",
    caraOculta: "Far side: no Earth in the sky",
    regionPolarSur: "south polar region",
    ecuador: "equator",
    filtro: "Filter by category",
    todas: "All",
    leyenda: "Category legend",
    lista: "List of sites",
    vacio: "No sites loaded yet",
    sinCategoria: "No sites in this category.",
    volver: "All sites",
    mision: "Mission",
    agencia: "Agency",
    coordenadas: "Coordinates",
    notas: "Notes",
    verCielo: "See its sky",
    solPeriodo: "Hours of sunlight",
    tierraPeriodo: "Earth in view",
    enPeriodo: (periodo: string) => `in ${periodo}`,
    ficha: (nombre: string) => `${nombre} details`,
    tarjeta: (nombre: string) => `Open ${nombre} details`,
    veredicto: "Verdict",
    verCieloDe: (nombre: string) => `See the sky at ${nombre}`,
    miniHorizonte: "Sun and Earth over the ideal horizon at the clock instant",
    relojPausar: "Pause the motion",
    relojReproducir: "Play the motion",
    detalles: "Site details",
    planear: "Plan a landing",
    medidores: (periodo: string) => `Power and comms in ${periodo}`,
  },
  mision: {
    titulo: "Mission status",
    region: (nombre: string, periodo: string) => `Mission status for ${nombre} in ${periodo}`,
    periodo: (periodo: string) => `Period: ${periodo}`,
    mostrar: "Show mission status",
    ocultar: "Hide mission status",
    medidores: "Power and comms for the period",
    energia: "Power",
    comunicacion: "Comms",
    puestaSol: (horas: string, fecha: string) => `Next sunset in ${horas} · ${fecha} UTC`,
    puestaTierra: (horas: string, fecha: string) => `Next Earthset in ${horas} · ${fecha} UTC`,
    sinPuestaSol: (fin: string) => `No sunset before ${fin} UTC, the end of the queried period.`,
    sinPuestaTierra: (fin: string) => `No Earthset before ${fin} UTC, the end of the queried period.`,
    noSaleSol: "The Sun does not rise in this period",
    noSaleTierra: "The Earth is not in view in this period",
    desdeInicio: (inicio: string) => `Hours counted from the start of the period (${inicio} UTC). Hourly step, ±1 h.`,
    tierraVisible: (pct: string, horas: string) => `Earth is in view ${pct} of the period (${horas}).`,
    solAhora: "Sun now",
    tierraAhora: "Earth now",
    proximoEvento: "Next event",
    sobre: "above the horizon",
    bajo: "below the horizon",
    puestaDe: (astro: "sol" | "tierra", fecha: string) => `${astro === "sol" ? "Sunset" : "Earthset"} · ${fecha} UTC · hourly step, ±1 h`,
    sinEvento: "No sets ahead in this period's data",
    fueraDePeriodo: "The simulation instant is outside this period",
    instante: (fecha: string) => `Simulation instant: ${fecha} UTC`,
    operativa: {
      noche: { racha: (h: string) => `No Sun for ${h} in a row`, cero: "No night in this period", todo: (h: string) => `No Sun for the whole period (${h})` },
      apagon: { racha: (h: string) => `No link to Earth for ${h}`, cero: "Link to Earth all period", todo: (h: string) => `No link to Earth for the whole period (${h})` },
      ventana: { racha: (h: string) => `You get Sun and Earth together for ${h} in a row`, cero: "No Sun and Earth together in this period", todo: (h: string) => `You get Sun and Earth together all period (${h})` },
    },
    indicadores: "Astronaut indicators",
    sinIndicadores: "This data does not include the astronaut indicators: no figure is shown.",
    alMenos: (valor: string) => `at least ${valor}`,
    noche: {
      rotulo: "Longest night",
      normal: (h: string, sitio: string, periodo: string) => `Up to ${h} in a row without Sun at ${sitio} (${periodo}). Size the battery to cover that night.`,
      cero: (periodo: string) => `No night in ${periodo}: the Sun stays above the ideal horizon. Terrain could still block it.`,
      cortada: (h: string) => `At least ${h} without Sun; the night continues beyond the period. Size the battery for more than ${h}.`,
      todo: (h: string, periodo: string) => `No Sun for all of ${periodo} (${h}); it may continue afterwards. No solar power in this period.`,
    },
    apagon: {
      rotulo: "Link blackout",
      normal: (h: string, sitio: string, periodo: string) => `Up to ${h} in a row without Earth in view at ${sitio} (${periodo}). Size the relay or onboard data storage.`,
      cero: (periodo: string) => `Earth never sets in ${periodo}: direct line of sight all period with an ideal horizon. Terrain could still cut it.`,
      cortada: (h: string) => `At least ${h} without Earth in view; the blackout continues beyond the period. Size relay or storage for more.`,
      todo: (h: string, periodo: string) => `Earth is not in view for all of ${periodo} (${h}). No direct link: communications depend on a relay.`,
    },
    ventana: {
      rotulo: "Sun+Earth window",
      normal: (h: string) => `Up to ${h} in a row with Sun and Earth both up: the best window for solar power plus a direct link.`,
      cero: (periodo: string) => `In ${periodo} Sun and Earth are never up together: no operation with solar power and a direct link at once.`,
      cortada: (h: string) => `At least ${h} with Sun and Earth both up; the window continues beyond the period.`,
      todo: (h: string, periodo: string) => `Sun and Earth both above the horizon all of ${periodo} (${h}): one continuous window for the period.`,
    },
    rango: (inicio: string, fin: string) => `${inicio} → ${fin} UTC`,
    verCielo: "See the sky at the start of this window",
    detalle: "Detail: mean elevation and next sets",
    elevacion: {
      rotulo: "Mean Sun elevation",
      normal: (g: string) => `During sunlit hours the Sun averages ${g} above the ideal horizon.`,
      cero: (periodo: string) => `No sunlit hours in ${periodo}: there is no mean elevation.`,
    },
    puestas: {
      rotulo: "Next sets",
      sol: (fecha: string, h: string) => `Sunset on ${fecha} UTC, ${h} after the start of the period. Direct solar power ends: prepare the battery.`,
      tierra: (fecha: string, h: string) => `Earthset on ${fecha} UTC, ${h} after the start of the period. The direct link drops: prepare the relay or storage.`,
      nota: "Hourly step, ±1 h.",
    },
    avisoLargo: "Elevation is measured against an ideal horizon (smooth Moon, no terrain). Real terrain can block the Sun or Earth. Figures are ephemerides computed from JPL Horizons, not measurements.",
  },
  lineaVentanas: {
    titulo: "Windows on the timeline",
    grupo: (periodo: string) => `Windows of ${periodo} on the timeline. Each window opens the sky at its first instant.`,
    filas: { sol: "Sun", tierra: "Earth", ambos: "Sun + Earth" },
    detalle: { sol: "Sun above the horizon", tierra: "Earth in view", ambos: "Sun and Earth together" },
    ventana: (que: string, inicio: string, horas: string, cortada: boolean) =>
      `${que}: from ${inicio} UTC, ${cortada ? "at least " : ""}${horas}${cortada ? " (continues beyond the period)" : ""}. See the sky at that instant.`,
    ninguna: "No window in this period",
    ayuda: "Select a window (or press Enter) to see the sky at its first instant.",
  },
  comparacion: {
    anadir: (n: number, max: number) => `Add to compare (${n}/${max})`,
    quitar: (n: number, max: number) => `Remove from compare (${n}/${max})`,
    corto: (n: number, max: number) => `Compare ${n}/${max}`,
    llena: (max: number) => `There are already ${max} sites to compare. Remove one to add another.`,
    bandeja: "Sites to compare",
    quitarDe: (nombre: string) => `Remove ${nombre} from the comparison`,
    comparar: "Compare",
    faltan: (min: number) => `Choose at least ${min}`,
  },
  analisis: {
    documento: (sitio: string) => `How we analyse the data for ${sitio}`,
    rotulo: "Analysis transparency",
    titulo: "How we analyse the data",
    entrada: "Seven steps, from the file to the projection. Every figure on this page comes from this site's data; nothing is written by hand.",
    cargando: "Computing the analysis…",
    si: "yes",
    no: "no",
    enlace: "How we analyse this data",
    enlaceProyeccion: "How this projection is computed",
    trasCarga: (fecha: string) => `Your data (${fecha}) feeds this analysis.`,
    verAnalisis: "See the analysis",
    origen: {
      rotulo: "Where the data comes from",
      semilla: { titulo: "Data from NASA/JPL Horizons", texto: "The file is identical, byte for byte, to the one the project generated with JPL Horizons." },
      subido: {
        titulo: "Data uploaded by a user",
        texto: (fecha: string, quien: string) => `This is not the project's seed data. The file matches the latest valid upload on record: ${fecha}, with ${quien}.`,
        sinFecha: "This is not the project's seed data. The file matches the latest valid upload on record.",
      },
      modificado: { titulo: "Data of unconfirmed origin", texto: "The file matches neither the project's seed data nor any recorded upload: it changed outside the application." },
      sinRegistro: { titulo: "Origin not on record", texto: "There is no seed data or upload record to compare against. We can only give the file's fingerprint, not state where it came from." },
      quienNoConsta: "unidentified origin",
      // The only three categories of `cargado_por` ever shown (never an identity). Keys are the backend's values.
      quienes: { "clave de API": "API key", "usuario registrado": "registered user", "anónimo": "anonymous" } as Record<string, string>,
      manifiesto: "Manifest",
      firma: { valida: "signed (valid signature)", sinFirma: "no valid signature", noVerificable: "signature cannot be verified" },
      huella: "SHA3-256 fingerprint",
      archivo: "File",
      filas: "Rows",
      rango: "Covers",
      huecos: "Gaps",
      paso: "Step",
    },
    pasos: {
      titulo: "The path of the data",
      estados: { ok: "Completed", advertencia: "With caveats", no_disponible: "Not available" } as Record<string, string>,
      paso: (n: number, total: number) => `Step ${n} of ${total}`,
    },
    espectro: {
      titulo: "Which rhythms are in the data",
      entrada: "Each bar is a rhythm that repeats. The taller it is, the more it weighs in the motion.",
      ejeX: "Period (days, logarithmic scale)",
      ejeY: "Relative weight",
      sinodico: (dias: string) => `Synodic month: ${dias} d`,
      pico: (dias: string, peso: string) => `${dias} d · weight ${peso}`,
      alt: (nombre: string, n: number, mayor: string) => `Spectrum of ${nombre}: ${n} rhythms detected; the strongest repeats every ${mayor} days.`,
      tabla: "See the rhythms as a table",
      columnas: ["Period (days)", "Relative weight", "Matches"],
      ninguno: "no known lunar period",
      candidatos: { sinodico: "synodic month", anomalistico: "anomalistic month", draconico: "draconic month", sideral: "sidereal month", tropico: "tropical month" } as Record<string, string>,
    },
    modelo: {
      titulo: "How well the model describes this data",
      r2: "Fit within the data (R²)",
      r2Nota: "R² measures how closely the model matches the data it already has. It does not say how well it does beyond them: validation measures that.",
      residuo: (rmse: string) => `typical error ${rmse}`,
      terminos: (cuerpo: string, n: number) => `${cuerpo}: ${n} ${plural(n, "term", "terms")}`,
    },
    validacion: {
      titulo: "How well it does beyond the data",
      rmse: "Validation RMSE (optimistic; not an interval)",
      propia: "Measured with this same data: the model predicted 12 months that were then compared with JPL Horizons.",
      referencia: "For reference",
      referenciaNota: "These figures were measured with other data (the project's seed data), not with what is loaded now. They are a reference; they do not describe the accuracy with your data.",
      ausente: "There is no validation for this site.",
      frenteIngenua: (veces: string) => `${veces} times better than repeating the previous month`,
      semaforo: "Months with the traffic light predicted correctly",
      deMeses: (aciertos: number, meses: number) => `${aciertos} of ${meses}`,
      porMes: "Error by how far ahead it projects",
      mes: (n: number) => `month ${n}`,
    },
    serie: {
      titulo: "Observed, fitted and projected",
      variable: "Variable",
      observado: "Observed (data)",
      ajustado: "Fitted (model, within the data)",
      proyectado: "Projected (estimate, beyond the data)",
      banda: (rmse: string) => `Band: ± ${rmse}, the validation RMSE (optimistic; not an interval)`,
      bandaReferencia: (rmse: string) => `Reference band: ± ${rmse}, validation RMSE measured with other data (optimistic; not an interval)`,
      finDatos: "end of the data",
      alt: (nombre: string, desde: string, fin: string, hasta: string) =>
        `${nombre}: observed data and model fit from ${desde} to ${fin}; statistical projection from then until ${hasta}.`,
      tabla: "See the series as a table",
      columnas: ["UTC", "Observed", "Fitted", "Projected"],
      variables: { sol_el_deg: "Sun elevation", sol_az_deg: "Sun azimuth", tierra_el_deg: "Earth elevation", tierra_az_deg: "Earth azimuth" } as Record<string, string>,
    },
    informe: {
      documento: (sitio: string) => `Projection confidence report for ${sitio}`,
      rotulo: "Projection confidence report",
      pregunta: (sitio: string) => `Can I trust the projection for ${sitio}?`,
      actos: { veredicto: "1 · Verdict", evidencia: "2 · Evidence", detalle: "3 · Detail and traceability" },
      veredicto: {
        propia: (aciertos: number, meses: number) => `The projection gets the traffic light right in ${aciertos} of ${meses} months`,
        referencia: (aciertos: number, meses: number) => `With other data (the project seed), the projection got the traffic light right in ${aciertos} of ${meses} months`,
        conError: (frase: string, rmse: string) => `${frase}; typical error of ${rmse} in the Sun's elevation.`,
        sinError: (frase: string) => `${frase}.`,
        referenciaNota: "It does not describe accuracy with the data loaded now: it is a reference only.",
        sinSemaforo: "This site's validation does not include traffic-light hits: there is no verdict to give.",
        ausente: "This site's projection has not been checked: there is no validation.",
        etiquetas: { verde: "High confidence", amarillo: "Confidence with caveats", rojo: "Low confidence", referencia: "Reference only", ausente: "Not validated" },
        propiaNota: "Measured with this same data: the projection was later compared with JPL Horizons.",
      },
      heroe: {
        rotulo: "Typical error · Sun elevation",
        contexto: "Validation RMSE (optimistic; not an interval).",
        mision: "For your mission: expect the projected Sun to sit that much higher or lower, and a bit more the further ahead you look.",
      },
      medidores: {
        r2Sol: "R² fit · Sun elevation",
        r2Tierra: "R² fit · Earth elevation",
        aciertos: "Traffic-light hits",
        nivelesR2: { verde: "High fit", amarillo: "Medium fit", rojo: "Low fit" },
        deMeses: (meses: number) => `/ ${meses}`,
        r2Mision: "How closely the model traces the data it already has. It does not say how well it will do later.",
        aciertosMision: "Months in which the projection gave the same traffic light as JPL Horizons.",
        aciertosReferencia: "Measured with other data: a reference, it does not describe yours.",
        ayuda: (rotulo: string) => `How to read: ${rotulo}`,
        umbralesR2: (reservas: string, viable: string) =>
          `Reading thresholds for this screen: high fit from ${viable}, medium from ${reservas}, low below. R² is an internal fit: it measures likeness to data already known, not future accuracy.`,
        umbralesAciertos: (reservas: number, viable: number, meses: number) =>
          `Reading thresholds for this screen: green with ${viable} or more months right out of ${meses}, amber with ${reservas} or more, red below.`,
      },
      evidencia: {
        titulo: "Real data versus the projection",
        entrada: "Drag the cursor across the chart or use the arrow keys. Before the end of the data you see what was observed and the fit; after it, only the projection with its error band.",
        cursor: "Series cursor",
        teclas: "Arrows: one sample. Page Up and Page Down: ten samples. Home and End: the ends.",
        utc: "UTC",
        lima: (hora: string, dia: string) => `${hora} in Lima (UTC−5), ${dia}`,
        zonaDatos: "Inside the data",
        zonaProyeccion: "Projection, outside the data",
        observado: "Observed",
        ajustado: "Fitted",
        proyectado: "Projected",
        desvio: "Model deviation",
        margen: (rmse: string) => `± ${rmse}`,
        margenRotulo: "Band (RMSE)",
        momentos: {
          titulo: "Key moments",
          ir: "Move the cursor to this moment",
          desvio: (valor: string, fecha: string) => `Largest model deviation inside the data: ${valor}, on ${fecha} UTC.`,
          cruceObservado: (astro: string, sentido: string, fecha: string) => `Last horizon crossing in the data: ${astro} ${sentido} around ${fecha} UTC.`,
          cruceProyectado: (astro: string, sentido: string, fecha: string) => `First projected horizon crossing: ${astro} ${sentido} around ${fecha} UTC (estimate).`,
          sale: "rises",
          sePone: "sets",
          astros: { sol: "the Sun", tierra: "Earth" },
          nota: (horas: string) => `The series has one sample every ${horas} h: a crossing happens between two samples. Ideal horizon: no terrain.`,
        },
      },
      ritmos: {
        titulo: "Rhythms of the sky",
        cifra: "Dominant rhythm",
        unidad: "days",
        sinodico: (dias: string, teorico: string) => `The strongest rhythm in the Sun's elevation repeats every ${dias} days: it is the lunar day, from one sunrise to the next (${teorico} days in theory).`,
        otro: (dias: string) => `The strongest rhythm in the Sun's elevation repeats every ${dias} days.`,
        mision: "For your mission: light and darkness alternate at that rhythm. Plan power and activities by lunar days, not Earth days.",
        ver: "See the full spectrum",
      },
      mision: {
        titulo: "What the sky imposes on your mission",
        periodo: (mes: string) => `Period: ${mes}`,
        aviso: "Elevation is measured against an ideal horizon (smooth Moon, no terrain). Real terrain can block the Sun or Earth. Figures are ephemerides computed from JPL Horizons, not measurements.",
        sinDatos: "No indicator data for this period.",
        minimo: (horas: string) => `≥ ${horas}`,
        rango: (inicio: string, fin: string) => `${inicio} → ${fin} UTC`,
        noche: {
          rotulo: "Longest night",
          normal: (h: string, sitio: string, mes: string) => `Up to ${h} h in a row without Sun at ${sitio} (${mes}). Size the battery to cover that night.`,
          cero: (mes: string) => `No night in ${mes}: the Sun stays above the ideal horizon. Terrain could still block it.`,
          sigue: (h: string) => `At least ${h} h without Sun; the night continues into next month. Size the battery for more than ${h} h.`,
          veniaDeAntes: (h: string, mes: string) => `At least ${h} h without Sun; the night began before ${mes}. Size the battery for more than ${h} h.`,
          todo: (mes: string, h: string) => `No Sun for all of ${mes} (${h} h); it may continue afterwards. No solar power in this period.`,
        },
        apagon: {
          rotulo: "Link blackout",
          normal: (h: string, sitio: string, mes: string) => `Up to ${h} h in a row without Earth in view at ${sitio} (${mes}). Size the relay or onboard data storage.`,
          cero: (mes: string) => `Earth never sets in ${mes}: direct line of sight all month with an ideal horizon. Terrain could still cut it.`,
          sigue: (h: string) => `At least ${h} h without Earth in view; the blackout continues into next month. Size relay or storage for more.`,
          veniaDeAntes: (h: string, mes: string) => `At least ${h} h without Earth in view; the blackout began before ${mes}. Size relay or storage for more.`,
          todo: (mes: string, h: string) => `Earth is not in view for all of ${mes} (${h} h). No direct link: communications depend on a relay.`,
        },
        ventana: {
          rotulo: "Sun+Earth window",
          normal: (h: string) => `Up to ${h} h in a row with Sun and Earth both up: the best window for solar power plus a direct link.`,
          cero: (mes: string) => `In ${mes} Sun and Earth are never up together: no operation with solar power and a direct link at once.`,
          sigue: (h: string) => `At least ${h} h with Sun and Earth both up; the window continues into next month.`,
          veniaDeAntes: (h: string, mes: string) => `At least ${h} h with Sun and Earth both up; the window began before ${mes}.`,
          todo: (mes: string, h: string) => `Sun and Earth both above the horizon all of ${mes} (${h} h): one continuous window for the period.`,
        },
        elevacion: {
          rotulo: "Mean Sun elevation",
          normal: (g: string) => `During sunlit hours the Sun averages ${g} above the ideal horizon.`,
          cero: (mes: string) => `No sunlit hours in ${mes}: there is no mean elevation.`,
        },
        puestas: {
          rotulo: "Next sets",
          sol: (fecha: string, h: string, mes: string) => `Sunset on ${fecha} UTC, ${h} h after the start of ${mes}. Direct solar power ends: prepare the battery.`,
          tierra: (fecha: string, h: string, mes: string) => `Earthset on ${fecha} UTC, ${h} h after the start of ${mes}. The direct link drops: prepare the relay or storage.`,
          sinSol: (mes: string) => `No sunset within ${mes}.`,
          sinTierra: (mes: string) => `No Earthset within ${mes}.`,
          nota: "Hourly step, ±1 h.",
        },
      },
      detalle: {
        titulo: "What lies behind the verdict",
        entrada: "What this analysis cannot say, how it was computed and where the data comes from.",
        limitaciones: (n: number) => `What this analysis cannot say (${n})`,
        pasos: (n: number) => `The ${n} steps of the calculation`,
        cifras: "Fit and validation, variable by variable",
        archivo: "File analysed",
      },
    },
    limitaciones: { titulo: "What this analysis cannot tell you", otras: "Limitations that do not affect this site" },
  },
  puntoPropio: {
    titulo: "Custom coordinates",
    entrada: "Look up the sky at any point on the Moon, live from JPL Horizons.",
    lat: "Latitude",
    lon: "Longitude",
    ayudaLat: "From −90 to 90. South is negative.",
    ayudaLon: "From −180 to 180. East is positive.",
    ver: "See the sky at this point",
    lectura: (coordenadas: string) => `Point: ${coordenadas}`,
    errores: {
      numero: "Enter a number, for example −89.66.",
      lat: "Latitude goes from −90 to 90 (South is negative).",
      lon: "Longitude goes from −180 to 180 (East is positive).",
    },
    privacidad: "The coordinates travel in the page address; they are not stored in this browser.",
    nombre: "Custom point",
    fuente: "JPL live",
    marca: "Custom point · JPL live",
    cargando: "Querying JPL Horizons…",
    cargandoNota: "The first query for a point can take several seconds; after that it comes from the cache.",
  },
  sitio: {
    pestanas: "Site views",
    cielo: "Sky",
    ventanas: "Windows",
    diaLunar: "Lunar day",
    analisis: "Analysis",
    periodo: "Period",
    mesAnterior: "Previous month",
    mesSiguiente: "Next month",
    desconocido: "We do not know this site",
    desconocidoTexto: "The identifier is not in the catalogue. The link may be mistyped, or the site may not have been loaded yet.",
    irASitios: "See the site catalogue",
  },
  cielo: {
    documento: (nombre: string) => `Sky · ${nombre}`,
    titulo: (nombre: string) => `The sky from ${nombre}`,
    figura: "Sky panorama",
    rol: "sky panorama",
    cargando: "Loading ephemeris…",
    escalaLupa: "Vertical scale magnified near the horizon",
    escalaLineal: "Linear vertical scale: 1° measures the same at any height",
    escala: "Vertical scale",
    lupa: "Magnified",
    lineal: "Linear",
    vista: "View",
    panorama: "Panorama",
    cenital: "Overhead",
    girarIzq: (g: number) => `Turn the view ${g}° to the left`,
    girarDer: (g: number) => `Turn the view ${g}° to the right`,
    centrar: (astro: string) => `Centre the view on ${astro}`,
    pantallaCompleta: "Full screen",
    salirPantallaCompleta: "Exit full screen",
    salir: "Exit",
    arrastra: "Drag the sky to turn your gaze · drag the ground to move time",
    relieve: "Illustrative terrain. The figures are for an ideal horizon (no terrain).",
    relieveCorto: "Illustrative terrain",
    tamanos: "Bodies drawn larger than life; the Earth looks about 3.6 times bigger than the Sun.",
    horizonteIdeal: "ideal horizon",
    faseTierra: (p: string) => `Earth ${p} lit`,
    proyeccion: "Projection",
    proyeccionSinApi: "This month lies beyond the Horizons data. It can only be shown as a projection, and the simulation API is not responding.",
    proyeccionAviso: "Projected month: this is not Horizons data. Each point carries its uncertainty.",
    proyeccionNota: (g: string) => `Band of ± ${g}, twice the typical error.`,
    proyeccionSinBanda: "The uncertainty of this point cannot be bounded.",
    azimutPocoFiable: (astro: Astro) => `The azimuth ${astro === "sol" ? "of the Sun" : "of the Earth"} is unreliable here: this close to the zenith or the nadir, its uncertainty is too large to draw as a band.`,
    pocoFiable: "unreliable",
    fueraDeVista: (astro: string, g: string, lado: "izquierda" | "derecha") => `${mayuscula(astro)} is ${g} to the ${lado === "izquierda" ? "left" : "right"}, out of view. Press to centre.`,
    etiqueta: (nombre: string, az: string, el: string) => `${nombre} ${az} / ${el}`,
    etiquetaAzDudoso: (nombre: string, az: string, el: string) => `${nombre} ≈ ${az} (az. unreliable) / ${el}`,
    bajo: "(below the horizon)",
    contexto: {
      abrir: (astro: string) => `Data for ${astro} at this instant`,
      elevacion: "Elevation",
      azimut: "Azimuth",
      arriba: "above the horizon",
      abajo: "below the horizon",
      sinEvento: "Computing the next horizon crossing…",
    },
    panel: "Reading at this instant",
    estado: "Status",
    proximoCambio: "Next change",
    abbrAzimut: "Azimuth: direction along the horizon, from north going clockwise",
    abbrElevacion: "Elevation: height above the ideal horizon",
    lima: "Lima",
    az: "az",
    el: "el",
    tabla: "See as a table",
    tablaTitulo: (n: number) => `Position of the Sun and the Earth, ${n} h before and after the chosen instant`,
    columnas: ["UTC", "Sun · azimuth (°)", "Sun · elevation (°)", "Earth · azimuth (°)", "Earth · elevation (°)"],
    teclas: "ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight PageUp PageDown Home End Space [ ]",
    cenit: "zenith",
    cenitalDescripcion: "Overhead view: the zenith at the centre, the horizon on the outer ring and north at the top.",
    rangoAjustado: "The requested instant lies outside the period and was moved to the nearest one.",
  },
  ventanas: {
    documento: (nombre: string) => `Windows · ${nombre}`,
    titulo: (nombre: string, periodo: string) => `Light windows at ${nombre} in ${periodo}`,
    energia: "Power",
    energiaDetalle: "Hours with the Sun above the horizon",
    comunicacion: "Communication",
    comunicacionDetalle: "Hours with the Earth above the horizon",
    deHoras: (h: string, total: string) => `${h} of ${total}`,
    frenteMedia: (n: number, media: string, puntos: string, signo: number) =>
      `Average of the ${n} sites: ${media.replace(" ", " ")}${signo === 0 ? " (same)" : ` · ${puntos} points ${signo > 0 ? "above" : "below"}`}`,
    relato: {
      sol: (dias: string, sin: string, todo: boolean, nada: boolean) =>
        nada ? "No Sun in the whole period: the lander would need batteries or another power source."
          : todo ? `Equal to ${dias} days of light in a row: there is no night in this period.`
          : `Equal to ${dias} days of light. That leaves ${sin} in the dark: that stretch needs batteries or another source.`,
      tierra: (dias: string, sin: string, todo: boolean, nada: boolean) =>
        nada ? "The Earth never shows in this period: without a relay satellite there is no direct communication."
          : todo ? "The Earth is always in view: a direct link for the whole period."
          : `Equal to ${dias} days of direct link. That leaves ${sin} with no line to Earth: it takes a relay, or waiting.`,
    },
    banda: (sol: string, tierra: string) => `Light bands for the period: Sun above the horizon ${sol}; Earth above the horizon ${tierra}.`,
    sinSol: "No Sun above the horizon in the whole period.",
    global: (nivel: string) => `Overall: ${nivel}`,
    masMetricas: "More metrics",
    solMax: "Maximum height of the Sun",
    campos: { horas_sol: "hours of sunlight", pct_sol: "% of sunlight", sol_el_max_deg: "maximum height", sol_el_media_deg: "mean height", horas_tierra_visible: "hours of Earth", pct_tierra: "% of Earth" } as Record<string, string>,
    solMedia: "Mean height of the Sun (while up)",
    sinMedia: "no hours of sunlight",
    origen: "Where the figures come from",
    origenes: { calculado: "Recomputed by the API from the ephemeris", ejemplo: "Computed in the browser from the sample data", horizons_en_vivo: "Computed by the API from the live JPL Horizons query" },
    referencia: "Reference metricas.csv",
    coincide: "matches",
    noCoincide: "does not match",
    sinReferencia: "there is no reference row for this range",
    diferencia: (campo: string, calculado: string, referencia: string) => `${campo}: ${calculado} computed against ${referencia} in the reference`,
    rango: "Date range",
    desde: "From",
    hasta: "To",
    aplicar: "Apply range",
    mesCompleto: "Whole month",
    semana: (n: number) => `Week ${n}`,
    atajos: "Range shortcuts",
    errorOrden: "“To” must be later than “From”.",
    errorMaximo: (dias: number) => `The maximum range is ${dias} days.`,
    errorFormato: "Enter a complete date and time.",
    errorCobertura: (desde: string, hasta: string) => `There is only data between ${desde} and ${hasta} (UTC).`,
    cargando: "Computing windows…",
  },
  carga: {
    titulo: "Upload data",
    pasos: { elegir: "Step 1 of 3 · Choose", validando: "Step 2 of 3 · Validate", revisar: "Step 3 of 3 · Review", guardando: "Step 3 of 3 · Save", hecho: "Done" },
    zona: "Drag one or more CSV files here, or",
    elegir: "choose files",
    zonaMovil: "Choose files",
    limites: (mb: number, n: number) => `.csv only · up to ${mb} MB per file · up to ${n} files`,
    nombres: "Accepted names: sites.csv, efemerides_<id>.csv and metricas.csv.",
    tipos: { sites: "Sites", efemerides: "Ephemeris", metricas: "Metrics" },
    nombreNoReconocido: "Name not recognised: use sites.csv, efemerides_<id>.csv or metricas.csv",
    noEsCsv: "Not a .csv file",
    demasiadoGrande: (mb: number) => `Over the ${mb} MB limit`,
    vacio: "The file is empty",
    demasiados: (n: number) => `Only ${n} files are accepted per upload. The extra ones were not added.`,
    repetido: (nombre: string) => `${nombre} was already in the list`,
    quitar: (nombre: string) => `Remove ${nombre}`,
    lista: "Chosen files",
    validar: (n: number) => `Validate ${n}`,
    validando: (i: number, n: number) => `Validating ${i} of ${n}…`,
    validandoFila: "Validating…",
    guardandoFila: "Saving…",
    guardar: (n: number) => `Save ${n}`,
    guardando: (i: number, n: number) => `Saving ${i} of ${n}…`,
    anterior: "Back",
    listo: "Done",
    revisarNoGuardados: "Review the ones not saved",
    estados: { valido: "Valid", advertencias: "With warnings", errores: "With errors", guardado: "Saved", no_guardado: "Not saved" },
    resumen: (guardar: number, errores: number) => `${guardar} will be saved${errores ? ` · ${errores} with errors` : ""}`,
    resultadoValidacion: (validos: number, errores: number) => `Validation finished: ${validos} valid, ${errores} with errors`,
    exito: "Data uploaded successfully",
    detalleExito: (guardados: number, no: number) =>
      `${guardados} ${plural(guardados, "file saved", "files saved")}${no ? ` · ${no} not saved` : ""}`,
    ningunoGuardado: "No file was saved. Check the errors.",
    errorRed: "Could not reach the server. Nothing was lost: you can retry.",
    clave: "Upload key",
    claveAyuda: "The API asks for it while there is no sign-in. It is kept only in this tab.",
    claveInvalida: "Invalid key",
    verErrores: (n: number) => `see all ${n} errors`,
    verMenos: "see fewer",
    limiteServidor: (mostrados: number, total: number) => `The server returns the first ${mostrados} of ${total}.`,
    detalle: (nombre: string) => `See the details of ${nombre}`,
    columnas: ["Line", "Column", "Message"],
    notaLinea: "File line: the header is line 1, so line 13 is data row 12.",
    errores: "Errors",
    advertencias: "Warnings",
    archivo: "file",
    filas: (n: number) => `${n} ${plural(n, "row", "rows")}`,
    nErrores: (n: number) => `${n} ${plural(n, "error", "errors")}`,
    nAdvertencias: (n: number) => `${n} ${plural(n, "warning", "warnings")}`,
  },
  comparar: {
    documento: "Compare",
    rotulo: "Compare",
    titulo: (periodo: string) => `Same period, different destinations · ${periodo}`,
    tituloFechas: (nombre: string) => `Same site, different dates · ${nombre}`,
    tituloElegir: "Choose what to compare",
    modo: "What to compare",
    modoSitios: "Sites",
    modoFechas: "Dates",
    elegirSitios: (min: number, max: number) => `Choose ${min} to ${max} sites`,
    elegirMeses: (min: number, max: number) => `Choose ${min} to ${max} months`,
    sitio: "Site",
    sugerida: "Suggested comparison: the pole, almost the pole and the equator.",
    maximo: (max: number) => `Only ${max} can be compared at a time. Remove one to add another.`,
    comparar: (n: number) => `Compare ${n}`,
    cambiar: "Change selection",
    grafico: "Stacked horizons. With focus here, the arrow keys move the shared cursor 1 hour (with Shift, 1 day).",
    hora: (n: number) => `hour ${n} of the period`,
    menosDia: "Move the cursor 1 day back",
    masDia: "Move the cursor 1 day forward",
    tabla: "See as a table",
    tablaTitulo: "Metrics for each row of the comparison",
    metrica: "Metric",
    filas: { horas_sol: "Hours of sunlight", pct_sol: "% of hours with Sun", sol_el_max_deg: "Maximum height of the Sun", horas_tierra_visible: "Hours with the Earth in view", pct_tierra: "% of hours with the Earth", energia: "Power", comunicacion: "Communication", global: "Overall viability" },
    mejor: "best",
    veredicto: "Verdict",
    diferencias: "The difference, in figures",
    frenteAlMejor: (rival: string) => `against ${rival}`,
    frenteADos: (sol: string, tierra: string) => `sunlight against ${sol}; Earth against ${tierra}`,
    recomendada: "Most solid option",
    mismoInstante: (n: number) => `The same instant on ${n} horizons`,
    mismoInstanteAyuda: "A single time control moves every horizon at once.",
    horizonteDe: (nombre: string) => `Horizon of ${nombre}`,
    instante: "Instant",
    tiempo: "Instant of the comparison",
    reproducir: "Play the horizons",
    pausar: "Pause the horizons",
    bajo: "below the horizon",
    actualizando: "Updating the comparison…",
    verCielo: (nombre: string) => `Open the sky of ${nombre} at this instant`,
    verSitio: (nombre: string) => `See the windows at ${nombre}`,
    cargando: "Comparing…",
    // Longest consecutive hours (astronaut indicators) and their operational reading.
    // Site ranking (Top 5): the criterion is stated in one line and each row reads at a glance.
    top: {
      titulo: (n: number, periodo: string) => `Where to land · Top ${n} for ${periodo}`,
      criterio: "Order: power and comms verdict first; on a tie, more consecutive hours with Sun and Earth both up.",
      lista: (n: number) => `Ranking of the top ${n} sites`,
      zona: "Sites in the ranking",
      todos: "All",
      polarSur: "South polar region",
      polarSurAyuda: (grados: string) => `Latitude ${grados} S or further south.`,
      puesto: (n: number) => `Rank ${n}`,
      decisiva: "in a row with Sun and Earth both up",
      decisivaLeida: (valor: string) => `You get Sun and Earth together for ${valor} in a row`,
      sinVentana: "No window data",
      // What the decisive figure is compared with: "14 h more than Chandrayaan-3 (rank 2)".
      frente: (dif: number, valor: string, rival: string, puesto: number) =>
        dif === 0 ? `Same as ${rival} (rank ${puesto})` : `${valor} ${dif > 0 ? "more" : "less"} than ${rival} (rank ${puesto})`,
      elegir: (nombre: string) => `Open the detail for ${nombre}`,
      quitar: (nombre: string) => `Remove ${nombre} from the detail`,
      enDetalle: "In the detail",
      tocar: "Tap a site to see its horizon. Up to 3 at once.",
      elegidos: (n: number, max: number) => `${n} of ${max} in the detail`,
      irAlDetalle: "See the detail",
      sinPolares: "No site in the catalogue is in the south polar region.",
      detalle: "Detail",
      detalleDe: (nombres: string) => `Horizon of ${nombres}`,
      planear: "Plan landing",
      planearDe: (nombre: string) => `Plan the landing at ${nombre}`,
      sitio: "Site",
      insignia: (nombre: string) => `${nombre} mission insignia`,
      creditoInsignia: "Insignia: NASA",
      avalInsignias: "Mission insignias: NASA, unmodified. NASA does not endorse this project.",
    },
    podio: {
      sensible: "Terrain-sensitive",
      sinDato: "No data",
      alMenos: (valor: string) => `≥ ${valor}`,
      alMenosLeido: (valor: string) => `at least ${valor}`,
      ahora: (sol: number, tierra: number, n: number) => `Right now: ${sol} of ${n} with Sun · ${tierra} of ${n} with Earth`,
      mision: "What it means for your mission",
      rachas: {
        noche_mas_larga: "Longest night",
        apagon_tierra_mas_largo: "Longest Earth blackout",
        ventana_sol_y_tierra: "Sun + Earth window",
      },
      definiciones: {
        noche_mas_larga: "Most consecutive hours with the Sun at or below 0° elevation.",
        apagon_tierra_mas_largo: "Most consecutive hours with Earth at or below 0° elevation: no direct line of sight.",
        ventana_sol_y_tierra: "Most consecutive hours with both Sun and Earth above the horizon.",
      },
      // Sentences from docs/datos/indicadores-astronauta.md (§4). `borde`: the run started earlier or the period is not a calendar month.
      frases: {
        noche_mas_larga: {
          normal: (f: FraseRacha) => `Up to ${f.horas} in a row without Sun at ${f.sitio} (${f.mes}). Size the battery to cover that night.`,
          cero: (f: FraseRacha) => `No night in ${f.mes}: the Sun stays above the ideal horizon. Terrain could still block it.`,
          sigue: (f: FraseRacha) => `At least ${f.horas} without Sun; the night continues into next month. Size the battery for more than ${f.horas}.`,
          borde: (f: FraseRacha) => `At least ${f.horas} without Sun; the night extends beyond ${f.mes}. Size the battery for more than ${f.horas}.`,
          todo: (f: FraseRacha) => `No Sun for all of ${f.mes} (${f.horas}); it may continue afterwards. No solar power in this period.`,
        },
        apagon_tierra_mas_largo: {
          normal: (f: FraseRacha) => `Up to ${f.horas} in a row without Earth in view at ${f.sitio} (${f.mes}). Size the relay or onboard data storage.`,
          cero: (f: FraseRacha) => `Earth never sets in ${f.mes}: direct line of sight all period with an ideal horizon. Terrain could still cut it.`,
          sigue: (f: FraseRacha) => `At least ${f.horas} without Earth in view; the blackout continues into next month. Size relay or storage for more.`,
          borde: (f: FraseRacha) => `At least ${f.horas} without Earth in view; the blackout extends beyond ${f.mes}. Size relay or storage for more.`,
          todo: (f: FraseRacha) => `Earth is not in view for all of ${f.mes} (${f.horas}). No direct link: communications depend on a relay.`,
        },
        ventana_sol_y_tierra: {
          normal: (f: FraseRacha) => `Up to ${f.horas} in a row with Sun and Earth both up: the best window for solar power plus a direct link.`,
          cero: (f: FraseRacha) => `In ${f.mes} Sun and Earth are never up together: no operation with solar power and a direct link at once.`,
          sigue: (f: FraseRacha) => `At least ${f.horas} with Sun and Earth both up; the window continues into next month.`,
          borde: (f: FraseRacha) => `At least ${f.horas} with Sun and Earth both up; the window extends beyond ${f.mes}.`,
          todo: (f: FraseRacha) => `Sun and Earth both above the horizon all of ${f.mes} (${f.horas}): one continuous window for the period.`,
        },
      },
      avisoRachas: "Ideal horizon: no terrain. Figures are ephemerides computed from JPL Horizons, not measurements; consecutive hours are multiples of 1 h.",
    },
  },
  diaLunar: {
    documento: (nombre: string) => `Lunar day · ${nombre}`,
    titulo: (nombre: string, periodo: string) => `The lunar day at ${nombre} in ${periodo}`,
    grafico: (periodo: string) => `Elevation of the Sun and the Earth throughout ${periodo}. The horizontal axis is the ideal horizon.`,
    rol: "lunar day timeline",
    duracion: (dias: string) => `Lunar day ≈ ${dias} Earth days`,
    sinEventos: (astro: string, arriba: boolean, periodo: string) => `${mayuscula(astro)} ${arriba ? "does not set" : "does not rise"} in ${periodo}`,
    evento: (astro: string, tipo: "salida" | "puesta", cuando: string) => `${mayuscula(astro)} ${tipo === "salida" ? "rises" : "sets"} · ${cuando} UTC`,
    // The crossings of the period in one sentence: "Earth: rises on 2026-12-14 23:00; sets on 2026-12-27 02:00 UTC".
    resumen: (astro: string, cruces: { tipo: "salida" | "puesta"; cuando: string }[]) =>
      `${astro}: ${cruces.map((c) => `${c.tipo === "salida" ? "rises on" : "sets on"} ${c.cuando}`).join("; ")} UTC`,
    irAlCielo: "See this instant in the sky",
    tabla: "See the daily table",
    tablaTitulo: "Hours with Sun and with the Earth in view per day (UTC)",
    columnas: ["Day", "Hours of sunlight", "Hours with the Earth", "Sun maximum (°)"],
    noche: "solar night",
    cargando: "Plotting the lunar day…",
  },
  acceso: {
    documento: "Sign in",
    rotulo: "Team sign-in",
    titulo: "Sign in",
    texto: "The public app is read-only and needs no account. A session lets you upload data without a key and, with the administration role, manage the keys.",
    email: "Email",
    password: "Password",
    entrar: "Sign in",
    entrando: "Signing in…",
    faltan: "Enter your email and password.",
    errorCredenciales: { titulo: "Could not sign in", mensaje: "The email or the password is not correct.", sugerencia: "Check them and try again." },
    privacidad: "The password is not stored in this browser. The session lives in a cookie that the page's code cannot read.",
    sesionDe: (nombre: string, rol: string) => `Signed in as ${nombre} (${rol}).`,
    soloAdmin: "The key manager is only for the administration role.",
    claves: "Key manager",
    documentoSeguridad: "Security plan: OAuth 2.0 and post-quantum cryptography",
    mostrarPassword: "Show password",
    bloqMayus: "Caps Lock is on.",
    seguridad: "Protected session · ML-KEM-1024 post-quantum keys",
    sesionIniciada: "Signed in",
    rol: "Role",
    huellas: "Public fingerprints of your keys",
    escena: "Illustration: the Earth rising over the lunar horizon. It does not represent data.",
  },
  sesion: {
    menu: (nombre: string) => `Account of ${nombre}`,
    perfil: "My profile",
    cerrar: "Sign out",
    roles: { analista: "Analyst", revisor: "Reviewer", admin: "Administration" },
  },
  perfil: {
    documento: "My profile",
    rotulo: "Account",
    rol: "Role",
    huellas: "Fingerprints of your post-quantum keys",
    explicacion: "A fingerprint is a public digest of a public key: it lets anyone check that a key is yours. A private key is never shown or stored here.",
    algoritmos: {
      "ML-KEM-1024": "Encryption. Protects what is sent to you encrypted, even against quantum computers.",
      "ML-DSA-65": "Signature. Proves that an upload or a manifest came from you and was not altered.",
    } as Record<string, string>,
    sinHuellas: "Your account has no post-quantum keys issued yet.",
  },
  claves: {
    documento: "Key manager",
    rotulo: "Administration",
    titulo: "Post-quantum key manager",
    entrada: "Each user has two pairs: ML-KEM-1024 to encrypt and ML-DSA-65 to sign. The private key is handed over only once and the server does not keep it: if it is lost, it is revoked and a new one is issued.",
    contadores: { pares: "Key pairs", activas: "Active", revocadas: "Revoked", pqc: "Post-quantum" },
    ejemplo: "Sample data: the key manager API is not responding. The rows below are fictitious and only show what the screen will look like; no action reaches the server.",
    pedirClave: "Administration key",
    pedirClaveAyuda: "It is different from the upload key. It is kept only in this tab.",
    entrar: "Enter",
    cambiarClave: "Change administration key",
    filtros: "Filters",
    estado: "Status",
    estados: { todas: "All", activa: "Active", revocada: "Revoked" },
    tipo: "Type",
    tipos: { todos: "All", kem: "Encryption (KEM)", firma: "Signature" },
    buscar: "Search by email or name",
    tabla: "Issued keys",
    columnas: ["Status", "User", "Created (UTC)", "Algorithm", "Sizes", "SHA3-256 fingerprint", "Backups", "Actions"],
    estadoClave: { activa: "Active", revocada: "Revoked" },
    tamanos: (pub: number, priv: number) => `public ${pub} B · private ${priv} B`,
    vacia: "No keys match these filters.",
    generar: "Generate pair",
    descargarPublica: (quien: string) => `Download the public key of ${quien}`,
    rotar: (quien: string) => `Rotate the key of ${quien}`,
    revocar: (quien: string) => `Revoke the key of ${quien}`,
    formGenerar: { titulo: "Generate keys", paso: "Step 1 of 2 · User", usuario: "User identifier (UUID)", usuarioAyuda: "Lowercase UUID with hyphens.", usuarioError: "Not a valid UUID.", tipos: "Which pairs to generate", accion: "Generate" },
    entrega: {
      paso: "Step 2 of 2 · One-time handover",
      titulo: "Save the private key now",
      aviso: "This is the only time it is shown. The server does not keep it and nobody can recover it, not even the administrator. If it is lost, the pair must be revoked and a new one issued.",
      descargar: (archivo: string) => `Download ${archivo}`,
      descargada: "Downloaded",
      confirmo: "I have downloaded the private keys and stored them somewhere safe.",
      listo: "Done",
      hecho: "Keys handed over",
      detalle: (n: number) => `${n} ${plural(n, "pair issued", "pairs issued")}. The private key is no longer on this page.`,
    },
    confirmarRotar: { titulo: "Rotate key", texto: "This key is revoked and a new pair of the same type is issued. The new private key is handed over only once, next.", motivo: "Reason (optional)", accion: "Rotate and issue" },
    confirmarRevocar: { titulo: "Revoke key", texto: "The key stops being valid. It stays in the list and its public key can still be downloaded. This cannot be undone.", motivo: "Reason for revoking", motivoAyuda: (min: number, max: number) => `Between ${min} and ${max} characters.`, accion: "Revoke" },
    confirmarPublica: { titulo: "Download public key", texto: "The PEM file of the public key will be downloaded. It is public information: it can be shared.", accion: "Download" },
    error: "The action could not be completed.",
    revocadaEl: (fecha: string, motivo: string | null) => `Revoked on ${fecha}${motivo ? ` · ${motivo}` : ""}`,
  },
  noEncontrado: {
    documento: "Off the map",
    rotulo: "Error 404",
    titulo: "Off the map",
    texto: "This route does not exist on our lunar map.",
    volver: "Back to Sites",
  },
  // Primitives of the «Lujo inmersivo» redesign (src/components/lujo).
  alunizaje: {
    documento: (sitio: string) => `Landing window · ${sitio}`,
    rotulo: "Landing window",
    titulo: (sitio: string) => `When to land at ${sitio}?`,
    acceso: "Plan a landing",
    sitio: "Site",
    estancia: "Length of stay",
    estancias: { "72": "3 days", "156": "6.5 days", "336": "14 days" },
    estanciaCorta: { "72": "3 d", "156": "6.5 d", "336": "14 d" },
    referencia: "reference",
    notaReferencia: "6.5 days is this tool's reference stay.",
    cargando: "Working out landing windows…",
    mejor: {
      rotulo: "Best window",
      llega: (dia: string, hora: string) => `Arrive on ${dia} at ${hora} UTC`,
      sale: (dia: string, hora: string) => `Departure: ${dia}, ${hora} UTC`,
      enLima: (dia: string, hora: string) => `${dia}, ${hora}`,
      conSolYTierra: "with Sun and Earth at once",
      deEstancia: (pct: string, estancia: string) => `${pct} of a ${estancia} stay`,
      empate: "First of several equivalent windows",
      empateCalendario: "The others are on the heat calendar.",
      sinVentana: "No window with Sun and a direct link to Earth in this period",
      sinVentanaDetalle: "No arrival date gives hours with the Sun and the Earth above the horizon at once. A link to Earth would need a relay satellite.",
      sinEvaluadas: "No windows were evaluated for this stay",
      sinEvaluadasDetalle: "The stay does not fit in the loaded data. Try a shorter stay.",
      verCielo: "See the sky on arrival",
      relieve: (nota: string) => `* Grazing Sun, ${nota}: with real terrain there may be fewer hours than calculated.`,
    },
    alLlegar: {
      titulo: "Sun and Earth on arrival?",
      sol: { si: "Sun on arrival", no: "No Sun on arrival" },
      tierra: { si: "Earth on arrival", no: "No Earth on arrival" },
    },
    riesgo: {
      sinEnlace: (horas: string) => `No link to Earth for ${horas} in a row`,
      todaLaEstancia: (horas: string) => `No link to Earth for the whole stay (≥ ${horas})`,
      enlaceContinuo: "Link to Earth for the whole stay",
    },
    alternativas: {
      titulo: "Alternatives",
      item: (dia: string, hora: string) => `${dia}, ${hora} UTC`,
      elegir: (dia: string, hora: string, horas: string) => `Show on the calendar the arrival on ${dia}, ${hora} UTC: ${horas} with Sun and Earth`,
    },
    calendario: {
      titulo: "Arrival calendar",
      ayuda: "Each day says how much of the stay would have Sun and Earth at once if you arrive at that day's best hour. Tap a day to see the stay.",
      meses: "Month",
      mes: (mes: string, max: string) => `${mes}: up to ${max}`,
      mesSinDatos: (mes: string) => `${mes}: no data`,
      rejilla: (mes: string) => `Arrival dates in ${mes}. Arrow keys move between days, Page Up and Page Down change month, Enter selects.`,
      celda: (dia: string, pct: string, horas: string, hora: string) => `${dia}: ${pct} of the stay with Sun and Earth (${horas}), arriving at ${hora} UTC`,
      celdaMejor: "Best window",
      celdaSinDatos: (dia: string) => `${dia}: no data, the stay does not fit in the period`,
      leyenda: "% of the stay with Sun and Earth at once",
      escalones: ["0%", "under 25%", "25 to 50%", "50 to 75%", "75% or more"],
      mejorMarca: "best window",
      tabla: "Show the month as a table",
      tablaTitulo: (mes: string) => `Arrivals in ${mes}`,
      columnas: { dia: "Arrival day", hora: "Best hour (UTC)", horas: "Hours with Sun and Earth", pct: "% of the stay" },
      sinDatos: "no data",
    },
    detalle: {
      titulo: (dia: string, hora: string) => `If you arrive on ${dia} at ${hora} UTC`,
      resumen: (horas: string, pct: string) => `${horas} with Sun and Earth at once (${pct} of the stay)`,
      banda: (desde: string, hasta: string) => `Sun and Earth above the horizon during the stay, from ${desde} to ${hasta} UTC.`,
      cargando: "Loading the stay…",
      elige: "Tap a day on the calendar to see the stay on the timeline.",
      verCielo: "See the sky at that moment",
    },
    notas: {
      datos: "Data: six months of hourly ephemerides (December 2026 to May 2027).",
      descartadas: (n: string) => `${n} arrival hours at the end of the period were not evaluated: their stay runs past the data.`,
    },
    noDisponible: {
      titulo: "The landing window is not available yet",
      texto: "The server does not offer this calculation yet. No sample data is shown.",
    },
    puntoPropio: "The landing window is only worked out for catalogue sites.",
  },
  lujo: {
    sinDato: "No data",
    medidor: {
      lectura: (valor: string, nivel: string) => `${valor} · ${nivel}`,
      umbralesMayor: (reservas: string, viable: string) => `With reservations from ${reservas}; viable from ${viable}.`,
      umbralesMenor: (viable: string, reservas: string) => `Viable up to ${viable}; with reservations up to ${reservas}.`,
    },
    sello: {
      rotulo: "Certificate of provenance",
      estados: { conforme: "Verified", invalida: "Invalid signature", sinConfirmar: "Not verified" },
      firma: "ML-DSA-65 signature",
      sinManifiesto: "There is no signed manifest for this file.",
      manifiestoAjeno: "The signed manifest does not correspond to this file.",
      copiar: "Copy the full fingerprint",
      copiado: "Fingerprint copied",
    },
  },
  errores: {
    sinConexion: { titulo: "No connection to the server", mensaje: "We could not reach the data server.", sugerencia: "Check your connection and try again." },
    inesperado: { titulo: "Something did not go as expected", mensaje: "The application ran into a problem showing this data.", sugerencia: "Try again; if it happens again, reload the page." },
    acciones: { reintentar: "Retry", clave: "Enter key", sitios: "Choose another site", mesAnterior: "Previous month", ultimoMes: (mes: string) => `Go to ${mes}` },
    mesSinDatos: { titulo: "No data for that month", mensaje: "That period lies outside the available data.", sugerencia: "Choose another month." },
    seguimiento: "Tracking code",
    copiar: "Copy",
    copiado: "Copied",
    generico: "Something did not go as expected.",
    sinServicio: "The data is not available right now.",
    sitioDesconocido: "We do not know this site.",
    sinEfemerides: "This site has no ephemeris loaded.",
    sinDatosRango: "There is no data in the requested range.",
    fueraDeDatos: (param: string) => `'${param}' is outside the available data range`,
    rangoOrden: "'to' must be later than 'from'",
    rangoMaximo: `The maximum range is ${DATOS.RANGO_MAX_DIAS} days.`,
  },
};

/** Suggestion for a 429 when the response says how long to wait (Retry-After header). */
export const esperaYReintenta = (valor: number, unidad: "s" | "min"): string => `Wait ${valor} ${unidad} and retry.`;
/** Base catalogue by status; the codes are the backend's and are how its Spanish messages get translated. */
export const ERRORES_POR_ESTADO: Record<number, { codigo: string; titulo: string; mensaje: string; accion: string }> = {
  400: { codigo: "PETICION_INVALIDA", titulo: "Invalid request", mensaje: "The server could not understand what it was asked.", accion: "Check the data you sent." },
  401: { codigo: "NO_AUTORIZADO", titulo: "Authorisation needed", mensaje: "This action needs a valid key.", accion: "Enter a valid key." },
  403: { codigo: "PROHIBIDO", titulo: "No permission", mensaje: "The key provided does not allow this action.", accion: "Use a key with permission for this action." },
  404: { codigo: "NO_ENCONTRADO", titulo: "Not found", mensaje: "We could not find what you were looking for.", accion: "Check the address or choose a site from the catalogue." },
  405: { codigo: "METODO_NO_PERMITIDO", titulo: "Method not allowed", mensaje: "This operation is not available here.", accion: "Go back and try it from the right screen." },
  409: { codigo: "CONFLICTO", titulo: "Conflict", mensaje: "The data changed in the meantime.", accion: "Reload and try again." },
  413: { codigo: "ARCHIVO_DEMASIADO_GRANDE", titulo: "File too large", mensaje: "The file is over the allowed size.", accion: "Up to 5 MB and 10,000 rows; split the file." },
  415: { codigo: "TIPO_NO_SOPORTADO", titulo: "Unsupported file type", mensaje: "The file is not in a format we can read.", accion: "Upload a .csv file in UTF-8." },
  422: { codigo: "DATOS_INVALIDOS", titulo: "Invalid data", mensaje: "Some data is not in the expected format or range.", accion: "Fix the fields indicated and try again." },
  429: { codigo: "DEMASIADAS_PETICIONES", titulo: "Too many requests", mensaje: "Too many requests were made in a short time.", accion: "Wait a few seconds and retry." },
  500: { codigo: "ERROR_INTERNO", titulo: "Unexpected error", mensaje: "The server had a problem responding.", accion: "Retry; if it persists, share the tracking code." },
  502: { codigo: "SERVICIO_EXTERNO_FALLO", titulo: "An external service failed", mensaje: "A service we depend on did not respond properly.", accion: "Retry in a few minutes." },
  503: { codigo: "SERVICIO_NO_DISPONIBLE", titulo: "Service unavailable", mensaje: "The data service is not available right now.", accion: "Retry in a few minutes." },
  504: { codigo: "TIEMPO_AGOTADO", titulo: "Timed out", mensaje: "The server took too long to respond.", accion: "Narrow the date range or retry." },
};

/** Domain codes: more specific than their status. The backend sends them in Spanish; here is their English. */
export const ERRORES_DE_DOMINIO: Record<string, { titulo: string; mensaje: string; accion: string }> = {
  SITIO_NO_ENCONTRADO: { titulo: "Site not found", mensaje: "There is no site with that identifier.", accion: "Check the identifier or choose a site from the catalogue." },
  EFEMERIDES_NO_ENCONTRADAS: { titulo: "No ephemeris", mensaje: "This site has no ephemeris loaded.", accion: "Choose another site or upload its ephemeris." },
  MANIFIESTO_NO_GENERADO: { titulo: "No manifest yet", mensaje: "No manifest of the data has been signed yet.", accion: "It is generated with the first valid upload; try again later." },
  TIPO_DATOS_DESCONOCIDO: { titulo: "Unknown data type", mensaje: "That type of data does not exist.", accion: "Use sites, efemerides or metricas." },
  USUARIO_NO_ENCONTRADO: { titulo: "User not found", mensaje: "That user does not exist.", accion: "Check the user identifier." },
  CLAVE_NO_ENCONTRADA: { titulo: "Key not found", mensaje: "That key does not exist.", accion: "Check the key identifier." },
  CLAVE_INVALIDA: { titulo: "Invalid or missing key", mensaje: "The access key is not valid or was not sent.", accion: "Enter a valid access key." },
  RANGO_FECHAS_INVALIDO: { titulo: "Invalid date range", mensaje: "The dates requested are not valid or lie outside the available data.", accion: "Use UTC dates in the format YYYY-MM-DDTHH:MMZ, with the end date later than the start date." },
  VARIABLE_INVALIDA: { titulo: "Invalid variable", mensaje: "That variable cannot be queried.", accion: "Choose the elevation or the azimuth of the Sun or the Earth." },
  RANGO_DEMASIADO_LARGO: { titulo: "Range too long", mensaje: "The range requested is longer than allowed.", accion: `Ask for a range of at most ${DATOS.RANGO_MAX_DIAS} days and query in sections.` },
  CSV_INVALIDO: { titulo: "Invalid CSV", mensaje: "The file has rows that cannot be saved.", accion: "Check the lines marked in the report and upload it again." },
  DATOS_NO_DISPONIBLES: { titulo: "Data unavailable", mensaje: "The data cannot be read right now.", accion: "Retry in a few minutes; if it persists, tell the team the tracking code." },
  BD_NO_DISPONIBLE: { titulo: "Database unavailable", mensaje: "The database is not responding or is not configured.", accion: "Retry in a few minutes; if it persists, tell the team the tracking code." },
  ALMACEN_NO_DISPONIBLE: { titulo: "Storage unavailable", mensaje: "The data storage could not be reached; nothing was saved.", accion: "Retry in a few minutes." },
  FIRMA_NO_DISPONIBLE: { titulo: "Signing unavailable", mensaje: "The post-quantum signature is not available; nothing was saved.", accion: "Tell the team the tracking code: the signing keys are missing." },
  CREDENCIALES_INVALIDAS: { titulo: "Could not sign in", mensaje: "The email or the password is not correct.", accion: "Check them and try again." },
  SESION_INVALIDA: { titulo: "Session expired", mensaje: "Your session is not valid or has expired.", accion: "Sign in again." },
  ROL_INSUFICIENTE: { titulo: "No permission", mensaje: "Your role does not allow this operation.", accion: "Use an account with the required role or ask an administrator for access." },
  ORIGEN_NO_PERMITIDO: { titulo: "Request not allowed", mensaje: "The request does not seem to come from the application.", accion: "Reload the page and try again." },
  DEMASIADOS_INTENTOS: { titulo: "Too many attempts", mensaje: "Too many sign-in attempts were made.", accion: "Wait a few minutes before trying again." },
  CLAVE_DUPLICADA: { titulo: "Key already active", mensaje: "There is already an active key for that user and type.", accion: "Revoke or rotate it instead of generating another." },
  CLAVE_YA_REVOCADA: { titulo: "Key already revoked", mensaje: "The key is already revoked.", accion: "There is no need to revoke it again; rotate it or generate a new one." },
  USUARIO_INACTIVO: { titulo: "User deactivated", mensaje: "The user is deactivated; no keys can be issued to them.", accion: "Activate the user before issuing keys." },
  PASO_HORAS_INVALIDO: { titulo: "Invalid step between points", mensaje: "The step between points you asked for is not allowed.", accion: "Choose a step within the allowed range." },
  DEMASIADOS_PUNTOS: { titulo: "Too many points", mensaje: "The range requested produces too many points to show.", accion: "Increase the step between points or shorten the date range." },
  FECHA_FUERA_DE_DATOS: { titulo: "Date outside the data", mensaje: "The date requested lies outside the period with data.", accion: "Choose a date within the period with data." },
  FECHA_ANTES_DE_LOS_DATOS: { titulo: "Date before the data", mensaje: "The start date is earlier than the first data available.", accion: "Choose a start date within the period with data." },
  FECHA_FUERA_DE_PROYECCION: { titulo: "Date too far ahead", mensaje: "The end date is too far from the data to be estimated.", accion: "Choose an end date closer to the last data point." },
  RANGO_SIN_DATOS: { titulo: "No data in that range", mensaje: "There is no data in the date range requested.", accion: "Try another date range." },
  ESTANCIA_INVALIDA: { titulo: "Invalid stay", mensaje: "The length of the stay is not one of the allowed values.", accion: "Choose a stay of 72, 156 or 336 hours." },
  SITIO_REQUERIDO: { titulo: "No site chosen", mensaje: "You did not indicate any site.", accion: "Choose at least one site." },
  COMPARACION_SITIOS_INVALIDA: { titulo: "Too many sites", mensaje: "Only a few sites can be compared at a time.", accion: "Reduce the selection of sites." },
  HORIZONS_FECHAS_FUERA_DE_RANGO: { titulo: "Dates out of range", mensaje: "The dates lie outside the period that can be queried live.", accion: "Choose dates within the allowed period." },
  HORIZONS_LIMITE: { titulo: "Too many queries", mensaje: "Too many live queries were made to NASA.", accion: "Wait a few seconds and try again." },
  HORIZONS_OCUPADO: { titulo: "Service busy", mensaje: "The live query service is busy.", accion: "Try again in a few seconds." },
  HORIZONS_TIEMPO_AGOTADO: { titulo: "NASA took too long", mensaje: "The NASA service took too long to respond.", accion: "Narrow the date range or try again in a few minutes." },
  HORIZONS_NO_DISPONIBLE: { titulo: "NASA service unavailable", mensaje: "The NASA service is not available right now.", accion: "Try again in a few minutes." },
  HORIZONS_RESPUESTA_INVALIDA: { titulo: "Unreadable response", mensaje: "NASA returned a response that could not be read.", accion: "Try again in a few minutes." },
  HORIZONS_RESULTADO_NO_VALIDO: { titulo: "Invalid result", mensaje: "NASA did not compute the position from the surface of the Moon.", accion: "Try other coordinates." },
  CARGA_EN_CONFLICTO: { titulo: "Another upload in progress", mensaje: "Another upload changed the data at the same time.", accion: "The current version was reloaded: upload the file again." },
  AUDITORIA_NO_DISPONIBLE: { titulo: "Audit log unavailable", mensaje: "The upload could not be recorded in the audit log; nothing was saved.", accion: "Try again in a few minutes." },
  CATALOGO_NO_DISPONIBLE: { titulo: "No site catalogue", mensaje: "No site catalogue has been loaded.", accion: "Upload the site catalogue or tell the team." },
  CATALOGO_INVALIDO: { titulo: "Invalid site catalogue", mensaje: "The site catalogue does not meet the data standard.", accion: "Fix it and upload it again." },
  EFEMERIDES_INVALIDAS: { titulo: "Invalid ephemeris", mensaje: "The ephemeris of this site does not meet the data standard.", accion: "Fix it and upload it again, or choose another site." },
  METRICAS_INVALIDAS: { titulo: "Invalid metrics", mensaje: "The metrics file does not meet the data standard.", accion: "Fix it and upload it again." },
  SIMULACION_NO_DISPONIBLE: { titulo: "Simulation unavailable", mensaje: "The simulation cannot estimate the uncertainty right now.", accion: "Tell the team the tracking code." },
};

const redondo = (v: number): string => numero(v, 0);

/** 'in 291 h' */
/**
 * The analysis API writes in Spanish. Its step names and descriptions are translated by `pasos[].id`, and each
 * measure by the name and the unit the API gives it. Anything not listed here is shown as the API sent it.
 * Only labels are translated: the figures are never touched.
 */
export const ANALISIS_API: TextosApiAnalisis = {
  pasos: {
    carga: { nombre: "Loading the file", descripcion: "The site's ephemeris CSV is read with the same safe reader the data upload uses." },
    validacion_csv: { nombre: "Checking the file", descripcion: "The file is checked against the CSV standard: header, types, ranges, dates in UTC, constant step and physical jumps." },
    features: { nombre: "Computing features with Polars", descripcion: "The windows of sunlight and of visible Earth, the hours of Sun per lunar day and the libration are measured." },
    fft: { nombre: "Searching for periodicities (FFT)", descripcion: "A Fourier transform looks for the rhythms in the series; the strongest is the synodic month, about 29.5 days long." },
    ajuste: {
      nombre: "Fitting the harmonic model",
      descripcion: "A sum of sines and cosines with the lunar periods is fitted. Its R² measures how much of this data it explains; it does not measure how well it does beyond them (validation measures that).",
    },
    // Rule 1: the validation is only presented as the site's own when it was made with this very data.
    validacion_horizons: {
      nombre: "Validation against Horizons",
      descripcion: {
        propia: "The model, trained only on this data, predicted 12 months that were then compared with those from JPL Horizons.",
        referencia: "These figures come from another validation: the model was trained on the project's seed data, not on yours. With your data, the model has not yet been compared with JPL Horizons.",
        ausente: "There is no validation against JPL Horizons for this site.",
      },
    },
    proyeccion: {
      nombre: "Projection",
      descripcion: {
        propia: "The model is extended beyond the last data point, with the uncertainty measured in that validation.",
        referencia: "The model is extended beyond the last data point. The uncertainty shown is for reference (from the validation with other data): with your data it may be larger.",
        ausente: "The model is extended beyond the last data point, but with no measured uncertainty for this site.",
      },
    },
  },
  medidas: {
    "Filas leídas": "Rows read",
    "Tamaño del archivo": "File size",
    "Rango cubierto": "Range covered",
    "Paso entre filas": "Step between rows",
    "Filas válidas": "Valid rows",
    "Filas con error": "Rows with errors",
    "Huecos de tiempo": "Time gaps",
    "Ventanas de Sol completas": "Complete Sun windows",
    "Duración media de una ventana de Sol": "Mean length of a Sun window",
    "Días lunares completos": "Complete lunar days",
    "Horas de Sol por día lunar (media)": "Hours of Sun per lunar day (mean)",
    "Oscilación de la Tierra en azimut": "Earth's swing in azimuth",
    "Oscilación de la Tierra en elevación": "Earth's swing in elevation",
    "Pico del mes sinódico (elevación del Sol)": "Synodic month peak (Sun elevation)",
    "Periodo del pico más fuerte": "Period of the strongest peak",
    "Amplitud relativa del pico más fuerte": "Relative amplitude of the strongest peak",
    "Resolución de la FFT en el mes sinódico": "FFT resolution at the synodic month",
    "Mes sinódico afinado": "Refined synodic month",
    "Términos del modelo (cos y sen)": "Model terms (cos and sin)",
    "R² medio del ajuste": "Mean R² of the fit",
    "RMSE medio del ajuste dentro de los datos": "Mean RMSE of the fit within the data",
    "RMSE de la elevación del Sol": "RMSE of the Sun's elevation",
    "RMSE del azimut de la Tierra": "RMSE of the Earth's azimuth",
    "Meses con el semáforo bien predicho": "Months with the traffic light predicted correctly",
    "Error medio de las puestas del Sol": "Mean error of the sunsets",
    "Validación vigente": "Validation made with this data",
    "Meses proyectables": "Months that can be projected",
    "Incertidumbre del mes 1 (elevación del Sol)": "Uncertainty in month 1 (Sun elevation)",
    "Incertidumbre del mes 12 (elevación del Sol)": "Uncertainty in month 12 (Sun elevation)",
  },
  unidades: { filas: "rows", "días": "days", meses: "months", "términos": "terms" },
};

export const enHoras = (h: number): string => `in ${horas(Math.round(h))}`;

export function proximoCambio(e: EventosAstro, periodo?: { desde: Utc; hasta: Utc }): string {
  const [verbo, negado, sustantivo] = e.visible ? ["sets", "does not set", "set"] : ["rises", "does not rise", "rise"];
  if (e.horas_restantes === null) return `${negado} within the period with data`;
  const cuando = e.visible ? e.proxima_puesta_utc : e.proxima_salida_utc;
  const fecha = cuando ? `${fechaHora(cuando)} ${T.utc}` : "";
  if (periodo && cuando && cuando >= periodo.hasta) {
    return `${negado} in ${periodoLegible(periodo.desde, periodo.hasta)} · next ${sustantivo}: ${fecha}`;
  }
  return `${verbo} ${enHoras(e.horas_restantes)} · ${fecha}`.trim();
}
/** Live text of the timeline: '9 h until the Sun sets'. */
export function faltanPara(astro: Astro, e: EventosAstro): string {
  if (e.horas_restantes === null) return `${NOMBRE_ASTRO[astro]}: ${T.sinCambio.toLowerCase()}`;
  const verbo = e.visible ? "sets" : "rises";
  if (e.horas_restantes <= 0) return `${mayuscula(ARTICULO_ASTRO[astro])} ${verbo} now`;
  return `${horas(Math.round(e.horas_restantes))} until ${ARTICULO_ASTRO[astro]} ${verbo}`;
}

const posicion = (el: number): string =>
  el > 0 ? `${grados(el, 1)} above the horizon` : `${grados(Math.abs(el), 1)} below the horizon`;

interface FilaCielo { sol_az_deg: number; sol_el_deg: number; tierra_az_deg: number; tierra_el_deg: number }
export function describirCielo(utc: Utc, fila: FilaCielo): string {
  return (
    `On ${fechaLarga(utc)}, the Sun is at ${redondo(fila.sol_az_deg)}° azimuth and ${posicion(fila.sol_el_deg)}; ` +
    `the Earth, at ${redondo(fila.tierra_az_deg)}° and ${posicion(fila.tierra_el_deg)}. ${T.avisoHorizonteCorto}`
  );
}
export function describirInstante(utc: Utc, fila: FilaCielo): string {
  return `${fechaLarga(utc)}. Sun ${posicion(fila.sol_el_deg)}; Earth ${posicion(fila.tierra_el_deg)}`;
}

export const horaLocal = (hora: string): string => `${hora} ${ZONA_HORARIA_LOCAL.NOMBRE}, ${ZONA_HORARIA_LOCAL.DESFASE}`;

export const SIN_LINEA_DIRECTA = "No direct line to Earth: it needs a relay satellite.";

const listar = (nombres: string[]): string =>
  nombres.length <= 1 ? (nombres[0] ?? "") : `${nombres.slice(0, -1).join(", ")} and ${nombres[nombres.length - 1]}`;
const frases = (...partes: string[]): string => partes.filter(Boolean).map((p) => `${mayuscula(p)}.`).join(" ");
const cautela = (filas: FilaVeredicto[]): string => {
  const sensibles = filas.filter((f) => f.sensible && f.horas_sol > 0).map((f) => f.nombre);
  return sensibles.length ? `note: the hours of sunlight at ${listar(sensibles)} are for the ideal horizon and depend on the terrain` : "";
};

const SIN_VEREDICTO: PartesVeredicto = { principal: "", matices: [] };
const partes = (principal: string, ...matices: string[]): PartesVeredicto => ({ principal: frases(principal), matices: matices.filter(Boolean).map((m) => frases(m)) });
const unido = (v: PartesVeredicto): string => [v.principal, ...v.matices].filter(Boolean).join(" ");

export const veredicto = (filas: FilaVeredicto[], periodo: string): string => unido(partesVeredicto(filas, periodo));
export function partesVeredicto(filas: FilaVeredicto[], periodo: string): PartesVeredicto {
  if (filas.length < 2) return SIN_VEREDICTO;
  const porSol = [...filas].sort((a, b) => b.horas_sol - a.horas_sol);
  const [mejor, ultimo] = [porSol[0], porSol[porSol.length - 1]];
  const dif = mejor.horas_sol - ultimo.horas_sol;
  const sol =
    dif === 0
      ? `${listar(filas.map((f) => f.nombre))} get the same hours of sunlight (${horas(mejor.horas_sol)}) in ${periodo}`
      : `${mejor.nombre} gets ${horas(dif)} more sunlight than ${ultimo.nombre} in ${periodo}`;

  const completos = filas.filter((f) => f.pct_tierra >= 100);
  const sinTierra = filas.filter((f) => f.horas_tierra_visible === 0);
  const parciales = filas.filter((f) => f.pct_tierra < 100 && f.horas_tierra_visible > 0);
  const tierra: string[] = [];
  if (completos.length) tierra.push(`${listar(completos.map((f) => f.nombre))} ${completos.length > 1 ? "see" : "sees"} the Earth for the whole period`);
  parciales.forEach((f) => tierra.push(`${f.nombre} sees it for ${horas(f.horas_tierra_visible)} (${pct(f.pct_tierra)})`));
  if (sinTierra.length) tierra.push(`${listar(sinTierra.map((f) => f.nombre))} ${sinTierra.length > 1 ? "do not see it" : "does not see it"} in the period`);
  return partes(sol, tierra.join("; "), cautela(filas));
}


const SIGNO_MENOS = "−";
const conSigno = (valor: number, texto: string): string => `${valor > 0 ? "+" : SIGNO_MENOS}${texto}`;
/** “+388 h of sunlight, but −61% of Earth”: what a row gains or loses against the best of the others. */
export function relatoDiferencia(d: Diferencia): string {
  const sol = d.sol_h === 0 ? "the same hours of sunlight" : `${conSigno(d.sol_h, horas(Math.abs(d.sol_h)))} of sunlight`;
  const tierra =
    d.tierra_h === 0 ? "the same view of the Earth"
      : `${conSigno(d.tierra_h, d.tierra_pct === null ? horas(Math.abs(d.tierra_h)) : pct(Math.round(Math.abs(d.tierra_pct))))} of Earth`;
  return `${sol}${d.sol_h * d.tierra_h < 0 ? ", but " : " and "}${tierra}`;
}
const nivelesDe = (l: LineaComparada): string => {
  const [energia, comunicacion] = [NOMBRE_NIVEL[l.semaforo.energia].toLowerCase(), NOMBRE_NIVEL[l.semaforo.comunicacion].toLowerCase()];
  return energia === comunicacion ? `${energia} for power and for communication` : `power ${energia} and communication ${comunicacion}`;
};
/** Verdict to decide between rows: which option is the most solid by the API traffic light and why, then what it costs. */
export function partesDecision(filas: LineaComparada[], contexto: string): PartesVeredicto {
  const d = decidir(filas);
  if (!d) return SIN_VEREDICTO;
  const nombre = (i: number) => filas[i].nombre;
  let principal: string;
  if (d.recomendadas.length === 1) {
    principal = `${nombre(d.recomendadas[0])} is the most solid option in ${contexto}: ${nivelesDe(filas[d.recomendadas[0]])}`;
  } else {
    const empatadas = `${listar(d.recomendadas.map(nombre))} tie on the traffic light in ${contexto}`;
    principal =
      d.liderSol === null && d.liderTierra === null ? `${empatadas} and on the figures`
        : d.liderSol === d.liderTierra ? `${empatadas}; ${nombre(d.liderSol!)} gets more sunlight and sees the Earth more`
          : `${empatadas}: ${[d.liderSol !== null && `${nombre(d.liderSol)} gets more sunlight`, d.liderTierra !== null && `${nombre(d.liderTierra)} sees the Earth more`].filter(Boolean).join(" and ")}`;
  }
  const contra = d.contrapartida === null ? "" : `${nombre(d.contrapartida)}: ${relatoDiferencia(diferencias(filas)[d.contrapartida])}`;
  return partes(principal, contra, cautela(filas));
}
export const veredictoFechas = (filas: FilaVeredicto[], sitio: string): string => unido(partesVeredictoFechas(filas, sitio));
export function partesVeredictoFechas(filas: FilaVeredicto[], sitio: string): PartesVeredicto {
  if (filas.length < 2) return SIN_VEREDICTO;
  const porSol = [...filas].sort((a, b) => b.horas_sol - a.horas_sol);
  const [mejor, ultimo] = [porSol[0], porSol[porSol.length - 1]];
  const dif = mejor.horas_sol - ultimo.horas_sol;
  const sol =
    dif === 0
      ? `at ${sitio} there are the same hours of sunlight (${horas(mejor.horas_sol)}) in ${listar(filas.map((f) => f.nombre))}`
      : `at ${sitio}, ${mejor.nombre} gets ${horas(dif)} more sunlight than ${ultimo.nombre}`;
  const tierra = `the Earth is in view for ${listar(filas.map((f) => `${horas(f.horas_tierra_visible)} in ${f.nombre}`))}`;
  return partes(sol, tierra, cautela(filas));
}

/** 'December 2026' if the range is a whole calendar month; otherwise '2026-12-01 → 2026-12-08'. */
export function periodoLegible(desde: Utc, hasta: Utc): string {
  return esMesCompleto(desde, hasta) ? mesLargo(desde) : `${soloFecha(desde)} → ${soloFecha(hasta)}`;
}
