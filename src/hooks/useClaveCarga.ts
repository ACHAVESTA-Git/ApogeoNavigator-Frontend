import { useCallback, useState } from "react";

/**
 * Clave de la API (X-API-Key) que escribe la persona en el popup. NUNCA va en el bundle ni en VITE_*.
 * Vive en sessionStorage (solo esta pestaña); si no está disponible, queda en memoria.
 */
const enMemoria = new Map<string, string>();
function leer(almacen: string): string {
  try {
    return sessionStorage.getItem(almacen) ?? enMemoria.get(almacen) ?? "";
  } catch {
    return enMemoria.get(almacen) ?? "";
  }
}
export function useClaveGuardada(almacen: string) {
  const [clave, setClave] = useState(() => leer(almacen));
  const guardar = useCallback(
    (valor: string) => {
      setClave(valor);
      enMemoria.set(almacen, valor);
      try {
        sessionStorage.setItem(almacen, valor);
      } catch {
        // sin sessionStorage: se queda en memoria
      }
    },
    [almacen],
  );
  /** Ante un 401 se borra para volver a pedirla. */
  const borrar = useCallback(() => {
    setClave("");
    enMemoria.delete(almacen);
    try {
      sessionStorage.removeItem(almacen);
    } catch {
      // nada que borrar
    }
  }, [almacen]);
  return { clave, guardar, borrar };
}
