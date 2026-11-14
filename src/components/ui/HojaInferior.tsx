import { X } from "lucide-react";
import { animate, m, useDragControls, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { useCapaModal } from "../../hooks/useCapaModal";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { MOVIMIENTO } from "../../lib/constants";
import { T } from "../../lib/textos";

/**
 * Hoja inferior móvil (70 % de la altura). Modal de verdad (velo, foco atrapado, Escape, foco de vuelta) y
 * gestual: se arrastra 1:1 desde el asa, con elástico hacia arriba, y se cierra por distancia o por velocidad.
 * El velo va ligado a la posición de la hoja: un solo valor gobierna los dos.
 */
export function HojaInferior({ etiquetadaPor, alCerrar, children }: { etiquetadaPor: string; alCerrar: () => void; children: ReactNode }) {
  const reducido = useMovimientoReducido();
  const { propsDialogo, visible, cerrar, alSalir } = useCapaModal(alCerrar);
  const hoja = useRef<HTMLDivElement>(null);
  const controles = useDragControls();
  const alto = () => hoja.current?.offsetHeight ?? window.innerHeight;
  const y = useMotionValue(window.innerHeight);
  const velo = useTransform(y, (v) => 1 - Math.min(1, Math.max(0, v / alto())));

  useEffect(() => {
    const destino = visible ? 0 : alto();
    if (reducido) {
      y.set(destino);
      if (!visible) alSalir();
      return;
    }
    const control = animate(y, destino, { ...MOVIMIENTO.SPRING_SUAVE, velocity: y.getVelocity(), onComplete: () => !visible && alSalir() });
    return () => control.stop();
  }, [visible, reducido, y, alSalir]);

  const alSoltar = (_: unknown, info: PanInfo) => {
    const { DISTANCIA, VELOCIDAD_PX_S } = MOVIMIENTO.CIERRE_HOJA;
    if (info.offset.y > alto() * DISTANCIA || info.velocity.y > VELOCIDAD_PX_S) cerrar();
    else animate(y, 0, { ...MOVIMIENTO.SPRING_VIVO, velocity: info.velocity.y }); // vuelve rápido, con la velocidad del gesto
  };

  return (
    <dialog {...propsDialogo} aria-labelledby={etiquetadaPor}>
      <m.div aria-hidden="true" className="bg-velo fixed inset-0" style={{ opacity: velo }} onClick={cerrar} />
      <m.div
        ref={hoja}
        drag={reducido ? false : "y"}
        dragControls={controles}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: MOVIMIENTO.ELASTICO * 0.4, bottom: 1 }}
        onDragEnd={alSoltar}
        style={{ y }}
        className="bg-elevada text-texto shadow-flotante fixed inset-x-0 bottom-0 flex h-[70svh] flex-col rounded-t-capa border-t border-texto/10 pb-[env(safe-area-inset-bottom)]"
      >
        {/* Asa: el único sitio que inicia el arrastre, para no pelear con el desplazamiento del contenido */}
        <div onPointerDown={(e) => controles.start(e)} className="flex cursor-grab touch-none items-center justify-between px-2 pt-1 active:cursor-grabbing">
          <span className="size-11" />
          <span aria-hidden="true" className="bg-texto/25 h-1 w-10 rounded-full" />
          <button type="button" onClick={cerrar} aria-label={T.cerrar}
            className="tactil text-texto-2 hover:text-texto inline-flex items-center justify-center rounded-full">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">{children}</div>
      </m.div>
    </dialog>
  );
}
