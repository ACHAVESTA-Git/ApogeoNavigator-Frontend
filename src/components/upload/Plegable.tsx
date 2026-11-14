import type { ReactNode } from "react";
import { unir } from "../ui/clases";

/**
 * Pliegue sin animar alturas: grid-template-rows 0fr ↔ 1fr con hijo de min-height 0 (estándar de carga §2).
 * 450 ms con cubic-bezier(0.22,1,0.36,1) y opacidad en 250 ms; `rapido` usa 200 ms (detalle de una fila).
 */
export function Plegable({ abierto, rapido = false, className, children }: { abierto: boolean; rapido?: boolean; className?: string; children: ReactNode }) {
  // `inert` saca lo plegado del orden de tabulación y de los lectores de pantalla.
  const inerte = abierto ? {} : { inert: "" };
  return (
    <div className={unir("plegable", className)} data-abierto={abierto} data-rapido={rapido} aria-hidden={!abierto} {...inerte}>
      <div>{children}</div>
    </div>
  );
}
