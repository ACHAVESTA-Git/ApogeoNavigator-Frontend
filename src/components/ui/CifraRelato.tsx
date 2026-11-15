import type { ReactNode } from "react";
import { useCifraAnimada } from "../../hooks/useCifraAnimada";
import { pct } from "../../lib/formato";
import type { Astro } from "../../lib/tipos";
import { GlifoAstro } from "../glifos/Astros";
import { unir } from "./clases";

export interface MarcaCifra {
  /** Porcentaje (0 a 100) donde cae la referencia sobre la barra. */
  valor: number;
  /** Texto que la nombra: la marca nunca va sola. */
  texto: string;
}

/**
 * Una cifra con su relato: qué significa (`detalle`), con qué se compara (`marca`, una raya sobre la barra y su
 * frase) y por qué importa (`relato`). El porcentaje cuenta desde 0 la primera vez y solo interpola al cambiar.
 */
export function CifraRelato({ astro, rotulo, porcentaje, lectura, detalle, marca, relato, children, compacto = false, titulo: Titulo = "h2", className }: {
  astro: Astro; rotulo: string; porcentaje: number; lectura: ReactNode; detalle?: string; marca?: MarcaCifra | null; relato: string;
  children?: ReactNode; compacto?: boolean; titulo?: "h2" | "h3"; className?: string;
}) {
  const cifra = useCifraAnimada<HTMLParagraphElement>(porcentaje, pct, true);
  return (
    <div className={unir("panel min-w-0", compacto ? "p-4" : "p-4 md:p-5", className)}>
      <Titulo className="rotulo flex items-center gap-2">
        <GlifoAstro astro={astro} px={14} />
        {rotulo}
      </Titulo>
      <p ref={cifra} data-dato
        className={unir("text-texto mt-2 font-mono leading-none font-medium whitespace-nowrap", compacto ? "text-[1.75rem]" : "sm:text-dato-xl text-[2rem]")}>
        {pct(porcentaje)}
      </p>
      <p className="text-dato-sm text-texto-2 mt-1.5 font-mono" data-dato>{lectura}</p>
      {detalle && <p className="text-texto-3 mt-0.5 text-[0.75rem]">{detalle}</p>}
      {/* proporción del periodo: crece al aparecer, junto con el conteo; la raya es la referencia */}
      <div aria-hidden="true" className="relative mt-3 py-1">
        <div className="bg-texto/10 h-1 overflow-hidden rounded-full">
          <div className={unir("animate-crecer h-full origin-left rounded-full", astro === "sol" ? "bg-sol" : "bg-tierra")} style={{ width: `${porcentaje}%` }} />
        </div>
        {marca && <span className="bg-texto absolute inset-y-0 w-px" style={{ left: `${marca.valor}%` }} />}
      </div>
      {marca && <p className="text-dato-sm text-texto-2 mt-1 font-mono" data-dato>{marca.texto}</p>}
      <p className="text-apoyo text-texto-2 mt-3">{relato}</p>
      {children}
    </div>
  );
}
