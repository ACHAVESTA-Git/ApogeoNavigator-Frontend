// Sesión de usuario. El backend la guarda en una cookie httpOnly: el navegador la envía sola y este código nunca
// ve el token. La contraseña solo vive en el formulario mientras se envía; no se guarda ni se registra en ningún sitio.
//
// Contrato (provisional hasta que el backend lo cierre):
//   POST /api/auth/login {email, password} → pone la cookie de sesión
//   POST /api/auth/logout
//   GET  /api/auth/me → {id, nombre, rol, huellas PQC}
import { API } from "./constants";
import { ApiError, ErrorDeRed, errorDeRespuesta } from "./errores";

export const ROLES = ["analista", "revisor", "admin"] as const;
export type Rol = (typeof ROLES)[number];
/** Huella pública de una clave post-cuántica del usuario. Nunca hay material privado en la sesión. */
export interface HuellaPqc {
  algoritmo: string;
  huella: string;
}
export interface UsuarioSesion {
  id: string;
  nombre: string;
  rol: Rol;
  huellas: HuellaPqc[];
}

/**
 * Marca que se pasa en lugar de una clave de API cuando hay sesión: la petición va con la cookie y sin X-API-Key.
 * No es un secreto ni sale del navegador.
 */
export const CLAVE_DE_SESION = "\u0000sesion";
const CABECERA_SESION = { [API.CABECERA_PETICION]: API.VALOR_PETICION };

/** Cómo se identifica una petición protegida: con la sesión (cookie y X-Requested-With) o con la clave de API. */
export function accesoApi(clave: string): { headers: Record<string, string>; credentials?: RequestCredentials } {
  return clave === CLAVE_DE_SESION ? { headers: CABECERA_SESION, credentials: "include" } : { headers: { [API.CABECERA_CLAVE]: clave } };
}

// Indicio de que este navegador inició sesión: evita preguntar por la sesión (y anotar un 401) en cada visita
// anónima. Solo dice «pregunta»; no es un token ni da acceso a nada.
const INDICIO = "apogeo.sesion";
function hayIndicio(): boolean {
  try {
    return window.localStorage.getItem(INDICIO) === "1";
  } catch {
    return false;
  }
}
function marcarIndicio(activo: boolean): void {
  try {
    if (activo) window.localStorage.setItem(INDICIO, "1");
    else window.localStorage.removeItem(INDICIO);
  } catch {
    // sin almacenamiento: la sesión vale mientras dure la página
  }
}

const esTexto = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
/**
 * Huellas del usuario. Se admite una lista de {algoritmo, huella} (o `huella_sha3_256`, como en el gestor de claves)
 * o un objeto algoritmo → huella. Cualquier otro campo se ignora: aquí no entra nada que no sea una huella.
 */
export function leerHuellas(valor: unknown): HuellaPqc[] {
  if (Array.isArray(valor)) {
    return valor.flatMap((h: unknown) => {
      const { algoritmo, huella, huella_sha3_256 } = (h ?? {}) as Record<string, unknown>;
      const texto = esTexto(huella) ? huella : huella_sha3_256;
      return esTexto(algoritmo) && esTexto(texto) ? [{ algoritmo, huella: texto }] : [];
    });
  }
  if (valor && typeof valor === "object") {
    return Object.entries(valor).flatMap(([algoritmo, huella]) => (esTexto(huella) ? [{ algoritmo, huella }] : []));
  }
  return [];
}
/** Valida la respuesta de /api/auth/me: sin id, nombre o un rol conocido no hay sesión. */
export function leerUsuario(cuerpo: unknown): UsuarioSesion | null {
  const u = (cuerpo ?? {}) as Record<string, unknown>;
  if (!(esTexto(u.id) || typeof u.id === "number") || !esTexto(u.nombre) || !(ROLES as readonly unknown[]).includes(u.rol)) return null;
  return { id: String(u.id), nombre: u.nombre, rol: u.rol as Rol, huellas: leerHuellas(u.huellas ?? u.huellas_pqc) };
}

async function llamar(ruta: string, init: RequestInit = {}): Promise<unknown> {
  let respuesta: Response;
  try {
    respuesta = await fetch(ruta, {
      ...init,
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json", ...CABECERA_SESION, ...(init.body ? { "Content-Type": "application/json" } : {}) },
    });
  } catch (error) {
    throw new ErrorDeRed(error, ruta);
  }
  const cuerpo: unknown = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw errorDeRespuesta(respuesta, cuerpo, ruta);
  return cuerpo;
}

/** Usuario de la sesión o null si no hay. Sin indicio de sesión no se pregunta al servidor. */
export async function obtenerSesion(url: (ruta: string) => string): Promise<UsuarioSesion | null> {
  if (!hayIndicio()) return null;
  try {
    const usuario = leerUsuario(await llamar(url(API.AUTH_ME)));
    if (!usuario) marcarIndicio(false);
    return usuario;
  } catch (error) {
    // 401/403: la sesión caducó. Con la API caída o sin la ruta no se borra el indicio: se volverá a preguntar.
    if (error instanceof ApiError && (error.status === API.NO_AUTORIZADO || error.status === API.PROHIBIDO)) marcarIndicio(false);
    return null;
  }
}
/** Inicia sesión y devuelve el usuario. La contraseña va solo en el cuerpo de esta petición. */
export async function iniciarSesion(url: (ruta: string) => string, email: string, password: string): Promise<UsuarioSesion> {
  await llamar(url(API.AUTH_LOGIN), { method: "POST", body: JSON.stringify({ email, password }) });
  const usuario = leerUsuario(await llamar(url(API.AUTH_ME)));
  if (!usuario) throw new ApiError(API.NO_AUTORIZADO, "");
  marcarIndicio(true);
  return usuario;
}
/** Cierra la sesión. Aunque el servidor falle, este navegador deja de considerarse con sesión. */
export async function cerrarSesion(url: (ruta: string) => string): Promise<void> {
  marcarIndicio(false);
  await llamar(url(API.AUTH_LOGOUT), { method: "POST" }).catch(() => undefined);
}

/** 'AC' de 'Ana Castro'; '?' si no hay letras. */
export function iniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  const letras = [palabras[0], palabras.length > 1 ? palabras[palabras.length - 1] : ""].map((p) => [...(p ?? "")][0] ?? "").join("");
  return letras.toUpperCase() || "?";
}
