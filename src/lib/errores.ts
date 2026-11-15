// Error de la API con el formato de FastAPI: {"detail": ...}.
import { API } from "./constants";
import { IDIOMA, type Idioma } from "./idioma";
import { ERRORES_POR_ESTADO, T, esperaYReintenta } from "./textos";
import type { InformeCsv } from "./tipos";

/** Objeto `error` que el backend añade junto a `detail` (estándar de respuestas HTTP §1). */
export interface ErrorBackend {
  codigo: string;
  estado: number;
  titulo: string;
  mensaje: string;
  accion: string;
  request_id?: string;
}
const esTexto = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
function leerErrorBackend(cuerpo: unknown): ErrorBackend | undefined {
  const e = (cuerpo as { error?: Partial<ErrorBackend> } | null)?.error;
  if (!e || typeof e !== "object" || !esTexto(e.codigo) || !esTexto(e.titulo) || !esTexto(e.mensaje)) return undefined;
  return { codigo: e.codigo, estado: Number(e.estado) || 0, titulo: e.titulo, mensaje: e.mensaje, accion: esTexto(e.accion) ? e.accion : "", request_id: esTexto(e.request_id) ? e.request_id : undefined };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** `detail` de FastAPI: texto, informe de CSV o cadena vacía si la respuesta no lo traía. */
    readonly detail: string | InformeCsv,
    /** Objeto `error` del backend, si la respuesta lo trae. */
    readonly error?: ErrorBackend,
    /** Código de seguimiento (`error.request_id` o la cabecera X-Request-ID). */
    readonly requestId?: string,
    /** Segundos de espera que pide un 429 (cabecera Retry-After), si los trae. */
    readonly esperaS?: number,
  ) {
    super(typeof detail === "string" && detail ? detail : `API ${status}`); // solo para depurar: la interfaz usa traducirError
    this.name = "ApiError";
  }
  get esNoEncontrado(): boolean {
    return this.status === API.NO_ENCONTRADO;
  }
  get esNoProcesable(): boolean {
    return this.status === API.NO_PROCESABLE;
  }
}
/** Ruta sin consulta: en la consola no se registran parámetros (podrían llevar datos del usuario). */
const soloRuta = (ruta: string): string => ruta.replace(/^https?:\/\/[^/]+/, "").split("?")[0];
/**
 * Única puerta por la que una respuesta fallida se convierte en ApiError: lee `detail`, el objeto `error` y el
 * código de seguimiento, y deja en la consola «[API] estado codigo request_id ruta» (sin claves ni datos).
 */
export function errorDeRespuesta(respuesta: { status: number; headers?: { get(nombre: string): string | null } }, cuerpo: unknown, ruta: string): ApiError {
  const detalle = (cuerpo as { detail?: unknown } | null)?.detail;
  const backend = leerErrorBackend(cuerpo);
  const requestId = backend?.request_id ?? respuesta.headers?.get(API.CABECERA_SEGUIMIENTO) ?? undefined;
  const codigo = backend?.codigo ?? CODIGO_POR_ESTADO[respuesta.status] ?? CODIGO_DESCONOCIDO;
  const registrar = respuesta.status >= 500 ? console.error : console.warn;
  registrar(`[API] ${respuesta.status} ${codigo} ${requestId ?? "-"} ${soloRuta(ruta)}`);
  const detail = typeof detalle === "string" ? detalle : esInforme(detalle) ? detalle : "";
  const espera = Number(respuesta.headers?.get(API.CABECERA_REINTENTO));
  return new ApiError(respuesta.status, detail, backend, requestId, Number.isFinite(espera) && espera > 0 ? Math.ceil(espera) : undefined);
}
const esInforme = (v: unknown): v is InformeCsv => typeof v === "object" && v !== null && !Array.isArray(v) && "valido" in v;
/** Fallo de red o de tiempo de espera: la API no llegó a responder. */
export class ErrorDeRed extends Error {
  constructor(readonly causa?: unknown, ruta = "") {
    super("sin conexión");
    this.name = "ErrorDeRed";
    console.warn(`[API] 0 ${CODIGO_SIN_CONEXION} - ${soloRuta(ruta)}`);
  }
}
/** La API no está (red caída, ruta sin registrar o servicio caído): único caso en que vale la muestra. */
export function esApiAusente(error: unknown): boolean {
  if (error instanceof ErrorDeRed) return true;
  if (!(error instanceof ApiError)) return false;
  if (error.status === API.NO_ENCONTRADO) return error.detail === API.DETALLE_RUTA_INEXISTENTE;
  return (API.ESTADOS_SIN_SERVICIO as readonly number[]).includes(error.status);
}

export type TipoAccion = "reintentar" | "clave" | "sitios" | "mes" | "ninguna";
/** Lo que la interfaz enseña de un error: nunca un estado a secas, un texto del navegador ni un JSON. */
export interface ErrorTraducido {
  codigo: string;
  /** 0 si no hubo respuesta. */
  estado: number;
  titulo: string;
  /** Qué pasó. */
  mensaje: string;
  /** Qué puede hacer el usuario (texto). */
  sugerencia: string;
  /** Qué botón ofrecer. */
  accion: TipoAccion;
  requestId?: string;
  /** Segundos que hay que esperar antes de reintentar (429 con Retry-After). */
  esperaS?: number;
}
export const CODIGO_SIN_CONEXION = "SIN_CONEXION";
export const CODIGO_DESCONOCIDO = "ERROR_DESCONOCIDO";
const CODIGO_POR_ESTADO: Record<number, string> = Object.fromEntries(Object.entries(ERRORES_POR_ESTADO).map(([estado, e]) => [estado, e.codigo]));

function accionDe(estado: number): TipoAccion {
  if (estado === API.NO_AUTORIZADO || estado === API.PROHIBIDO) return "clave";
  if (estado === API.NO_ENCONTRADO) return "sitios";
  if (estado === 0 || estado === 409 || estado === 429 || estado >= 500) return "reintentar";
  return "ninguna"; // 400, 413, 415, 422…: hay que corregir lo enviado, reintentar tal cual no sirve
}
/** `detail` solo vale como mensaje si es una frase para personas (no el texto por defecto del servidor ni JSON). */
const detalleLegible = (detail: unknown): string | null =>
  esTexto(detail) && detail !== API.DETALLE_RUTA_INEXISTENTE && !/^[[{<]/.test(detail.trim()) && !/^(internal server error|bad gateway|service unavailable|gateway timeout)$/i.test(detail.trim()) ? detail : null;

export const CODIGO_MES_SIN_DATOS = "MES_SIN_DATOS";
/** Frase con la que la API dice que «desde» o «hasta» caen fuera de los datos cargados (T.errores.fueraDeDatos). */
const FUERA_DE_DATOS = /fuera del rango de datos/i;
/** 422 de un periodo sin datos: no es un fallo ni algo que corregir en un formulario, es un mes que no existe en los datos. */
export function esMesSinDatos(error: unknown): boolean {
  return error instanceof ApiError && error.esNoProcesable && FUERA_DE_DATOS.test(`${error.error?.mensaje ?? ""} ${typeof error.detail === "string" ? error.detail : ""}`);
}

/** Catálogo por código: con él se traducen los textos del backend, que llegan en español, cuando la interfaz está en otro idioma. */
const ERRORES_POR_CODIGO = Object.fromEntries(Object.values(ERRORES_POR_ESTADO).map((e) => [e.codigo, e]));

/**
 * EL traductor: cualquier error (de la API, de red o inesperado) → título, mensaje, sugerencia y acción.
 * En español se muestran el título y el mensaje del backend tal cual; en otro idioma, los del catálogo propio,
 * buscados por el código del error (y, si el código no está, por el estado HTTP).
 */
export function traducirError(error: unknown, idioma: Idioma = IDIOMA): ErrorTraducido {
  if (error instanceof ErrorDeRed) return { codigo: CODIGO_SIN_CONEXION, estado: 0, ...T.errores.sinConexion, accion: "reintentar" };
  if (!(error instanceof ApiError)) return { codigo: CODIGO_DESCONOCIDO, estado: 0, ...T.errores.inesperado, accion: "reintentar" };
  if (esMesSinDatos(error)) return { codigo: CODIGO_MES_SIN_DATOS, estado: error.status, ...T.errores.mesSinDatos, accion: "mes", requestId: error.requestId };
  const base = ERRORES_POR_ESTADO[error.status] ?? (error.status >= 500 ? ERRORES_POR_ESTADO[500] : ERRORES_POR_ESTADO[400]);
  const b = error.error;
  if (idioma !== "es") {
    const propio = (b && ERRORES_POR_CODIGO[b.codigo]) || base;
    return {
      codigo: b?.codigo ?? base.codigo, estado: error.status, titulo: propio.titulo, mensaje: propio.mensaje,
      sugerencia: error.esperaS ? esperaYReintenta(error.esperaS) : propio.accion,
      accion: accionDe(error.status), requestId: error.requestId, esperaS: error.esperaS,
    };
  }
  return {
    codigo: b?.codigo ?? base.codigo,
    estado: error.status,
    titulo: b?.titulo ?? base.titulo,
    mensaje: b?.mensaje ?? detalleLegible(error.detail) ?? base.mensaje,
    sugerencia: error.esperaS ? esperaYReintenta(error.esperaS) : b?.accion || base.accion,
    accion: accionDe(error.status),
    requestId: error.requestId,
    esperaS: error.esperaS,
  };
}
