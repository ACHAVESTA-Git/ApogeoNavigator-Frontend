import type { KeyboardEvent } from "react";
import { ALUNIZAJE } from "../../lib/constants";
import { T } from "../../lib/textos";
import type { EstanciaH } from "../../lib/tipos";
import { unir } from "../ui/clases";

const ESTANCIAS = ALUNIZAJE.ESTANCIAS_H as readonly EstanciaH[];

/** Chips de duración de la estancia (grupo de radios: un tabulador y flechas). Objetivos de 48 px con 8 px de separación. */
export function SelectorEstancia({ valor, alCambiar, className }: { valor: EstanciaH; alCambiar: (valor: EstanciaH) => void; className?: string }) {
  const t = T.alunizaje;
  const alPulsar = (e: KeyboardEvent<HTMLDivElement>) => {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const siguiente = ESTANCIAS[(ESTANCIAS.indexOf(valor) + delta + ESTANCIAS.length) % ESTANCIAS.length];
    alCambiar(siguiente);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-valor="${siguiente}"]`)?.focus();
  };
  return (
    <div className={className}>
      <p id="estancia-rotulo" className="rotulo mb-2">{t.estancia}</p>
      <div role="radiogroup" aria-labelledby="estancia-rotulo" onKeyDown={alPulsar} className="grid grid-cols-3 gap-2">
        {ESTANCIAS.map((h) => {
          const activo = h === valor;
          return (
            <button key={h} type="button" role="radio" aria-checked={activo} tabIndex={activo ? 0 : -1} data-valor={h} onClick={() => alCambiar(h)}
              aria-label={`${t.estancias[h]}${h === ALUNIZAJE.ESTANCIA_POR_DEFECTO ? ` (${t.referencia})` : ""}`}
              className={unir(
                "rounded-control flex min-h-12 min-w-0 flex-col items-center justify-center border px-2 select-none",
                "transition-[background-color,border-color,color,transform] duration-(--dur-micro) ease-salida active:scale-[0.97]",
                activo ? "border-sol/60 bg-sol/14 text-texto" : "border-texto/12 bg-texto/[0.045] text-texto-2 hover:border-texto/30 hover:text-texto",
              )}>
              <span className="text-apoyo font-semibold whitespace-nowrap">{t.estancias[h]}</span>
              {h === ALUNIZAJE.ESTANCIA_POR_DEFECTO && <span className="text-[0.75rem] leading-tight">{t.referencia}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
