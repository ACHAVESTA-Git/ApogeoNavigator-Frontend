import { useCallback, useRef } from "react";

/**
 * Devuelve un formateador con identidad estable que siempre llama al último recibido: así un `formato` escrito en
 * línea por quien usa la primitiva no reinicia (ni corta a medias) el conteo de la cifra en cada render.
 */
export function useFormatoEstable(formato: (valor: number) => string): (valor: number) => string {
  const ultimo = useRef(formato);
  ultimo.current = formato;
  return useCallback((valor: number) => ultimo.current(valor), []);
}
