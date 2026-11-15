import { CalendarClock, Radio, Sun } from "lucide-react";
import { PROYECCION_MODELO } from "../../lib/constants";
import { mesCorto, mesLargo } from "../../lib/fechas";
import { horas, pct } from "../../lib/formato";
import { inicioDelMes, type MesProyeccion } from "../../lib/proyeccionModelo";
import { NOMBRE_NIVEL, T } from "../../lib/textos";
import type { Racha } from "../../lib/tipos";
import { GlifoSemaforo } from "../glifos/GlifoSemaforo";
import { unir } from "../ui/clases";

const TACTIL = { minHeight: PROYECCION_MODELO.TACTIL_MIN_PX, minWidth: PROYECCION_MODELO.TACTIL_MIN_PX };
const racha = (r: Racha | null | undefined): string | null =>
  r && Number.isFinite(r.horas) ? (r.trunca_inicio || r.trunca_fin ? T.proyeccion.evidencia.detalle.alMenos(horas(r.horas)) : horas(r.horas)) : null;

/** Lo que la API dice del mes elegido: porcentajes y, si llegan, los indicadores para astronautas. Lo que no llega no se pinta. */
function DetalleMes({ m }: { m: MesProyeccion | undefined }) {
  const t = T.proyeccion.evidencia.detalle;
  const i = m?.indicadores_astronauta;
  const cifras: [string, string | null][] = m ? [
    [t.sol, Number.isFinite(m.pct_sol) ? pct(m.pct_sol) : null],
    [t.tierra, Number.isFinite(m.pct_tierra) ? pct(m.pct_tierra) : null],
    [t.noche, racha(i?.noche_mas_larga)],
    [t.apagon, racha(i?.apagon_tierra_mas_largo)],
    [t.ventana, racha(i?.ventana_sol_y_tierra)],
  ] : [];
  return (
    // Alto reservado: elegir un mes no mueve la serie de debajo.
    <div aria-live="polite" className="mt-4 min-h-[5.5rem]" data-detalle-mes={m?.mes ?? ""}>
      {m ? (
        <>
          <p className="text-subtitulo text-texto font-semibold first-letter:uppercase">{mesLargo(inicioDelMes(m.mes))}</p>
          <dl className="mt-2 flex flex-wrap gap-x-8 gap-y-3">
            {cifras.filter(([, v]) => v !== null).map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-texto-2 text-[0.75rem]">{k}</dt>
                <dd className="text-dato-lg text-texto font-mono font-medium whitespace-nowrap" data-dato>{v}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : <p className="text-apoyo text-texto-2">{t.ninguno}</p>}
    </div>
  );
}

/** Marca «Mes parcial»: icono + palabra (la proyección no cubre el mes entero). */
const Parcial = () => (
  <span className="text-texto-2 inline-flex items-center gap-1 text-[0.75rem] font-semibold whitespace-nowrap" data-mes-parcial="">
    <CalendarClock aria-hidden="true" className="size-3 shrink-0" />{T.proyeccion.evidencia.parcial}
  </span>
);

/**
 * Línea de meses proyectados: cada mes es un botón (≥ 48 px) con el semáforo de energía y de comunicación dicho con
 * glifo + palabra, nunca solo con color. Elegir un mes acerca la serie a ese mes; volver a tocarlo la devuelve entera.
 */
export function LineaMeses({ meses, elegido, alElegir, parciales }: { meses: readonly MesProyeccion[]; elegido: string | null; alElegir: (mes: string | null) => void; parciales?: ReadonlySet<string> }) {
  const t = T.proyeccion.evidencia;
  return (
    <div>
      <ul aria-hidden="true" className="text-apoyo text-texto-2 flex flex-wrap gap-x-6 gap-y-1">
        <li className="flex items-center gap-2"><Sun className="text-sol size-4" />{t.leyendaEnergia}</li>
        <li className="flex items-center gap-2"><Radio className="text-tierra size-4" />{t.leyendaComunicacion}</li>
      </ul>
      <ul aria-label={t.meses} className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {meses.map((m) => {
          const activo = m.mes === elegido;
          const inicio = inicioDelMes(m.mes);
          const parcial = parciales?.has(m.mes) ?? false;
          return (
            <li key={m.mes} className="min-w-0">
              <button type="button" style={TACTIL} aria-pressed={activo} onClick={() => alElegir(activo ? null : m.mes)}
                aria-label={`${t.mes(mesLargo(inicio), NOMBRE_NIVEL[m.semaforo.energia], NOMBRE_NIVEL[m.semaforo.comunicacion])}${parcial ? ` ${t.parcial}.` : ""}`}
                className={unir("rounded-panel flex w-full flex-col gap-1.5 border p-3 text-left transition-[background-color,border-color,transform] duration-(--dur-micro) ease-salida active:scale-[0.98]",
                  activo ? "border-texto/30 bg-texto/[0.08]" : "border-texto/8 bg-texto/[0.02] hover:border-texto/20")}>
                <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <span className="rotulo text-texto-2!" data-dato>{mesCorto(inicio)}</span>
                  {parcial && <Parcial />}
                </span>
                <span className="flex items-center gap-2"><Sun aria-hidden="true" className="text-sol size-4 shrink-0" /><GlifoSemaforo nivel={m.semaforo.energia} /></span>
                <span className="flex items-center gap-2"><Radio aria-hidden="true" className="text-tierra size-4 shrink-0" /><GlifoSemaforo nivel={m.semaforo.comunicacion} /></span>
              </button>
            </li>
          );
        })}
      </ul>
      {meses.some((m) => parciales?.has(m.mes)) && <p className="text-apoyo text-texto-2 mt-3 max-w-medida">{t.parcialNota}</p>}
      <DetalleMes m={meses.find((m) => m.mes === elegido)} />
    </div>
  );
}
