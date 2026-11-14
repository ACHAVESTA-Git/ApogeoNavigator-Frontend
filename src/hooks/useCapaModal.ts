import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Capa modal sobre <dialog> nativo con movimiento de motion. `visible` gobierna la animación; al terminar la
 * salida se cierra el diálogo de verdad (y el foco vuelve a quien lo abrió). Como son springs, la salida se
 * puede interrumpir: volver a poner `visible` la retoma desde donde iba.
 */
export function useCapaModal(alCerrar: () => void, bloqueada = false) {
  const ref = useRef<HTMLDialogElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const capa = ref.current;
    if (capa && !capa.open) capa.showModal();
  }, []);
  const cerrar = useCallback(() => {
    if (!bloqueada) setVisible(false);
  }, [bloqueada]);
  /** Llamar al terminar la animación de salida. */
  const alSalir = useCallback(() => ref.current?.close(), []);
  const propsDialogo = {
    ref,
    className: "capa",
    onCancel: (e: React.SyntheticEvent) => {
      e.preventDefault(); // Escape: salida animada en vez de cierre brusco
      cerrar();
    },
    onClose: alCerrar,
  };
  return { propsDialogo, visible, cerrar, alSalir };
}
