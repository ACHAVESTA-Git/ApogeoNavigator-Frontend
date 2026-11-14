// Datos de ejemplo: instantánea de los CSV reales (scripts/generar-datos-ejemplo.mjs).
// PARA QUITAR EL RESPALDO: borrar este archivo, public/muestra/, el script y BannerDatosEjemplo,
// y la función conRespaldo() de api.ts.
import { useSyncExternalStore } from "react";
import { avisosDe, calcularMetricas, proximosEventos, semaforo } from "./astro";
import { API, DATOS, HORAS_POR_DIA, MS_POR_HORA, MUESTRA } from "./constants";
import { ApiError } from "./errores";
import { aMs, aUtc } from "./fechas";
import { T } from "./textos";
import type { Efemerides, FilaEfemeride, FilaReferencia, Metrica, Puestas, Rango, RespuestaMetricas, Site, Utc } from "./tipos";

// ---------------------------------------------------------------- bandera «se están usando datos de ejemplo»
let activa = false;
const oyentes = new Set<() => void>();
export function marcarMuestraActiva(): void {
  if (activa) return;
  activa = true;
  oyentes.forEach((avisar) => avisar());
}
export function reiniciarMuestra(): void {
  activa = false;
  cache.clear();
}
const suscribir = (avisar: () => void) => {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
};
export const useMuestraActiva = (): boolean => useSyncExternalStore(suscribir, () => activa, () => false);

// ---------------------------------------------------------------- lectura de los JSON
const cache = new Map<string, Promise<unknown>>();
function leer<T>(ruta: string): Promise<T> {
  let promesa = cache.get(ruta) as Promise<T> | undefined;
  if (!promesa) {
    promesa = fetch(ruta).then((r) => {
      if (!r.ok) throw new ApiError(API.NO_ENCONTRADO, T.errores.sinEfemerides);
      return r.json() as Promise<T>;
    });
    promesa.catch(() => cache.delete(ruta));
    cache.set(ruta, promesa);
  }
  return promesa;
}

type Columna = "sol_az_deg" | "sol_el_deg" | "tierra_az_deg" | "tierra_el_deg";
export interface EfemeridesColumnar extends Omit<Efemerides, "filas"> {
  columnas: Record<Columna, number[]>;
}
/** Reconstruye las filas del formato columnar (el paso es constante). */
export function expandirEfemerides(datos: EfemeridesColumnar): FilaEfemeride[] {
  const t0 = aMs(datos.inicio_utc);
  const paso = datos.paso_horas * MS_POR_HORA;
  const c = datos.columnas;
  return c.sol_az_deg.map((_, i) => ({
    utc: aUtc(t0 + i * paso),
    sol_az_deg: c.sol_az_deg[i],
    sol_el_deg: c.sol_el_deg[i],
    tierra_az_deg: c.tierra_az_deg[i],
    tierra_el_deg: c.tierra_el_deg[i],
  }));
}

const filasCompletas = new Map<string, Promise<FilaEfemeride[]>>();
async function todasLasFilas(id: string): Promise<FilaEfemeride[]> {
  const sitios = await sitiosMuestra();
  if (!sitios.some((s) => s.site_id === id)) throw new ApiError(API.NO_ENCONTRADO, T.errores.sitioDesconocido);
  let filas = filasCompletas.get(id);
  if (!filas) {
    filas = leer<EfemeridesColumnar>(MUESTRA.EFEMERIDES(id)).then(expandirEfemerides);
    filas.catch(() => filasCompletas.delete(id));
    filasCompletas.set(id, filas);
  }
  return filas;
}

/** Misma regla que resolve_range del backend: dentro de los datos, hasta > desde y ≤ 35 días. */
export function resolverRango(primera: Utc, ultima: Utc, rango: Rango = {}): { desde: Utc; hasta: Utc } {
  const noProcesable = (detalle: string) => new ApiError(API.NO_PROCESABLE, detalle);
  const maxMs = DATOS.RANGO_MAX_DIAS * HORAS_POR_DIA * MS_POR_HORA;
  const desde = rango.desde ?? primera;
  const hasta = rango.hasta ?? aUtc(Math.min(aMs(desde) + maxMs, aMs(ultima)));
  if (aMs(desde) < aMs(primera) || aMs(desde) > aMs(ultima)) throw noProcesable(T.errores.fueraDeDatos(API.PARAM.DESDE));
  if (aMs(hasta) > aMs(ultima)) throw noProcesable(T.errores.fueraDeDatos(API.PARAM.HASTA));
  if (aMs(hasta) <= aMs(desde)) throw noProcesable(T.errores.rangoOrden);
  if (aMs(hasta) - aMs(desde) > maxMs) throw noProcesable(T.errores.rangoMaximo);
  return { desde, hasta };
}

// ---------------------------------------------------------------- mismas formas que la API
export const sitiosMuestra = (): Promise<Site[]> => leer<Site[]>(MUESTRA.SITES);

export async function efemeridesMuestra(id: string, rango?: Rango): Promise<Efemerides> {
  const filas = await todasLasFilas(id);
  const { desde, hasta } = resolverRango(filas[0].utc, filas[filas.length - 1].utc, rango);
  const [a, b] = [aMs(desde), aMs(hasta)];
  return {
    site_id: id,
    inicio_utc: desde,
    fin_utc: hasta,
    paso_horas: (aMs(filas[1].utc) - aMs(filas[0].utc)) / MS_POR_HORA,
    filas: filas.filter((f) => aMs(f.utc) >= a && aMs(f.utc) <= b), // extremos incluidos
  };
}

export async function metricasMuestra(ids: string[], rango?: Rango): Promise<RespuestaMetricas> {
  const referencias = await leer<FilaReferencia[]>(MUESTRA.REFERENCIA).catch(() => [] as FilaReferencia[]);
  const resultados: Metrica[] = [];
  for (const id of [...new Set(ids)]) {
    const filas = await todasLasFilas(id);
    const { desde, hasta } = resolverRango(filas[0].utc, filas[filas.length - 1].utc, rango);
    const valores = calcularMetricas(filas, desde, hasta);
    if (!valores) throw new ApiError(API.NO_PROCESABLE, T.errores.sinDatosRango);
    const ref = referencias.find((r) => r.site_id === id && r.inicio_utc === desde && r.fin_utc === hasta);
    resultados.push({
      site_id: id,
      inicio_utc: desde,
      fin_utc: hasta,
      ...valores,
      semaforo: semaforo(valores.pct_sol, valores.pct_tierra),
      avisos: avisosDe(valores),
      origen: "ejemplo",
      referencia: ref ? { ...soloValores(ref), coincide: coincide(valores, ref) } : null,
    });
  }
  return { resultados };
}
const CLAVES_METRICA = ["horas_sol", "pct_sol", "sol_el_max_deg", "sol_el_media_deg", "horas_tierra_visible", "pct_tierra"] as const;
const TOLERANCIA = { horas_sol: 0.01, horas_tierra_visible: 0.01, pct_sol: 0.01, pct_tierra: 0.01, sol_el_max_deg: 0.001, sol_el_media_deg: 0.001 };
const soloValores = (r: FilaReferencia) =>
  Object.fromEntries(CLAVES_METRICA.map((k) => [k, r[k]])) as Pick<FilaReferencia, (typeof CLAVES_METRICA)[number]>;
function coincide(a: ReturnType<typeof soloValores>, b: FilaReferencia): boolean {
  return CLAVES_METRICA.every((k) => {
    const [x, y] = [a[k], b[k]];
    return x === null || y === null ? x === y : Math.abs(x - y) <= TOLERANCIA[k];
  });
}

export async function puestasMuestra(id: string, desde?: Utc): Promise<Puestas> {
  const filas = await todasLasFilas(id);
  const eventos = proximosEventos(filas, desde ?? filas[0].utc);
  if (!eventos) throw new ApiError(API.NO_PROCESABLE, T.errores.fueraDeDatos(API.PARAM.DESDE));
  return { site_id: id, ...eventos };
}
