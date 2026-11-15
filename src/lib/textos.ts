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
    titular: { antes: "En el polo sur, ", acento: "el Sol", despues: " no se pone en todo el mes: rueda por el horizonte." },
    apoyo: "Un paso de unos kilómetros o de unos días decide si un módulo tiene energía y línea directa con la Tierra. Compáralo en minutos.",
    // Relato con scroll en tres actos. Todas las cifras salen de hero-shackleton.json (CSV reales).
    actos: {
      progreso: "Actos del relato",
      ir: (n: number) => `Ir al acto ${n}`,
      uno: { rotulo: "Acto 1 · El problema", kpi: "Horas con Sol en diciembre", contexto: (min: string, max: string) => `El Sol nunca sube de ${max} ni baja de ${min}: da la vuelta al horizonte sin ponerse. Cualquier colina puede taparlo.` },
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
        contexto: (puesta: string) => `Unos kilómetros o unos días lo cambian todo: el ${puesta} (UTC) el Sol de Shackleton también se pone. Compara energía y enlace antes de decidir.`,
      },
      de: (total: string) => `de ${total}`,
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
    arrastra: "Arrastra el cielo para girar la mirada · arrastra el suelo para mover el tiempo",
    relieve: "Relieve ilustrativo. Las cifras son de horizonte ideal (sin relieve).",
    tamanos: "Tamaños de los astros ampliados; la Tierra se ve casi 4 veces mayor que el Sol.",
    horizonteIdeal: "horizonte ideal",
    faseTierra: (pct: string) => `Tierra iluminada al ${pct}`,
    proyeccion: "Proyección",
    proyeccionSinApi: "Este mes queda más allá de los datos de Horizons. Solo se puede ver como proyección, y la API de simulación no responde.",
    proyeccionAviso: "Mes proyectado: no son datos de Horizons. Cada punto lleva su incertidumbre.",
    proyeccionNota: (g: string) => `Proyección, no dato de Horizons (± ${g})`,
    fueraDeVista: (astro: string, g: string, lado: "izquierda" | "derecha") => `${astro} está a ${g} a la ${lado}, fuera de la vista. Pulsa para centrar.`,
    etiqueta: (nombre: string, az: string, el: string) => `${nombre} ${az} / ${el}`,
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
        nada ? "Sin Sol en todo el periodo: el módulo depende por completo de baterías o de una fuente de calor."
          : todo ? `Equivale a ${dias} días seguidos de luz: no hay noche que sobrevivir en este periodo.`
          : `Equivale a ${dias} días de luz. Quedan ${sin} a oscuras: ese tramo hay que pasarlo con baterías.`,
      tierra: (dias: string, sin: string, todo: boolean, nada: boolean) =>
        nada ? "La Tierra nunca asoma: sin satélite de retransmisión no hay comunicación."
          : todo ? "La Tierra está siempre a la vista: enlace directo durante todo el periodo."
          : `Equivale a ${dias} días de enlace directo. Quedan ${sin} sin línea con la Tierra: hace falta un repetidor o esperar.`,
    },
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
    cursor: "Cursor",
    sinCursor: "Pasa el puntero por las bandas o usa las flechas para leer cada sitio a la misma hora.",
    hora: (n: number) => `hora ${n} del periodo`,
    menosDia: "Mover el cursor 1 día atrás",
    masDia: "Mover el cursor 1 día adelante",
    tabla: "Ver como tabla",
    tablaTitulo: "Métricas de cada fila de la comparación",
    metrica: "Métrica",
    filas: { horas_sol: "Horas de sol", pct_sol: "% de horas con sol", sol_el_max_deg: "Altura máxima del Sol", horas_tierra_visible: "Horas con la Tierra visible", pct_tierra: "% de horas con la Tierra", energia: "Energía", comunicacion: "Comunicación", global: "Viabilidad global" },
    mejor: "mejor",
    cifras: "Quién lidera y por cuánto",
    lidera: (nombre: string, horas: string) => `${nombre} · ${horas}`,
    frenteA: (nombre: string, pct: string) => `${nombre}: ${pct}`,
    // Relato del líder de cada eje: con quién se compara (el menor de la selección) y qué supone la diferencia.
    relato: {
      sol: (mejor: string, peor: string, horas: string, dias: string, empate: boolean) =>
        empate ? "Empate en horas de sol: la energía no decide entre estas opciones."
          : `${mejor} suma ${horas} más de sol que ${peor}: ${dias} días menos de noche que cubrir con baterías.`,
      tierra: (mejor: string, peor: string, horas: string, dias: string, empate: boolean) =>
        empate ? "Empate en horas de enlace: la comunicación no decide entre estas opciones."
          : `${mejor} suma ${horas} más de enlace directo que ${peor}: ${dias} días menos dependiendo de un repetidor.`,
    },
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
    resumen: (astro: string, eventos: string) => `${astro}: ${eventos}`,
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
    titulo: "El inicio de sesión llegará con OAuth 2.0",
    texto: "La carga y edición de datos se protegerá con OAuth 2.0. Mientras tanto, «Subir datos» pide una clave de equipo, y la app pública es de solo lectura: nadie necesita cuenta para explorarla.",
    boton: "Iniciar sesión (próximamente)",
    nota: "Todavía no hay cuentas: este botón está desactivado.",
    claves: "Gestor de claves (administración)",
    documentoSeguridad: "Plan de seguridad: OAuth 2.0 y criptografía post-cuántica",
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

export const SIN_LINEA_DIRECTA = "Sin línea directa con la Tierra: requiere satélite de retransmisión.";

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

/** Sitios distintos en un mismo periodo. Frase generada solo con las métricas: ordena, no opina. */
export function veredicto(filas: FilaVeredicto[], periodo: string): string {
  if (filas.length < 2) return "";
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
  const partes: string[] = [];
  if (completos.length) partes.push(`${listar(completos.map((f) => f.nombre))} ${completos.length > 1 ? "ven" : "ve"} la Tierra todo el periodo`);
  parciales.forEach((f) => partes.push(`${f.nombre} la ve ${horas(f.horas_tierra_visible)} (${pct(f.pct_tierra)})`));
  if (sinTierra.length) partes.push(`${listar(sinTierra.map((f) => f.nombre))} no ${sinTierra.length > 1 ? "la ven" : "la ve"} nunca`);
  return frases(sol, partes.join("; "), cautela(filas));
}

/** Un mismo sitio en fechas distintas (`nombre` es el periodo de cada fila). */
export function veredictoFechas(filas: FilaVeredicto[], sitio: string): string {
  if (filas.length < 2) return "";
  const porSol = [...filas].sort((a, b) => b.horas_sol - a.horas_sol);
  const [mejor, ultimo] = [porSol[0], porSol[porSol.length - 1]];
  const dif = mejor.horas_sol - ultimo.horas_sol;
  const sol =
    dif === 0
      ? `en ${sitio} hay las mismas horas de sol (${horas(mejor.horas_sol)}) en ${listar(filas.map((f) => f.nombre))}`
      : `en ${sitio}, ${mejor.nombre} tiene ${horas(dif)} más de sol que ${ultimo.nombre}`;
  const tierra = `la Tierra se ve ${listar(filas.map((f) => `${horas(f.horas_tierra_visible)} en ${f.nombre}`))}`;
  return frases(sol, tierra, cautela(filas));
}

/** 'diciembre de 2026' si el rango es un mes natural completo; si no, '2026-12-01 → 2026-12-08'. */
export function periodoLegible(desde: Utc, hasta: Utc): string {
  return esMesCompleto(desde, hasta) ? mesLargo(desde) : `${soloFecha(desde)} → ${soloFecha(hasta)}`;
}
