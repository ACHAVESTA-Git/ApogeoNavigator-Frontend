import { ArrowRight } from "lucide-react";
import { RUTAS } from "../../lib/constants";
import { aUtc, soloFecha } from "../../lib/fechas";
import { T } from "../../lib/textos";
import { EnlaceBoton } from "../ui/Boton";

/** Confirmación inequívoca: un círculo verde y un ✓ que se dibujan en unos 600 ms (ya dibujados con movimiento reducido). */
export function SuccessCheck({ guardados, noGuardados, sitioAnalizado, alIr }: { guardados: number; noGuardados: number; sitioAnalizado?: string; alIr?: () => void }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <svg aria-hidden="true" viewBox="0 0 56 56" className="text-viable size-14 fill-none stroke-current" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="28" cy="28" r="25" pathLength={1} className="check-circulo" transform="rotate(-90 28 28)" />
        <path d="M17 29l8 8 15-17" pathLength={1} className="check-trazo" />
      </svg>
      <h3 className="text-subtitulo text-texto mt-4 font-medium">{T.carga.exito}</h3>
      <p className="text-apoyo text-texto-2 mt-1">{T.carga.detalleExito(guardados, noGuardados)}</p>
      {/* Si se guardaron efemérides de un sitio, esas son ya las que usa el análisis: se dice y se enlaza. */}
      {sitioAnalizado && (
        <>
          <p className="text-apoyo text-texto mt-4">{T.analisis.trasCarga(`${soloFecha(aUtc(Date.now()))} ${T.utc}`)}</p>
          <EnlaceBoton to={RUTAS.ANALISIS(sitioAnalizado)} variante="secundario" className="mt-3" onClick={alIr}>
            {T.analisis.verAnalisis}
            <ArrowRight aria-hidden="true" className="size-4" />
          </EnlaceBoton>
        </>
      )}
    </div>
  );
}
