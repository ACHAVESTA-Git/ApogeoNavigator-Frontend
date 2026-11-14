import { useSyncExternalStore } from "react";
import { BREAKPOINT_PX } from "../lib/constants";

const alRedimensionar = (avisar: () => void) => {
  window.addEventListener("resize", avisar);
  return () => window.removeEventListener("resize", avisar);
};
/** Alto de la ventana en px (para que el gráfico principal y sus controles quepan en el primer pliegue). */
export const useAltoVentana = (): number => useSyncExternalStore(alRedimensionar, () => window.innerHeight, () => 800);

/** ¿El ancho de la ventana alcanza el breakpoint? (mismos valores que --breakpoint-* del CSS). */
export function useDesde(breakpoint: keyof typeof BREAKPOINT_PX): boolean {
  const consulta = `(min-width: ${BREAKPOINT_PX[breakpoint]}px)`;
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia(consulta);
      mq.addEventListener("change", avisar);
      return () => mq.removeEventListener("change", avisar);
    },
    () => window.matchMedia(consulta).matches,
    () => true,
  );
}
