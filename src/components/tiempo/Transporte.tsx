import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Pause, Play, RotateCcw } from "lucide-react";
import type { RelojSimulacion } from "../../hooks/useRelojSimulacion";
import { HORAS_POR_DIA, MS_POR_HORA, VELOCIDADES_HORAS_POR_SEG } from "../../lib/constants";
import { aMs } from "../../lib/fechas";
import { T, describirInstante } from "../../lib/textos";
import type { FilaEfemeride } from "../../lib/tipos";
import { Segmentado } from "../ui/Segmentado";
import { clasesBoton, unir } from "../ui/clases";
import { MarcasTiempo } from "./MarcasTiempo";

/** Lo mínimo que necesita el transporte de quien lleva el tiempo (el reloj de la simulación o el bucle del hero). */
export interface ControlTiempo {
  indice: number;
  reproduciendo: boolean;
  alternar: () => void;
  irAIndice: (indice: number) => void;
  /** Solo en la variante completa. */
  paso?: (horas: number) => void;
  reiniciar?: () => void;
  velocidad?: number;
  setVelocidad?: (horasPorSegundo: number) => void;
}
/** Adapta el reloj de la simulación (Cielo, Día lunar) al transporte. */
export const controlDeReloj = (reloj: RelojSimulacion, filas: readonly FilaEfemeride[]): ControlTiempo => ({
  indice: reloj.indice,
  reproduciendo: reloj.reproduciendo,
  alternar: reloj.alternar,
  irAIndice: (i) => reloj.irA(aMs(filas[i].utc)),
  paso: reloj.paso,
  reiniciar: () => reloj.irA(reloj.desdeMs),
  velocidad: reloj.velocidad,
  setVelocidad: reloj.setVelocidad,
});

const PASO = clasesBoton("secundario", "px-0 border-linea shrink-0 max-sm:w-11 max-sm:px-0!");
const VELOCIDADES = VELOCIDADES_HORAS_POR_SEG.map((v) => ({ valor: String(v), etiqueta: T.tiempo.porSegundo(v) }));

/**
 * El único control de tiempo de la app: el hero, el Cielo y el Día lunar usan este mismo componente, así se
 * aprende una vez. Regla = input range nativo sobre marcas que son a la vez mini-banda de luz. Toda acción de
 * arrastre tiene su alternativa con botones (WCAG 2.5.7) y la reproducción, su botón de pausa (WCAG 2.2.2).
 */
export function Transporte({ filas, control, variante = "completa", etiqueta = T.tiempo.regla, conHoras = false, className }: {
  filas: readonly FilaEfemeride[]; control: ControlTiempo; variante?: "completa" | "minima"; etiqueta?: string; conHoras?: boolean; className?: string;
}) {
  const t = T.tiempo;
  const fila = filas[Math.min(control.indice, filas.length - 1)];
  const [desdeMs, hastaMs] = [aMs(filas[0].utc), aMs(filas[filas.length - 1].utc)];
  const horas = (ms: number) => Math.round((ms - desdeMs) / MS_POR_HORA);
  const completa = variante === "completa";

  const regla = (
    <div className="relative min-w-0 flex-1">
      <MarcasTiempo filas={filas} desdeMs={desdeMs} hastaMs={hastaMs} conHoras={conHoras} />
      <input type="range" className="regla-tiempo absolute inset-x-0 top-0" aria-label={etiqueta} min={0} max={filas.length - 1} step={1}
        value={control.indice} aria-valuetext={describirInstante(fila.utc, fila)} onChange={(e) => control.irAIndice(Number(e.target.value))} />
    </div>
  );
  const reproducir = (
    <button type="button" onClick={control.alternar} aria-label={control.reproduciendo ? t.pausar : t.reproducir}
      title={control.reproduciendo ? t.pausar : t.reproducir}
      className={completa ? clasesBoton("primario", "w-11 shrink-0 px-0 max-sm:px-0! sm:w-14") : unir(PASO, "border-horizonte! shrink-0")}>
      {control.reproduciendo ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
    </button>
  );
  const contador = (
    <p className="text-dato-sm text-texto-2 font-mono whitespace-nowrap" data-dato aria-hidden="true">
      <span className="text-texto">{horas(aMs(fila.utc))}</span>/{horas(hastaMs)} h
    </p>
  );

  if (!completa) {
    return (
      <div className={unir("flex items-start gap-3", className)}>
        {reproducir}
        {regla}
        <div className="flex h-11 items-center max-sm:hidden">{contador}</div>
      </div>
    );
  }
  const pasos = [
    { etiqueta: t.reiniciar, Icono: RotateCcw, alPulsar: control.reiniciar },
    { etiqueta: t.menosDia, Icono: ChevronsLeft, alPulsar: () => control.paso?.(-HORAS_POR_DIA) },
    { etiqueta: t.menosHora, Icono: ChevronLeft, alPulsar: () => control.paso?.(-1) },
    null,
    { etiqueta: t.masHora, Icono: ChevronRight, alPulsar: () => control.paso?.(1) },
    { etiqueta: t.masDia, Icono: ChevronsRight, alPulsar: () => control.paso?.(HORAS_POR_DIA) },
  ];
  return (
    <div className={className}>
      {regla}
      <div className="mt-2 flex items-center gap-x-2 gap-y-2 sm:flex-wrap sm:gap-x-5">
        <div className="flex gap-1 sm:gap-2">
          {pasos.map((p) => p === null ? <span key="play" className="contents">{reproducir}</span> : (
            <button key={p.etiqueta} type="button" aria-label={p.etiqueta} title={p.etiqueta} onClick={p.alPulsar}
              className={unir(PASO, p.Icono === RotateCcw && "max-sm:hidden")}>
              <p.Icono aria-hidden="true" className="size-4" />
            </button>
          ))}
        </div>
        <div className="max-sm:hidden">{contador}</div>
        {control.velocidad !== undefined && control.setVelocidad && (
          <>
            <Segmentado comoRadio etiqueta={t.velocidad} opciones={VELOCIDADES} valor={String(control.velocidad)}
              alCambiar={(v) => control.setVelocidad?.(Number(v))} className="ml-auto max-sm:hidden" />
            {/* En móvil las velocidades van a un menú nativo: una sola fila de controles. */}
            <select aria-label={t.velocidad} value={String(control.velocidad)} onChange={(e) => control.setVelocidad?.(Number(e.target.value))}
              className="tactil bg-superficie border-linea text-texto ml-auto min-w-0 flex-1 rounded-control border px-2 text-base font-semibold sm:hidden">
              {VELOCIDADES.map((v) => <option key={v.valor} value={v.valor}>{v.etiqueta}</option>)}
            </select>
          </>
        )}
      </div>
    </div>
  );
}
