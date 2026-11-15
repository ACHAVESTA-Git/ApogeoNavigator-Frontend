import { useEffect } from "react";
import { AvisoHorizonteIdeal } from "../components/layout/AvisoHorizonteIdeal";
import { TituloPagina } from "../components/layout/TituloPagina";
import { GlifoSemaforo } from "../components/glifos/GlifoSemaforo";
import { Desplegable } from "../components/ui/Desplegable";
import { CargaHorizons, EstadoCarga, EstadoError } from "../components/ui/Estados";
import { esPuntoPropio } from "../lib/puntoPropio";
import { BandaLuz } from "../components/ventanas/BandaLuz";
import { CifraMetrica } from "../components/ventanas/CifraMetrica";
import { ReferenciaMetricas } from "../components/ventanas/ReferenciaMetricas";
import { SelectorRango } from "../components/ventanas/SelectorRango";
import { useEfemerides } from "../hooks/useEfemerides";
import { useDesde } from "../hooks/useMedia";
import { useMediaCatalogo } from "../hooks/useMediaCatalogo";
import { useMetricas } from "../hooks/useMetricas";
import { usePeriodo } from "../hooks/useParametrosUrl";
import { avisoDeRelieve } from "../lib/astro";
import { ApiError, traducirError } from "../lib/errores";
import { horasEntre, inicioDeMes, sumarMeses } from "../lib/fechas";
import { fijarFranjaTiempo } from "../lib/relojGlobal";
import { horas } from "../lib/formato";
import { NOMBRE_NIVEL, T, periodoLegible } from "../lib/textos";
import { useContextoSitio } from "./SitioLayout";

export default function Ventanas() {
  const t = T.ventanas;
  const { sitio, desde, hasta } = useContextoSitio();
  const periodo = usePeriodo();
  const esTableta = useDesde("md");
  // Dentro del mismo sitio se conserva el rango anterior mientras llega el nuevo; al cambiar de sitio, no.
  const mismoSitio = { mantener: true };
  const metricas = useMetricas([sitio.site_id], { desde, hasta }, mismoSitio);
  const media = useMediaCatalogo({ desde, hasta });
  const efemerides = useEfemerides(sitio.site_id, { desde, hasta }, mismoSitio);
  const deEsteSitio = metricas.data?.resultados[0]?.site_id === sitio.site_id && efemerides.data?.site_id === sitio.site_id;
  const m = deEsteSitio ? metricas.data?.resultados[0] : undefined;
  const error = metricas.error ?? efemerides.error;
  const errorDeRango = error instanceof ApiError && error.esNoProcesable ? traducirError(error).mensaje : null;
  const aviso = m && avisoDeRelieve(m);
  // Barra de tiempo: qué parte del mes cubre el rango elegido.
  useEffect(() => {
    const mes = inicioDeMes(desde);
    const total = horasEntre(mes, sumarMeses(mes, 1));
    fijarFranjaTiempo(horasEntre(mes, desde) / total, Math.min(1, horasEntre(mes, hasta) / total));
    return () => fijarFranjaTiempo(0, 0);
  }, [desde, hasta]);
  const total = m ? horasEntre(m.inicio_utc, m.fin_utc) : 0;

  return (
    <div className="contenedor pt-4 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <TituloPagina documento={t.documento(sitio.nombre)} className="rotulo">{t.titulo(sitio.nombre, periodoLegible(desde, hasta))}</TituloPagina>
        {m && (
          <p className="flex flex-wrap items-center gap-x-2">
            <span className="rotulo">{T.semaforo.global}</span>
            <GlifoSemaforo nivel={m.semaforo.global} />
            <span className="text-texto-3 text-[0.75rem]">({T.semaforo.peor})</span>
            <span className="sr-only">{t.global(NOMBRE_NIVEL[m.semaforo.global])}</span>
          </p>
        )}
      </div>

      {!m && !error && (esPuntoPropio(sitio.site_id) ? <CargaHorizons className="min-h-[40svh]" /> : <EstadoCarga texto={t.cargando} className="min-h-[40svh]" />)}
      {error && !errorDeRango && (
        <EstadoError error={error} className="mt-8" alReintentar={() => { void metricas.refetch(); void efemerides.refetch(); }} />
      )}

      {m && efemerides.data && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-12" aria-live="polite">
            <figure className="m-0 min-w-0 lg:order-none lg:col-span-8" role="img"
              aria-label={t.banda(t.deHoras(horas(m.horas_sol), horas(total)), t.deHoras(horas(m.horas_tierra_visible), horas(total)))}>
              <BandaLuz key={m.inicio_utc + m.fin_utc} filas={efemerides.data.filas} desde={m.inicio_utc} hasta={m.fin_utc} rayado={Boolean(aviso)} tamano={esTableta ? "grande" : "media"} />
            </figure>
            <div className="grid grid-cols-2 gap-6 max-lg:order-first lg:col-span-4 lg:grid-cols-1 lg:content-between lg:pb-6">
              <CifraMetrica astro="sol" porcentaje={m.pct_sol} horasVisibles={m.horas_sol} horasTotales={total} nivel={m.semaforo.energia} sensible={Boolean(aviso)} media={media && { valor: media.pct_sol, n: media.n }} />
              <CifraMetrica astro="tierra" porcentaje={m.pct_tierra} horasVisibles={m.horas_tierra_visible} horasTotales={total} nivel={m.semaforo.comunicacion} media={media && { valor: media.pct_tierra, n: media.n }} />
            </div>
          </div>
          {aviso && (
            <p className="text-apoyo text-texto border-reservas mt-6 max-w-[80ch] border-l-2 pl-3">
              <span aria-hidden="true" className="rayado-artefacto border-reservas mr-2 inline-block size-3 border align-[-1px]" />* {aviso.mensaje}.
            </p>
          )}
          <p className="text-texto-3 mt-4 max-w-[90ch] text-[0.75rem]">{T.semaforo.leyenda}</p>
          <AvisoHorizonteIdeal className="mt-2" />
          <div className="mt-8"><ReferenciaMetricas metrica={m} /></div>
        </>
      )}

      <Desplegable titulo={t.rango} abierto={Boolean(errorDeRango)} className={m ? "border-t-0 border-b" : "mt-8 border-b"}>
        <SelectorRango desde={desde} hasta={hasta} alAplicar={periodo.fijar} errorServidor={errorDeRango} />
      </Desplegable>
    </div>
  );
}
