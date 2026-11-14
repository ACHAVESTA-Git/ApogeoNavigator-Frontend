import { useSyncExternalStore } from "react";
import { DATOS, REGEX, SESION } from "../lib/constants";

// Lista de sitios fijados para comparar (máx. 3). Persiste en sessionStorage si está disponible.
function leerGuardado(): string[] {
  try {
    const crudo: unknown = JSON.parse(sessionStorage.getItem(SESION.COMPARACION) ?? "[]");
    return Array.isArray(crudo) ? crudo.filter((v): v is string => typeof v === "string" && REGEX.SITE_ID.test(v)).slice(0, DATOS.MAX_COMPARAR) : [];
  } catch {
    return [];
  }
}
let fijados: string[] = leerGuardado();
const oyentes = new Set<() => void>();
function guardar(nuevos: string[]): void {
  fijados = nuevos;
  try {
    sessionStorage.setItem(SESION.COMPARACION, JSON.stringify(nuevos));
  } catch {
    // sin sessionStorage (modo privado estricto): la lista vive en memoria
  }
  oyentes.forEach((avisar) => avisar());
}
const suscribir = (avisar: () => void) => {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
};

export const comparacion = {
  /** Añade o quita. Devuelve false si no se pudo añadir porque ya hay 3. */
  alternar(id: string): boolean {
    if (fijados.includes(id)) guardar(fijados.filter((v) => v !== id));
    else if (fijados.length >= DATOS.MAX_COMPARAR) return false;
    else guardar([...fijados, id]);
    return true;
  },
  quitar: (id: string) => guardar(fijados.filter((v) => v !== id)),
  fijar: (ids: string[]) => guardar([...new Set(ids)].slice(0, DATOS.MAX_COMPARAR)),
};

export function useComparacion() {
  const ids = useSyncExternalStore(suscribir, () => fijados, () => fijados);
  return { ids, llena: ids.length >= DATOS.MAX_COMPARAR, lista: ids.length >= DATOS.MIN_COMPARAR, ...comparacion };
}
