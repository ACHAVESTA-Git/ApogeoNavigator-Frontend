import { T } from "../../lib/textos";

/** Confirmación inequívoca: un círculo verde y un ✓ que se dibujan en unos 600 ms (ya dibujados con movimiento reducido). */
export function SuccessCheck({ guardados, noGuardados }: { guardados: number; noGuardados: number }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <svg aria-hidden="true" viewBox="0 0 56 56" className="text-viable size-14 fill-none stroke-current" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="28" cy="28" r="25" pathLength={1} className="check-circulo" transform="rotate(-90 28 28)" />
        <path d="M17 29l8 8 15-17" pathLength={1} className="check-trazo" />
      </svg>
      <h3 className="text-subtitulo text-texto mt-4 font-medium">{T.carga.exito}</h3>
      <p className="text-apoyo text-texto-2 mt-1">{T.carga.detalleExito(guardados, noGuardados)}</p>
    </div>
  );
}
