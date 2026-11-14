import { useEffect, useRef } from "react";
import { animarNumero } from "../lib/motion/animar";

/**
 * Cifra que interpola SOLO cuando cambia (otro sitio u otro rango), nunca en la primera carga: el cambio
 * explica la diferencia; contar desde cero al cargar solo retrasa la lectura. Escribe el texto sin rerender.
 */
export function useCifraAnimada<E extends HTMLElement>(valor: number, formato: (valor: number) => string) {
  const ref = useRef<E>(null);
  const previo = useRef(valor);
  useEffect(() => {
    const desde = previo.current;
    previo.current = valor;
    return animarNumero(desde, valor, (v) => {
      if (ref.current) ref.current.textContent = formato(v);
    });
  }, [valor, formato]);
  return ref;
}
