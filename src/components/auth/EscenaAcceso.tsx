import { ACCESO } from "../../lib/constants";
import { estrellasEscena } from "../../lib/acceso";
import { useAnclaHorizonte } from "../layout/horizonteContexto";

const ESTRELLAS = estrellasEscena(ACCESO.ESTRELLAS);
const R = 9;

/**
 * Escena de fondo de Acceso: cielo, la Tierra asomando sobre el horizonte y el regolito. Es una ilustración (no
 * datos) y no añade bucles: la línea la dibuja el horizonte continuo de la app, y la Tierra sube UNA vez con una
 * animación CSS de transform y opacidad. La única luz de acento es el Sol, rasante a la izquierda.
 */
export function EscenaAcceso() {
  const ancla = useAnclaHorizonte("linea");
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Cielo: recorta en el horizonte, así la Tierra «sale» de detrás de él */}
      <div className="absolute inset-x-0 top-0 h-[62%] overflow-hidden opacity-55 lg:opacity-100">
        {ESTRELLAS.map((e, i) => (
          <span key={i} className="bg-texto absolute rounded-full" style={{ left: `${e.x}%`, top: `${e.y}%`, width: e.d, height: e.d, opacity: e.opacidad }} />
        ))}
        <div className="bg-sol/20 absolute bottom-0 -left-[12%] h-44 w-[48%] translate-y-1/2 rounded-full blur-3xl" />
        <div className="acceso-tierra absolute bottom-0 left-[14%] size-28 translate-y-[30%] lg:left-[20%] lg:size-48">
          <svg viewBox="-10 -10 20 20" className="shadow-glow-tierra size-full rounded-full">
            <circle r={R} className="fill-regolito" />
            {/* media luna iluminada, de cara al Sol */}
            <path d={`M0 ${-R} A${R} ${R} 0 0 1 0 ${R} A${R * 0.55} ${R} 0 0 0 0 ${-R}Z`} transform="rotate(140)" className="fill-tierra opacity-80" />
          </svg>
        </div>
      </div>
      <div className="from-regolito to-vacio absolute inset-x-0 top-[62%] bottom-0 bg-linear-to-b" />
      <div ref={ancla} className="absolute inset-x-0 top-[62%] h-px" />
    </div>
  );
}
