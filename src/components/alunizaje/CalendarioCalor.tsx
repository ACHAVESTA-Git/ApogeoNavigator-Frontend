import { Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useDimensiones } from "../../hooks/useDimensiones";
import { columnasRejilla, moverEnRejilla, nivelCalor, retrasoCelda, utcDeDia, type MesCalendario, type NivelCalor } from "../../lib/alunizaje";
import { ALUNIZAJE } from "../../lib/constants";
import { diaCorto, diaDelMes, mesCorto, mesLargo, soloHora } from "../../lib/fechas";
import { horas, pct } from "../../lib/formato";
import { T } from "../../lib/textos";
import { unir } from "../ui/clases";
import { Desplegable } from "../ui/Desplegable";

// Una sola luz: el ámbar del Sol, en cinco escalones. El valor va SIEMPRE escrito en la celda (no depende del color).
const CELDA: Record<NivelCalor, string> = {
  0: "bg-texto/[0.04] text-texto-2",
  1: "bg-calor-1 text-texto",
  2: "bg-calor-2 text-texto",
  3: "bg-calor-3 text-texto",
  4: "bg-sol text-vacio",
};
const TIRA: Record<NivelCalor, string> = { 0: "bg-texto/10", 1: "bg-calor-1", 2: "bg-calor-2", 3: "bg-calor-3", 4: "bg-sol" };
const NIVELES: readonly NivelCalor[] = [0, 1, 2, 3, 4];
const { CELDA_PX, HUECO_PX, ENTRADA } = ALUNIZAJE;

export interface CalendarioCalorProps {
  meses: readonly MesCalendario[];
  mesActivo: number;
  alCambiarMes: (indice: number) => void;
  /** Día elegido ('YYYY-MM-DD') o null. */
  seleccion: string | null;
  alElegir: (dia: string) => void;
  /** Día de la mejor ventana: lleva una estrella además del valor. */
  mejorDia?: string | null;
  /** Cambia con el sitio y la estancia: las celdas vuelven a entrar escalonadas UNA vez por cada cálculo. */
  claveEntrada: string;
  cargando?: boolean;
}

/**
 * Calendario de calor de fechas de llegada. Arriba, los seis meses de un vistazo (cada uno con su tira de días);
 * debajo, el mes elegido como rejilla navegable con teclado (patrón grid) y su alternativa en tabla.
 */
export function CalendarioCalor({ meses, mesActivo, alCambiarMes, seleccion, alElegir, mejorDia, claveEntrada, cargando = false }: CalendarioCalorProps) {
  const t = T.alunizaje.calendario;
  const [refAncho, { ancho }] = useDimensiones<HTMLDivElement>();
  const columnas = columnasRejilla(ancho);
  const mes = meses[mesActivo] ?? meses[0];
  const todos = useMemo(() => meses.flatMap((m, i) => m.dias.map((d) => ({ ...d, mes: i }))), [meses]);
  const inicioMes = todos.findIndex((d) => d.mes === mesActivo);
  const finMes = inicioMes + mes.dias.length - 1;
  // Foco itinerante: una sola celda en el orden de tabulación (la elegida si está en el mes; si no, la primera).
  const [focoDia, setFocoDia] = useState<string | null>(null);
  const enMes = (dia: string | null) => dia !== null && mes.dias.some((d) => d.dia === dia);
  const foco = enMes(focoDia) ? focoDia : enMes(seleccion) ? seleccion : mes.dias[0].dia;
  const rejilla = useRef<HTMLDivElement>(null);
  const pendiente = useRef<string | null>(null);
  useEffect(() => {
    if (!pendiente.current) return;
    rejilla.current?.querySelector<HTMLElement>(`[data-dia="${pendiente.current}"]`)?.focus();
    pendiente.current = null;
  });

  const irA = (indice: number) => {
    const destino = todos[indice];
    pendiente.current = destino.dia;
    setFocoDia(destino.dia);
    if (destino.mes !== mesActivo) alCambiarMes(destino.mes);
  };
  const alPulsar = (e: KeyboardEvent<HTMLDivElement>) => {
    const actual = todos.findIndex((d) => d.dia === foco);
    let destino: number | null;
    if (e.key === "PageDown" || e.key === "PageUp") {
      const otro = mesActivo + (e.key === "PageDown" ? 1 : -1);
      if (otro < 0 || otro >= meses.length) return;
      const inicioOtro = todos.findIndex((d) => d.mes === otro);
      destino = inicioOtro + Math.min(actual - inicioMes, meses[otro].dias.length - 1);
    } else destino = moverEnRejilla(e.key, actual, todos.length, columnas, inicioMes, finMes);
    if (destino === null) return;
    e.preventDefault();
    e.stopPropagation();
    if (destino !== actual) irA(destino);
  };

  const filas = Array.from({ length: Math.ceil(mes.dias.length / columnas) }, (_, f) => mes.dias.slice(f * columnas, (f + 1) * columnas));
  // Alto reservado para el mes más largo: al cambiar de mes o al llegar los datos nada salta.
  const filasMax = Math.ceil(Math.max(...meses.map((m) => m.dias.length)) / columnas);
  const nombreMes = mesLargo(mes.inicio);

  return (
    <div>
      <div role="group" aria-label={t.meses} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {meses.map((m, i) => (
          <button key={m.inicio} type="button" aria-pressed={i === mesActivo} onClick={() => alCambiarMes(i)}
            aria-label={m.maxPct === null ? t.mesSinDatos(mesLargo(m.inicio)) : t.mes(mesLargo(m.inicio), pct(m.maxPct))}
            className={unir(
              "rounded-control flex min-h-14 min-w-0 flex-col items-center justify-center gap-2 border px-1.5 select-none",
              "transition-[background-color,border-color,color,transform] duration-(--dur-micro) ease-salida active:scale-[0.97]",
              i === mesActivo ? "border-texto/30 bg-texto/[0.09] text-texto" : "border-texto/8 text-texto-2 hover:border-texto/20 hover:text-texto",
            )}>
            <span className="text-rotulo font-semibold uppercase">{mesCorto(m.inicio)}</span>
            <span aria-hidden="true" className="flex h-1.5 w-full overflow-hidden rounded-full">
              {m.dias.map((d) => <span key={d.dia} className={unir("min-w-0 flex-1", d.dato ? TIRA[nivelCalor(d.dato.pct_sol_y_tierra)] : "bg-transparent")} />)}
            </span>
          </button>
        ))}
      </div>

      <div ref={refAncho} className="mt-4">
        <div ref={rejilla} key={claveEntrada} role="grid" aria-label={t.rejilla(nombreMes)} aria-busy={cargando} aria-colcount={columnas} onKeyDown={alPulsar}
          className="flex flex-col" style={{ gap: HUECO_PX, minHeight: filasMax * CELDA_PX + (filasMax - 1) * HUECO_PX }}>
          {filas.map((fila, f) => (
            <div key={f} role="row" className="grid" style={{ gap: HUECO_PX, gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}>
              {fila.map((d, c) => {
                const indice = f * columnas + c;
                const utc = utcDeDia(d.dia);
                const elegida = d.dia === seleccion;
                const mejor = d.dia === mejorDia;
                const etiqueta = d.dato
                  ? `${t.celda(diaCorto(utc), pct(d.dato.pct_sol_y_tierra), horas(d.dato.horas_sol_y_tierra), soloHora(d.dato.llegada_utc))}${mejor ? `. ${t.celdaMejor}` : ""}`
                  : t.celdaSinDatos(diaCorto(utc));
                return (
                  <button key={indice} type="button" role="gridcell" data-dia={d.dia} tabIndex={d.dia === foco ? 0 : -1}
                    aria-selected={elegida} aria-disabled={!d.dato || undefined} aria-label={etiqueta}
                    onFocus={() => setFocoDia(d.dia)} onClick={() => d.dato && alElegir(d.dia)}
                    style={{ height: CELDA_PX, "--retraso": `${retrasoCelda(indice)}ms`, "--desde": `${ENTRADA.DESDE_PX}px` } as CSSProperties}
                    className={unir(
                      "rounded-control relative flex min-w-0 flex-col items-center justify-center gap-1 font-mono select-none",
                      "transition-transform duration-(--dur-micro) ease-salida",
                      d.dato ? unir(CELDA[nivelCalor(d.dato.pct_sol_y_tierra)], "active:scale-[0.95]") : "text-texto-2 border border-dashed border-texto/12",
                      !cargando && "lujo-entrada",
                      elegida && "outline-texto outline-2 outline-offset-2",
                    )}>
                    <span className="text-[0.75rem] leading-none">{diaDelMes(utc)}</span>
                    <span className="text-dato-sm leading-none font-semibold" aria-hidden="true">{d.dato ? pct(Math.round(d.dato.pct_sol_y_tierra)) : "–"}</span>
                    {mejor && <Star aria-hidden="true" fill="currentColor" className="absolute top-1 right-1 size-2.5" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4" aria-label={t.leyenda} role="group">
        <p className="text-texto-2 text-[0.75rem]">{t.leyenda}</p>
        <ul className="text-texto-2 mt-2 flex flex-wrap gap-x-4 gap-y-2 text-[0.75rem]">
          {NIVELES.map((n) => (
            <li key={n} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={unir("size-3.5 rounded-xs border border-texto/10", CELDA[n])} />
              {t.escalones[n]}
            </li>
          ))}
          <li className="flex items-center gap-1.5"><Star aria-hidden="true" fill="currentColor" className="text-sol size-3.5" />{t.mejorMarca}</li>
        </ul>
      </div>

      <Desplegable titulo={t.tabla} className="mt-4 border-b [&>button]:min-h-12">
        <div className="max-h-80 overflow-auto">
          <table className="text-apoyo w-full text-left">
            <caption className="sr-only">{t.tablaTitulo(nombreMes)}</caption>
            <thead className="text-texto-2 text-[0.75rem]">
              <tr>{[t.columnas.dia, t.columnas.hora, t.columnas.horas, t.columnas.pct].map((c) => <th key={c} scope="col" className="py-2 pr-3 font-medium">{c}</th>)}</tr>
            </thead>
            <tbody className="font-mono" data-dato>
              {mes.dias.map((d) => (
                <tr key={d.dia} className="border-t border-texto/8">
                  <th scope="row" className="py-2 pr-3 font-normal whitespace-nowrap">{diaCorto(utcDeDia(d.dia))}</th>
                  {d.dato
                    ? <><td className="py-2 pr-3">{soloHora(d.dato.llegada_utc)}</td><td className="py-2 pr-3">{horas(d.dato.horas_sol_y_tierra)}</td><td className="py-2 pr-3">{pct(d.dato.pct_sol_y_tierra)}</td></>
                    : <td colSpan={3} className="text-texto-2 py-2 pr-3 font-sans">{t.sinDatos}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Desplegable>
    </div>
  );
}
