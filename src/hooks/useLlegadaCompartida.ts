import { useEffect, useRef } from "react";
import { llegarDesdeOrigen } from "../lib/motion/vuelo";

/** Ref para el elemento de llegada de una transición compartida entre rutas (ver `lib/motion/vuelo`). */
export function useLlegadaCompartida<E extends HTMLElement>(clave: string) {
  const ref = useRef<E>(null);
  useEffect(() => {
    let detener: (() => void) | undefined;
    // Un fotograma después: la ruta ya reinició el scroll y la caja de destino es la definitiva.
    const cuadro = requestAnimationFrame(() => {
      if (ref.current) detener = llegarDesdeOrigen(clave, ref.current);
    });
    return () => {
      cancelAnimationFrame(cuadro);
      detener?.();
    };
  }, [clave]);
  return ref;
}
