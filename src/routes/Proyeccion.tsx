import { LockKeyhole } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router";
import { TituloPagina } from "../components/layout/TituloPagina";
import { ActoDetalleProyeccion, LimitacionesProyeccion } from "../components/proyeccion/ActoDetalleProyeccion";
import { ActoVeredictoProyeccion } from "../components/proyeccion/ActoVeredictoProyeccion";
import { EtiquetaProyeccion } from "../components/proyeccion/EtiquetaProyeccion";
import { GraficoProyeccion } from "../components/proyeccion/GraficoProyeccion";
import { LineaMeses } from "../components/proyeccion/LineaMeses";
import { EnlaceBoton } from "../components/ui/Boton";
import { EstadoCarga, EstadoError } from "../components/ui/Estados";
import { Segmentado } from "../components/ui/Segmentado";
import { useAnalisis } from "../hooks/useAnalisis";
import { useEscribirUrl } from "../hooks/useParametrosUrl";
import { useProyeccion } from "../hooks/useProyeccion";
import { useSesion } from "../hooks/useSesion";
import { PARAM_URL, PROYECCION_MODELO, RUTAS } from "../lib/constants";
import { aMs, sumarMeses } from "../lib/fechas";
import { nombreCorto } from "../lib/formato";
import { esPasoHoras, inicioDelMes, mesesParciales, resultadoDe, type PasoHorasProyeccion, type ProyeccionModelo, type ResultadoProyeccion } from "../lib/proyeccionModelo";
import { esPuntoPropio } from "../lib/puntoPropio";
import { T } from "../lib/textos";
import { useContextoSitio } from "./SitioLayout";

const PASOS = PROYECCION_MODELO.PASOS_HORAS.map((h) => ({ valor: String(h), etiqueta: T.proyeccion.evidencia.pasoHoras(h) }));

/** Quien no es admin no ve la proyección ni la pide: solo se le dice qué rol hace falta y, sin sesión, dónde entrar. */
function SinPermiso({ anonimo, siteId }: { anonimo: boolean; siteId: string }) {
  const t = T.proyeccion.sinPermiso;
  return (
    <div role="status" className="panel mt-8 max-w-xl p-4 md:p-5" data-sin-permiso="">
      <p className="text-texto flex items-start gap-2.5 font-semibold">
        <span aria-hidden="true" className="bg-reservas/12 text-reservas grid size-6 shrink-0 place-items-center rounded-full"><LockKeyhole className="size-3.5" /></span>
        {t.titulo}
      </p>
      <p className="text-apoyo text-texto-2 mt-1.5">{t.texto} {anonimo && <span className="text-texto">{t.anonimo}</span>}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {anonimo && <EnlaceBoton to={RUTAS.ACCESO} variante="primario">{t.acceso}</EnlaceBoton>}
        <EnlaceBoton to={RUTAS.CIELO(siteId)}>{t.volver}</EnlaceBoton>
      </div>
    </div>
  );
}

/** Acto 2 · Evidencia: la línea de meses (semáforo de energía y comunicación) y la serie con su banda de error. */
function ActoEvidencia({ p, resultado, sitio, paso }: { p: ProyeccionModelo; resultado: ResultadoProyeccion; sitio: string; paso: PasoHorasProyeccion }) {
  const t = T.proyeccion.evidencia;
  const [mes, setMes] = useState<string | null>(null);
  const meses = resultado.meses ?? [];
  const serie = resultado.serie ?? [];
  const elegido = meses.some((m) => m.mes === mes) ? mes : null;
  const parciales = useMemo(() => mesesParciales(serie, meses, paso), [serie, meses, paso]);
  const dominio = useMemo(() => (elegido ? ([aMs(inicioDelMes(elegido)), aMs(sumarMeses(inicioDelMes(elegido), 1))] as const) : null), [elegido]);
  return (
    <section aria-labelledby="acto-evidencia-proyeccion" className="mt-16">
      <p className="rotulo">{T.proyeccion.actos.evidencia}</p>
      <h2 id="acto-evidencia-proyeccion" className="titulo-instrumento text-seccion text-texto mt-2">{t.titulo}</h2>
      <p className="text-texto-2 mt-2 max-w-medida">{t.entrada}</p>
      {meses.length > 0 && <div className="mt-5"><LineaMeses meses={meses} elegido={elegido} alElegir={setMes} parciales={parciales} /></div>}
      <h3 className="text-subtitulo text-texto mt-8 font-semibold">{T.proyeccion.serie.titulo}</h3>
      <GraficoProyeccion serie={serie} modelo={p.modelo} sitio={sitio} dominio={dominio} />
    </section>
  );
}

/** «Proyección» de un sitio (solo rol admin), en tres actos: veredicto, evidencia y detalle con trazabilidad. */
function ProyeccionSitio() {
  const t = T.proyeccion;
  const { sitio } = useContextoSitio();
  const { usuario, comprobando } = useSesion();
  const esAdmin = usuario?.rol === PROYECCION_MODELO.ROL;
  const [params] = useSearchParams();
  const escribir = useEscribirUrl();
  const pedido = Number(params.get(PARAM_URL.PASO));
  const paso: PasoHorasProyeccion = esPasoHoras(pedido) ? pedido : PROYECCION_MODELO.PASO_POR_DEFECTO;
  const { data, isPending, error, refetch } = useProyeccion(sitio.site_id, paso, esAdmin);
  // Procedencia y firma del archivo de efemérides del sitio (público): solo acompaña al Sello, y solo para admin.
  const analisis = useAnalisis(esAdmin ? sitio.site_id : undefined);
  const nombre = nombreCorto(sitio.nombre);
  const resultado = data ? resultadoDe(data, sitio.site_id) : undefined;
  return (
    <div className="contenedor py-8 lg:py-10">
      <p className="rotulo">{t.rotulo}</p>
      <TituloPagina documento={t.documento(sitio.nombre)} className="text-titulo! mt-2">{t.titulo(nombre)}</TituloPagina>
      {comprobando ? <EstadoCarga texto={t.comprobando} className="min-h-[60svh]" />
        : !esAdmin ? <SinPermiso anonimo={!usuario} siteId={sitio.site_id} />
        : (
          <>
            {/* Permanente: no depende de que la carga termine ni de que salga bien. */}
            <EtiquetaProyeccion className="mt-4" />
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="rotulo">{t.evidencia.paso}</p>
              <Segmentado comoRadio etiqueta={t.evidencia.paso} valor={String(paso)} opciones={PASOS}
                alCambiar={(v) => escribir({ [PARAM_URL.PASO]: Number(v) === PROYECCION_MODELO.PASO_POR_DEFECTO ? null : v })} className="*:min-h-12 *:min-w-12" />
            </div>
            {isPending && <EstadoCarga texto={t.cargando} className="min-h-[60svh]" />}
            {error && <EstadoError error={error} className="mt-8" alReintentar={() => void refetch()} />}
            {data && !error && (
              <>
                {resultado
                  ? <ActoVeredictoProyeccion sitio={nombre} resultado={resultado} modelo={data.modelo} />
                  : <p role="status" className="text-texto-2 mt-8">{t.sinResultado}</p>}
                <LimitacionesProyeccion limitaciones={data.limitaciones} className="mt-6 px-1" />
                {resultado && (
                  <>
                    <ActoEvidencia p={data} resultado={resultado} sitio={nombre} paso={paso} />
                    <ActoDetalleProyeccion p={data} resultado={resultado} certificado={analisis.data?.entrada.origen} />
                  </>
                )}
              </>
            )}
          </>
        )}
    </div>
  );
}

/** Un punto propio no está en el catálogo: no tiene proyección del modelo, y su dirección lleva al cielo. */
export default function Proyeccion() {
  const { sitio } = useContextoSitio();
  return esPuntoPropio(sitio.site_id) ? <Navigate to={RUTAS.CIELO(sitio.site_id)} replace /> : <ProyeccionSitio />;
}
