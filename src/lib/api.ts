// Cliente HTTP de la API. Es el ÚNICO archivo que construye URL de la API (a partir de constants.ts).
import { avisosDe, esSemaforo, semaforo } from "./astro";
import { API, API_BASE_URL, MODO_MUESTRA } from "./constants";
import { ApiError, ErrorDeRed, esApiAusente } from "./errores";
import { efemeridesMuestra, marcarMuestraActiva, metricasMuestra, puestasMuestra, sitiosMuestra } from "./muestra";
import type { Efemerides, InformeCsv, Metrica, Puestas, Rango, RespuestaMetricas, ResultadoGuardado, Site, TipoArchivo, Utc } from "./tipos";

type Params = Record<string, string | readonly string[] | undefined>;

/** Ruta relativa si no hay base (mismo origen) o URL absoluta contra la base configurada. */
export function urlApi(ruta: string, params: Params = {}, base: string = API_BASE_URL): string {
  const consulta = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (valor === undefined) continue;
    for (const v of typeof valor === "string" ? [valor] : valor) consulta.append(clave, v);
  }
  const sufijo = consulta.size ? `?${consulta}` : "";
  return base ? `${new URL(ruta.replace(/^\//, ""), `${base}/`)}${sufijo}` : `${ruta}${sufijo}`;
}

async function enviar(url: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
  const control = new AbortController();
  const abortar = () => control.abort();
  const reloj = setTimeout(abortar, API.TIMEOUT_MS);
  signal?.addEventListener("abort", abortar);
  try {
    return await fetch(url, { ...init, signal: control.signal });
  } catch (error) {
    if (signal?.aborted) throw error; // cancelación de la consulta: no es un fallo de red
    throw new ErrorDeRed(error);
  } finally {
    clearTimeout(reloj);
    signal?.removeEventListener("abort", abortar);
  }
}

async function leerRespuesta<T>(respuesta: Response): Promise<T> {
  const cuerpo: unknown = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const detalle = (cuerpo as { detail?: string | InformeCsv } | null)?.detail;
    throw new ApiError(respuesta.status, detalle ?? respuesta.statusText);
  }
  return cuerpo as T;
}

async function pedir<T>(ruta: string, params?: Params, signal?: AbortSignal): Promise<T> {
  return leerRespuesta<T>(await enviar(urlApi(ruta, params), { headers: { Accept: "application/json" } }, signal));
}

/** Respaldo a la muestra según VITE_USE_SAMPLE_DATA. Solo cuando la API no está, nunca ante 404/422 reales. */
async function conRespaldo<T>(deApi: () => Promise<T>, deMuestra: () => Promise<T>, modo = MODO_MUESTRA): Promise<T> {
  if (modo === "true") {
    marcarMuestraActiva();
    return deMuestra();
  }
  try {
    return await deApi();
  } catch (error) {
    if (modo !== "auto" || !esApiAusente(error)) throw error;
    marcarMuestraActiva();
    return deMuestra();
  }
}

/**
 * El semáforo y los avisos son de la API. Red de seguridad: la leyenda de la interfaz sale de los umbrales
 * de constants.ts, así que si la API manda un nivel distinto del que dan esos umbrales (backend sin actualizar
 * o forma no válida) se pinta el calculado. Color y leyenda nunca pueden contradecirse.
 */
function normalizarMetrica(m: Metrica): Metrica {
  const propio = semaforo(m.pct_sol, m.pct_tierra);
  const coincide = esSemaforo(m.semaforo) && (["energia", "comunicacion", "global"] as const).every((k) => m.semaforo[k] === propio[k]);
  if (!coincide && import.meta.env.DEV) {
    console.warn(`Semáforo de la API distinto de los umbrales del cliente para ${m.site_id}`, m.semaforo, propio);
  }
  return { ...m, semaforo: coincide ? m.semaforo : propio, avisos: Array.isArray(m.avisos) ? m.avisos : avisosDe(m) };
}

export interface Opciones {
  signal?: AbortSignal;
  modo?: typeof MODO_MUESTRA;
}

export const obtenerSitios = ({ signal, modo }: Opciones = {}): Promise<Site[]> =>
  conRespaldo(() => pedir<Site[]>(API.SITES, undefined, signal), sitiosMuestra, modo);

export const obtenerEfemerides = (id: string, rango: Rango = {}, { signal, modo }: Opciones = {}): Promise<Efemerides> =>
  conRespaldo(() => pedir<Efemerides>(API.EFEMERIDES(id), { ...rango }, signal), () => efemeridesMuestra(id, rango), modo);

export const obtenerMetricas = (ids: string[], rango: Rango = {}, { signal, modo }: Opciones = {}): Promise<RespuestaMetricas> =>
  conRespaldo(
    () => pedir<RespuestaMetricas>(API.METRICAS, { [API.PARAM.SITE_ID]: ids, ...rango }, signal),
    () => metricasMuestra(ids, rango),
    modo,
  ).then((r) => ({ resultados: r.resultados.map(normalizarMetrica) }));

export const obtenerPuestas = (id: string, desde?: Utc, { signal, modo }: Opciones = {}): Promise<Puestas> =>
  conRespaldo(() => pedir<Puestas>(API.PUESTAS(id), { desde }, signal), () => puestasMuestra(id, desde), modo);

// ---------------------------------------------------------------- carga de CSV (nunca usa la muestra)
async function subir<T>(ruta: string, archivo: File, clave: string): Promise<T> {
  const cuerpo = new FormData();
  cuerpo.append(API.CAMPO_ARCHIVO, archivo);
  const respuesta = await enviar(urlApi(ruta), { method: "POST", body: cuerpo, headers: { [API.CABECERA_CLAVE]: clave } });
  return leerRespuesta<T>(respuesta);
}
export const validarCsv = (tipo: TipoArchivo, archivo: File, clave: string): Promise<InformeCsv> =>
  subir<InformeCsv>(API.VALIDAR(tipo), archivo, clave);
export const guardarCsv = (tipo: TipoArchivo, archivo: File, clave: string): Promise<ResultadoGuardado> =>
  subir<ResultadoGuardado>(API.GUARDAR(tipo), archivo, clave);
