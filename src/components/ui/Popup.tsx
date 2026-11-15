import { X } from "lucide-react";
import { m } from "motion/react";
import type { ReactNode } from "react";
import { useCapaModal } from "../../hooks/useCapaModal";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { MOVIMIENTO } from "../../lib/constants";
import { T } from "../../lib/textos";

/**
 * Popup modal: nace de su botón (arriba a la derecha; en móvil, desde abajo) y vuelve a él. Se cierra con la X,
 * con Escape o al pulsar el velo, salvo si `bloqueado`. No hay botón «Cancelar». Velo sin desenfoque.
 */
export function Popup({ titulo, rotulo, idTitulo, ancho, bloqueado = false, alCerrar, pie, children }: {
  titulo: string; rotulo?: string; idTitulo: string; ancho: string; bloqueado?: boolean; alCerrar: () => void; pie?: ReactNode; children: ReactNode;
}) {
  const reducido = useMovimientoReducido();
  const { propsDialogo, visible, cerrar, alSalir } = useCapaModal(alCerrar, bloqueado);
  const fuera = reducido ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 };
  return (
    <dialog {...propsDialogo} aria-labelledby={idTitulo}>
      <m.div aria-hidden="true" className="bg-velo fixed inset-0" onClick={cerrar}
        initial={{ opacity: 0 }} animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: MOVIMIENTO.CORTA / 1000 }} />
      <div className="pointer-events-none fixed inset-0 flex items-end justify-center p-2 sm:items-center sm:p-8">
        <m.div
          data-popup
          initial={fuera}
          animate={visible ? { opacity: 1, scale: 1, y: 0 } : fuera}
          transition={MOVIMIENTO.SPRING_SUAVE}
          onAnimationComplete={() => !visible && alSalir()}
          style={{ maxWidth: ancho, transformOrigin: "85% 0%" }}
          className="bg-elevada text-texto shadow-flotante pointer-events-auto flex max-h-full w-full flex-col overflow-hidden rounded-capa border border-texto/10 transition-[max-width] duration-(--dur-media) ease-salida"
        >
          <header className="flex items-start justify-between gap-4 pt-4 pr-2 pl-5">
            <div>
              {rotulo && <p className="rotulo">{rotulo}</p>}
              <h2 id={idTitulo} className="text-subtitulo text-texto mt-1 font-medium">{titulo}</h2>
            </div>
            <button type="button" onClick={cerrar} disabled={bloqueado} aria-label={T.cerrar}
              className="tactil text-texto-2 hover:bg-texto/[0.07] hover:text-texto inline-flex items-center justify-center rounded-full transition-colors duration-(--dur-micro) disabled:opacity-40">
              <X aria-hidden="true" className="size-5" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-4">{children}</div>
          {pie && <footer className="capilar-t px-5 py-3">{pie}</footer>}
        </m.div>
      </div>
    </dialog>
  );
}
