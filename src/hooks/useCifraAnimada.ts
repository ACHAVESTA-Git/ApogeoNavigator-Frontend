import { useEffect, useRef } from "react";
import { MOVIMIENTO } from "../lib/constants";
import { animarNumero } from "../lib/motion/animar";

/**
 * Cifra que interpola SOLO cuando cambia (otro sitio u otro rango), nunca en la primera carga: el cambio
 * explica la diferencia; contar desde cero al cargar solo retrasa la lectura. Escribe el texto sin rerender.
 */
export function useCifraAnimada<E extends HTMLElement>(valor: number, formato: (valor: number) => string, alAparecer = false) {
  const ref = useRef<E>(null);
  // `alAparecer`: la cifra cuenta desde 0 la primera vez (escena de una sola vez); después solo interpola al cambiar.
  const previo = useRef(alAparecer ? 0 : valor);
  const primera = useRef(alAparecer);
  useEffect(() => {
    const desde = previo.current;
    previo.current = valor;
    const escena = primera.current;
    primera.current = false;
    return animarNumero(desde, valor, (v) => {
      if (ref.current) ref.current.textContent = formato(v);
    }, escena ? { duracion: MOVIMIENTO.CONTEO, escena: true } : undefined);
  }, [valor, formato]);
  return ref;
}
