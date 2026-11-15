import { Hourglass } from "lucide-react";
import type { CSSProperties } from "react";
import { PROYECCION_MODELO } from "../../lib/constants";
import { mesLargo } from "../../lib/fechas";
import { grados, numero } from "../../lib/formato";
import { errorControl, inicioDelMes, resumenMeses, type ModeloProyeccion, type ResultadoProyeccion } from "../../lib/proyeccionModelo";
import { T } from "../../lib/textos";
import { CifraHeroe, PanelVidrio, Veredicto } from "../lujo";

const entrada = (retraso: number, desde: number) => ({ "--retraso": `${retraso}ms`, "--desde": `${desde}px` }) as CSSProperties;
const error = (v: number) => numero(v, PROYECCION_MODELO.DECIMALES_ERROR);

/**
 * Acto 1 · Veredicto: «Hasta julio de 2028, {sitio}…» con los meses viables y críticos, y como cifra héroe el error
 * medido contra JPL Horizons en los puntos de control. Si la API no trae control, se enseña el RMSE del modelo
 * rotulado como tal; si tampoco, se dice que no hay error medido. Nunca se rellena con un valor propio.
 */
export function ActoVeredictoProyeccion({ sitio, resultado, modelo }: { sitio: string; resultado: ResultadoProyeccion; modelo: ModeloProyeccion }) {
  const t = T.proyeccion;
  const r = resumenMeses(resultado.meses ?? []);
  const control = errorControl(modelo.error, resultado.site_id);
  const rmseSol = modelo.error?.rmse_deg?.sol_el_deg;
  const aciertos = modelo.error?.aciertos_semaforo_control;
  const cuentas = [
    { clave: "viables", rotulo: t.veredicto.cuenta.viables, valor: r.viables, tono: "text-viable" },
    { clave: "reservas", rotulo: t.veredicto.cuenta.reservas, valor: r.reservas, tono: "text-reservas" },
    { clave: "criticos", rotulo: t.veredicto.cuenta.criticos, valor: r.criticos, tono: "text-critico" },
  ];
  return (
    <PanelVidrio como="section" aria-labelledby="acto-veredicto-proyeccion" relleno="ninguno" className="relative mt-6 overflow-hidden p-5 md:p-8">
      {/* La única luz de acento de la pantalla: el Sol, ámbar, rasante desde la esquina. Decorativa y quieta. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_90%_at_0%_0%,var(--color-sol-tenue),transparent_70%)]" />
      <div className="relative grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center">
        <div className="lujo-entrada min-w-0" style={entrada(0, 12)}>
          <p id="acto-veredicto-proyeccion" className="rotulo">{t.actos.veredicto}</p>
          {r.total > 0 && r.ultimoMes ? (
            <>
              <Veredicto nivel={r.nivel} etiqueta={t.veredicto.etiquetas[r.nivel]} como="h2" tamano="titulo" className="mt-4 *:last:basis-full">
                {t.veredicto.frase(mesLargo(inicioDelMes(r.ultimoMes)), sitio, r.viables, r.total, r.criticos)}
              </Veredicto>
              <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
                {cuentas.map((c) => (
                  <div key={c.clave} className="min-w-0">
                    <dt className="rotulo">{c.rotulo}</dt>
                    <dd className={`text-dato-xl mt-1 font-mono font-medium ${c.tono}`} data-dato>{c.valor}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-apoyo text-texto-2 mt-4 max-w-medida">{t.veredicto.nota}</p>
            </>
          ) : (
            <Veredicto nivel="amarillo" etiqueta={t.veredicto.etiquetas.sinMeses} como="h2" tamano="titulo" className="mt-4 *:last:basis-full">
              {t.veredicto.sinMeses(sitio)}
            </Veredicto>
          )}
        </div>
        <div className="lujo-entrada min-w-0" style={entrada(60, 8)} data-error-heroe={control ? "control" : typeof rmseSol === "number" ? "rmse" : "ninguno"}>
          {control ? (
            <CifraHeroe valor={control.mediaAbs} formato={error} unidad="°" rotulo={t.heroe.rotulo} tono="sol"
              contexto={<>{(control.deEsteSitio ? t.heroe.delSitio : t.heroe.global)(control.puntos)} {t.heroe.maximo(grados(control.maxAbs, PROYECCION_MODELO.DECIMALES_ERROR))}</>} />
          ) : typeof rmseSol === "number" && Number.isFinite(rmseSol) ? (
            <CifraHeroe valor={rmseSol} formato={error} unidad="°" rotulo={t.heroe.rmseRotulo} contexto={t.heroe.rmseContexto} />
          ) : (
            <p className="text-texto-2 max-w-medida">{t.heroe.sinError}</p>
          )}
          {/* El error a largo plazo (por horizonte y puntos de control) aún puede no existir: se deja el hueco, rotulado. */}
          {(!modelo.error?.por_horizonte?.length || !modelo.error?.control_horizons?.length) && <p className="text-apoyo text-reservas mt-3 flex items-center gap-2 font-semibold" data-error-pendiente=""><Hourglass aria-hidden="true" className="size-4 shrink-0" />{t.heroe.pendiente}</p>}
          {aciertos && aciertos.total > 0 && <p className="text-apoyo text-texto mt-3 max-w-medida">{t.heroe.aciertos(aciertos.aciertos, aciertos.total)}</p>}
          {(control || typeof rmseSol === "number") && <p className="text-apoyo text-texto-2 mt-2 max-w-medida">{t.heroe.mision}</p>}
        </div>
      </div>
    </PanelVidrio>
  );
}
