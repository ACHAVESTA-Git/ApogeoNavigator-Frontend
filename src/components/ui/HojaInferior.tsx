import { X } from "lucide-react";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { MOVIMIENTO } from "../../lib/constants";
import { T } from "../../lib/textos";

/**
 * Hoja inferior móvil (70 % de la altura) para el detalle bajo demanda. Es un <dialog> modal: velo que cierra
 * al pulsarlo, foco atrapado, Escape y devolución del foco a quien la abrió. Sale por donde entró (hacia abajo).
 */
export function HojaInferior({ etiquetadaPor, alCerrar, children }: { etiquetadaPor: string; alCerrar: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const reducido = useMovimientoReducido();
  useEffect(() => {
    const hoja = ref.current;
    if (hoja && !hoja.open) hoja.showModal();
  }, []);
  const cerrar = useCallback(() => {
    const hoja = ref.current;
    if (!hoja) return;
    if (reducido) return hoja.close();
    hoja.dataset.cerrando = "true";
    setTimeout(() => hoja.close(), MOVIMIENTO.SALIDA_RUTA);
  }, [reducido]);
  return (
    <dialog ref={ref} aria-labelledby={etiquetadaPor} onCancel={(e) => { e.preventDefault(); cerrar(); }} onClose={alCerrar}
      onClick={(e) => e.target === ref.current && cerrar()}
      className="hoja bg-elevada border-horizonte text-texto fixed inset-x-0 top-auto bottom-0 m-0 h-[70svh] max-h-none w-full max-w-none border-t p-0 pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-full flex-col">
        <div className="flex justify-end px-2 pt-1">
          <button type="button" onClick={cerrar} aria-label={T.cerrar} className="tactil text-texto-2 hover:text-texto inline-flex items-center justify-center">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">{children}</div>
      </div>
    </dialog>
  );
}
