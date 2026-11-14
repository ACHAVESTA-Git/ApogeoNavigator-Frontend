import { useCallback, type KeyboardEvent } from "react";
import { HORAS_POR_DIA } from "../lib/constants";
import type { RelojSimulacion } from "./useRelojSimulacion";

/** Atajos del Cielo y del Día lunar (con el foco en el gráfico). `extra` añade teclas propias de cada vista. */
export function useTeclasTiempo(reloj: RelojSimulacion, extra?: (tecla: string) => boolean) {
  const { paso, irA, alternar, desdeMs, hastaMs } = reloj;
  return useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement || e.target instanceof HTMLSelectElement) return;
      const salto = e.shiftKey ? HORAS_POR_DIA : 1;
      const acciones: Record<string, () => void> = {
        ArrowLeft: () => paso(-salto),
        ArrowRight: () => paso(salto),
        PageUp: () => paso(-HORAS_POR_DIA),
        PageDown: () => paso(HORAS_POR_DIA),
        Home: () => irA(desdeMs),
        End: () => irA(hastaMs),
        " ": alternar,
      };
      const accion = acciones[e.key];
      if (accion) accion();
      else if (!extra?.(e.key)) return;
      e.preventDefault();
    },
    [paso, irA, alternar, desdeMs, hastaMs, extra],
  );
}
