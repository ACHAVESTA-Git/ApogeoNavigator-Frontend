// Cliente tipado del Gestor de claves post-cuánticas (contrato: docs/plan/seguridad-oauth-pqc.md §7.3).
import { urlApi } from "./api";
import { API } from "./constants";
import { ErrorDeRed, errorDeRespuesta, esApiAusente } from "./errores";

export type TipoClave = "kem" | "firma";
export type EstadoClave = "activa" | "revocada";
export interface Clave {
  id: string;
  usuario_id: string;
  usuario_email: string;
  usuario_nombre: string;
  tipo: TipoClave;
  algoritmo: string;
  estado: EstadoClave;
  huella_sha3_256: string;
  tamano_publica: number;
  tamano_privada: number;
  tamano_privada_fips: number;
  creada_utc: string;
  revocada_utc: string | null;
  motivo_revocacion: string | null;
  reemplazada_por: string | null;
  backups: number;
}
/** Solo en las respuestas de generar y rotar. `privada_pem` existe UNA vez: no se guarda en ningún sitio. */
export interface ClaveEntregada extends Clave {
  clave_publica_pem: string;
  privada_pem: string;
  nombre_archivo_privada: string;
}
export interface Entrega {
  aviso: string;
  claves: ClaveEntregada[];
}
export interface PaginaClaves {
  total: number;
  limite: number;
  offset: number;
  items: Clave[];
  /** true si son filas ficticias porque la API no responde (se marca en la pantalla). */
  ejemplo?: boolean;
}
export interface FiltrosClaves {
  estado?: EstadoClave;
  tipo?: TipoClave;
  q?: string;
}

async function llamar<T>(ruta: string, claveAdmin: string, init: RequestInit = {}, params: Record<string, string | undefined> = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(urlApi(ruta, params), {
      ...init,
      cache: "no-store", // nada de esto debe quedar en la caché del navegador
      headers: { Accept: "application/json", [API.CABECERA_CLAVE]: claveAdmin, ...(init.body ? { "Content-Type": "application/json" } : {}) },
    });
  } catch (error) {
    throw new ErrorDeRed(error);
  }
  const cuerpo: unknown = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw errorDeRespuesta(respuesta, cuerpo, ruta);
  return cuerpo as T;
}
const publicar = (cuerpo: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(cuerpo) });

export async function listarClaves(claveAdmin: string, filtros: FiltrosClaves, limite: number): Promise<PaginaClaves> {
  try {
    return await llamar<PaginaClaves>(API.CLAVES, claveAdmin, {}, { ...filtros, q: filtros.q || undefined, limite: String(limite) });
  } catch (error) {
    if (!esApiAusente(error)) throw error;
    const items = CLAVES_EJEMPLO.filter((c) => (!filtros.estado || c.estado === filtros.estado) && (!filtros.tipo || c.tipo === filtros.tipo) &&
      (!filtros.q || `${c.usuario_email} ${c.usuario_nombre}`.toLowerCase().includes(filtros.q.toLowerCase())));
    return { total: items.length, limite, offset: 0, items, ejemplo: true };
  }
}
export const generarClaves = (claveAdmin: string, usuarioId: string, tipos: TipoClave[]) =>
  llamar<Entrega>(API.CLAVES, claveAdmin, publicar({ usuario_id: usuarioId, tipos }));
export const revocarClave = (claveAdmin: string, id: string, motivo: string) =>
  llamar<Clave>(API.CLAVE_REVOCAR(id), claveAdmin, publicar({ motivo }));
export const rotarClave = (claveAdmin: string, id: string, motivo: string) =>
  llamar<Entrega>(API.CLAVE_ROTAR(id), claveAdmin, publicar(motivo ? { motivo } : {}));
/** Clave pública en PEM (`?formato=pem`). También funciona con claves revocadas. */
export async function obtenerPublicaPem(claveAdmin: string, id: string): Promise<string> {
  let respuesta: Response;
  try {
    respuesta = await fetch(urlApi(API.CLAVE_PUBLICA(id), { formato: "pem" }), { cache: "no-store", headers: { [API.CABECERA_CLAVE]: claveAdmin } });
  } catch (error) {
    throw new ErrorDeRed(error);
  }
  if (!respuesta.ok) throw errorDeRespuesta(respuesta, null, API.CLAVE_PUBLICA(id));
  return respuesta.text();
}

/** Crea el archivo en el navegador y lo descarga. El texto no se guarda en ningún almacenamiento. */
export function descargarTexto(nombre: string, texto: string): void {
  const url = URL.createObjectURL(new Blob([texto], { type: "application/x-pem-file" }));
  const enlace = Object.assign(document.createElement("a"), { href: url, download: nombre });
  enlace.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------- DATOS DE EJEMPLO (ficticios, marcados en la interfaz)
// Solo se usan si la API del gestor no responde. Usuarios de example.org y huellas obviamente falsas.
const ejemplo = (n: number, tipo: TipoClave, estado: EstadoClave, usuario: string, nombre: string): Clave => ({
  id: `00000000-0000-4000-8000-00000000000${n}`, usuario_id: `00000000-0000-4000-8000-0000000000a${n % 3}`,
  usuario_email: `${usuario}@example.org`, usuario_nombre: nombre, tipo, estado,
  algoritmo: tipo === "kem" ? "ML-KEM-1024" : "ML-DSA-65",
  huella_sha3_256: `ejemplo${n}`.padEnd(64, "0"),
  tamano_publica: tipo === "kem" ? 1568 : 1952, tamano_privada: tipo === "kem" ? 64 : 32, tamano_privada_fips: tipo === "kem" ? 3168 : 4032,
  creada_utc: `2026-11-1${n}T15:00:00Z`, revocada_utc: estado === "revocada" ? "2026-11-14T18:30:00Z" : null,
  motivo_revocacion: estado === "revocada" ? "ejemplo: extravío de la privada" : null, reemplazada_por: null, backups: estado === "activa" ? 1 : 0,
});
export const CLAVES_EJEMPLO: Clave[] = [
  ejemplo(4, "kem", "activa", "analista.ejemplo", "Analista de ejemplo"),
  ejemplo(3, "firma", "activa", "analista.ejemplo", "Analista de ejemplo"),
  ejemplo(2, "kem", "activa", "revisor.ejemplo", "Revisor de ejemplo"),
  ejemplo(1, "firma", "revocada", "revisor.ejemplo", "Revisor de ejemplo"),
];
export const entregaDeEjemplo = (tipos: TipoClave[]): Entrega => ({
  aviso: "EJEMPLO",
  claves: tipos.map((tipo, i) => ({
    ...ejemplo(8 + i, tipo, "activa", "nuevo.ejemplo", "Usuario de ejemplo"),
    clave_publica_pem: "-----BEGIN PUBLIC KEY-----\nEJEMPLO: NO ES UNA CLAVE REAL\n-----END PUBLIC KEY-----\n",
    privada_pem: "-----BEGIN PRIVATE KEY-----\nEJEMPLO: NO ES UNA CLAVE REAL (la API del gestor no responde)\n-----END PRIVATE KEY-----\n",
    nombre_archivo_privada: `${tipo}-ejemplo.privada.pem`,
  })),
});
