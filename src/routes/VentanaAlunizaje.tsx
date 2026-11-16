import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { CalendarioCalor } from "../components/alunizaje/CalendarioCalor";
import { DetalleEstancia } from "../components/alunizaje/DetalleEstancia";
import { MejorVentana } from "../components/alunizaje/MejorVentana";
import { SelectorEstancia } from "../components/alunizaje/SelectorEstancia";
import { TituloPagina } from "../components/layout/TituloPagina";
import { PanelVidrio } from "../components/lujo";
import { EnlaceBoton } from "../components/ui/Boton";
import { EstadoCarga, EstadoError, EstadoVacio } from "../components/ui/Estados";
import { useMetricas } from "../hooks/useMetricas";
import { useEscribirUrl } from "../hooks/useParametrosUrl";
import { useSites } from "../hooks/useSites";
import { useSitio } from "../hooks/useSitio";
import { useVentanasAlunizaje } from "../hooks/useVentanasAlunizaje";
import { estanciaDeUrl, mesDelInstante, mesesCalendario, sinVentanaUtil } from "../lib/alunizaje";
import { esSensibleAlRelieve } from "../lib/astro";
import { ALUNIZAJE, PARAM_URL, RUTAS } from "../lib/constants";
import { esApiAusente } from "../lib/errores";
import { soloFecha } from "../lib/fechas";
import { nombreCorto, numeroCorto } from "../lib/formato";
import { esPuntoPropio } from "../lib/puntoPropio";
import { T } from "../lib/textos";
import type { EstanciaH } from "../lib/tipos";

const SIN_SITIOS: string[] = [];

/** «¿Cuándo conviene alunizar aquí?»: mejor llegada, calendario de calor de fechas y la estancia sobre la línea de tiempo. */
export default function VentanaAlunizaje() {
  const t = T.alunizaje;
  const { siteId } = useParams();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const escribir = useEscribirUrl();
  const { sitio, estado, reintentar } = useSitio(siteId);
  const sitios = useSites();
  const propio = esPuntoPropio(siteId);
  const estanciaH = estanciaDeUrl(params.get(PARAM_URL.ESTANCIA));
  const id = sitio?.site_id;
  const consulta = useVentanasAlunizaje(id ? [id] : SIN_SITIOS, estanciaH, !propio);
  // Con `keepPreviousData` puede quedar a la vista el cálculo anterior: solo vale si es de este sitio.
  const resultado = consulta.data?.resultados.find((r) => r.site_id === id);
  const alDia = Boolean(resultado) && consulta.data?.estancia_h === estanciaH;
  const mejor = resultado?.mejores[0];
  const util = Boolean(resultado && mejor && !sinVentanaUtil(resultado.mejores));
  // «Sensible al relieve» lo dice la API en las métricas del mes de la mejor ventana (no se repite el umbral aquí).
  const metricas = useMetricas(id && mejor && util ? [id] : SIN_SITIOS, mejor ? mesDelInstante(mejor.llegada_utc) : {});
  const metrica = metricas.data?.resultados[0];
  const sensible = Boolean(util && metrica && metrica.site_id === id && esSensibleAlRelieve(metrica));

  const meses = mesesCalendario(resultado?.serie_diaria ?? []);
  const diaUrl = params.get(PARAM_URL.DIA);
  const conDato = (dia: string | null | undefined) => (dia && resultado?.serie_diaria.find((d) => d.dia_utc === dia)) || undefined;
  const elegido = conDato(diaUrl) ?? (util ? conDato(mejor && soloFecha(mejor.llegada_utc)) : undefined);
  const mesDe = (dia: string | undefined) => (dia ? meses.findIndex((m) => m.dias.some((d) => d.dia === dia)) : -1);
  const [mesManual, setMesManual] = useState<number | null>(null);
  const mesActivo = mesManual ?? Math.max(0, mesDe(elegido?.dia_utc));

  const elegir = (dia: string) => {
    setMesManual(null);
    escribir({ [PARAM_URL.DIA]: dia });
  };
  const cambiarEstancia = (h: EstanciaH) => {
    setMesManual(null);
    escribir({ [PARAM_URL.ESTANCIA]: h === ALUNIZAJE.ESTANCIA_POR_DEFECTO ? null : String(h), [PARAM_URL.DIA]: null });
  };
  const cambiarSitio = (nuevo: string) => {
    setMesManual(null);
    const estancia = params.get(PARAM_URL.ESTANCIA);
    navegar(`${RUTAS.VENTANA_ALUNIZAJE(nuevo)}${estancia ? `?${new URLSearchParams({ [PARAM_URL.ESTANCIA]: estancia })}` : ""}`);
  };

  if (estado === "cargando") return <div className="contenedor min-h-[60svh]"><EstadoCarga /></div>;
  if (estado === "error") return <div className="contenedor py-12"><EstadoError alReintentar={reintentar} /></div>;
  if (!sitio || propio) {
    return (
      <div className="contenedor py-12">
        <TituloPagina documento={t.rotulo}>{sitio ? t.rotulo : T.sitio.desconocido}</TituloPagina>
        <EstadoVacio titulo={sitio ? t.puntoPropio : T.sitio.desconocidoTexto}><EnlaceBoton to={RUTAS.SITIOS} variante="primario">{T.sitio.irASitios}</EnlaceBoton></EstadoVacio>
      </div>
    );
  }

  const nombre = nombreCorto(sitio.nombre);
  const descartadas = resultado?.ventanas_descartadas;
  return (
    <div className="contenedor pt-5 pb-16 md:pt-8">
      <p className="rotulo mb-2">{t.rotulo}</p>
      <TituloPagina documento={t.documento(nombre)}>{t.titulo(nombre)}</TituloPagina>

      <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,22rem)_minmax(0,24rem)] md:items-end md:gap-6">
        <label className="block min-w-0">
          <span className="rotulo mb-2 block">{t.sitio}</span>
          <select value={sitio.site_id} onChange={(e) => cambiarSitio(e.target.value)}
            className="rounded-control border-texto/12 bg-superficie text-texto text-cuerpo h-12 w-full border px-3">
            {(sitios.data ?? [sitio]).map((s) => <option key={s.site_id} value={s.site_id}>{s.nombre}</option>)}
          </select>
        </label>
        <SelectorEstancia valor={estanciaH} alCambiar={cambiarEstancia} />
      </div>

      {consulta.error
        ? (esApiAusente(consulta.error)
          ? <EstadoVacio titulo={t.noDisponible.titulo} className="mt-8"><p className="text-apoyo text-texto-2 basis-full">{t.noDisponible.texto}</p></EstadoVacio>
          : <EstadoError error={consulta.error} className="mt-8" alReintentar={() => void consulta.refetch()} />)
        : (
          <>
            <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-start" aria-busy={!alDia}>
              <PanelVidrio como="section" aria-live="polite" className="min-h-[24rem] lg:col-span-5">
                {resultado
                  ? <MejorVentana key={`${sitio.site_id}-${consulta.data?.estancia_h}`} siteId={sitio.site_id} resultado={resultado} estanciaH={estanciaDeUrl(String(consulta.data?.estancia_h))} sensible={sensible} alElegir={elegir} />
                  : <EstadoCarga texto={t.cargando} className="min-h-[20rem]" />}
              </PanelVidrio>
              <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
                <PanelVidrio como="section">
                  <h2 className="text-seccion text-texto font-medium">{t.calendario.titulo}</h2>
                  <p className="text-apoyo text-texto-2 mt-1 mb-4 max-w-medida">{t.calendario.ayuda}</p>
                  <CalendarioCalor meses={meses} mesActivo={mesActivo} alCambiarMes={setMesManual} seleccion={elegido?.dia_utc ?? null} alElegir={elegir}
                    mejorDia={util && mejor ? soloFecha(mejor.llegada_utc) : null} claveEntrada={`${sitio.site_id}-${consulta.data?.estancia_h ?? 0}`} cargando={!resultado} />
                </PanelVidrio>
                <PanelVidrio className="min-h-[17rem]">
                  {resultado && elegido
                    ? <DetalleEstancia siteId={sitio.site_id} dato={elegido} estanciaH={estanciaDeUrl(String(consulta.data?.estancia_h))} rayado={sensible} />
                    : <p className="text-apoyo text-texto-2">{resultado ? t.detalle.elige : t.cargando}</p>}
                </PanelVidrio>
              </div>
            </div>
            <p className="text-texto-2 mt-6 max-w-medida text-[0.75rem]">
              {t.notas.datos} {t.notaReferencia}
              {resultado?.trunca && descartadas ? ` ${t.notas.descartadas(numeroCorto(descartadas))}` : ""}
            </p>
          </>
        )}
    </div>
  );
}
