import type { NivelSemaforo } from "../../lib/tipos";
import { GlifoSemaforo } from "../glifos/GlifoSemaforo";
import { unir } from "../ui/clases";

const HALO: Record<NivelSemaforo, string> = { verde: "bg-viable/12", amarillo: "bg-reservas/12", rojo: "bg-critico/12" };

/** Veredicto de una palabra: glifo (forma distinta por nivel) + palabra sobre un halo sutil. Sin línea lateral. */
export function ChipNivel({ nivel, rotulo, nota = false, className }: {
  nivel: NivelSemaforo; rotulo?: string;
  /** Asterisco de «sensible al relieve» (el mismo de Ventanas); la línea que lo explica va junto al chip. */
  nota?: boolean; className?: string;
}) {
  return (
    <span data-nivel={nivel} className={unir("inline-flex items-center rounded-full py-1 pr-3 pl-2.5", HALO[nivel], className)}>
      {rotulo && <span className="sr-only">{rotulo}: </span>}
      <GlifoSemaforo nivel={nivel} nota={nota} />
    </span>
  );
}
