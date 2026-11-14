import { Pause, Play } from "lucide-react";
import { aMs } from "../../lib/fechas";
import { T, describirInstante } from "../../lib/textos";
import type { FilaEfemeride } from "../../lib/tipos";
import { MarcasTiempo } from "../tiempo/MarcasTiempo";
import { clasesBoton } from "../ui/clases";

/** Regla del hero: arrastrarla pausa el bucle y deja al usuario recorrer el mes. Con botón de pausa (WCAG 2.2.2). */
export function ReglaHero({ filas, indice, reproduciendo, alAlternar, alMover }: {
  filas: readonly FilaEfemeride[]; indice: number; reproduciendo: boolean; alAlternar: () => void; alMover: (indice: number) => void;
}) {
  const fila = filas[indice];
  return (
    <div className="flex items-start gap-3">
      <button type="button" onClick={alAlternar} aria-label={reproduciendo ? T.tiempo.pausar : T.tiempo.reproducir}
        className={clasesBoton("secundario", "shrink-0 px-0")}>
        {reproduciendo ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
      </button>
      <div className="relative min-w-0 flex-1">
        <MarcasTiempo filas={filas} desdeMs={aMs(filas[0].utc)} hastaMs={aMs(filas[filas.length - 1].utc)} />
        <input
          type="range"
          className="regla-tiempo absolute inset-x-0 top-0"
          aria-label={T.inicio.regla}
          min={0}
          max={filas.length - 1}
          step={1}
          value={indice}
          aria-valuetext={describirInstante(fila.utc, fila)}
          onChange={(e) => alMover(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
