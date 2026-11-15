// Cadenas de la interfaz y plantillas generadas a partir de datos, en español. La interfaz las lee a través de
// `textos.ts`, que elige este módulo o `textos.en.ts` según el idioma. Toda clave nueva va en los dos.
import { DATOS, MARCA, SEMAFORO, UMBRAL_RASANTE_DEG, ZONA_HORARIA_LOCAL } from "./constants";
import { diaDelMes, esMesCompleto, fechaHora, fechaLarga, mesLargo, soloFecha, soloHora } from "./fechas";
import { grados, horas, numero, pct } from "./formato";
import { decidir, diferencias, type Diferencia, type LineaComparada } from "./comparar";
import type { Astro, Categoria, EventosAstro, NivelSemaforo, Utc } from "./tipos";

export const NOMBRE_ASTRO: Record<Astro, string> = { sol: "Sol", tierra: "Tierra" };
export const ARTICULO_ASTRO: Record<Astro, string> = { sol: "el Sol", tierra: "la Tierra" };
export const DEL_ASTRO: Record<Astro, string> = { sol: "del Sol", tierra: "de la Tierra" };

export const NOMBRE_NIVEL: Record<NivelSemaforo, string> = { verde: "Viable", amarillo: "Con reservas", rojo: "Crítico" };
export const FORMA_NIVEL: Record<NivelSemaforo, string> = { verde: "círculo", amarillo: "triángulo", rojo: "cuadrado con aspa" };
export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  apolo: "Apolo", artemis: "Región polo sur", clps: "CLPS", internacional: "Internacional",
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
  marca: MARCA.NOMBRE,
  producto: "Sitios de alunizaje",
  // La misma frase que la <meta name="description"> de index.html.
  descripcion: "Compara sitios de alunizaje: dónde están el Sol y la Tierra sobre el horizonte, cuántas horas de energía y de enlace directo hay, y cuándo se ponen. Datos de JPL Horizons.",
  utc: "UTC",
  oeste: "O",
  config: {
    abrir: "Configuración",
    titulo: "Configuración",
    idioma: "Idioma",
    idiomas: { es: "Español", en: "English" },
    nota: "Las fechas y las cifras siguen el idioma elegido. La página se recarga al cambiarlo.",
    sinAlmacenamiento: "Este navegador no deja guardar la preferencia, así que aquí no se puede cambiar el idioma.",
    notaDatos: "Los nombres de los sitios, sus notas y los pasos del análisis vienen del conjunto de datos y se muestran en español en los dos idiomas.",
  },
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
    // Mismo texto que MSG_AVISO_RELIEVE del backend.
    avisoRelieve: `Sensible al relieve: el Sol no supera ${UMBRAL_RASANTE_DEG}° sobre el horizonte ideal, así que una colina puede taparlo y las horas de sol reales ser menores`,
  },
  banner: {
    texto: (fecha: string) =>
      `Mostrando una instantánea de los CSV del ${fecha} porque la API no responde. Las cifras son reales, pero pueden estar desactualizadas.`,
    corto: "Datos de ejemplo activos",
    cerrar: "Ocultar el aviso de datos de ejemplo",
  },
  reloj: { utcLargo: "Tiempo universal coordinado", rotulo: "UTC simulado", titulo: "Instante de la simulación (no es la hora actual)" },
  tiempo: {
    reproducir: "Reproducir",
    pausar: "Pausar",
    regla: "Instante",
    velocidad: "Velocidad",
    porSegundo: (h: number) => (h % 24 === 0 ? `${h / 24} d/s` : `${h} h/s`),
    reiniciar: "Volver al inicio del periodo",
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
    // El acento de color va solo en «el Sol». La frase vale para el mes del relato: con más meses de datos, el Sol
    // de Shackleton sí llega a ponerse (27/01/2027), así que no se afirma que no se ponga «nunca».
    titular: { antes: "En Shackleton, junto al polo\u00a0sur, ", acento: "el Sol", despues: " no se pone en diciembre: rueda por el horizonte." },
    apoyo: "Un cambio pequeño de lugar o de fecha puede decidir si un módulo tiene energía y línea directa con la Tierra. Compáralo en minutos.",
    // Relato con scroll en tres actos. Todas las cifras salen de hero-shackleton.json (CSV reales).
    actos: {
      progreso: "Actos del relato",
      ir: (n: number) => `Ir al acto ${n}`,
      uno: { rotulo: "Acto 1 · Centro de Shackleton, diciembre de 2026, horizonte ideal", kpi: "Horas con Sol en diciembre", contexto: (min: string, max: string) => `En diciembre el Sol no sube de ${max} ni baja de ${min}: da la vuelta al horizonte sin ponerse. El relieve real puede taparlo.` },
      dos: {
        rotulo: "Acto 2 · La exploración",
        titular: { antes: "Pero ", acento: "la Tierra", despues: " sí se esconde." },
        kpi: "Horas con enlace directo",
        contexto: (salida: string, puesta: string, sin: string) => `Sale el ${salida} y se pone el ${puesta} (UTC). El resto del mes, ${sin} sin línea directa con la Tierra.`,
      },
      tres: {
        rotulo: "Acto 3 · La decisión",
        titular: "Elige dónde aterrizar.",
        kpi: "Sitios para comparar",
        contexto: (puesta: string) => `Un cambio de lugar o de fecha lo cambia todo: el ${puesta} (UTC) el Sol de Shackleton también se pone. Compara energía y enlace antes de decidir.`,
      },
      de: (total: string) => `de ${total}`,
      // Día y hora de un cruce dentro de una frase del relato: «14/12 a las 23:00».
      momento: (utc: Utc) => `${diaDelMes(utc)}/${utc.slice(5, 7)} a las ${soloHora(utc)}`,
      sigue: "Desplázate para avanzar el mes",
    },
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
        `El eje de la Luna está inclinado solo ${inclinacion} respecto a la eclíptica, el plano de la órbita de la Tierra alrededor del Sol. Por eso, visto desde el polo, el Sol nunca se aleja del horizonte: da la vuelta completa en un día lunar, de unos 29,5 días terrestres, siempre rasante. Cualquier colina puede taparlo, y la Tierra asoma y se esconde por la libración.`,
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
      texto: "Las cifras salen de fuentes públicas de NASA y de cálculos reproducibles. Lo que no es dato de NASA está marcado: las proyecciones, los umbrales del semáforo y el relieve ilustrativo.",
      fuentes: [
        { nombre: "JPL Horizons", uso: "Posición del Sol y la Tierra (azimut y elevación), hora a hora", clave: "HORIZONS" },
        { nombre: "NSSDC", uso: "Coordenadas de los sitios Apolo", clave: "NSSDC" },
        { nombre: "LROC", uso: "Coordenadas de los alunizajes recientes y de Shackleton", clave: "LROC" },
        { nombre: "NASA/LRO", uso: "Coordenadas de IM-1 Odysseus", clave: "LRO" },
      ],
      periodo: (desde: string, hasta: string, generado: string) => `Periodo con datos: ${desde} a ${hasta} (UTC). Generados el ${generado}.`,
    },
    equipo: {
      // Sin nombres ni roles hasta que el equipo confirme sus datos (docs/entrega/equipo.md).
      titulo: "Apogeo Team",
      texto: "Proyecto para el NASA Space Apps Challenge 2026.",
      roles: [] as string[],
    },
    pie: {
      aviso: "NASA no respalda ni patrocina este proyecto ni a ninguna entidad, producto o servicio de terceros. Los datos provienen de fuentes públicas de NASA y de JPL.",
      autoria: "Apogeo Team · Anthony Chavesta Pisfil · NASA Space Apps Chiclayo 2026",
      licencia: "Código bajo licencia MIT © 2026 Apogeo Team.",
      repoFrontend: "Repositorio del frontend",
      repoBackend: "Repositorio del backend",
      acceso: "Acceso del equipo",
    },
  },
  sitios: {
    documento: "Sitios",
    rotulo: "Catálogo",
    titulo: "Diez sitios, vistos desde el polo sur",
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
  analisis: {
    documento: (sitio: string) => `Cómo analizamos los datos de ${sitio}`,
    rotulo: "Transparencia del análisis",
    titulo: "Cómo analizamos los datos",
    entrada: "Siete pasos, del archivo a la proyección. Cada cifra de esta página sale de los datos de este sitio; nada está escrito a mano.",
    cargando: "Calculando el análisis…",
    si: "sí",
    no: "no",
    enlace: "Cómo analizamos estos datos",
    enlaceProyeccion: "Cómo se calcula esta proyección",
    trasCarga: (fecha: string) => `Tus datos (${fecha}) alimentan este análisis.`,
    verAnalisis: "Ver el análisis",
    origen: {
      rotulo: "De dónde vienen los datos",
      semilla: { titulo: "Datos de NASA/JPL Horizons", texto: "El archivo es idéntico, byte a byte, al que el proyecto generó con JPL Horizons." },
      subido: {
        titulo: "Datos subidos por un usuario",
        texto: (fecha: string, quien: string) => `No son la semilla del proyecto. El archivo coincide con la última carga válida registrada: ${fecha}, con ${quien}.`,
        sinFecha: "No son la semilla del proyecto. El archivo coincide con la última carga válida registrada.",
      },
      modificado: { titulo: "Datos de origen sin confirmar", texto: "El archivo no coincide con la semilla del proyecto ni con ninguna carga registrada: cambió fuera de la aplicación." },
      sinRegistro: { titulo: "Origen sin registro", texto: "No hay semilla ni registro de cargas con los que comparar. Solo podemos dar la huella del archivo, no afirmar su procedencia." },
      quienNoConsta: "origen sin identificar",
      // Las tres únicas categorías de `cargado_por` que se muestran (nunca una identidad).
      quienes: { "clave de API": "clave de API", "usuario registrado": "usuario registrado", "anónimo": "anónimo" } as Record<string, string>,
      manifiesto: "Manifiesto",
      firma: { valida: "firmado (firma válida)", sinFirma: "sin firma válida", noVerificable: "firma no verificable" },
      huella: "Huella SHA3-256",
      archivo: "Archivo",
      filas: "Filas",
      rango: "Cubre",
      huecos: "Huecos",
      paso: "Paso",
    },
    pasos: {
      titulo: "El recorrido de los datos",
      estados: { ok: "Completado", advertencia: "Con reservas", no_disponible: "No disponible" } as Record<string, string>,
      paso: (n: number, total: number) => `Paso ${n} de ${total}`,
    },
    espectro: {
      titulo: "Qué ritmos hay en los datos",
      entrada: "Cada barra es un ritmo que se repite. Cuanto más alta, más pesa en el movimiento.",
      ejeX: "Periodo (días, escala logarítmica)",
      ejeY: "Peso relativo",
      sinodico: (dias: string) => `Mes sinódico: ${dias} d`,
      pico: (dias: string, peso: string) => `${dias} d · peso ${peso}`,
      alt: (nombre: string, n: number, mayor: string) => `Espectro de ${nombre}: ${n} ritmos detectados; el mayor se repite cada ${mayor} días.`,
      tabla: "Ver los ritmos en una tabla",
      columnas: ["Periodo (días)", "Peso relativo", "Coincide con"],
      ninguno: "ningún periodo lunar conocido",
      candidatos: { sinodico: "mes sinódico", anomalistico: "mes anomalístico", draconico: "mes dracónico", sideral: "mes sideral", tropico: "mes trópico" } as Record<string, string>,
    },
    modelo: {
      titulo: "Qué tan bien describe el modelo estos datos",
      r2: "Ajuste dentro de los datos (R²)",
      r2Nota: "El R² mide cuánto se parece el modelo a los datos que ya tiene. No dice cuánto acierta fuera de ellos: eso lo mide la validación.",
      residuo: (rmse: string) => `error típico ${rmse}`,
      terminos: (cuerpo: string, n: number) => `${cuerpo}: ${n} términos`,
    },
    validacion: {
      titulo: "Cuánto acierta fuera de los datos",
      rmse: "RMSE de validación (optimista; no es un intervalo)",
      propia: "Medido con estos mismos datos: el modelo predijo 12 meses que después se compararon con JPL Horizons.",
      referencia: "De referencia",
      referenciaNota: "Estas cifras se midieron con otros datos (la semilla del proyecto), no con los que hay cargados ahora. Sirven de referencia; no describen el acierto con tus datos.",
      ausente: "No hay validación de este sitio.",
      frenteIngenua: (veces: string) => `${veces} veces mejor que repetir el mes anterior`,
      semaforo: "Meses con el semáforo bien predicho",
      deMeses: (aciertos: number, meses: number) => `${aciertos} de ${meses}`,
      porMes: "Error según lo lejos que se proyecta",
      mes: (n: number) => `mes ${n}`,
    },
    serie: {
      titulo: "Lo observado, lo ajustado y lo proyectado",
      variable: "Variable",
      observado: "Observado (datos)",
      ajustado: "Ajustado (modelo, dentro de los datos)",
      proyectado: "Proyectado (estimación, fuera de los datos)",
      banda: (rmse: string) => `Banda: ± ${rmse}, el RMSE de validación (optimista; no es un intervalo)`,
      bandaReferencia: (rmse: string) => `Banda de referencia: ± ${rmse}, RMSE de validación medido con otros datos (optimista; no es un intervalo)`,
      finDatos: "fin de los datos",
      alt: (nombre: string, desde: string, fin: string, hasta: string) =>
        `${nombre}: datos observados y ajuste del modelo del ${desde} al ${fin}; proyección estadística desde entonces hasta el ${hasta}.`,
      tabla: "Ver la serie en una tabla",
      columnas: ["UTC", "Observado", "Ajustado", "Proyectado"],
      variables: { sol_el_deg: "Elevación del Sol", sol_az_deg: "Azimut del Sol", tierra_el_deg: "Elevación de la Tierra", tierra_az_deg: "Azimut de la Tierra" } as Record<string, string>,
    },
    limitaciones: { titulo: "Lo que este análisis no puede decir", otras: "Limitaciones que no afectan a este sitio" },
  },
  puntoPropio: {
    titulo: "Coordenadas propias",
    entrada: "Consulta el cielo de cualquier punto de la Luna, en vivo desde JPL Horizons.",
    lat: "Latitud",
    lon: "Longitud",
    ayudaLat: "De −90 a 90. Sur, negativo.",
    ayudaLon: "De −180 a 180. Este, positivo.",
    ver: "Ver el cielo de este punto",
    lectura: (coordenadas: string) => `Punto: ${coordenadas}`,
    errores: {
      numero: "Escribe un número, por ejemplo −89,66.",
      lat: "La latitud va de −90 a 90 (Sur, negativo).",
      lon: "La longitud va de −180 a 180 (Este, positivo).",
    },
    privacidad: "Las coordenadas viajan en la dirección de la página; no se guardan en este navegador.",
    nombre: "Punto personalizado",
    fuente: "JPL en vivo",
    marca: "Punto personalizado · JPL en vivo",
    cargando: "Consultando JPL Horizons…",
    cargandoNota: "La primera consulta de un punto puede tardar varios segundos; después sale de la caché.",
  },
  sitio: {
    pestanas: "Vistas del sitio",
    cielo: "Cielo",
    ventanas: "Ventanas",
    diaLunar: "Día lunar",
    analisis: "Análisis",
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
    pantallaCompleta: "Pantalla completa",
    salirPantallaCompleta: "Salir de pantalla completa",
    salir: "Salir",
    arrastra: "Arrastra el cielo para girar la mirada · arrastra el suelo para mover el tiempo",
    relieve: "Relieve ilustrativo. Las cifras son de horizonte ideal (sin relieve).",
    relieveCorto: "Relieve ilustrativo",
    tamanos: "Tamaños de los astros ampliados; la Tierra se ve unas 3,6 veces mayor que el Sol.",
    horizonteIdeal: "horizonte ideal",
    faseTierra: (pct: string) => `Tierra iluminada al ${pct}`,
    proyeccion: "Proyección",
    proyeccionSinApi: "Este mes queda más allá de los datos de Horizons. Solo se puede ver como proyección, y la API de simulación no responde.",
    proyeccionAviso: "Mes proyectado: no son datos de Horizons. Cada punto lleva su incertidumbre.",
    proyeccionNota: (g: string) => `Banda de ± ${g}, el doble del error típico.`,
    proyeccionSinBanda: "La incertidumbre de este punto no es acotable.",
    azimutPocoFiable: (astro: Astro) => `El azimut ${astro === "sol" ? "del Sol" : "de la Tierra"} es poco fiable aquí: tan cerca del cénit o del nadir, su incertidumbre es demasiado grande para dibujarla como banda.`,
    pocoFiable: "poco fiable",
    fueraDeVista: (astro: string, g: string, lado: "izquierda" | "derecha") => `${astro} está a ${g} a la ${lado}, fuera de la vista. Pulsa para centrar.`,
    etiqueta: (nombre: string, az: string, el: string) => `${nombre} ${az} / ${el}`,
    etiquetaAzDudoso: (nombre: string, az: string, el: string) => `${nombre} ≈ ${az} (az. poco fiable) / ${el}`,
    bajo: "(bajo el horizonte)",
    contexto: {
      abrir: (astro: string) => `Datos de ${astro} en este instante`,
      elevacion: "Elevación",
      azimut: "Azimut",
      arriba: "sobre el horizonte",
      abajo: "bajo el horizonte",
      sinEvento: "Calculando el próximo cruce del horizonte…",
    },
    panel: "Lectura del instante",
    estado: "Estado",
    proximoCambio: "Próximo cambio",
    abbrAzimut: "Azimut: dirección sobre el horizonte, desde el norte y en sentido horario",
    abbrElevacion: "Elevación: altura sobre el horizonte ideal",
    lima: "Lima",
    az: "az",
    el: "el",
    tabla: "Ver como tabla",
    tablaTitulo: (n: number) => `Posición del Sol y la Tierra, ${n} h antes y después del instante elegido`,
    columnas: ["UTC", "Sol · azimut (°)", "Sol · elevación (°)", "Tierra · azimut (°)", "Tierra · elevación (°)"],
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
    // Con qué se compara: la media de todos los sitios del catálogo en el mismo rango (raya sobre la barra).
    frenteMedia: (n: number, media: string, puntos: string, signo: number) =>
      `Media de los ${n} sitios: ${media.replace(" ", "\u00a0")}${signo === 0 ? " (igual)" : ` · ${puntos}\u00a0puntos por ${signo > 0 ? "encima" : "debajo"}`}`,
    // Relato de cada cifra: con qué se compara (días equivalentes) y por qué importa (la consecuencia operativa).
    relato: {
      sol: (dias: string, sin: string, todo: boolean, nada: boolean) =>
        nada ? "Sin Sol en todo el periodo: el módulo necesitaría baterías u otra fuente de energía."
          : todo ? `Equivale a ${dias} días seguidos de luz: no hay noche en este periodo.`
          : `Equivale a ${dias} días de luz. Quedan ${sin} a oscuras: ese tramo requiere baterías u otra fuente.`,
      tierra: (dias: string, sin: string, todo: boolean, nada: boolean) =>
        nada ? "La Tierra nunca asoma en este periodo: sin satélite de retransmisión no hay comunicación directa."
          : todo ? "La Tierra está siempre a la vista: enlace directo durante todo el periodo."
          : `Equivale a ${dias} días de enlace directo. Quedan ${sin} sin línea con la Tierra: hace falta un repetidor o esperar.`,
    },
    banda: (sol: string, tierra: string) => `Bandas de luz del periodo: Sol sobre el horizonte ${sol}; Tierra sobre el horizonte ${tierra}.`,
    sinSol: "Sin Sol sobre el horizonte en todo el periodo.",
    global: (nivel: string) => `Global: ${nivel}`,
    masMetricas: "Más métricas",
    solMax: "Altura máxima del Sol",
    campos: { horas_sol: "horas de sol", pct_sol: "% de sol", sol_el_max_deg: "altura máxima", sol_el_media_deg: "altura media", horas_tierra_visible: "horas de Tierra", pct_tierra: "% de Tierra" } as Record<string, string>,
    solMedia: "Altura media del Sol (con Sol)",
    sinMedia: "sin horas de sol",
    origen: "Origen de las cifras",
    origenes: { calculado: "Recalculadas por la API a partir de las efemérides", ejemplo: "Calculadas en el navegador con los datos de ejemplo", horizons_en_vivo: "Calculadas por la API con la consulta en vivo a JPL Horizons" },
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
    columnas: ["Línea", "Columna", "Mensaje"],
    notaLinea: "Línea del archivo: la cabecera es la línea 1, así que la línea 13 es la fila de datos 12.",
    errores: "Errores",
    advertencias: "Advertencias",
    archivo: "archivo",
    filas: (n: number) => `${n} ${n === 1 ? "fila" : "filas"}`,
    nErrores: (n: number) => `${n} ${n === 1 ? "error" : "errores"}`,
    nAdvertencias: (n: number) => `${n} ${n === 1 ? "advertencia" : "advertencias"}`,
  },
  comparar: {
    documento: "Comparar",
    rotulo: "Comparar",
    titulo: (periodo: string) => `Mismo periodo, destinos distintos · ${periodo}`,
    tituloFechas: (nombre: string) => `Mismo sitio, fechas distintas · ${nombre}`,
    tituloElegir: "Elige qué comparar",
    modo: "Qué comparar",
    modoSitios: "Sitios",
    modoFechas: "Fechas",
    elegirSitios: (min: number, max: number) => `Elige de ${min} a ${max} sitios`,
    elegirMeses: (min: number, max: number) => `Elige de ${min} a ${max} meses`,
    sitio: "Sitio",
    sugerida: "Comparación sugerida: el polo, casi el polo y el ecuador.",
    maximo: (max: number) => `Solo se pueden comparar ${max} a la vez. Quita uno para añadir otro.`,
    comparar: (n: number) => `Comparar ${n}`,
    cambiar: "Cambiar selección",
    grafico: "Horizontes apilados. Con el foco aquí, las flechas mueven el cursor compartido 1 hora (con Mayús, 1 día).",
    hora: (n: number) => `hora ${n} del periodo`,
    menosDia: "Mover el cursor 1 día atrás",
    masDia: "Mover el cursor 1 día adelante",
    tabla: "Ver como tabla",
    tablaTitulo: "Métricas de cada fila de la comparación",
    metrica: "Métrica",
    filas: { horas_sol: "Horas de sol", pct_sol: "% de horas con sol", sol_el_max_deg: "Altura máxima del Sol", horas_tierra_visible: "Horas con la Tierra visible", pct_tierra: "% de horas con la Tierra", energia: "Energía", comunicacion: "Comunicación", global: "Viabilidad global" },
    mejor: "mejor",
    veredicto: "Veredicto",
    diferencias: "La diferencia, en cifras",
    frenteAlMejor: (rival: string) => `frente a ${rival}`,
    frenteADos: (sol: string, tierra: string) => `sol frente a ${sol}; Tierra frente a ${tierra}`,
    recomendada: "Opción más sólida",
    mismoInstante: (n: number) => `El mismo instante en ${n} horizontes`,
    mismoInstanteAyuda: "Un solo control de tiempo mueve todos los horizontes a la vez.",
    horizonteDe: (nombre: string) => `Horizonte de ${nombre}`,
    instante: "Instante",
    tiempo: "Instante de la comparación",
    reproducir: "Reproducir los horizontes",
    pausar: "Pausar los horizontes",
    bajo: "bajo el horizonte",
    actualizando: "Actualizando la comparación…",
    verCielo: (nombre: string) => `Abrir el cielo de ${nombre} en este instante`,
    verSitio: (nombre: string) => `Ver las ventanas de ${nombre}`,
    cargando: "Comparando…",
  },
  diaLunar: {
    documento: (nombre: string) => `Día lunar · ${nombre}`,
    titulo: (nombre: string, periodo: string) => `El día lunar de ${nombre} en ${periodo}`,
    grafico: (periodo: string) => `Elevación del Sol y de la Tierra a lo largo de ${periodo}. El eje horizontal es el horizonte ideal.`,
    rol: "línea de tiempo del día lunar",
    duracion: (dias: string) => `Día lunar ≈ ${dias} días terrestres`,
    sinEventos: (astro: string, arriba: boolean, periodo: string) => `${astro} ${arriba ? "no se pone" : "no sale"} en ${periodo}`,
    evento: (astro: string, tipo: "salida" | "puesta", cuando: string) => `${tipo === "salida" ? "Sale" : "Se pone"} ${astro} · ${cuando} UTC`,
    // Los cruces del periodo en una frase: «Tierra: sale el 2026-12-14 23:00; se pone el 2026-12-27 02:00 UTC».
    resumen: (astro: string, cruces: { tipo: "salida" | "puesta"; cuando: string }[]) =>
      `${astro}: ${cruces.map((c) => `${c.tipo === "salida" ? "sale" : "se pone"} el ${c.cuando}`).join("; ")} UTC`,
    irAlCielo: "Ver este instante en el cielo",
    tabla: "Ver tabla diaria",
    tablaTitulo: "Horas con Sol y con la Tierra visible por día (UTC)",
    columnas: ["Día", "Horas de sol", "Horas con la Tierra", "Sol máximo (°)"],
    noche: "noche solar",
    cargando: "Trazando el día lunar…",
  },
  acceso: {
    documento: "Acceso",
    rotulo: "Acceso del equipo",
    titulo: "Inicia sesión",
    texto: "La app pública es de solo lectura y no necesita cuenta. La sesión sirve para subir datos sin clave y, con el rol de administración, para gestionar las claves.",
    email: "Correo",
    password: "Contraseña",
    entrar: "Iniciar sesión",
    entrando: "Entrando…",
    faltan: "Escribe el correo y la contraseña.",
    errorCredenciales: { titulo: "No se pudo iniciar sesión", mensaje: "El correo o la contraseña no son correctos.", sugerencia: "Revísalos y vuelve a intentarlo." },
    privacidad: "La contraseña no se guarda en este navegador. La sesión vive en una cookie que el código de la página no puede leer.",
    sesionDe: (nombre: string, rol: string) => `Sesión iniciada como ${nombre} (${rol}).`,
    soloAdmin: "El gestor de claves es solo para el rol de administración.",
    claves: "Gestor de claves",
    documentoSeguridad: "Plan de seguridad: OAuth 2.0 y criptografía post-cuántica",
    mostrarPassword: "Mostrar contraseña",
    bloqMayus: "Bloq Mayús está activado.",
    seguridad: "Sesión protegida · claves post-cuánticas ML-KEM-1024",
    sesionIniciada: "Sesión iniciada",
    rol: "Rol",
    huellas: "Huellas públicas de tus claves",
    escena: "Ilustración: la Tierra asoma sobre el horizonte lunar. No representa datos.",
  },
  sesion: {
    menu: (nombre: string) => `Cuenta de ${nombre}`,
    perfil: "Mi perfil",
    cerrar: "Cerrar sesión",
    roles: { analista: "Analista", revisor: "Revisor", admin: "Administración" },
  },
  perfil: {
    documento: "Mi perfil",
    rotulo: "Cuenta",
    rol: "Rol",
    huellas: "Huellas de tus claves post-cuánticas",
    explicacion: "Una huella es un resumen público de una clave pública: sirve para comprobar que una clave es la tuya. Aquí nunca se muestra ni se guarda una clave privada.",
    algoritmos: {
      "ML-KEM-1024": "Cifrado. Protege lo que se te envía cifrado, también frente a ordenadores cuánticos.",
      "ML-DSA-65": "Firma. Demuestra que una carga o un manifiesto salió de ti y no se alteró.",
    } as Record<string, string>,
    sinHuellas: "Tu cuenta aún no tiene claves post-cuánticas emitidas.",
  },
  claves: {
    documento: "Gestor de claves",
    rotulo: "Administración",
    titulo: "Gestor de claves post-cuánticas",
    entrada: "Cada usuario tiene dos pares: ML-KEM-1024 para cifrar y ML-DSA-65 para firmar. La clave privada se entrega una sola vez y el servidor no la guarda: si se pierde, se revoca y se emite otra.",
    contadores: { pares: "Pares de claves", activas: "Activas", revocadas: "Revocadas", pqc: "Post-cuánticas" },
    ejemplo: "Datos de ejemplo: la API del gestor de claves no responde. Las filas de abajo son ficticias y solo muestran cómo se verá la pantalla; ninguna acción llega al servidor.",
    pedirClave: "Clave de administración",
    pedirClaveAyuda: "Es distinta de la clave de carga. Se guarda solo en esta pestaña.",
    entrar: "Entrar",
    cambiarClave: "Cambiar clave de administración",
    filtros: "Filtros",
    estado: "Estado",
    estados: { todas: "Todas", activa: "Activas", revocada: "Revocadas" },
    tipo: "Tipo",
    tipos: { todos: "Todos", kem: "Cifrado (KEM)", firma: "Firma" },
    buscar: "Buscar por correo o nombre",
    tabla: "Claves emitidas",
    columnas: ["Estado", "Usuario", "Creada (UTC)", "Algoritmo", "Tamaños", "Huella SHA3-256", "Copias", "Acciones"],
    estadoClave: { activa: "Activa", revocada: "Revocada" },
    tamanos: (pub: number, priv: number) => `pública ${pub} B · privada ${priv} B`,
    vacia: "No hay claves con estos filtros.",
    generar: "Generar par",
    descargarPublica: (quien: string) => `Descargar la clave pública de ${quien}`,
    rotar: (quien: string) => `Rotar la clave de ${quien}`,
    revocar: (quien: string) => `Revocar la clave de ${quien}`,
    formGenerar: { titulo: "Generar claves", paso: "Paso 1 de 2 · Usuario", usuario: "Identificador del usuario (UUID)", usuarioAyuda: "UUID en minúsculas con guiones.", usuarioError: "No es un UUID válido.", tipos: "Qué pares generar", accion: "Generar" },
    entrega: {
      paso: "Paso 2 de 2 · Entrega única",
      titulo: "Guarda la clave privada ahora",
      aviso: "Es la única vez que se muestra. El servidor no la guarda y nadie puede recuperarla, tampoco el administrador. Si se pierde, hay que revocar el par y emitir uno nuevo.",
      descargar: (archivo: string) => `Descargar ${archivo}`,
      descargada: "Descargada",
      confirmo: "He descargado y guardado las claves privadas en un lugar seguro.",
      listo: "Listo",
      hecho: "Claves entregadas",
      detalle: (n: number) => `${n} ${n === 1 ? "par emitido" : "pares emitidos"}. La privada ya no está en esta página.`,
    },
    confirmarRotar: { titulo: "Rotar clave", texto: "Se revoca esta clave y se emite un par nuevo del mismo tipo. La privada nueva se entrega una sola vez a continuación.", motivo: "Motivo (opcional)", accion: "Rotar y emitir" },
    confirmarRevocar: { titulo: "Revocar clave", texto: "La clave deja de ser válida. Seguirá en la lista y su pública se podrá descargar. No se puede deshacer.", motivo: "Motivo de la revocación", motivoAyuda: (min: number, max: number) => `Entre ${min} y ${max} caracteres.`, accion: "Revocar" },
    confirmarPublica: { titulo: "Descargar clave pública", texto: "Se descargará el archivo PEM de la clave pública. Es información pública: se puede compartir.", accion: "Descargar" },
    error: "No se pudo completar la acción.",
    revocadaEl: (fecha: string, motivo: string | null) => `Revocada el ${fecha}${motivo ? ` · ${motivo}` : ""}`,
  },
  noEncontrado: {
    documento: "Fuera del mapa",
    rotulo: "Error 404",
    titulo: "Fuera del mapa",
    texto: "Esta ruta no existe en nuestro mapa lunar.",
    volver: "Volver a Sitios",
  },
  // Primitivas del rediseño «Lujo inmersivo» (src/components/lujo).
  lujo: {
    sinDato: "Sin dato",
    medidor: {
      lectura: (valor: string, nivel: string) => `${valor} · ${nivel}`,
      umbralesMayor: (reservas: string, viable: string) => `Con reservas desde ${reservas}; viable desde ${viable}.`,
      umbralesMenor: (viable: string, reservas: string) => `Viable hasta ${viable}; con reservas hasta ${reservas}.`,
    },
    sello: {
      rotulo: "Certificado de procedencia",
      estados: { conforme: "Verificado", invalida: "Firma no válida", sinConfirmar: "Sin verificar" },
      firma: "Firma ML-DSA-65",
      sinManifiesto: "No hay manifiesto firmado para este archivo.",
      manifiestoAjeno: "El manifiesto firmado no corresponde a este archivo.",
      copiar: "Copiar la huella completa",
      copiado: "Huella copiada",
    },
  },
  errores: {
    sinConexion: { titulo: "No hay conexión con el servidor", mensaje: "No pudimos llegar al servidor de datos.", sugerencia: "Comprueba tu conexión y vuelve a intentarlo." },
    inesperado: { titulo: "Algo no salió como esperábamos", mensaje: "La aplicación encontró un problema al mostrar estos datos.", sugerencia: "Vuelve a intentarlo; si se repite, recarga la página." },
    acciones: { reintentar: "Reintentar", clave: "Introducir clave", sitios: "Elegir otro sitio", mesAnterior: "Mes anterior", ultimoMes: (mes: string) => `Ir a ${mes}` },
    mesSinDatos: { titulo: "No hay datos de ese mes", mensaje: "Ese periodo queda fuera de los datos disponibles.", sugerencia: "Elige otro mes." },
    seguimiento: "Código de seguimiento",
    copiar: "Copiar",
    copiado: "Copiado",
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

/** Forma de `T` sin los literales de texto: lo que debe cumplir cualquier otro idioma (mismas claves, mismas firmas). */
/** Campos que son identificadores y no textos: el astro de cada pregunta y la clave del enlace de cada fuente. */
type ClaveFija<X> = "astro" | (X extends { uso: unknown } ? "clave" : never);
type Ancho<X> = X extends string ? string
  : X extends (...a: infer A) => infer R ? (...a: A) => Ancho<R>
  : X extends readonly (infer E)[] ? readonly Ancho<E>[]
  : X extends object ? { readonly [K in keyof X]: K extends ClaveFija<X> ? X[K] : Ancho<X[K]> }
  : X;
export type Textos = Ancho<typeof T>;

/**
 * Catálogo base por estado (estándar de respuestas HTTP §2): lo que se muestra cuando la respuesta no trae el
 * objeto `error`. `mensaje` es qué pasó y `accion`, qué puede hacer el usuario.
 */
/** Sugerencia de un 429 cuando la respuesta dice cuánto esperar (cabecera Retry-After). */
export const esperaYReintenta = (valor: number, unidad: "s" | "min"): string => `Espera ${valor} ${unidad} y reintenta.`;
export const ERRORES_POR_ESTADO: Record<number, { codigo: string; titulo: string; mensaje: string; accion: string }> = {
  400: { codigo: "PETICION_INVALIDA", titulo: "Petición inválida", mensaje: "El servidor no pudo entender lo que se le pidió.", accion: "Revisa los datos enviados." },
  401: { codigo: "NO_AUTORIZADO", titulo: "Falta autorización", mensaje: "Esta acción necesita una clave válida.", accion: "Introduce una clave válida." },
  403: { codigo: "PROHIBIDO", titulo: "Sin permiso", mensaje: "La clave indicada no permite esta acción.", accion: "Usa una clave con permiso para esta acción." },
  404: { codigo: "NO_ENCONTRADO", titulo: "No encontrado", mensaje: "No encontramos lo que buscabas.", accion: "Revisa la dirección o elige un sitio del catálogo." },
  405: { codigo: "METODO_NO_PERMITIDO", titulo: "Método no permitido", mensaje: "Esta operación no está disponible aquí.", accion: "Vuelve atrás e inténtalo desde la pantalla correspondiente." },
  409: { codigo: "CONFLICTO", titulo: "Conflicto", mensaje: "Los datos cambiaron mientras tanto.", accion: "Recarga y vuelve a intentarlo." },
  413: { codigo: "ARCHIVO_DEMASIADO_GRANDE", titulo: "Archivo demasiado grande", mensaje: "El archivo supera el tamaño permitido.", accion: "Máximo 5 MB y 10 000 filas; divide el archivo." },
  415: { codigo: "TIPO_NO_SOPORTADO", titulo: "Tipo de archivo no soportado", mensaje: "El archivo no tiene un formato que podamos leer.", accion: "Sube un archivo .csv en UTF-8." },
  422: { codigo: "DATOS_INVALIDOS", titulo: "Datos inválidos", mensaje: "Algunos datos no tienen el formato o el rango esperado.", accion: "Corrige los campos indicados y vuelve a intentarlo." },
  429: { codigo: "DEMASIADAS_PETICIONES", titulo: "Demasiadas peticiones", mensaje: "Se hicieron demasiadas peticiones en poco tiempo.", accion: "Espera unos segundos y reintenta." },
  500: { codigo: "ERROR_INTERNO", titulo: "Error inesperado", mensaje: "El servidor tuvo un problema al responder.", accion: "Reintenta; si persiste, comparte el código de seguimiento." },
  502: { codigo: "SERVICIO_EXTERNO_FALLO", titulo: "Fallo de un servicio externo", mensaje: "Un servicio del que dependemos no respondió bien.", accion: "Reintenta en unos minutos." },
  503: { codigo: "SERVICIO_NO_DISPONIBLE", titulo: "Servicio no disponible", mensaje: "El servicio de datos no está disponible ahora.", accion: "Reintenta en unos minutos." },
  504: { codigo: "TIEMPO_AGOTADO", titulo: "Tiempo de espera agotado", mensaje: "El servidor tardó demasiado en responder.", accion: "Reduce el rango de fechas o reintenta." },
};

/** Códigos de dominio, más específicos que su estado. En español la interfaz muestra los textos del backend; estos son el respaldo y la referencia de la traducción. */
export const ERRORES_DE_DOMINIO: Record<string, { titulo: string; mensaje: string; accion: string }> = {
  SITIO_NO_ENCONTRADO: { titulo: "Sitio no encontrado", mensaje: "No hay ningún sitio con ese identificador.", accion: "Revisa el identificador o elige un sitio del catálogo." },
  EFEMERIDES_NO_ENCONTRADAS: { titulo: "Sin efemérides", mensaje: "Este sitio no tiene efemérides cargadas.", accion: "Elige otro sitio o carga sus efemérides." },
  MANIFIESTO_NO_GENERADO: { titulo: "Aún no hay manifiesto", mensaje: "Todavía no se ha firmado ningún manifiesto de los datos.", accion: "Se genera con la primera carga válida; vuelve a intentarlo después." },
  TIPO_DATOS_DESCONOCIDO: { titulo: "Tipo de datos desconocido", mensaje: "Ese tipo de datos no existe.", accion: "Usa sites, efemerides o metricas." },
  USUARIO_NO_ENCONTRADO: { titulo: "Usuario no encontrado", mensaje: "No existe ese usuario.", accion: "Revisa el identificador del usuario." },
  CLAVE_NO_ENCONTRADA: { titulo: "Clave no encontrada", mensaje: "No existe esa clave.", accion: "Revisa el identificador de la clave." },
  CLAVE_INVALIDA: { titulo: "Clave inválida o ausente", mensaje: "La clave de acceso no es válida o no se envió.", accion: "Introduce una clave de acceso válida." },
  RANGO_FECHAS_INVALIDO: { titulo: "Rango de fechas inválido", mensaje: "Las fechas pedidas no son válidas o quedan fuera de los datos disponibles.", accion: "Usa fechas UTC con el formato AAAA-MM-DDTHH:MMZ y que la fecha final sea posterior a la inicial." },
  VARIABLE_INVALIDA: { titulo: "Variable no válida", mensaje: "Esa variable no se puede consultar.", accion: "Elige la elevación o el azimut del Sol o de la Tierra." },
  RANGO_DEMASIADO_LARGO: { titulo: "Rango demasiado largo", mensaje: "El rango pedido supera el máximo permitido.", accion: `Pide un rango de ${DATOS.RANGO_MAX_DIAS} días como máximo y consulta por tramos.` },
  CSV_INVALIDO: { titulo: "CSV inválido", mensaje: "El archivo tiene filas que no se pueden guardar.", accion: "Revisa las líneas marcadas en el informe y vuelve a subirlo." },
  DATOS_NO_DISPONIBLES: { titulo: "Datos no disponibles", mensaje: "No se pueden leer los datos en este momento.", accion: "Reintenta en unos minutos; si persiste, avisa al equipo con el código de seguimiento." },
  BD_NO_DISPONIBLE: { titulo: "Base de datos no disponible", mensaje: "La base de datos no responde o no está configurada.", accion: "Reintenta en unos minutos; si persiste, avisa al equipo con el código de seguimiento." },
  ALMACEN_NO_DISPONIBLE: { titulo: "Almacenamiento no disponible", mensaje: "No se pudo acceder al almacenamiento de datos; no se guardó nada.", accion: "Reintenta en unos minutos." },
  FIRMA_NO_DISPONIBLE: { titulo: "Firma no disponible", mensaje: "La firma post-cuántica no está disponible; no se guardó nada.", accion: "Avisa al equipo con el código de seguimiento: faltan las claves de firma." },
  CREDENCIALES_INVALIDAS: { titulo: "No se pudo iniciar sesión", mensaje: "El correo o la contraseña no son correctos.", accion: "Revisa tus datos e inténtalo de nuevo." },
  SESION_INVALIDA: { titulo: "Sesión caducada", mensaje: "Tu sesión no es válida o ya caducó.", accion: "Inicia sesión de nuevo." },
  ROL_INSUFICIENTE: { titulo: "Sin permiso", mensaje: "Tu rol no permite esta operación.", accion: "Usa una cuenta con el rol necesario o pide acceso a un administrador." },
  ORIGEN_NO_PERMITIDO: { titulo: "Petición no permitida", mensaje: "La petición no parece venir de la aplicación.", accion: "Recarga la página e inténtalo de nuevo." },
  DEMASIADOS_INTENTOS: { titulo: "Demasiados intentos", mensaje: "Se hicieron demasiados intentos de inicio de sesión.", accion: "Espera unos minutos antes de volver a intentarlo." },
  CLAVE_DUPLICADA: { titulo: "Clave ya activa", mensaje: "Ya hay una clave activa para ese usuario y tipo.", accion: "Revócala o rótala en lugar de generar otra." },
  CLAVE_YA_REVOCADA: { titulo: "Clave ya revocada", mensaje: "La clave ya está revocada.", accion: "No hace falta revocarla de nuevo; rota o genera una nueva." },
  USUARIO_INACTIVO: { titulo: "Usuario desactivado", mensaje: "El usuario está desactivado; no se le pueden emitir claves.", accion: "Activa al usuario antes de emitirle claves." },
  PASO_HORAS_INVALIDO: { titulo: "Paso entre puntos no válido", mensaje: "El paso entre puntos que pediste no está permitido.", accion: "Elige un paso dentro del rango permitido." },
  DEMASIADOS_PUNTOS: { titulo: "Demasiados puntos", mensaje: "El rango pedido genera demasiados puntos para mostrarlos.", accion: "Aumenta el paso entre puntos o acorta el rango de fechas." },
  FECHA_FUERA_DE_DATOS: { titulo: "Fecha fuera de los datos", mensaje: "La fecha pedida queda fuera del periodo con datos.", accion: "Elige una fecha dentro del periodo con datos." },
  FECHA_ANTES_DE_LOS_DATOS: { titulo: "Fecha anterior a los datos", mensaje: "La fecha inicial es anterior al primer dato disponible.", accion: "Elige una fecha de inicio dentro del periodo con datos." },
  FECHA_FUERA_DE_PROYECCION: { titulo: "Fecha demasiado lejana", mensaje: "La fecha final queda demasiado lejos de los datos para estimarla.", accion: "Elige una fecha final más cercana al último dato." },
  RANGO_SIN_DATOS: { titulo: "Sin datos en ese rango", mensaje: "No hay datos en el rango de fechas pedido.", accion: "Prueba con otro rango de fechas." },
  SITIO_REQUERIDO: { titulo: "Falta elegir un sitio", mensaje: "No indicaste ningún sitio.", accion: "Elige al menos un sitio." },
  COMPARACION_SITIOS_INVALIDA: { titulo: "Demasiados sitios", mensaje: "Solo se pueden comparar unos pocos sitios a la vez.", accion: "Reduce la selección de sitios." },
  HORIZONS_FECHAS_FUERA_DE_RANGO: { titulo: "Fechas fuera de rango", mensaje: "Las fechas quedan fuera del periodo que se puede consultar en vivo.", accion: "Elige fechas dentro del periodo permitido." },
  HORIZONS_LIMITE: { titulo: "Demasiadas consultas", mensaje: "Se hicieron demasiadas consultas en vivo a la NASA.", accion: "Espera unos segundos y vuelve a intentarlo." },
  HORIZONS_OCUPADO: { titulo: "Servicio ocupado", mensaje: "El servicio de consultas en vivo está ocupado.", accion: "Vuelve a intentarlo en unos segundos." },
  HORIZONS_TIEMPO_AGOTADO: { titulo: "La NASA tardó demasiado", mensaje: "El servicio de la NASA tardó demasiado en responder.", accion: "Reduce el rango de fechas o vuelve a intentarlo en unos minutos." },
  HORIZONS_NO_DISPONIBLE: { titulo: "Servicio de la NASA no disponible", mensaje: "El servicio de la NASA no está disponible ahora.", accion: "Vuelve a intentarlo en unos minutos." },
  HORIZONS_RESPUESTA_INVALIDA: { titulo: "Respuesta no legible", mensaje: "La NASA devolvió una respuesta que no se pudo leer.", accion: "Vuelve a intentarlo en unos minutos." },
  HORIZONS_RESULTADO_NO_VALIDO: { titulo: "Resultado no válido", mensaje: "La NASA no calculó la posición desde la superficie de la Luna.", accion: "Prueba con otras coordenadas." },
  CARGA_EN_CONFLICTO: { titulo: "Otra carga en curso", mensaje: "Otra carga modificó los datos al mismo tiempo.", accion: "Se recargó la versión vigente: vuelve a subir el archivo." },
  AUDITORIA_NO_DISPONIBLE: { titulo: "Auditoría no disponible", mensaje: "No se pudo registrar la carga en el historial de auditoría; no se guardó nada.", accion: "Vuelve a intentarlo en unos minutos." },
  CATALOGO_NO_DISPONIBLE: { titulo: "Sin catálogo de sitios", mensaje: "No hay un catálogo de sitios cargado.", accion: "Carga el catálogo de sitios o avisa al equipo." },
  CATALOGO_INVALIDO: { titulo: "Catálogo de sitios inválido", mensaje: "El catálogo de sitios no cumple el estándar de datos.", accion: "Corrígelo y vuelve a subirlo." },
  EFEMERIDES_INVALIDAS: { titulo: "Efemérides inválidas", mensaje: "Las efemérides de este sitio no cumplen el estándar de datos.", accion: "Corrígelas y vuelve a subirlas, o elige otro sitio." },
  METRICAS_INVALIDAS: { titulo: "Métricas inválidas", mensaje: "El archivo de métricas no cumple el estándar de datos.", accion: "Corrígelo y vuelve a subirlo." },
  SIMULACION_NO_DISPONIBLE: { titulo: "Simulación no disponible", mensaje: "La simulación no puede estimar la incertidumbre en este momento.", accion: "Avisa al equipo con el código de seguimiento." },
};

const redondo = (v: number): string => numero(v, 0);

/** 'en 291 h' */
/** Estados de la validación de un análisis: hecha con estos datos, con otros (de referencia) o inexistente. */
type EstadoValidacionAnalisis = "propia" | "referencia" | "ausente";
/** Textos del análisis que escribe la API y la interfaz traduce: por `pasos[].id`, por el nombre de cada medida y por su unidad. */
export interface TextosApiAnalisis {
  /** La descripción de un paso puede depender de la validación (regla 1: propia, de referencia o ausente). */
  pasos: Record<string, { nombre: string; descripcion: string | Record<EstadoValidacionAnalisis, string> }>;
  medidas: Record<string, string>;
  unidades: Record<string, string>;
}
/** La API de análisis ya escribe en español: aquí no se traduce nada y cada texto se muestra como llega. */
export const ANALISIS_API: TextosApiAnalisis = { pasos: {}, medidas: {}, unidades: {} };

export const enHoras = (h: number): string => `en ${horas(Math.round(h))}`;

/**
 * Línea del panel de lectura: qué hará el astro y cuándo. Si el cambio cae después del periodo que se está
 * mirando (`finPeriodo`), se dice primero que no cambia en ese periodo y la fecha queda como dato secundario.
 */
export function proximoCambio(e: EventosAstro, periodo?: { desde: Utc; hasta: Utc }): string {
  const [verbo, sustantivo] = e.visible ? ["se pone", "puesta"] : ["sale", "salida"];
  if (e.horas_restantes === null) return `no ${verbo} en el periodo con datos`;
  const cuando = e.visible ? e.proxima_puesta_utc : e.proxima_salida_utc;
  const fecha = cuando ? `${fechaHora(cuando)} ${T.utc}` : "";
  if (periodo && cuando && cuando >= periodo.hasta) {
    return `no ${verbo} en ${periodoLegible(periodo.desde, periodo.hasta)} · próxima ${sustantivo}: ${fecha}`;
  }
  return `${verbo} ${enHoras(e.horas_restantes)} · ${fecha}`.trim();
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

export const SIN_LINEA_DIRECTA: string = "Sin línea directa con la Tierra: requiere satélite de retransmisión.";

export interface FilaVeredicto {
  nombre: string;
  horas_sol: number;
  pct_sol: number;
  horas_tierra_visible: number;
  pct_tierra: number;
  /** La API avisó de que las horas de sol dependen del relieve. */
  sensible?: boolean;
}
const listar = (nombres: string[]): string =>
  nombres.length <= 1 ? (nombres[0] ?? "") : `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
const mayuscula = (texto: string): string => texto.charAt(0).toUpperCase() + texto.slice(1);
const frases = (...partes: string[]): string => partes.filter(Boolean).map((p) => `${mayuscula(p)}.`).join(" ");
/** Recuerda que un primer puesto en horas de sol puede deberse al horizonte ideal. */
const cautela = (filas: FilaVeredicto[]): string => {
  const sensibles = filas.filter((f) => f.sensible && f.horas_sol > 0).map((f) => f.nombre);
  return sensibles.length ? `ojo: las horas de sol de ${listar(sensibles)} son del horizonte ideal y dependen del relieve` : "";
};

/** Veredicto partido para la pantalla: una frase principal (el Sol) y hasta dos matices (la Tierra y la cautela). */
export interface PartesVeredicto { principal: string; matices: string[] }
const SIN_VEREDICTO: PartesVeredicto = { principal: "", matices: [] };
const partes = (principal: string, ...matices: string[]): PartesVeredicto => ({ principal: frases(principal), matices: matices.filter(Boolean).map((m) => frases(m)) });
const unido = (v: PartesVeredicto): string => [v.principal, ...v.matices].filter(Boolean).join(" ");

/** Sitios distintos en un mismo periodo. Frase generada solo con las métricas: ordena, no opina. */
export const veredicto = (filas: FilaVeredicto[], periodo: string): string => unido(partesVeredicto(filas, periodo));
export function partesVeredicto(filas: FilaVeredicto[], periodo: string): PartesVeredicto {
  if (filas.length < 2) return SIN_VEREDICTO;
  const porSol = [...filas].sort((a, b) => b.horas_sol - a.horas_sol);
  const [mejor, ultimo] = [porSol[0], porSol[porSol.length - 1]];
  const dif = mejor.horas_sol - ultimo.horas_sol;
  const sol =
    dif === 0
      ? `${listar(filas.map((f) => f.nombre))} tienen las mismas horas de sol (${horas(mejor.horas_sol)}) en ${periodo}`
      : `${mejor.nombre} tiene ${horas(dif)} más de sol que ${ultimo.nombre} en ${periodo}`;

  const completos = filas.filter((f) => f.pct_tierra >= 100);
  const sinTierra = filas.filter((f) => f.horas_tierra_visible === 0);
  const parciales = filas.filter((f) => f.pct_tierra < 100 && f.horas_tierra_visible > 0);
  const tierra: string[] = [];
  if (completos.length) tierra.push(`${listar(completos.map((f) => f.nombre))} ${completos.length > 1 ? "ven" : "ve"} la Tierra todo el periodo`);
  parciales.forEach((f) => tierra.push(`${f.nombre} la ve ${horas(f.horas_tierra_visible)} (${pct(f.pct_tierra)})`));
  if (sinTierra.length) tierra.push(`${listar(sinTierra.map((f) => f.nombre))} no ${sinTierra.length > 1 ? "la ven" : "la ve"} en el periodo`);
  return partes(sol, tierra.join("; "), cautela(filas));
}

const SIGNO_MENOS = "−";
const conSigno = (valor: number, texto: string): string => `${valor > 0 ? "+" : SIGNO_MENOS}${texto}`;
/** «+388 h de sol, pero −61 % de Tierra»: lo que una fila gana o pierde frente a la mejor de las demás. */
export function relatoDiferencia(d: Diferencia): string {
  const sol = d.sol_h === 0 ? "las mismas horas de sol" : `${conSigno(d.sol_h, horas(Math.abs(d.sol_h)))} de sol`;
  const tierra =
    d.tierra_h === 0 ? "la misma Tierra"
      : `${conSigno(d.tierra_h, d.tierra_pct === null ? horas(Math.abs(d.tierra_h)) : pct(Math.round(Math.abs(d.tierra_pct))))} de Tierra`;
  return `${sol}${d.sol_h * d.tierra_h < 0 ? ", pero " : " y "}${tierra}`;
}
const nivelesDe = (l: LineaComparada): string => {
  const [energia, comunicacion] = [NOMBRE_NIVEL[l.semaforo.energia].toLowerCase(), NOMBRE_NIVEL[l.semaforo.comunicacion].toLowerCase()];
  return energia === comunicacion ? `${energia} en energía y en comunicación` : `energía ${energia} y comunicación ${comunicacion}`;
};
/**
 * Veredicto para decidir entre filas: la frase principal dice cuál es la opción más sólida según el semáforo de
 * la API y por qué; los matices, lo que se deja de ganar con ella (en cifras) y la cautela del relieve.
 */
export function partesDecision(filas: LineaComparada[], contexto: string): PartesVeredicto {
  const d = decidir(filas);
  if (!d) return SIN_VEREDICTO;
  const nombre = (i: number) => filas[i].nombre;
  let principal: string;
  if (d.recomendadas.length === 1) {
    principal = `${nombre(d.recomendadas[0])} es la opción más sólida en ${contexto}: ${nivelesDe(filas[d.recomendadas[0]])}`;
  } else {
    const empatadas = `${listar(d.recomendadas.map(nombre))} empatan en el semáforo en ${contexto}`;
    principal =
      d.liderSol === null && d.liderTierra === null ? `${empatadas} y en las cifras`
        : d.liderSol === d.liderTierra ? `${empatadas}; ${nombre(d.liderSol!)} tiene más sol y ve más la Tierra`
          : `${empatadas}: ${[d.liderSol !== null && `${nombre(d.liderSol)} tiene más sol`, d.liderTierra !== null && `${nombre(d.liderTierra)} ve más la Tierra`].filter(Boolean).join(" y ")}`;
  }
  const contra = d.contrapartida === null ? "" : `${nombre(d.contrapartida)}: ${relatoDiferencia(diferencias(filas)[d.contrapartida])}`;
  return partes(principal, contra, cautela(filas));
}

/** Un mismo sitio en fechas distintas (`nombre` es el periodo de cada fila). */
export const veredictoFechas = (filas: FilaVeredicto[], sitio: string): string => unido(partesVeredictoFechas(filas, sitio));
export function partesVeredictoFechas(filas: FilaVeredicto[], sitio: string): PartesVeredicto {
  if (filas.length < 2) return SIN_VEREDICTO;
  const porSol = [...filas].sort((a, b) => b.horas_sol - a.horas_sol);
  const [mejor, ultimo] = [porSol[0], porSol[porSol.length - 1]];
  const dif = mejor.horas_sol - ultimo.horas_sol;
  const sol =
    dif === 0
      ? `en ${sitio} hay las mismas horas de sol (${horas(mejor.horas_sol)}) en ${listar(filas.map((f) => f.nombre))}`
      : `en ${sitio}, ${mejor.nombre} tiene ${horas(dif)} más de sol que ${ultimo.nombre}`;
  const tierra = `la Tierra se ve ${listar(filas.map((f) => `${horas(f.horas_tierra_visible)} en ${f.nombre}`))}`;
  return partes(sol, tierra, cautela(filas));
}

/** 'diciembre de 2026' si el rango es un mes natural completo; si no, '2026-12-01 → 2026-12-08'. */
export function periodoLegible(desde: Utc, hasta: Utc): string {
  return esMesCompleto(desde, hasta) ? mesLargo(desde) : `${soloFecha(desde)} → ${soloFecha(hasta)}`;
}
