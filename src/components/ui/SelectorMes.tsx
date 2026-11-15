import { ChevronLeft, ChevronRight } from "lucide-react";
import type { usePeriodo } from "../../hooks/useParametrosUrl";
import { T, periodoLegible } from "../../lib/textos";
import { clasesBoton } from "./clases";

const PASO = clasesBoton("secundario", "px-0 border-linea");
/** Mes anterior · mes en curso · mes siguiente, acotado a la cobertura de los datos. */
export function SelectorMes({ periodo }: { periodo: ReturnType<typeof usePeriodo> }) {
  const t = T.sitio;
  return (
    <div role="group" aria-label={t.periodo} className="flex items-center">
      <button type="button" className={PASO} aria-label={t.mesAnterior} disabled={!periodo.hayAnterior} onClick={() => periodo.moverMes(-1)}>
        <ChevronLeft aria-hidden="true" className="size-4" />
      </button>
      <p aria-live="polite" className="text-texto sm:text-apoyo min-w-28 px-1 text-center text-[0.8125rem] font-semibold whitespace-nowrap first-letter:uppercase sm:min-w-40">
        {periodoLegible(periodo.desde, periodo.hasta)}
      </p>
      <button type="button" className={PASO} aria-label={t.mesSiguiente} disabled={!periodo.haySiguiente} onClick={() => periodo.moverMes(1)}>
        <ChevronRight aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
