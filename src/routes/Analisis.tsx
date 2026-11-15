import { Navigate, useSearchParams } from "react-router";
import { ActoDetalle } from "../components/analisis/ActoDetalle";
import { ActoVeredicto } from "../components/analisis/ActoVeredicto";
import { GraficoSerie } from "../components/analisis/GraficoSerie";
import { IndicadoresMision } from "../components/analisis/IndicadoresMision";
import { RitmosCielo } from "../components/analisis/RitmosCielo";
import { TituloPagina } from "../components/layout/TituloPagina";
import { EstadoCarga, EstadoError } from "../components/ui/Estados";
import { Segmentado } from "../components/ui/Segmentado";
import { useAnalisis } from "../hooks/useAnalisis";
import { useEscribirUrl } from "../hooks/useParametrosUrl";
import { VARIABLES_ANALISIS, esVariableAnalisis, type Analisis as DatosAnalisis, type VariableAnalisis } from "../lib/analisis";
import { PARAM_URL, RUTAS } from "../lib/constants";
import { nombreCorto } from "../lib/formato";
import { esPuntoPropio } from "../lib/puntoPropio";
import { T } from "../lib/textos";
import type { Utc } from "../lib/tipos";
import { useContextoSitio } from "./SitioLayout";

const VARIABLES = VARIABLES_ANALISIS.map((v) => ({ valor: v, etiqueta: T.analisis.serie.variables[v] }));

/** Acto 2 · Evidencia: la serie a todo el ancho con su cursor, los ritmos del cielo y lo que el cielo impone a la misión. */
function ActoEvidencia({ a, sitio, desde, hasta, variable, alCambiarVariable }: { a: DatosAnalisis; sitio: string; desde: Utc; hasta: Utc; variable: VariableAnalisis; alCambiarVariable: (v: VariableAnalisis) => void }) {
  const t = T.analisis.informe;
  return (
    <section aria-labelledby="acto-evidencia" className="mt-16">
      <p className="rotulo">{t.actos.evidencia}</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <h2 id="acto-evidencia" className="titulo-instrumento text-seccion text-texto">{t.evidencia.titulo}</h2>
          <p className="text-texto-2 mt-2 max-w-medida">{t.evidencia.entrada}</p>
        </div>
        <Segmentado comoRadio etiqueta={T.analisis.serie.variable} valor={variable} alCambiar={alCambiarVariable} opciones={VARIABLES} />
      </div>
      {/* La clave reinicia el cursor cuando llega la serie de otra variable. */}
      <GraficoSerie key={a.serie.variable} analisis={a} />
      <RitmosCielo a={a} />
      <IndicadoresMision siteId={a.site_id} sitio={sitio} desde={desde} hasta={hasta} />
    </section>
  );
}

/** «Informe de confianza de la proyección» de un sitio, en tres actos: veredicto, evidencia y detalle con trazabilidad. */
function AnalisisSitio() {
  const t = T.analisis;
  const { sitio, desde, hasta } = useContextoSitio();
  const [params] = useSearchParams();
  const escribir = useEscribirUrl();
  const pedida = params.get(PARAM_URL.VARIABLE);
  const variable: VariableAnalisis = esVariableAnalisis(pedida) ? pedida : "sol_el_deg";
  const { data, isPending, error, refetch } = useAnalisis(sitio.site_id, variable === "sol_el_deg" ? undefined : variable);
  const nombre = nombreCorto(sitio.nombre);
  return (
    <div className="contenedor py-8 lg:py-10">
      <p className="rotulo">{t.informe.rotulo}</p>
      <TituloPagina documento={t.informe.documento(sitio.nombre)} className="text-titulo! mt-2">{t.informe.pregunta(nombre)}</TituloPagina>
      {isPending && <EstadoCarga texto={t.cargando} className="min-h-[60svh]" />}
      {error && !data && <EstadoError error={error} className="mt-8" alReintentar={() => void refetch()} />}
      {data && (
        <>
          <ActoVeredicto a={data} />
          <ActoEvidencia a={data} sitio={nombre} desde={desde} hasta={hasta} variable={variable} alCambiarVariable={(v) => escribir({ [PARAM_URL.VARIABLE]: v === "sol_el_deg" ? null : v })} />
          <ActoDetalle a={data} />
        </>
      )}
    </div>
  );
}

/** Un punto propio no tiene archivo que analizar (sus datos se piden en vivo a JPL): su dirección de análisis lleva al cielo. */
export default function Analisis() {
  const { sitio } = useContextoSitio();
  return esPuntoPropio(sitio.site_id) ? <Navigate to={RUTAS.CIELO(sitio.site_id)} replace /> : <AnalisisSitio />;
}
