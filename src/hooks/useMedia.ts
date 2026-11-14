import { useSyncExternalStore } from "react";
import { BREAKPOINT_PX } from "../lib/constants";

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
