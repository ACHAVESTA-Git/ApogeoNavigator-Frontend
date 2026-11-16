import { useEffect, useRef, useState } from "react";
import { PORTADA } from "../lib/constants";

/** true desde que el elemento entra en pantalla por primera vez (y ya no cambia): revelados de una sola vez. */
export function useRevelado<E extends Element = HTMLDivElement>() {
  const ref = useRef<E | null>(null);
  const [visto, setVisto] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current;
    if (visto || !el) return;
    const observador = new IntersectionObserver(([entrada]) => {
      if (!entrada.isIntersecting) return;
      setVisto(true);
      observador.disconnect();
    }, { rootMargin: PORTADA.REVELADO_MARGEN });
    observador.observe(el);
    return () => observador.disconnect();
  }, [visto]);
  return { ref, visto };
}
