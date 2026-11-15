import { useCifraAnimada } from "../../hooks/useCifraAnimada";
import { HORAS_POR_DIA, SEMAFORO } from "../../lib/constants";
import { horas, numero, pct } from "../../lib/formato";
import { T, umbralNivel } from "../../lib/textos";
import type { Astro, NivelSemaforo } from "../../lib/tipos";
import { GlifoAstro } from "../glifos/Astros";
import { GlifoSemaforo } from "../glifos/GlifoSemaforo";
import { unir } from "../ui/clases";

const EJE = {
  sol: { rotulo: T.ventanas.energia, detalle: T.ventanas.energiaDetalle, umbrales: SEMAFORO.ENERGIA },
  tierra: { rotulo: T.ventanas.comunicacion, detalle: T.ventanas.comunicacionDetalle, umbrales: SEMAFORO.COMUNICACION },
} as const;

/** La cifra grande de un eje: porcentaje, «N de 744 h» y semáforo con glifo, palabra y umbral. Sin conteo animado. */
export function CifraMetrica({ astro, porcentaje, horasVisibles, horasTotales, nivel, sensible = false, className }: {
  astro: Astro; porcentaje: number; horasVisibles: number; horasTotales: number; nivel: NivelSemaforo; sensible?: boolean; className?: string;
}) {
  const eje = EJE[astro];
  const cifra = useCifraAnimada<HTMLParagraphElement>(porcentaje, pct, true);
  const sin = horasTotales - horasVisibles;
  const relato = T.ventanas.relato[astro](numero(horasVisibles / HORAS_POR_DIA, 1), horas(sin), sin === 0, horasVisibles === 0);
  return (
    <div className={unir("panel min-w-0 p-4 md:p-5", className)}>
      <h2 className="rotulo flex items-center gap-2">
        <GlifoAstro astro={astro} px={14} />
        {eje.rotulo}
      </h2>
      <p ref={cifra} className="text-texto sm:text-dato-xl mt-2 font-mono text-[2rem] leading-none font-medium whitespace-nowrap" data-dato>{pct(porcentaje)}</p>
      <p className="text-dato-sm text-texto-2 mt-1.5 font-mono" data-dato>{T.ventanas.deHoras(horas(horasVisibles), horas(horasTotales))}</p>
      <p className="text-texto-3 mt-0.5 text-[0.75rem]">{eje.detalle}</p>
      {/* proporción del periodo: crece al aparecer, junto con el conteo */}
      <div aria-hidden="true" className="bg-texto/10 mt-3 h-1 overflow-hidden rounded-full">
        <div className={unir("animate-crecer h-full origin-left rounded-full", astro === "sol" ? "bg-sol" : "bg-tierra")} style={{ width: `${porcentaje}%` }} />
      </div>
      <p className="text-apoyo text-texto-2 mt-3">{relato}</p>
      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <GlifoSemaforo nivel={nivel} nota={sensible} />
        <span className="text-dato-sm text-texto-2 font-mono" data-dato>· {umbralNivel(nivel, eje.umbrales)}</span>
      </p>
    </div>
  );
}
