// Cliente HTTP de la API. Es el ÚNICO archivo que construye URL de la API (a partir de constants.ts).
import { avisosDe, avisosTraducidos, esSemaforo, semaforo } from "./astro";
import type { Analisis, VariableAnalisis } from "./analisis";
import { API, API_BASE_URL, DATOS, MODO_MUESTRA, MUESTRA, PUNTO_PROPIO } from "./constants";
import { ErrorDeRed, errorDeRespuesta, esApiAusente } from "./errores";
import { accesoApi } from "./sesion";
import { efemeridesMuestra, marcarMuestraActiva, metricasMuestra, puestasMuestra, sitiosMuestra } from "./muestra";
import { idDePunto, puntoDeId, type Punto } from "./puntoPropio";
import type { Efemerides, EstanciaH, InformeCsv, Metrica, Puestas, Rango, RespuestaHorizons, RespuestaMetricas, RespuestaVentanas, ResultadoGuardado, Simulacion, Site, TipoArchivo, Utc } from "./tipos";

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
    throw new ErrorDeRed(error, url);
  } finally {
    clearTimeout(reloj);
    signal?.removeEventListener("abort", abortar);
  }
}

async function leerRespuesta<T>(respuesta: Response): Promise<T> {
  const cuerpo: unknown = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw errorDeRespuesta(respuesta, cuerpo, respuesta.url);
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
  return { ...m, semaforo: coincide ? m.semaforo : propio, avisos: Array.isArray(m.avisos) ? avisosTraducidos(m.avisos) : avisosDe(m) };
}

export interface Opciones {
  signal?: AbortSignal;
  modo?: typeof MODO_MUESTRA;
}

export const obtenerSitios = ({ signal, modo }: Opciones = {}): Promise<Site[]> =>
  conRespaldo(() => pedir<Site[]>(API.SITES, undefined, signal), sitiosMuestra, modo);

// ---------------------------------------------------------------- coordenadas propias (HU-13)
const horizonsEnCurso = new Map<string, Promise<RespuestaHorizons>>();
/**
 * Efemérides, métricas y puestas de un punto cualquiera, en vivo desde JPL Horizons (la primera consulta tarda
 * varios segundos; después el servidor la sirve de caché). Una sola petición por punto y periodo: Cielo y
 * Ventanas comparten la misma promesa. `desde` y `hasta` son obligatorios y el rango no pasa de 35 días.
 */
export function obtenerHorizons(punto: Punto, rango: Required<Rango>): Promise<RespuestaHorizons> {
  const clave = `${idDePunto(punto)}|${rango.desde}|${rango.hasta}`;
  const enCurso = horizonsEnCurso.get(clave);
  if (enCurso) return enCurso;
  const { LAT, LON } = API.PARAM_HORIZONS;
  const promesa = pedir<RespuestaHorizons>(API.HORIZONS, { [LAT]: String(punto.lat), [LON]: String(punto.lon), ...rango })
    .catch((error: unknown) => {
      horizonsEnCurso.delete(clave); // un error no se queda en la caché: «Reintentar» vuelve a preguntar
      throw error;
    });
  horizonsEnCurso.set(clave, promesa);
  if (horizonsEnCurso.size > PUNTO_PROPIO.CACHE_MAX) horizonsEnCurso.delete(horizonsEnCurso.keys().next().value as string);
  return promesa;
}
/** Vacía la caché en memoria (pruebas). */
export const olvidarHorizons = (): void => horizonsEnCurso.clear();
const rangoCompleto = (rango: Rango): Required<Rango> => ({ desde: rango.desde ?? DATOS.DESDE_POR_DEFECTO, hasta: rango.hasta ?? DATOS.HASTA_POR_DEFECTO });

export const obtenerEfemerides = (id: string, rango: Rango = {}, { signal, modo }: Opciones = {}): Promise<Efemerides> => {
  const punto = puntoDeId(id);
  // /api/horizons responde con site_id «personalizado»: aquí se devuelve con el id pedido, como hace cualquier sitio
  // (las pantallas comprueban que los datos son del sitio en curso antes de pintarlos).
  return punto ? obtenerHorizons(punto, rangoCompleto(rango)).then((r) => ({ ...r, site_id: id })) : efemeridesDeSitio(id, rango, { signal, modo });
};
const efemeridesDeSitio = (id: string, rango: Rango = {}, { signal, modo }: Opciones = {}): Promise<Efemerides> =>
  conRespaldo(() => pedir<Efemerides>(API.EFEMERIDES(id), { ...rango }, signal), () => efemeridesMuestra(id, rango), modo);

/** Los puntos propios sacan sus métricas de /api/horizons; los sitios del catálogo, de /api/metricas. Se conserva el orden. */
export async function obtenerMetricas(ids: string[], rango: Rango = {}, opciones: Opciones = {}): Promise<RespuestaMetricas> {
  const deCatalogo = ids.filter((id) => !puntoDeId(id));
  if (deCatalogo.length === ids.length) return metricasDeSitios(ids, rango, opciones);
  const [catalogo, propios] = await Promise.all([
    deCatalogo.length ? metricasDeSitios(deCatalogo, rango, opciones) : { resultados: [] },
    Promise.all(ids.filter((id) => puntoDeId(id)).map(async (id) => normalizarMetrica({ ...(await obtenerHorizons(puntoDeId(id) as Punto, rangoCompleto(rango))).metricas, site_id: id }))),
  ]);
  const porId = new Map([...catalogo.resultados, ...propios].map((m) => [m.site_id, m]));
  return { resultados: ids.flatMap((id) => porId.get(id) ?? []) };
}
const metricasDeSitios = (ids: string[], rango: Rango = {}, { signal, modo }: Opciones = {}): Promise<RespuestaMetricas> =>
  conRespaldo(
    () => pedir<RespuestaMetricas>(API.METRICAS, { [API.PARAM.SITE_ID]: ids, ...rango }, signal),
    () => metricasMuestra(ids, rango),
    modo,
  ).then((r) => ({ resultados: r.resultados.map(normalizarMetrica) }));

export const obtenerPuestas = (id: string, desde?: Utc, { signal, modo }: Opciones = {}): Promise<Puestas> =>
  conRespaldo(() => pedir<Puestas>(API.PUESTAS(id), { desde }, signal), () => puestasMuestra(id, desde), modo);

/**
 * Serie para animar el cielo más allá de los datos: la proyección viene marcada punto a punto. No tiene respaldo
 * de ejemplo: una proyección no se puede sacar de los CSV, y no se inventa.
 */
export const obtenerSimulacion = (id: string, rango: Rango = {}, { signal }: Opciones = {}): Promise<Simulacion> =>
  pedir<Simulacion>(API.SIMULACION(id), { ...rango }, signal);

/**
 * Ventanas de alunizaje de 1 a 5 sitios para una estancia de 72, 156 o 336 h, sobre todos los datos cargados.
 * Sin respaldo de ejemplo: si la API no ofrece el cálculo, la pantalla lo dice; no se inventa una ventana.
 */
export const obtenerVentanasAlunizaje = (ids: readonly string[], estanciaH: EstanciaH, { signal }: Opciones = {}): Promise<RespuestaVentanas> =>
  pedir<RespuestaVentanas>(API.VENTANAS_ALUNIZAJE, { [API.PARAM.SITE_ID]: ids, [API.PARAM_ESTANCIA]: String(estanciaH) }, signal);

/** Transparencia del análisis de un sitio: siempre la API real, sin muestra (un fallo es un error con su acción). */
export const obtenerAnalisis = (id: string, variable?: VariableAnalisis, { signal }: Opciones = {}): Promise<Analisis> =>
  pedir<Analisis>(API.ANALISIS(id), { [API.PARAM_VARIABLE]: variable }, signal);

// ---------------------------------------------------------------- carga de CSV (nunca usa la muestra)
async function subir<T>(ruta: string, archivo: File, clave: string): Promise<T> {
  const cuerpo = new FormData();
  cuerpo.append(API.CAMPO_ARCHIVO, archivo);
  const respuesta = await enviar(urlApi(ruta), { method: "POST", body: cuerpo, ...accesoApi(clave) });
  return leerRespuesta<T>(respuesta);
}
export const validarCsv = (tipo: TipoArchivo, archivo: File, clave: string): Promise<InformeCsv> =>
  subir<InformeCsv>(API.VALIDAR(tipo), archivo, clave);
export const guardarCsv = (tipo: TipoArchivo, archivo: File, clave: string): Promise<ResultadoGuardado> =>
  subir<ResultadoGuardado>(API.GUARDAR(tipo), archivo, clave);
