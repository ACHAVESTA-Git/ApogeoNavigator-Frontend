import { useMotionValueEvent, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MOVIMIENTO } from "../lib/constants";

/** El mismo valor, o dos objetos planos con los mismos campos. */
export function igualSuperficial<V>(a: V, b: V): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  const claves = Object.keys(a) as (keyof V)[];
  return claves.length === Object.keys(b).length && claves.every((k) => Object.is(a[k], b[k]));
}

/**
 * Valor de un MotionValue como estado de React, refrescado como mucho a `hz` (las lecturas no necesitan 60 fps).
 * Si el valor nuevo es igual al que ya hay, no se vuelve a renderizar: un `useTransform` que devuelve un objeto
 * emite «change» en cada render (el objeto es otro aunque diga lo mismo) y, sin esta comprobación, el componente
 * se renderizaba y repintaba su lienzo diez veces por segundo estando en reposo.
 */
export function useValorMotion<V>(valor: MotionValue<V>, hz: number = MOVIMIENTO.REFRESCO_LECTURA_HZ): V {
  const [estado, setEstado] = useState(() => valor.get());
  const ultimo = useRef(0);
  const pendiente = useRef<ReturnType<typeof setTimeout>>();
  const intervalo = 1000 / hz;
  useMotionValueEvent(valor, "change", (nuevo) => {
    clearTimeout(pendiente.current);
    const ahora = performance.now();
    if (ahora - ultimo.current >= intervalo) {
      ultimo.current = ahora;
      setEstado((previo) => (igualSuperficial(previo, nuevo) ? previo : nuevo));
    } else {
      pendiente.current = setTimeout(() => setEstado((previo) => (igualSuperficial(previo, valor.get()) ? previo : valor.get())), intervalo); // último valor al detenerse
    }
  });
  useEffect(() => () => clearTimeout(pendiente.current), []);
  return estado;
}
