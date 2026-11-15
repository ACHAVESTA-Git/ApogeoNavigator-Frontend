// «Informe de confianza de la proyección»: cálculo puro de lo que la pantalla Análisis deriva de la respuesta de
// la API (veredicto, cursor de la serie, momentos clave, ritmo dominante y variantes de los indicadores para
// astronautas). Nada se inventa: cada cifra sale de /api/analisis o /api/metricas. Con prueba (informe.test.ts).
import { estadoValidacion, type Analisis, type VariableAnalisis } from "./analisis";
import { CONFIANZA } from "./constants";
import { aMs } from "./fechas";
import { nivelPorUmbrales, type UmbralesMedidor } from "./lujo";
import type { NivelSemaforo, RachaAstronauta, Utc } from "./tipos";

/** Umbrales del medidor de aciertos, en meses enteros (de 12: ámbar desde 9, verde desde 11). */
export const umbralesAciertos = (meses: number): UmbralesMedidor => ({
  reservas: Math.ceil(meses * CONFIANZA.ACIERTOS_FRACCION.reservas),
  viable: Math.ceil(meses * CONFIANZA.ACIERTOS_FRACCION.viable),
});

export interface VeredictoConfianza {
  estado: "propia" | "referencia" | "ausente";
  nivel: NivelSemaforo;
  aciertos: number | null;
  meses: number | null;
  /** RMSE de validación de la elevación del Sol (optimista; no es un intervalo). */
  rmseSol: number | null;
}

/**
 * Acto 1. El nivel sale de los meses con el semáforo bien predicho. Una validación hecha con OTROS datos
 * (regla 1: «de referencia») nunca da verde, y sin validación o sin aciertos no hay nada que afirmar: ámbar.
 */
export function veredictoConfianza(a: Pick<Analisis, "validacion">): VeredictoConfianza {
  const v = a.validacion;
  const estado = estadoValidacion(v);
  if (estado === "ausente") return { estado, nivel: "amarillo", aciertos: null, meses: null, rmseSol: null };
  const s = v.semaforo_aciertos;
  const rmseSol = v.rmse_deg?.sol_el_deg ?? null;
  if (!s || !(s.meses > 0)) return { estado, nivel: "amarillo", aciertos: null, meses: null, rmseSol };
  const propio = nivelPorUmbrales(s.aciertos_global, umbralesAciertos(s.meses));
  return { estado, nivel: estado === "referencia" && propio === "verde" ? "amarillo" : propio, aciertos: s.aciertos_global, meses: s.meses, rmseSol };
}

export interface PuntoCursor { t: number; utc: Utc; observado: number | null; ajustado: number | null; proyectado: number | null }

/** Muestras por las que pasa el cursor, con la regla 4 aplicada: observado y ajustado solo dentro de los datos; proyectado, solo después. */
export function puntosCursor(serie: Pick<Analisis["serie"], "puntos" | "fin_datos_utc">): PuntoCursor[] {
  const fin = aMs(serie.fin_datos_utc);
  return serie.puntos.flatMap((p) => {
    const t = aMs(p.utc);
    const dentro = t <= fin;
    const punto = { t, utc: p.utc, observado: dentro ? p.observado : null, ajustado: dentro ? p.ajustado : null, proyectado: dentro ? null : p.proyectado };
    return punto.observado === null && punto.ajustado === null && punto.proyectado === null ? [] : [punto];
  });
}

export type TipoMomento = "desvio" | "cruceObservado" | "cruceProyectado";
export interface Momento {
  tipo: TipoMomento;
  /** Posición en `puntosCursor`. En un cruce es la primera muestra ya al otro lado del horizonte. */
  indice: number;
  /** Desvío: |observado − ajustado| en grados. */
  valor?: number;
  /** Cruce: true si el astro sale (pasa a > 0°), false si se pone. */
  sube?: boolean;
}

export const esElevacion = (variable: VariableAnalisis): boolean => variable.endsWith("_el_deg");
const visible = (v: number) => v > 0; // mismo criterio que la API: ≤ 0° es bajo el horizonte

/**
 * Los 2 o 3 momentos que merece la pena mirar, calculados desde la serie: el mayor desvío del modelo dentro de los
 * datos y, solo en elevaciones, el último cruce del horizonte observado y el primero proyectado.
 */
export function momentosClave(puntos: readonly PuntoCursor[], variable: VariableAnalisis): Momento[] {
  const momentos: Momento[] = [];
  let desvio: Momento | null = null;
  puntos.forEach((p, i) => {
    if (p.observado === null || p.ajustado === null) return;
    const d = Math.abs(p.observado - p.ajustado);
    if (!desvio || d > (desvio.valor as number)) desvio = { tipo: "desvio", indice: i, valor: d };
  });
  if (desvio) momentos.push(desvio);
  if (!esElevacion(variable)) return momentos;
  let cruceObservado: Momento | null = null;
  let cruceProyectado: Momento | null = null;
  for (let i = 1; i < puntos.length; i++) {
    const antes = puntos[i - 1].observado ?? puntos[i - 1].proyectado;
    const proyectado = puntos[i].observado === null;
    const ahora = puntos[i].observado ?? puntos[i].proyectado;
    if (antes === null || ahora === null || visible(antes) === visible(ahora)) continue;
    if (!proyectado) cruceObservado = { tipo: "cruceObservado", indice: i, sube: visible(ahora) };
    else if (!cruceProyectado) cruceProyectado = { tipo: "cruceProyectado", indice: i, sube: visible(ahora) };
  }
  if (cruceObservado) momentos.push(cruceObservado);
  if (cruceProyectado) momentos.push(cruceProyectado);
  return momentos;
}

/** Ritmo más fuerte del espectro de una variable (por defecto, la elevación del Sol); `null` si esa serie no llega. */
export function ritmoDominante(espectro: Analisis["espectro"], variable: string = CONFIANZA.VARIABLE_RITMO) {
  const serie = espectro.series.find((s) => s.variable === variable);
  if (!serie?.picos.length) return null;
  const pico = serie.picos.reduce((mayor, p) => (p.amplitud_rel > mayor.amplitud_rel ? p : mayor));
  return { variable: serie.variable, periodo_dias: pico.periodo_dias, es_sinodico: pico.es_sinodico };
}

// ---------------------------------------------------------------- indicadores para astronautas
export type VarianteRacha = "sinDato" | "cero" | "todo" | "sigue" | "veniaDeAntes" | "normal";

/**
 * Qué frase toca para una racha (docs/datos/indicadores-astronauta.md §4 y §6): 0 h, todo el periodo, cortada por
 * el final (continúa después), cortada solo por el inicio (venía de antes) o completa. Sin dato no es cero.
 */
export function varianteRacha(r: RachaAstronauta | null | undefined, horasPeriodo: number): VarianteRacha {
  if (!r || !Number.isFinite(r.horas)) return "sinDato";
  if (r.horas === 0) return "cero";
  if (horasPeriodo > 0 && r.horas >= horasPeriodo) return "todo";
  if (r.trunca_fin) return "sigue";
  return r.trunca_inicio ? "veniaDeAntes" : "normal";
}
/** Una racha que toca un borde del rango es un mínimo: se escribe «≥ X h». */
export const esMinimo = (r: RachaAstronauta): boolean => r.trunca_inicio || r.trunca_fin;
