import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { unir } from "./clases";

/** Revelado progresivo con <details> nativo (teclado y lectores de pantalla gratis). */
export function Desplegable({ titulo, children, className, abierto }: { titulo: ReactNode; children: ReactNode; className?: string; abierto?: boolean }) {
  return (
    <details open={abierto} className={unir("group border-linea border-t", className)}>
      <summary className="tactil text-apoyo text-texto-2 hover:text-texto flex items-center justify-between gap-3 font-semibold">
        {titulo}
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform duration-(--dur-corta) group-open:rotate-180" />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}
