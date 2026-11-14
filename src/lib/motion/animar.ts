// Única puerta para animar valores desde código: aplica el techo de duración de la interfaz y respeta
// prefers-reduced-motion por construcción (salta al estado final). Las «escenas» (trazo del hero, morph del
// horizonte, revelado de bandas, pliegue del popup) tienen su propia duración y no pasan por aquí.
import { animate } from "motion";
import { MOVIMIENTO } from "../constants";

const reducido = (): boolean => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface OpcionesAnimar {
  /** ms; se recorta a MOVIMIENTO.MEDIA (320 ms), el techo de la interfaz. */
  duracion?: number;
  curva?: readonly [number, number, number, number];
}
/** Interpola un número y llama a `alActualizar` en cada fotograma. Devuelve una función para detenerla. */
export function animarNumero(desde: number, hasta: number, alActualizar: (valor: number) => void,
  { duracion = MOVIMIENTO.MEDIA, curva = MOVIMIENTO.EASE_SALIDA }: OpcionesAnimar = {}): () => void {
  if (reducido() || desde === hasta) {
    alActualizar(hasta);
    return () => undefined;
  }
  const control = animate(desde, hasta, {
    duration: Math.min(duracion, MOVIMIENTO.MEDIA) / 1000,
    ease: [...curva] as [number, number, number, number],
    onUpdate: alActualizar,
  });
  return () => control.stop();
}
