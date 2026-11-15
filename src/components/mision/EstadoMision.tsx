import { ChevronDown } from "lucide-react";
import { useId, useState, type CSSProperties } from "react";
import { useMetricas } from "../../hooks/useMetricas";
import { ENTRADA_LUJO } from "../../lib/constants";
import { esMesSinDatos } from "../../lib/errores";
import { fechaHora } from "../../lib/fechas";
import { horas, pct } from "../../lib/formato";
import { horasHasta } from "../../lib/indicadores";
import { T, periodoLegible } from "../../lib/textos";
import type { Site, Utc } from "../../lib/tipos";
import { GlifoAstro } from "../glifos/Astros";
import { PanelVidrio } from "../lujo";
import { unir } from "../ui/clases";
import { Plegable } from "../ui/Plegable";
import { ChipNivel } from "./ChipNivel";
import { IndicadoresAstronauta } from "./IndicadoresAstronauta";
import { MedidoresMision } from "./MedidoresMision";

const retraso = (paso: number) => ({ "--retraso": `${paso * ENTRADA_LUJO.PASO_MS}ms` }) as CSSProperties;

/**
 * Cabecera «Estado de misión» de un sitio en el periodo elegido. Veredicto: el semáforo global y los dos medidores
 * (energía y comunicación), con la próxima puesta del Sol y cuánto se ve la Tierra. Evidencia: los indicadores para
 * astronautas. Todo sale de `/api/metricas`; mientras carga se reservan los tamaños (nada se desplaza al llegar).
 */
export function EstadoMision({ sitio, desde, hasta, plegado = false, className }: {
  sitio: Pick<Site, "site_id" | "nombre">; desde: Utc; hasta: Utc;
  /**
   * Plegado por defecto (queda la franja con el veredicto y el resumen en una línea): donde la pantalla es de la
   * escena del cielo. Sigue a la ruta hasta que la persona lo abre o lo cierra; desde entonces manda su elección.
   */
  plegado?: boolean; className?: string;
}) {
  const t = T.mision;
  const id = useId();
  const [eleccion, setEleccion] = useState<boolean | null>(null);
  const abierto = eleccion ?? !plegado;
  const { data, error } = useMetricas([sitio.site_id], { desde, hasta }, { mantener: true });
  // Un mes sin datos no enseña las cifras del mes anterior (`mantener` las conserva mientras llega lo nuevo).
  const m = !esMesSinDatos(error) && data?.resultados[0]?.site_id === sitio.site_id ? data.resultados[0] : undefined;
  const periodo = periodoLegible(desde, hasta);
  const ind = m?.indicadores_astronauta;
  const puesta = ind?.proxima_puesta_sol_utc;
  const horasPuesta = m ? horasHasta(m.inicio_utc, puesta) : null;
  return (
    <PanelVidrio como="section" relleno="ninguno" aria-label={t.region(sitio.nombre, periodo)} className={className}>
      <div className="flex min-h-12 items-center gap-x-3 px-4 md:px-6">
        <h2 className="rotulo shrink-0">{t.titulo}</h2>
        {m && <ChipNivel nivel={m.semaforo.global} rotulo={T.semaforo.global} className="entrada-lujo shrink-0" />}
        {/* Plegado, la franja resume las dos cifras (y la próxima puesta si cabe); abierto, ya están debajo. */}
        {m && !abierto && (
          <p className="entrada-lujo text-apoyo text-texto-2 min-w-0 truncate font-mono" data-dato>
            {t.resumen(pct(Math.floor(m.pct_sol)), pct(Math.floor(m.pct_tierra)))}
            {horasPuesta !== null && <span className="max-md:hidden"> · {t.puestaCorta(horas(horasPuesta))}</span>}
          </p>
        )}
        <button type="button" aria-expanded={abierto} aria-controls={id} aria-label={abierto ? t.ocultar : t.mostrar}
          onClick={() => setEleccion(!abierto)}
          className="tactil text-texto-2 hover:text-texto -mr-3 ml-auto grid place-content-center transition-transform duration-(--dur-micro) ease-salida active:scale-[0.94]">
          <ChevronDown aria-hidden="true" className={unir("size-4 transition-transform duration-(--dur-corta) ease-salida", abierto && "rotate-180")} />
        </button>
      </div>
      <Plegable abierto={abierto} rapido>
        <div id={id} className="grid gap-x-10 gap-y-6 px-4 pb-4 md:px-6 md:pb-6 lg:grid-cols-[auto_minmax(0,1fr)]" aria-busy={!m && !error}>
          <div className="flex flex-col gap-4 sm:max-lg:flex-row sm:max-lg:items-center sm:max-lg:gap-8">
            <MedidoresMision metrica={m} animar />
            <ul className="text-apoyo text-texto min-h-24 max-w-[26rem] space-y-2 lg:max-w-[14.5rem]">
              {m && (
                <>
                  {(horasPuesta !== null || puesta === null) && (
                    <li className="entrada-lujo flex items-start gap-2" style={retraso(1)}>
                      <GlifoAstro astro="sol" px={14} className="mt-1 shrink-0" />
                      <span>
                        {horasPuesta !== null && puesta ? t.puestaSol(horas(horasPuesta), fechaHora(puesta)) : t.sinPuestaSol(fechaHora(m.fin_utc))}
                        {horasPuesta !== null && <span className="text-texto-2 block text-[0.75rem]">{t.desdeInicio(fechaHora(m.inicio_utc))}</span>}
                      </span>
                    </li>
                  )}
                  <li className="entrada-lujo flex items-start gap-2" style={retraso(2)}>
                    <GlifoAstro astro="tierra" px={14} className="mt-1 shrink-0" />
                    <span>{t.tierraVisible(pct(m.pct_tierra), horas(m.horas_tierra_visible))}</span>
                  </li>
                </>
              )}
            </ul>
          </div>
          {/* Alto reservado = el de la variante más larga (frases ES a 1024 px): el panel mide lo mismo antes y después del dato. */}
          <div className="min-h-44 min-w-0 md:min-h-[21.75rem]">
            {m && (
              <div className="entrada-lujo" style={retraso(3)}>
                <h3 className="rotulo text-texto mb-4">{t.indicadores} · <span className="normal-case">{periodo}</span></h3>
                <IndicadoresAstronauta metrica={m} sitio={sitio} />
              </div>
            )}
          </div>
        </div>
      </Plegable>
    </PanelVidrio>
  );
}
