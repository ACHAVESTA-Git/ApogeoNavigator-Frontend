import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";

export interface Dimensiones {
  ancho: number;
  alto: number;
}
/**
 * Tamaño de un elemento con ResizeObserver. Devuelve [refCallback, dimensiones].
 * Con `sincrono`, cada cambio de tamaño se pinta en el mismo fotograma (para cajas que cambian de tamaño de
 * forma animada: sin ello el contenido iría un fotograma por detrás de su caja).
 */
export function useDimensiones<E extends Element = HTMLDivElement>({ sincrono = false }: { sincrono?: boolean } = {}): [(el: E | null) => void, Dimensiones] {
  const [dim, setDim] = useState<Dimensiones>({ ancho: 0, alto: 0 });
  const observador = useRef<ResizeObserver | null>(null);
  const ref = useCallback((el: E | null) => {
    observador.current?.disconnect();
    if (!el) return;
    const medir = () => {
      const { width, height } = el.getBoundingClientRect();
      setDim((previo) => (previo.ancho === width && previo.alto === height ? previo : { ancho: width, alto: height }));
    };
    observador.current = new ResizeObserver(() => (sincrono ? flushSync(medir) : medir()));
    observador.current.observe(el);
    medir();
  }, [sincrono]);
  return [ref, dim];
}
