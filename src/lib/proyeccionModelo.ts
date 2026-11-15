// Pestaña «Proyección» (solo rol admin): contrato de GET /api/proyeccion y cálculo puro de lo que la pantalla deriva
// de la respuesta (resumen de meses, error contra Horizons y banda de error según el horizonte). Nada se inventa:
// cada cifra sale de la API; lo que la API no trae (campos de error en null) no se muestra. Con prueba.
import { peorNivel } from "./astro";
import { HORAS_POR_DIA, MS_POR_HORA, PROYECCION_MODELO } from "./constants";
import { aMs, esUtc, sumarMeses } from "./fechas";
import type { FilaEfemeride, IndicadoresAstronauta, NivelSemaforo, Utc } from "./tipos";

export type PasoHorasProyeccion = (typeof PROYECCION_MODELO.PASOS_HORAS)[number];
export const esPasoHoras = (v: number): v is PasoHorasProyeccion => (PROYECCION_MODELO.PASOS_HORAS as readonly number[]).includes(v);

type RmsePorVariable = Partial<Record<keyof Omit<FilaEfemeride, "utc">, number | null>>;
export interface ErrorHorizonte { meses: number; rmse_sol_el_deg?: number | null; rmse_tierra_el_deg?: number | null }
export interface PuntoControl { site_id: string; utc: Utc; variable: string; error_deg: number | null }
/** Error medido del modelo. Cualquier campo puede faltar o venir en null: entonces no se enseña. */
export interface ErrorModelo {
  rmse_deg?: RmsePorVariable | null;
  por_horizonte?: ErrorHorizonte[] | null;
  control_horizons?: PuntoControl[] | null;
  aciertos_semaforo_control?: { aciertos: number; total: number } | null;
}
export interface ModeloProyeccion {
  version: string;
  metodo: string;
  entrenado_desde: string;
  entrenado_hasta: string;
  proyectado_hasta: string;
  error?: ErrorModelo | null;
}
export interface MesProyeccion {
  /** 'YYYY-MM' */
  mes: string;
  pct_sol: number;
  pct_tierra: number;
  semaforo: { energia: NivelSemaforo; comunicacion: NivelSemaforo };
  indicadores_astronauta?: IndicadoresAstronauta | null;
}
/** `sha3_256`: huella del archivo de efemérides del sitio (null si no hay archivo). Sin archivo: `serie` y `meses` vacíos. */
export interface ResultadoProyeccion { site_id: string; sha3_256?: string | null; serie: FilaEfemeride[]; meses: MesProyeccion[] }
/** GET /api/proyeccion?site_id&desde&hasta&paso_horas */
export interface ProyeccionModelo {
  origen: "proyeccion";
  modelo: ModeloProyeccion;
  limitaciones: { codigo: string; mensaje: string }[];
  resultados: ResultadoProyeccion[];
}

const finito = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const MS_POR_MES = PROYECCION_MODELO.DIAS_POR_MES * HORAS_POR_DIA * MS_POR_HORA;

/** Primer instante de un mes 'YYYY-MM'. */
export const inicioDelMes = (mes: string): Utc => `${mes}-01T00:00Z`;
/** Milisegundos de una fecha de la API ('YYYY-MM-DDTHH:MMZ' o ISO); null si no se puede leer. */
export function msDeFecha(fecha: string | null | undefined): number | null {
  if (!fecha) return null;
  const ms = esUtc(fecha) ? aMs(fecha) : Date.parse(fecha);
  return Number.isFinite(ms) ? ms : null;
}

export const resultadoDe = (p: Pick<ProyeccionModelo, "resultados">, siteId: string): ResultadoProyeccion | undefined =>
  p.resultados?.find((r) => r.site_id === siteId);

/** Nivel de un mes: el peor de energía y comunicación (misma regla que el semáforo global). */
export const nivelDelMes = (m: Pick<MesProyeccion, "semaforo">): NivelSemaforo => peorNivel(m.semaforo.energia, m.semaforo.comunicacion);

export interface ResumenMeses {
  total: number;
  viables: number;
  reservas: number;
  criticos: number;
  /** Lectura del periodo: viable solo si todos los meses lo son; crítico si lo es al menos FRACCION_CRITICA. */
  nivel: NivelSemaforo;
  /** Último mes proyectado ('YYYY-MM'). */
  ultimoMes: string | null;
}
export function resumenMeses(meses: readonly MesProyeccion[]): ResumenMeses {
  const niveles = meses.map(nivelDelMes);
  const cuenta = (n: NivelSemaforo) => niveles.filter((x) => x === n).length;
  const total = meses.length;
  const [viables, reservas, criticos] = [cuenta("verde"), cuenta("amarillo"), cuenta("rojo")];
  const nivel: NivelSemaforo = total > 0 && viables === total ? "verde" : total > 0 && criticos / total >= PROYECCION_MODELO.FRACCION_CRITICA ? "rojo" : "amarillo";
  return { total, viables, reservas, criticos, nivel, ultimoMes: meses.reduce<string | null>((u, m) => (u === null || m.mes > u ? m.mes : u), null) };
}

export interface ErrorControl {
  /** Media del error absoluto de elevación en los puntos de control (grados). */
  mediaAbs: number;
  maxAbs: number;
  puntos: number;
  /** true si los puntos son de este sitio; false si el sitio no tiene control y se usan los de todos. */
  deEsteSitio: boolean;
}
/**
 * Error medido contra JPL Horizons en los puntos de control, solo en elevación (de ella depende el semáforo).
 * Prefiere los puntos del sitio; si no tiene, usa los de todos los sitios y lo dice. Sin puntos: null.
 */
export function errorControl(error: ErrorModelo | null | undefined, siteId: string): ErrorControl | null {
  const validos = (error?.control_horizons ?? []).filter((c) => finito(c.error_deg) && c.variable.endsWith(PROYECCION_MODELO.SUFIJO_ELEVACION));
  const propios = validos.filter((c) => c.site_id === siteId);
  const usados = propios.length ? propios : validos;
  if (!usados.length) return null;
  const abs = usados.map((c) => Math.abs(c.error_deg as number));
  return { mediaAbs: abs.reduce((s, v) => s + v, 0) / abs.length, maxAbs: Math.max(...abs), puntos: abs.length, deEsteSitio: propios.length > 0 };
}

export type AstroBanda = "sol" | "tierra";
const CLAVE_HORIZONTE = { sol: "rmse_sol_el_deg", tierra: "rmse_tierra_el_deg" } as const;
const CLAVE_RMSE = { sol: "sol_el_deg", tierra: "tierra_el_deg" } as const;

/**
 * RMSE de elevación a `meses` de horizonte: interpola entre los horizontes medidos. Antes del primero y después
 * del último se queda con el más cercano (no se extrapola). Sin tabla por horizonte: null.
 */
export function rmseEnHorizonte(porHorizonte: readonly ErrorHorizonte[] | null | undefined, astro: AstroBanda, meses: number): number | null {
  const clave = CLAVE_HORIZONTE[astro];
  const tabla = (porHorizonte ?? []).filter((h) => finito(h.meses) && finito(h[clave])).sort((a, b) => a.meses - b.meses);
  if (!tabla.length) return null;
  if (meses <= tabla[0].meses) return tabla[0][clave] as number;
  for (let i = 1; i < tabla.length; i++) {
    const [a, b] = [tabla[i - 1], tabla[i]];
    if (meses <= b.meses) {
      const f = b.meses === a.meses ? 1 : (meses - a.meses) / (b.meses - a.meses);
      return (a[clave] as number) + ((b[clave] as number) - (a[clave] as number)) * f;
    }
  }
  return tabla[tabla.length - 1][clave] as number;
}

export type TipoBanda = "horizonte" | "fija";
/**
 * Semiancho de la banda de error (± RMSE, grados) de un astro en el instante `ms`. Con la tabla por horizonte, crece
 * con los meses desde el fin del entrenamiento; sin ella, es el RMSE global (fijo); sin ninguno, no hay banda.
 */
export function bandaError(modelo: Pick<ModeloProyeccion, "entrenado_hasta" | "error">, astro: AstroBanda): { tipo: TipoBanda; en: (ms: number) => number } | null {
  const e = modelo.error;
  const origen = msDeFecha(modelo.entrenado_hasta);
  if (origen !== null && rmseEnHorizonte(e?.por_horizonte, astro, 0) !== null) {
    return { tipo: "horizonte", en: (ms) => rmseEnHorizonte(e?.por_horizonte, astro, Math.max(0, (ms - origen) / MS_POR_MES)) as number };
  }
  const fijo = e?.rmse_deg?.[CLAVE_RMSE[astro]];
  return finito(fijo) ? { tipo: "fija", en: () => fijo } : null;
}

/**
 * Meses parciales: el primero y el último pueden no estar enteros en la proyección. Un extremo es parcial si a la
 * serie le falta más de un paso para llegar al principio (o al final) de ese mes. Sin muestras del mes no se afirma nada.
 */
export function mesesParciales(serie: readonly FilaEfemeride[], meses: readonly Pick<MesProyeccion, "mes">[], pasoHoras: number): Set<string> {
  const parciales = new Set<string>();
  const orden = meses.map((m) => m.mes).sort();
  if (!orden.length) return parciales;
  const tolerancia = pasoHoras * MS_POR_HORA;
  const extremos = (mes: string) => {
    const ms = serie.filter((f) => f.utc.startsWith(mes)).flatMap((f) => msDeFecha(f.utc) ?? []);
    return ms.length ? { primera: Math.min(...ms), ultima: Math.max(...ms) } : null;
  };
  const [primero, ultimo] = [orden[0], orden[orden.length - 1]];
  const ini = extremos(primero);
  if (ini && ini.primera - aMs(inicioDelMes(primero)) > tolerancia) parciales.add(primero);
  const fin = extremos(ultimo);
  if (fin && aMs(sumarMeses(inicioDelMes(ultimo), 1)) - fin.ultima > tolerancia) parciales.add(ultimo);
  return parciales;
}
