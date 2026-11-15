import { useEffect, useRef, useState } from "react";

/** true mientras el elemento está en pantalla y la pestaña visible: las animaciones autónomas se pausan si no. */
export function useVisibleEnPantalla<E extends Element = HTMLDivElement>() {
  const ref = useRef<E | null>(null);
  const [enPantalla, setEnPantalla] = useState(true);
  const [pestanaVisible, setPestanaVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const alCambiar = () => setPestanaVisible(!document.hidden);
    document.addEventListener("visibilitychange", alCambiar);
    const el = ref.current;
    const observador = new IntersectionObserver(([entrada]) => setEnPantalla(entrada.isIntersecting));
    if (el) observador.observe(el);
    return () => {
      document.removeEventListener("visibilitychange", alCambiar);
      observador.disconnect();
    };
  }, []);
  return { ref, visible: enPantalla && pestanaVisible };
}
