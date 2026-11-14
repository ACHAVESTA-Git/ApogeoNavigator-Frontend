import { useMotionValueEvent, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MOVIMIENTO } from "../lib/constants";

/** Valor de un MotionValue como estado de React, refrescado como mucho a `hz` (las lecturas no necesitan 60 fps). */
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
      setEstado(nuevo);
    } else {
      pendiente.current = setTimeout(() => setEstado(valor.get()), intervalo); // último valor al detenerse
    }
  });
  useEffect(() => () => clearTimeout(pendiente.current), []);
  return estado;
}
