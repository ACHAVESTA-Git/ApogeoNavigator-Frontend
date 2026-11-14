import type { ReactNode } from "react";
import { unir } from "./clases";

// [posición, borde fino, borde grueso (activo)]
const ESQUINAS = [
  ["top-0 left-0", "border-t border-l", "border-t-2 border-l-2"],
  ["top-0 right-0", "border-t border-r", "border-t-2 border-r-2"],
  ["bottom-0 left-0", "border-b border-l", "border-b-2 border-l-2"],
  ["bottom-0 right-0", "border-b border-r", "border-b-2 border-r-2"],
] as const;

/** Cuatro esquinas de 10 px que enmarcan sin rellenar: el sustituto de las tarjetas. */
export function Corchetes({ activo = false, className, children }: { activo?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={unir("relative", className)}>
      {ESQUINAS.map(([posicion, fino, grueso]) => (
        <span
          key={posicion}
          aria-hidden="true"
          className={unir("pointer-events-none absolute size-2.5", posicion, activo ? `${grueso} border-texto` : `${fino} border-horizonte`)}
        />
      ))}
      {children}
    </div>
  );
}
