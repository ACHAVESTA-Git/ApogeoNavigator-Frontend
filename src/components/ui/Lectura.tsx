import type { ReactNode } from "react";
import { unir } from "./clases";

/** Rótulo de instrumento + valor monoespaciado (+ unidad). La pieza base de todas las lecturas. */
export function Lectura({ rotulo, children, unidad, nota, className }: {
  rotulo: ReactNode; children: ReactNode; unidad?: string; nota?: ReactNode; className?: string;
}) {
  return (
    <div className={unir("min-w-0", className)}>
      <dt className="rotulo">{rotulo}</dt>
      <dd className="text-dato text-texto mt-1 font-mono" data-dato>
        {children}
        {unidad && <span className="text-texto-2"> {unidad}</span>}
        {nota && <span className="text-apoyo text-texto-2 mt-0.5 block font-sans">{nota}</span>}
      </dd>
    </div>
  );
}
