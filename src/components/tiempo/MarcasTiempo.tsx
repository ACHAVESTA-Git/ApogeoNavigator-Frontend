import { useMemo } from "react";
import { mediasNoches, tramosVisibles } from "../../lib/astro";
import { BANDA, HORAS_POR_DIA, MS_POR_HORA } from "../../lib/constants";
import { aUtc, diaCorto, diaDelMes } from "../../lib/fechas";
import type { FilaEfemeride } from "../../lib/tipos";

const ANCHO = 1000; // unidades del viewBox; se estira al ancho real sin deformar los trazos
const ALTO = 44;

/**
 * Regla de marcas finas que es a la vez mini-banda de luz: una marca por día (más alta cada 7),
 * una fila ámbar con las horas de Sol y otra azul con las de Tierra visible.
 */
export function MarcasTiempo({ filas, desdeMs, hastaMs, conHoras = false }: {
  filas: readonly FilaEfemeride[]; desdeMs: number; hastaMs: number; conHoras?: boolean;
}) {
  const x = (ms: number) => ((ms - desdeMs) / (hastaMs - desdeMs)) * ANCHO;
  const { dias, sol, tierra } = useMemo(() => {
    const [desde, hasta] = [aUtc(desdeMs), aUtc(hastaMs + MS_POR_HORA)];
    return {
      dias: mediasNoches(desdeMs, hastaMs),
      sol: tramosVisibles(filas, "sol", desde, hasta),
      tierra: tramosVisibles(filas, "tierra", desde, hasta),
    };
  }, [filas, desdeMs, hastaMs]);
  const totalHoras = Math.round((hastaMs - desdeMs) / MS_POR_HORA);
  const esSemana = (i: number) => i % BANDA.DIAS_ETIQUETA === 0;

  return (
    <div aria-hidden="true" className="pointer-events-none relative h-[62px] select-none">
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-11 w-full overflow-visible">
        {sol.map((t) => (
          <rect key={`s${t.inicioMs}`} x={x(t.inicioMs)} width={Math.max(1, x(t.finMs) - x(t.inicioMs))} y={30} height={4} className="fill-sol opacity-70" />
        ))}
        {tierra.map((t) => (
          <rect key={`t${t.inicioMs}`} x={x(t.inicioMs)} width={Math.max(1, x(t.finMs) - x(t.inicioMs))} y={37} height={4} className="fill-tierra opacity-80" />
        ))}
        {conHoras &&
          Array.from({ length: totalHoras + 1 }, (_, h) => h).filter((h) => h % HORAS_POR_DIA !== 0).map((h) => (
            <line key={h} x1={x(desdeMs + h * MS_POR_HORA)} x2={x(desdeMs + h * MS_POR_HORA)} y1={21} y2={26}
              className="stroke-linea" vectorEffect="non-scaling-stroke" />
          ))}
        {dias.map((ms, i) => (
          <line key={ms} x1={x(ms)} x2={x(ms)} y1={esSemana(i) ? 4 : 14} y2={26}
            className={esSemana(i) ? "stroke-texto-2" : "stroke-horizonte"} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {dias.filter((_, i) => esSemana(i)).map((ms, i) => (
        <span key={ms} className="text-texto-3 absolute top-[46px] font-mono text-[0.6875rem] whitespace-nowrap" data-dato
          style={{ left: `${(x(ms) / ANCHO) * 100}%`, transform: x(ms) > ANCHO * 0.95 ? "translateX(-100%)" : undefined }}>
          {/* el mes solo en la primera etiqueta y al cambiar de mes: las demás son el día */}
          {i === 0 || diaDelMes(aUtc(ms)) <= BANDA.DIAS_ETIQUETA ? diaCorto(aUtc(ms)) : diaDelMes(aUtc(ms))}
        </span>
      ))}
    </div>
  );
}
