// Idioma de la interfaz. Se decide una vez, al cargar la página: el guardado, si lo hay; si no, el del navegador;
// y, si el navegador no pide ni español ni inglés, inglés. Cambiarlo guarda la elección y recarga la página, porque
// los textos, las fechas y las cifras se resuelven al cargar los módulos (así no queda nada a medio traducir).
export const IDIOMAS = ["es", "en"] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const IDIOMA_POR_DEFECTO: Idioma = "en";
export const CLAVE_IDIOMA = "apogeo.idioma";

const esIdioma = (v: unknown): v is Idioma => (IDIOMAS as readonly unknown[]).includes(v);

/** Idioma que toca: el guardado si es válido; si no, el primero del navegador que sea español o inglés. */
export function detectarIdioma(guardado: string | null | undefined, preferidos: readonly string[] = []): Idioma {
  if (esIdioma(guardado)) return guardado;
  for (const preferido of preferidos) {
    const base = String(preferido).toLowerCase().split("-")[0];
    if (esIdioma(base)) return base;
  }
  return IDIOMA_POR_DEFECTO;
}

function leerGuardado(): string | null {
  try {
    return window.localStorage.getItem(CLAVE_IDIOMA);
  } catch {
    return null; // almacenamiento bloqueado (modo privado, políticas): se sigue con el idioma del navegador
  }
}
function preferidosDelNavegador(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  return navigator.languages?.length ? navigator.languages : [navigator.language];
}

export const IDIOMA: Idioma = typeof window === "undefined" ? IDIOMA_POR_DEFECTO : detectarIdioma(leerGuardado(), preferidosDelNavegador());

/** Deja `<html lang>` de acuerdo con el idioma de la interfaz (lectores de pantalla, traductores, guionado). */
export function aplicarIdiomaAlDocumento(idioma: Idioma = IDIOMA): void {
  if (typeof document !== "undefined") document.documentElement.lang = idioma;
}

/** Guarda la elección (si el navegador deja) y recarga. Devuelve false si ya era el idioma activo. */
export function cambiarIdioma(idioma: Idioma): boolean {
  if (idioma === IDIOMA) return false;
  let guardado = true;
  try {
    window.localStorage.setItem(CLAVE_IDIOMA, idioma);
  } catch {
    guardado = false;
  }
  if (!guardado) return false; // sin almacenamiento no hay forma de recordar la elección: la interfaz lo avisa
  window.location.reload();
  return true;
}
