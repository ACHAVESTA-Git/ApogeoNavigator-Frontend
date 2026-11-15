// Lógica del popup «Subir datos» (docs/plan/estandar-carga-ui.md): tipo por nombre, límites, validación y
// guardado EN SECUENCIA (un archivo por petición), agrupación y contadores. Sin React.
import { guardarCsv, validarCsv } from "./api";
import { API, CARGA, REGEX, TIPOS_ARCHIVO } from "./constants";
import { ApiError, traducirError } from "./errores";
import { T } from "./textos";
import type { InformeCsv, ResultadoGuardado, TipoArchivo } from "./tipos";

export type EstadoArchivo = "pendiente" | "validando" | "valido" | "advertencias" | "errores" | "guardando" | "guardado" | "no_guardado";
export interface ArchivoCarga {
  id: string;
  archivo: File;
  tipo: TipoArchivo | null;
  /** site_id de `efemerides_<id>.csv` (para recargar sus efemérides al terminar). */
  siteId: string | null;
  /** Problema detectable sin el servidor (nombre, extensión, tamaño). Bloquea «Validar». */
  errorLocal: string | null;
  estado: EstadoArchivo;
  informe: InformeCsv | null;
  /** Mensaje del servidor cuando el rechazo no trae informe (413, 415…). */
  mensaje: string | null;
}

/** La clave de carga no es válida (401): hay que volver a pedirla. */
export class ClaveInvalida extends Error {}
/** Red caída o 5xx: se puede reintentar sin perder nada. */
export class ServicioNoDisponible extends Error {}

const MB = 1024 * 1024;
export function detectarTipo(nombre: string): { tipo: TipoArchivo; siteId: string | null } | null {
  for (const tipo of TIPOS_ARCHIVO) {
    const coincidencia = REGEX.ARCHIVO[tipo].exec(nombre);
    if (coincidencia) return { tipo, siteId: coincidencia[1] ?? null };
  }
  return null;
}
function revisar(archivo: File): string | null {
  if (!archivo.name.toLowerCase().endsWith(CARGA.EXTENSION)) return T.carga.noEsCsv;
  if (!detectarTipo(archivo.name)) return T.carga.nombreNoReconocido;
  if (archivo.size > CARGA.MAX_BYTES) return T.carga.demasiadoGrande(CARGA.MAX_BYTES / MB);
  if (archivo.size === 0) return T.carga.vacio;
  return null;
}
export function crearArchivo(archivo: File): ArchivoCarga {
  const detectado = detectarTipo(archivo.name);
  return {
    id: `${archivo.name}:${archivo.size}:${archivo.lastModified}`,
    archivo, tipo: detectado?.tipo ?? null, siteId: detectado?.siteId ?? null,
    errorLocal: revisar(archivo), estado: "pendiente", informe: null, mensaje: null,
  };
}
/** Añade archivos respetando el máximo de 10 y sin repetir nombres. `aviso` explica lo que no entró. */
export function agregarArchivos(actuales: readonly ArchivoCarga[], nuevos: readonly File[]): { lista: ArchivoCarga[]; aviso: string | null } {
  const lista = [...actuales];
  let aviso: string | null = null;
  for (const archivo of nuevos) {
    if (lista.some((a) => a.archivo.name === archivo.name)) aviso = T.carga.repetido(archivo.name);
    else if (lista.length >= CARGA.MAX_ARCHIVOS) aviso = T.carga.demasiados(CARGA.MAX_ARCHIVOS);
    else lista.push(crearArchivo(archivo));
  }
  return { lista, aviso };
}

export const esGuardable = (a: ArchivoCarga): boolean => a.estado === "valido" || a.estado === "advertencias";
export const puedeValidar = (archivos: readonly ArchivoCarga[]): boolean => archivos.length > 0 && archivos.every((a) => !a.errorLocal);

const GRUPO: Record<EstadoArchivo, number> = {
  valido: 0, guardado: 0, advertencias: 1, errores: 2, no_guardado: 2, pendiente: 3, validando: 3, guardando: 3,
};
/** Válido → Con advertencias → Con errores, conservando el orden dentro de cada grupo. Se llama UNA vez. */
export const agrupar = (archivos: readonly ArchivoCarga[]): ArchivoCarga[] =>
  archivos.map((a, i) => [a, i] as const).sort(([a, i], [b, j]) => GRUPO[a.estado] - GRUPO[b.estado] || i - j).map(([a]) => a);

export function contar(archivos: readonly ArchivoCarga[]) {
  const de = (...estados: EstadoArchivo[]) => archivos.filter((a) => estados.includes(a.estado)).length;
  return { guardables: de("valido", "advertencias"), conErrores: de("errores"), guardados: de("guardado"), noGuardados: de("no_guardado", "errores") };
}

/** «← Anterior»: los archivos sin guardar vuelven a estar pendientes (se validarán de nuevo); no se pierde ninguno. */
export const reiniciar = (archivos: readonly ArchivoCarga[]): ArchivoCarga[] =>
  archivos.filter((a) => a.estado !== "guardado").map((a) => ({ ...a, estado: "pendiente", informe: null, mensaje: null }));
/** «Revisar los no guardados»: solo ellos, de vuelta en el paso de revisión. */
export const soloNoGuardados = (archivos: readonly ArchivoCarga[]): ArchivoCarga[] =>
  archivos.filter((a) => a.estado !== "guardado").map((a) => (a.estado === "no_guardado" ? { ...a, estado: "errores" } : a));

type Cambio = Pick<ArchivoCarga, "estado" | "informe" | "mensaje">;
/** «Título. Mensaje», sin repetir el título si el mensaje ya empieza por él. */
const conTitulo = (titulo: string, mensaje: string): string =>
  mensaje.toLowerCase().startsWith(titulo.toLowerCase()) ? mensaje : `${titulo.replace(/[.:]\s*$/, "")}. ${mensaje}`;
/** Convierte la respuesta (o el error) de un archivo en su nuevo estado. Lanza si hay que parar toda la tanda. */
function interpretar(error: unknown, siFalla: EstadoArchivo): Cambio {
  if (error instanceof ApiError) {
    if (error.status === API.NO_AUTORIZADO) throw new ClaveInvalida();
    if (error.status >= 500) throw new ServicioNoDisponible();
    // El informe por fila y columna se conserva; el resumen sale del traductor único (nunca un estado a secas).
    const { titulo, mensaje, sugerencia } = traducirError(error);
    // Si la respuesta trae el objeto `error`, su título y su mensaje se muestran tal cual, sin texto propio.
    const delBackend = error.error ? conTitulo(titulo, mensaje) : null;
    if (typeof error.detail !== "string") return { estado: siFalla, informe: error.detail, mensaje: delBackend };
    if (delBackend) return { estado: siFalla, informe: null, mensaje: `${delBackend} ${sugerencia}`.trim() };
    return { estado: siFalla, informe: null, mensaje: mensaje === error.detail ? mensaje : `${mensaje} ${sugerencia}`.trim() }; // el texto del servidor ya dice qué hacer
  }
  throw new ServicioNoDisponible();
}
const deInforme = (informe: InformeCsv): Cambio => ({
  estado: !informe.valido ? "errores" : informe.advertencias.length ? "advertencias" : "valido", informe, mensaje: null,
});

// Los sitios van primero: las efemérides y las métricas se validan contra el catálogo.
const enOrdenDeEnvio = (archivos: readonly ArchivoCarga[]): ArchivoCarga[] =>
  [...archivos].sort((a, b) => TIPOS_ARCHIVO.indexOf(a.tipo ?? "metricas") - TIPOS_ARCHIVO.indexOf(b.tipo ?? "metricas"));

type AlCambiar = (id: string, cambio: Partial<ArchivoCarga>, hechos: number, total: number) => void;
export interface Envio {
  validar: (tipo: TipoArchivo, archivo: File, clave: string) => Promise<InformeCsv>;
  guardar: (tipo: TipoArchivo, archivo: File, clave: string) => Promise<ResultadoGuardado>;
}
const ENVIO_API: Envio = { validar: validarCsv, guardar: guardarCsv };

let candado = false;
/** Ejecuta una tanda de envíos uno tras otro. Si ya hay una en curso (doble clic), no hace nada. */
async function enSecuencia(pendientes: ArchivoCarga[], enCurso: EstadoArchivo, alCambiar: AlCambiar,
  enviar: (a: ArchivoCarga) => Promise<Cambio>): Promise<boolean> {
  if (candado) return false;
  candado = true;
  try {
    const cola = enOrdenDeEnvio(pendientes);
    for (const [i, a] of cola.entries()) {
      alCambiar(a.id, { estado: enCurso }, i, cola.length);
      try {
        alCambiar(a.id, await enviar(a), i + 1, cola.length);
      } catch (error) {
        alCambiar(a.id, { estado: a.estado }, i, cola.length); // vuelve a su estado: se puede reintentar
        throw error;
      }
    }
    return true;
  } finally {
    candado = false;
  }
}

/** Dry-run de los archivos pendientes, en secuencia. */
export const validarEnSecuencia = (archivos: readonly ArchivoCarga[], clave: string, alCambiar: AlCambiar, envio: Envio = ENVIO_API) =>
  enSecuencia(archivos.filter((a) => a.estado === "pendiente" && a.tipo), "validando", alCambiar, async (a) => {
    try {
      return deInforme(await envio.validar(a.tipo as TipoArchivo, a.archivo, clave));
    } catch (error) {
      return interpretar(error, "errores");
    }
  });

/** Guarda solo los válidos y los que tienen advertencias: un POST por archivo. */
export const guardarEnSecuencia = (archivos: readonly ArchivoCarga[], clave: string, alCambiar: AlCambiar, envio: Envio = ENVIO_API) =>
  enSecuencia(archivos.filter(esGuardable), "guardando", alCambiar, async (a) => {
    try {
      const resultado = await envio.guardar(a.tipo as TipoArchivo, a.archivo, clave);
      return { estado: resultado.guardado ? "guardado" : "no_guardado", informe: resultado, mensaje: null };
    } catch (error) {
      return interpretar(error, "no_guardado");
    }
  });
