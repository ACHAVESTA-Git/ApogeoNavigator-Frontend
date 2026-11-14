import { useTransform } from "motion/react";
import { Suspense, lazy, useCallback, useEffect, useId, useMemo, useRef, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router";
import { PanelLectura } from "../components/cielo/PanelLectura";
import { PanoramaCielo, type Escala } from "../components/cielo/PanoramaCielo";
import { ControlesTiempo, ReglaTiempo } from "../components/cielo/ReglaTiempo";
import { TablaCielo } from "../components/cielo/TablaCielo";
import { AvisoHorizonteIdeal } from "../components/layout/AvisoHorizonteIdeal";
import { useApp } from "../components/layout/contexto";
import { TituloPagina } from "../components/layout/TituloPagina";
import { Boton } from "../components/ui/Boton";
import { Desplegable } from "../components/ui/Desplegable";
import { EstadoCarga, EstadoError } from "../components/ui/Estados";
import { Segmentado } from "../components/ui/Segmentado";
import { useEfemerides } from "../hooks/useEfemerides";
import { useEscribirUrl } from "../hooks/useParametrosUrl";
import { usePuestas } from "../hooks/usePuestas";
import { useRelojSimulacion } from "../hooks/useRelojSimulacion";
import { useTeclasTiempo } from "../hooks/useTeclasTiempo";
import { useValorMotion } from "../hooks/useValorMotion";
import { eventosEn, proximosEventos, sobreHorizonte } from "../lib/astro";
import { MOVIMIENTO, PANORAMA, PARAM_URL } from "../lib/constants";
import { ApiError } from "../lib/errores";
import { aMs } from "../lib/fechas";
import { interpolarFila } from "../lib/interpolar";
import { T, describirCielo } from "../lib/textos";
import type { FilaEfemeride, Site, Utc } from "../lib/tipos";
import { useContextoSitio } from "./SitioLayout";

const CieloCenital = lazy(() => import("../components/cielo/CieloCenital"));
type Vista = "panorama" | "cenital";
const ESCALAS = [{ valor: "lupa" as Escala, etiqueta: T.cielo.lupa }, { valor: "lineal" as Escala, etiqueta: T.cielo.lineal }];
const VISTAS = [{ valor: "panorama" as Vista, etiqueta: T.cielo.panorama }, { valor: "cenital" as Vista, etiqueta: T.cielo.cenital }];

function Instrumento({ sitio, filas, periodo }: { sitio: Site; filas: FilaEfemeride[]; periodo: { desde: Utc; hasta: Utc } }) {
  const t = T.cielo;
  const idTitulo = useId();
  const [params] = useSearchParams();
  const escribir = useEscribirUrl();
  const { anunciar } = useApp();
  const reloj = useRelojSimulacion(filas, sitio.site_id);
  const vista: Vista = params.get(PARAM_URL.VISTA) === "cenital" ? "cenital" : "panorama";
  const escala: Escala = params.get(PARAM_URL.ESCALA) === "lineal" ? "lineal" : "lupa";

  const posicion = useValorMotion(useTransform(reloj.t, (ms) => interpolarFila(filas, ms)));
  // «Puesta en N h»: la API cuando está en pausa; mientras se reproduce, el mismo cálculo sobre las filas ya cargadas.
  const puestas = usePuestas(sitio.site_id, reloj.tUtc, !reloj.reproduciendo);
  // La última respuesta de la API se proyecta al instante en curso (la API ve todos los datos del sitio; las filas
  // cargadas, solo este periodo). Si ya no vale, se usa el cálculo local.
  const ultima = useRef(puestas.data);
  if (puestas.data) ultima.current = puestas.data;
  const eventos = useMemo(() => {
    const locales = proximosEventos(filas, reloj.tUtc);
    const ref = ultima.current;
    const fila = filas[reloj.indice];
    if (!ref || !locales || aMs(ref.desde_utc) > aMs(reloj.tUtc)) return locales;
    return {
      sol: eventosEn(ref.sol, reloj.tUtc, sobreHorizonte(fila.sol_el_deg)) ?? locales.sol,
      tierra: eventosEn(ref.tierra, reloj.tUtc, sobreHorizonte(fila.tierra_el_deg)) ?? locales.tierra,
    };
  }, [filas, reloj.tUtc, reloj.indice, puestas.data]); // eslint-disable-line react-hooks/exhaustive-deps

  // La descripción se anuncia solo al pausar o soltar, nunca durante la reproducción.
  useEffect(() => {
    if (reloj.reproduciendo) return;
    const espera = setTimeout(() => anunciar(describirCielo(reloj.tUtc, filas[reloj.indice])), MOVIMIENTO.DEBOUNCE_ANUNCIO_MS);
    return () => clearTimeout(espera);
  }, [reloj.tUtc, reloj.reproduciendo, reloj.indice, filas, anunciar]);

  const teclas = useTeclasTiempo(reloj);
  const alPulsarTecla = useCallback(
    (e: KeyboardEvent, girar: (g: number) => void) => {
      if (e.key === "[") girar(-PANORAMA.GIRO_DEG);
      else if (e.key === "]") girar(PANORAMA.GIRO_DEG);
      else teclas(e);
    },
    [teclas],
  );

  return (
    <div className="contenedor pt-4 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <TituloPagina documento={t.documento(sitio.nombre)} className="rotulo">
          <span id={idTitulo}>{t.titulo(sitio.nombre)}</span>
        </TituloPagina>
        <div className="flex gap-x-2 md:gap-x-6">
          {vista === "panorama" && (
            <Segmentado etiqueta={t.escala} opciones={ESCALAS} valor={escala} className="border-b-0"
              alCambiar={(v) => escribir({ [PARAM_URL.ESCALA]: v === "lupa" ? null : v })} />
          )}
          <Segmentado etiqueta={t.vista} opciones={VISTAS} valor={vista} className="border-b-0"
            alCambiar={(v) => escribir({ [PARAM_URL.VISTA]: v === "panorama" ? null : v })} />
        </div>
      </div>
      {reloj.ajustado && <p role="status" className="text-apoyo text-reservas mt-2">{t.rangoAjustado}</p>}

      <div className="mt-1 grid grid-cols-1 gap-x-6 gap-y-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-9">
          {vista === "panorama" ? (
            <PanoramaCielo filas={filas} t={reloj.t} tUtc={reloj.tUtc} escala={escala} alPulsarTecla={alPulsarTecla} idTitulo={idTitulo} />
          ) : (
            <Suspense fallback={<EstadoCarga />}>
              <div tabIndex={0} role="group" aria-labelledby={idTitulo} aria-keyshortcuts={t.teclas} onKeyDown={teclas} className="py-4">
                <CieloCenital filas={filas} t={reloj.t} tUtc={reloj.tUtc} idTitulo={idTitulo} />
              </div>
            </Suspense>
          )}
          <AvisoHorizonteIdeal className="mt-3" />
        </div>
        <PanelLectura utc={reloj.tUtc} posicion={posicion} eventos={eventos} periodo={periodo} className="min-w-0 lg:col-span-3 lg:pt-2" />
      </div>

      <div className="mt-6">
        <ReglaTiempo filas={filas} reloj={reloj} />
        <div className="mt-3"><ControlesTiempo reloj={reloj} /></div>
      </div>

      <div className="mt-10">
        <Desplegable titulo={t.tabla}><TablaCielo filas={filas} indice={reloj.indice} /></Desplegable>
        <Desplegable titulo={t.atajos} className="border-b">
          <dl className="text-apoyo grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
            {t.listaAtajos.map(([tecla, accion]) => (
              <div key={tecla} className="contents">
                <dt className="text-texto font-mono">{tecla}</dt>
                <dd className="text-texto-2">{accion}</dd>
              </div>
            ))}
          </dl>
        </Desplegable>
      </div>
    </div>
  );
}

export default function Cielo() {
  const { sitio, desde, hasta } = useContextoSitio();
  const { abrirCarga } = useApp();
  const { data, isPending, error, refetch } = useEfemerides(sitio.site_id, { desde, hasta });
  if (isPending) return <div className="contenedor min-h-[70svh]"><EstadoCarga texto={T.cielo.cargando} /></div>;
  if (error || !data?.filas.length) {
    const sinEfemerides = error instanceof ApiError && error.esNoEncontrado;
    return (
      <div className="contenedor py-10">
        <EstadoError error={error ?? undefined} titulo={sinEfemerides ? T.errores.sinEfemerides : !error ? T.errores.sinDatosRango : undefined}
          alReintentar={sinEfemerides ? undefined : () => void refetch()}>
          {sinEfemerides && <Boton variante="primario" onClick={abrirCarga}>{T.nav.subir}</Boton>}
        </EstadoError>
      </div>
    );
  }
  return <Instrumento key={`${sitio.site_id}-${desde}`} sitio={sitio} filas={data.filas} periodo={{ desde, hasta }} />;
}
