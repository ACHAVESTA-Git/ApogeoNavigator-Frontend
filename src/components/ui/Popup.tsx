import { X } from "lucide-react";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { MOVIMIENTO } from "../../lib/constants";
import { T } from "../../lib/textos";
import { unir } from "./clases";

/**
 * Popup modal sobre <dialog> nativo: foco atrapado, fondo inerte y devolución del foco al disparador sin código
 * propio. Se cierra con la X, con Escape o al hacer clic fuera, salvo si `bloqueado`. No hay botón «Cancelar».
 */
export function Popup({ titulo, rotulo, idTitulo, ancho, bloqueado = false, alCerrar, pie, children }: {
  titulo: string; rotulo?: string; idTitulo: string; ancho: string; bloqueado?: boolean; alCerrar: () => void; pie?: ReactNode; children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const reducido = useMovimientoReducido();
  useEffect(() => {
    const dialogo = ref.current;
    if (dialogo && !dialogo.open) dialogo.showModal();
  }, []);

  const cerrar = useCallback(() => {
    const dialogo = ref.current;
    if (!dialogo || bloqueado) return;
    if (reducido) return dialogo.close();
    dialogo.dataset.cerrando = "true"; // vuelve a su botón en 160 ms y entonces se cierra
    setTimeout(() => dialogo.close(), MOVIMIENTO.SALIDA_RUTA);
  }, [bloqueado, reducido]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onCancel={(e) => { e.preventDefault(); cerrar(); }}
      onClose={alCerrar}
      onClick={(e) => e.target === ref.current && cerrar()}
      className="popup bg-elevada border-linea text-texto max-h-none w-[calc(100vw-16px)] max-w-none overflow-visible rounded-xs border p-0 transition-[max-width] duration-(--dur-media) ease-salida sm:w-[calc(100vw-2rem)]"
      style={{ maxWidth: ancho }}
    >
      <div className="flex max-h-[calc(100svh-16px)] flex-col sm:max-h-[calc(100svh-4rem)]">
        <header className="flex items-start justify-between gap-4 pt-4 pr-2 pl-5">
          <div>
            {rotulo && <p className="rotulo">{rotulo}</p>}
            <h2 id={idTitulo} className="text-subtitulo text-texto mt-1 font-medium">{titulo}</h2>
          </div>
          <button type="button" onClick={cerrar} disabled={bloqueado} aria-label={T.cerrar}
            className={unir("tactil text-texto-2 hover:text-texto inline-flex items-center justify-center disabled:opacity-40")}>
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-4">{children}</div>
        {pie && <footer className="capilar-t px-5 py-3">{pie}</footer>}
      </div>
    </dialog>
  );
}
