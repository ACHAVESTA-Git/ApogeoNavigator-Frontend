import { X } from "lucide-react";
import { m } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { MOVIMIENTO } from "../../lib/constants";
import { T } from "../../lib/textos";

/** Hoja inferior móvil (70 % de la altura) para el detalle bajo demanda. Se cierra con el botón o con Escape. */
export function HojaInferior({ etiquetadaPor, alCerrar, children }: { etiquetadaPor: string; alCerrar: () => void; children: ReactNode }) {
  const reducido = useMovimientoReducido();
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => e.key === "Escape" && alCerrar();
    document.addEventListener("keydown", alPulsar);
    document.getElementById(etiquetadaPor)?.focus({ preventScroll: true });
    return () => document.removeEventListener("keydown", alPulsar);
  }, [alCerrar, etiquetadaPor]);
  return (
    <m.div
      role="dialog"
      aria-labelledby={etiquetadaPor}
      initial={reducido ? false : { y: "100%" }}
      animate={{ y: 0 }}
      transition={{ duration: MOVIMIENTO.MEDIA / 1000, ease: MOVIMIENTO.EASE_SALIDA }}
      className="bg-elevada border-horizonte fixed inset-x-0 bottom-0 z-40 flex h-[70svh] flex-col border-t pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex justify-end px-2 pt-1">
        <button type="button" onClick={alCerrar} aria-label={T.cerrar} className="tactil text-texto-2 hover:text-texto inline-flex items-center justify-center">
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div className="overflow-y-auto overscroll-contain px-4 pb-6">{children}</div>
    </m.div>
  );
}
