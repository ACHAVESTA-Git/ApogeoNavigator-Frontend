// Cálculos en el cliente con las mismas reglas que el backend (app/services/lectura.py):
// métricas, semáforo, cruces del horizonte y próximos eventos. Sirven de respaldo y para los gráficos.
import { AVISO, DATOS, HORAS_POR_DIA, MS_POR_HORA, SEMAFORO, UMBRAL_RASANTE_DEG } from "./constants";
import { aMs, soloFecha } from "./fechas";
import type { Astro, Aviso, EventosAstro, FilaEfemeride, NivelSemaforo, Semaforo, Utc, ValoresMetricas } from "./tipos";

// Mismo texto que MSG_AVISO_RELIEVE del backend.
const AVISO_RELIEVE_RESPALDO =
  `Sensible al relieve: el Sol no supera ${UMBRAL_RASANTE_DEG}° sobre el horizonte ideal, ` +
  "así que una colina puede taparlo y las horas de sol reales ser menores";

type ClaveElevacion = "sol_el_deg" | "tierra_el_deg";
export const CLAVE_ELEVACION: Record<Astro, ClaveElevacion> = { sol: "sol_el_deg", tierra: "tierra_el_deg" };
export const CLAVE_AZIMUT = { sol: "sol_az_deg", tierra: "tierra_az_deg" } as const;

const redondear = (valor: number, decimales: number): number => {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
};
export const sobreHorizonte = (elevacion: number): boolean => elevacion > 0;

export function pasoHoras(filas: readonly FilaEfemeride[]): number {
  return filas.length > 1 ? (aMs(filas[1].utc) - aMs(filas[0].utc)) / MS_POR_HORA : DATOS.PASO_HORAS;
}
/** Filas del intervalo semiabierto [desde, hasta), como metricas.csv. */
export function filasEnIntervalo(filas: readonly FilaEfemeride[], desde: Utc, hasta: Utc): FilaEfemeride[] {
  const a = aMs(desde);
  const b = aMs(hasta);
  return filas.filter((f) => {
    const t = aMs(f.utc);
    return t >= a && t < b;
  });
}

/** Métricas de [desde, hasta). null si no hay filas en el rango. */
export function calcularMetricas(filas: readonly FilaEfemeride[], desde: Utc, hasta: Utc): ValoresMetricas | null {
  const muestra = filasEnIntervalo(filas, desde, hasta);
  if (muestra.length === 0) return null;
  const paso = pasoHoras(filas);
  const total = muestra.length * paso;
  const solArriba = muestra.map((f) => f.sol_el_deg).filter(sobreHorizonte);
  const horasSol = solArriba.length * paso;
  const horasTierra = muestra.filter((f) => sobreHorizonte(f.tierra_el_deg)).length * paso;
  return {
    horas_sol: horasSol,
    pct_sol: redondear((horasSol / total) * 100, DATOS.DECIMALES_PCT),
    sol_el_max_deg: redondear(Math.max(...muestra.map((f) => f.sol_el_deg)), DATOS.DECIMALES_GRADOS),
    sol_el_media_deg: solArriba.length
      ? redondear(solArriba.reduce((a, b) => a + b, 0) / solArriba.length, DATOS.DECIMALES_GRADOS)
      : null,
    horas_tierra_visible: horasTierra,
    pct_tierra: redondear((horasTierra / total) * 100, DATOS.DECIMALES_PCT),
  };
}

type Umbrales = { readonly VERDE_MIN: number; readonly AMARILLO_MIN: number };
export function nivel(pct: number, umbrales: Umbrales): NivelSemaforo {
  if (pct >= umbrales.VERDE_MIN) return "verde";
  return pct >= umbrales.AMARILLO_MIN ? "amarillo" : "rojo";
}
const NIVELES: readonly NivelSemaforo[] = SEMAFORO.ORDEN;
export const peorNivel = (a: NivelSemaforo, b: NivelSemaforo): NivelSemaforo =>
  NIVELES.indexOf(a) <= NIVELES.indexOf(b) ? a : b;
/** Semáforo provisional: energía por % de Sol, comunicación por % de Tierra, global = el peor. */
export function semaforo(pctSol: number, pctTierra: number): Semaforo {
  const energia = nivel(pctSol, SEMAFORO.ENERGIA);
  const comunicacion = nivel(pctTierra, SEMAFORO.COMUNICACION);
  return { energia, comunicacion, global: peorNivel(energia, comunicacion) };
}
export function esSemaforo(valor: unknown): valor is Semaforo {
  if (typeof valor !== "object" || valor === null) return false;
  const v = valor as Record<string, unknown>;
  return (["energia", "comunicacion", "global"] as const).every((k) => NIVELES.includes(v[k] as NivelSemaforo));
}
/** Misma regla que warnings_for() del backend: el Sol nunca supera el umbral rasante. Solo para el respaldo. */
export function avisosDe(m: Pick<ValoresMetricas, "sol_el_max_deg">): Aviso[] {
  return m.sol_el_max_deg < UMBRAL_RASANTE_DEG ? [{ codigo: AVISO.RELIEVE, mensaje: AVISO_RELIEVE_RESPALDO }] : [];
}
/** ¿La API marcó la métrica como sensible al relieve? */
export const esSensibleAlRelieve = (m: { avisos?: readonly Aviso[] }): boolean =>
  (m.avisos ?? []).some((a) => a.codigo === AVISO.RELIEVE);
export const avisoDeRelieve = (m: { avisos?: readonly Aviso[] }): Aviso | undefined =>
  (m.avisos ?? []).find((a) => a.codigo === AVISO.RELIEVE);

export interface EventoCruce {
  utc: Utc;
  tipo: "salida" | "puesta";
  astro: Astro;
}
/** Todas las salidas (≤0 → >0) y puestas (>0 → ≤0); el evento se fecha en la primera fila del nuevo estado. */
export function eventosCruce(filas: readonly FilaEfemeride[], astro: Astro): EventoCruce[] {
  const clave = CLAVE_ELEVACION[astro];
  const eventos: EventoCruce[] = [];
  for (let i = 1; i < filas.length; i++) {
    const antes = sobreHorizonte(filas[i - 1][clave]);
    const ahora = sobreHorizonte(filas[i][clave]);
    if (antes !== ahora) eventos.push({ utc: filas[i].utc, tipo: ahora ? "salida" : "puesta", astro });
  }
  return eventos;
}

function eventosDesde(filas: readonly FilaEfemeride[], indice: number, astro: Astro, desdeMs: number): EventosAstro {
  const clave = CLAVE_ELEVACION[astro];
  const visible = sobreHorizonte(filas[indice][clave]);
  let estado = visible;
  let puesta: Utc | null = null;
  let salida: Utc | null = null;
  for (let i = indice + 1; i < filas.length && !(puesta && salida); i++) {
    const ahora = sobreHorizonte(filas[i][clave]);
    if (ahora === estado) continue;
    if (estado) puesta ??= filas[i].utc;
    else salida ??= filas[i].utc;
    estado = ahora;
  }
  const proximo = visible ? puesta : salida;
  return {
    visible,
    proxima_puesta_utc: puesta,
    proxima_salida_utc: salida,
    horas_restantes: proximo ? redondear((aMs(proximo) - desdeMs) / MS_POR_HORA, 1) : null,
  };
}
/** Misma forma que GET /api/puestas (sin site_id). null si `desde` queda fuera de los datos. */
export function proximosEventos(filas: readonly FilaEfemeride[], desde: Utc) {
  const ms = aMs(desde);
  if (filas.length === 0 || ms < aMs(filas[0].utc) || ms > aMs(filas[filas.length - 1].utc)) return null;
  let indice = 0;
  for (let i = 0; i < filas.length && aMs(filas[i].utc) <= ms; i++) indice = i;
  return { desde_utc: desde, sol: eventosDesde(filas, indice, "sol", ms), tierra: eventosDesde(filas, indice, "tierra", ms) };
}

/**
 * Actualiza una respuesta de /api/puestas a otro instante posterior sin volver a pedirla: sirve mientras el
 * astro no haya cambiado de estado ni se haya pasado el evento. Devuelve null si ya no es válida.
 */
export function eventosEn(referencia: EventosAstro, desde: Utc, visibleAhora: boolean): EventosAstro | null {
  if (referencia.visible !== visibleAhora) return null;
  const proximo = visibleAhora ? referencia.proxima_puesta_utc : referencia.proxima_salida_utc;
  if (!proximo) return referencia.horas_restantes === null ? referencia : null;
  const horas = (aMs(proximo) - aMs(desde)) / MS_POR_HORA;
  return horas > 0 ? { ...referencia, horas_restantes: redondear(horas, 1) } : null;
}

/** Primer instante con ambos astros sobre el horizonte; si no hay, el de mayor elevación solar. */
export function instantePorDefecto(filas: readonly FilaEfemeride[]): Utc | null {
  if (filas.length === 0) return null;
  const ambos = filas.find((f) => sobreHorizonte(f.sol_el_deg) && sobreHorizonte(f.tierra_el_deg));
  if (ambos) return ambos.utc;
  return filas.reduce((mejor, f) => (f.sol_el_deg > mejor.sol_el_deg ? f : mejor)).utc;
}

export interface Tramo {
  inicioMs: number;
  finMs: number; // exclusivo: fin de la última hora visible
  horas: number;
  elevacionMedia: number;
}
/** Tramos continuos con el astro sobre el horizonte dentro de [desde, hasta): un rectángulo por tramo. */
export function tramosVisibles(filas: readonly FilaEfemeride[], astro: Astro, desde: Utc, hasta: Utc): Tramo[] {
  const clave = CLAVE_ELEVACION[astro];
  const pasoMs = pasoHoras(filas) * MS_POR_HORA;
  const tramos: Tramo[] = [];
  let suma = 0;
  let actual: Tramo | null = null;
  for (const fila of filasEnIntervalo(filas, desde, hasta)) {
    const t = aMs(fila.utc);
    if (sobreHorizonte(fila[clave])) {
      if (actual && actual.finMs === t) {
        actual.finMs = t + pasoMs;
        actual.horas += pasoMs / MS_POR_HORA;
        suma += fila[clave];
      } else {
        actual = { inicioMs: t, finMs: t + pasoMs, horas: pasoMs / MS_POR_HORA, elevacionMedia: 0 };
        suma = fila[clave];
        tramos.push(actual);
      }
      actual.elevacionMedia = suma / (actual.horas / (pasoMs / MS_POR_HORA));
    }
  }
  return tramos;
}

export interface ResumenDia {
  fecha: string; // 'YYYY-MM-DD' (UTC)
  horasSol: number;
  horasTierra: number;
  solMax: number;
}
/** Horas de sol y de Tierra por día UTC (tabla accesible del día lunar). */
export function resumenDiario(filas: readonly FilaEfemeride[], desde: Utc, hasta: Utc): ResumenDia[] {
  const paso = pasoHoras(filas);
  const dias = new Map<string, ResumenDia>();
  for (const fila of filasEnIntervalo(filas, desde, hasta)) {
    const fecha = soloFecha(fila.utc);
    const dia = dias.get(fecha) ?? { fecha, horasSol: 0, horasTierra: 0, solMax: -Infinity };
    if (sobreHorizonte(fila.sol_el_deg)) dia.horasSol += paso;
    if (sobreHorizonte(fila.tierra_el_deg)) dia.horasTierra += paso;
    dia.solMax = Math.max(dia.solMax, fila.sol_el_deg);
    dias.set(fecha, dia);
  }
  return [...dias.values()];
}

/** Instantes de medianoche UTC dentro del rango (marcas diarias de las reglas de tiempo). */
export function mediasNoches(desdeMs: number, hastaMs: number): number[] {
  const dia = HORAS_POR_DIA * MS_POR_HORA;
  const marcas: number[] = [];
  for (let t = Math.ceil(desdeMs / dia) * dia; t <= hastaMs; t += dia) marcas.push(t);
  return marcas;
}
