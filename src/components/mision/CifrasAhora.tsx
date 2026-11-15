import type { ReactNode } from "react";
import { aMs, fechaHora } from "../../lib/fechas";
import { grados, horas } from "../../lib/formato";
import { indiceEn } from "../../lib/interpolar";
import { useInstanteGlobal } from "../../lib/relojGlobal";
import { T } from "../../lib/textos";
import type { Astro, FilaEfemeride, IndicadoresAstronauta } from "../../lib/tipos";
import { proximoEvento } from "../../lib/vivo";
import { GlifoAstro } from "../glifos/Astros";

/** Una cifra de primer nivel: rótulo, valor en mono de 32 px o más y una línea de contexto. Alto reservado. */
function Cifra({ rotulo, astro, valor, children }: { rotulo: string; astro?: Astro; valor: string | null; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="rotulo flex items-center gap-1.5">{astro && <GlifoAstro astro={astro} px={12} />}{rotulo}</p>
      <p className="text-dato-xl text-texto mt-1.5 font-mono font-medium whitespace-nowrap" data-dato>
        {valor ?? <span className="text-texto-2" aria-hidden="true">—</span>}
      </p>
      <p className="text-texto-2 mt-1.5 text-[0.75rem] text-pretty">{children}</p>
    </div>
  );
}

// Un decimal solo cerca del horizonte (donde importa); así «+61°» y «+0,4°» caben a 32 px en un móvil de 360 px.
const elevacion = (el: number) => grados(el, Math.abs(el) < 10 ? 1 : 0, true);

/**
 * Las 3 cifras del estado de misión en el instante de la simulación (el reloj UTC de la cabecera): elevación del
 * Sol, elevación de la Tierra y la próxima puesta. Salen de la fila de la efeméride de esa hora y de
 * `proxima_puesta_*_utc`; fuera del periodo o sin serie, queda el hueco («Sin dato»), nunca un valor.
 */
export function CifrasAhora({ filas, indicadores, sensible = false, className }: {
  filas: readonly FilaEfemeride[] | undefined; indicadores?: IndicadoresAstronauta | null;
  /** Aviso de la API «sensible al relieve»: su línea va aquí, siempre a la vista (también con la cabecera plegada). */
  sensible?: boolean; className?: string;
}) {
  const t = T.mision;
  const ahora = useInstanteGlobal();
  const ms = aMs(ahora);
  const dentro = filas?.length && ms >= aMs(filas[0].utc) && ms <= aMs(filas[filas.length - 1].utc);
  const fila = dentro ? filas[indiceEn(filas, ms)] : null;
  const evento = fila && filas ? proximoEvento(ahora, filas, indicadores) : null;
  const hueco = filas && !dentro ? t.fueraDePeriodo : T.lujo.sinDato;
  return (
    <div className={className}>
      {/* Alto reservado (dos líneas en móvil): qué es «ahora», el horizonte ideal y, si la API lo avisa, el asterisco. */}
      <p className="text-texto-2 -mt-1 mb-3 min-h-10 text-[0.75rem] sm:min-h-5" data-linea-mision>
        {sensible && <span className="text-texto" data-aviso-relieve>* <span className="inline-block first-letter:uppercase">{T.semaforo.sensible}</span> · </span>}
        {t.instante(fechaHora(ahora))} · {T.avisoHorizonteCorto}
      </p>
      <div className="grid min-h-[8.25rem] grid-cols-3 gap-x-3 sm:min-h-[6.25rem] sm:gap-x-8">
        {(["sol", "tierra"] as const).map((astro) => {
          const el = fila?.[`${astro}_el_deg`];
          return (
            <Cifra key={astro} astro={astro} rotulo={astro === "sol" ? t.solAhora : t.tierraAhora} valor={el === undefined ? null : elevacion(el)}>
              {el === undefined ? hueco : el > 0 ? t.sobre : t.bajo}
            </Cifra>
          );
        })}
        <Cifra rotulo={t.proximoEvento} valor={evento ? horas(evento.horas) : null}>
          {evento ? t.puestaDe(evento.astro, fechaHora(evento.utc)) : fila ? t.sinEvento : hueco}
        </Cifra>
      </div>
    </div>
  );
}
