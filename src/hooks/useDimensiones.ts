import { useCallback, useRef, useState } from "react";

export interface Dimensiones {
  ancho: number;
  alto: number;
}
/** Tamaño de un elemento con ResizeObserver. Devuelve [refCallback, dimensiones]. */
export function useDimensiones<E extends Element = HTMLDivElement>(): [(el: E | null) => void, Dimensiones] {
  const [dim, setDim] = useState<Dimensiones>({ ancho: 0, alto: 0 });
  const observador = useRef<ResizeObserver | null>(null);
  const ref = useCallback((el: E | null) => {
    observador.current?.disconnect();
    if (!el) return;
    const medir = () => {
      const { width, height } = el.getBoundingClientRect();
      setDim((previo) => (previo.ancho === width && previo.alto === height ? previo : { ancho: width, alto: height }));
    };
    observador.current = new ResizeObserver(medir);
    observador.current.observe(el);
    medir();
  }, []);
  return [ref, dim];
}
