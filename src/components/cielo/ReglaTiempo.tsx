import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Pause, Play } from "lucide-react";
import { useDesde } from "../../hooks/useMedia";
import type { RelojSimulacion } from "../../hooks/useRelojSimulacion";
import { HORAS_POR_DIA, VELOCIDADES_HORAS_POR_SEG } from "../../lib/constants";
import { aMs } from "../../lib/fechas";
import { T, describirInstante } from "../../lib/textos";
import type { FilaEfemeride } from "../../lib/tipos";
import { MarcasTiempo } from "../tiempo/MarcasTiempo";
import { Segmentado } from "../ui/Segmentado";
import { clasesBoton, unir } from "../ui/clases";

const PASO = clasesBoton("secundario", "px-0 border-linea");

/** Controles de tiempo: toda acción de arrastre tiene su alternativa con botones (±1 h, ±1 d, reproducir). */
export function ControlesTiempo({ reloj, conVelocidad = true }: { reloj: RelojSimulacion; conVelocidad?: boolean }) {
  const t = T.tiempo;
  const esTableta = useDesde("md");
  const botones = [
    { etiqueta: t.menosDia, Icono: ChevronsLeft, alPulsar: () => reloj.paso(-HORAS_POR_DIA) },
    { etiqueta: t.menosHora, Icono: ChevronLeft, alPulsar: () => reloj.paso(-1) },
    { etiqueta: reloj.reproduciendo ? t.pausar : t.reproducir, Icono: reloj.reproduciendo ? Pause : Play, alPulsar: reloj.alternar, principal: true },
    { etiqueta: t.masHora, Icono: ChevronRight, alPulsar: () => reloj.paso(1) },
    { etiqueta: t.masDia, Icono: ChevronsRight, alPulsar: () => reloj.paso(HORAS_POR_DIA) },
  ];
  const opciones = VELOCIDADES_HORAS_POR_SEG.map((v) => ({ valor: String(v), etiqueta: t.porSegundo(v) }));
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="flex gap-2">
        {botones.map(({ etiqueta, Icono, alPulsar, principal }) => (
          <button key={etiqueta} type="button" aria-label={etiqueta} title={etiqueta} onClick={alPulsar}
            className={principal ? clasesBoton("primario", "px-0 w-14") : PASO}>
            <Icono aria-hidden="true" className="size-4" />
          </button>
        ))}
      </div>
      {conVelocidad && (esTableta ? (
        <Segmentado etiqueta={t.velocidad} opciones={opciones} valor={String(reloj.velocidad)} alCambiar={(v) => reloj.setVelocidad(Number(v))} className="border-b-0" />
      ) : (
        <label className="text-apoyo text-texto-2 flex items-center gap-2">
          {t.velocidad}
          <select value={reloj.velocidad} onChange={(e) => reloj.setVelocidad(Number(e.target.value))}
            className="tactil bg-superficie border-linea text-texto rounded-xs border px-2 font-mono">
            {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

/** Regla de tiempo: un input range nativo (paso de 1 h) sobre las marcas, que son a la vez mini-banda de luz. */
export function ReglaTiempo({ filas, reloj, className }: { filas: readonly FilaEfemeride[]; reloj: RelojSimulacion; className?: string }) {
  const esEscritorio = useDesde("lg");
  const fila = filas[reloj.indice];
  return (
    <div className={unir("relative", className)}>
      <MarcasTiempo filas={filas} desdeMs={reloj.desdeMs} hastaMs={reloj.hastaMs} conHoras={esEscritorio} />
      <input
        type="range"
        className="regla-tiempo absolute inset-x-0 top-0"
        aria-label={T.tiempo.regla}
        min={0}
        max={filas.length - 1}
        step={1}
        value={reloj.indice}
        aria-valuetext={describirInstante(fila.utc, fila)}
        onChange={(e) => reloj.irA(aMs(filas[Number(e.target.value)].utc))}
      />
    </div>
  );
}
