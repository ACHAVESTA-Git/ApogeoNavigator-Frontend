import { CircleCheck, OctagonX, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { NOMBRE_NIVEL } from "../../lib/textos";
import type { NivelSemaforo } from "../../lib/tipos";
import { unir } from "../ui/clases";

// Estado por icono (forma distinta por nivel) + palabra + halo de fondo; el color solo refuerza.
const ESTADO: Record<NivelSemaforo, { Icono: LucideIcon; chip: string }> = {
  verde: { Icono: CircleCheck, chip: "bg-viable/12 text-viable" },
  amarillo: { Icono: TriangleAlert, chip: "bg-reservas/12 text-reservas" },
  rojo: { Icono: OctagonX, chip: "bg-critico/12 text-critico" },
};
const CUERPO = { titulo: "text-titulo font-semibold", seccion: "text-seccion font-medium", entrada: "text-entrada font-medium" } as const;

export interface VeredictoProps {
  /** Nivel del semáforo (viene de la API o de `nivelPorUmbrales`). */
  nivel: NivelSemaforo;
  /** La frase del veredicto, en una línea. */
  children: ReactNode;
  /** Palabra del chip; por defecto el nombre del nivel («Viable», «Con reservas», «Crítico»). */
  etiqueta?: string;
  /** Etiqueta de la frase: `h2`/`h3` si encabeza una sección; `p` por defecto. */
  como?: "p" | "h2" | "h3";
  tamano?: keyof typeof CUERPO;
  className?: string;
}

/** Acto 1 de cada pantalla: una frase con su estado en un chip (icono + palabra + halo). Sin línea lateral. */
export function Veredicto({ nivel, children, etiqueta, como: Frase = "p", tamano = "seccion", className }: VeredictoProps) {
  const { Icono, chip } = ESTADO[nivel];
  return (
    <div data-nivel={nivel} className={unir("flex flex-wrap items-center gap-x-4 gap-y-2.5", className)}>
      <span className={unir("text-apoyo inline-flex shrink-0 items-center gap-1.5 rounded-full py-1 pr-3 pl-2 font-semibold whitespace-nowrap", chip)}>
        <Icono aria-hidden="true" className="size-4 shrink-0" />
        {etiqueta ?? NOMBRE_NIVEL[nivel]}
      </span>
      <Frase className={unir("text-texto min-w-0 flex-1 basis-64 text-balance", CUERPO[tamano])}>{children}</Frase>
    </div>
  );
}
