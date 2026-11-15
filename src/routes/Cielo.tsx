import { useTransform } from "motion/react";
import { Suspense, lazy, useCallback, useEffect, useId, useMemo, useRef, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router";
import { PanelLectura } from "../components/cielo/PanelLectura";
import { PanoramaCielo, type Escala } from "../components/cielo/PanoramaCielo";
import { TablaCielo } from "../components/cielo/TablaCielo";
import { AvisoHorizonteIdeal } from "../components/layout/AvisoHorizonteIdeal";
import { useApp } from "../components/layout/contexto";
import { TituloPagina } from "../components/layout/TituloPagina";
import { Transporte, controlDeReloj } from "../components/tiempo/Transporte";
import { Boton } from "../components/ui/Boton";
import { Desplegable } from "../components/ui/Desplegable";
import { EstadoCarga, EstadoError } from "../components/ui/Estados";
import { Segmentado } from "../components/ui/Segmentado";
import { useEfemerides } from "../hooks/useEfemerides";
import { useDesde } from "../hooks/useMedia";
import { useEscribirUrl, usePeriodo } from "../hooks/useParametrosUrl";
import { useSimulacion } from "../hooks/useSimulacion";
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
import { grados } from "../lib/formato";
import type { FilaEfemeride, PuntoSimulacion, Site, Utc } from "../lib/tipos";
import { useContextoSitio } from "./SitioLayout";

const CieloCenital = lazy(() => import("../components/cielo/CieloCenital"));
type Vista = "panorama" | "cenital";
const ESCALAS = [{ valor: "lupa" as Escala, etiqueta: T.cielo.lupa }, { valor: "lineal" as Escala, etiqueta: T.cielo.lineal }];
const VISTAS = [{ valor: "panorama" as Vista, etiqueta: T.cielo.panorama }, { valor: "cenital" as Vista, etiqueta: T.cielo.cenital }];

/** Mayor incertidumbre del punto (0 si es un dato de Horizons). */
const incertidumbreDe = (fila: FilaEfemeride): number => {
  const i = (fila as Partial<PuntoSimulacion>).incertidumbre_deg;
  return i ? Math.max(i.sol_az_deg, i.sol_el_deg, i.tierra_az_deg, i.tierra_el_deg) : 0;
};

function Instrumento({ sitio, filas, periodo }: { sitio: Site; filas: FilaEfemeride[]; periodo: { desde: Utc; hasta: Utc } }) {
  const t = T.cielo;
  const idTitulo = useId();
  const [params] = useSearchParams();
  const escribir = useEscribirUrl();
  const { anunciar } = useApp();
  const reloj = useRelojSimulacion(filas, sitio.site_id);
  const esEscritorio = useDesde("lg");
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

  const incertidumbre = incertidumbreDe(filas[reloj.indice]);
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
        <TituloPagina documento={t.documento(sitio.nombre)} className="rotulo max-md:sr-only">
          <span id={idTitulo}>{t.titulo(sitio.nombre)}</span>
        </TituloPagina>
        <div className="flex gap-x-2 md:gap-x-6">
          {vista === "panorama" && (
            <Segmentado etiqueta={t.escala} opciones={ESCALAS} valor={escala}
              alCambiar={(v) => escribir({ [PARAM_URL.ESCALA]: v === "lupa" ? null : v })} />
          )}
          <Segmentado etiqueta={t.vista} opciones={VISTAS} valor={vista}
            alCambiar={(v) => escribir({ [PARAM_URL.VISTA]: v === "panorama" ? null : v })} />
        </div>
      </div>
      {incertidumbre > 0 && (
        <p role="status" className="text-apoyo text-reservas mt-2 flex items-center gap-2">
          <span className="border-reservas rounded-full border border-dashed px-2 py-0.5 text-[0.75rem] font-semibold tracking-wide uppercase">{t.proyeccion}</span>
          {t.proyeccionAviso} {t.proyeccionNota(grados(incertidumbre, 2))}
        </p>
      )}
      {reloj.ajustado && <p role="status" className="text-apoyo text-reservas mt-2">{t.rangoAjustado}</p>}

      {/* La simulación es la protagonista: ocupa todo el ancho y casi toda la altura. El control de tiempo flota
          sobre el suelo de la escena en pantallas anchas; en móvil es una barra compacta que se queda pegada
          encima de la barra inferior mientras la escena está a la vista. */}
      <div className="relative mt-2">
        {vista === "panorama" ? (
          <PanoramaCielo filas={filas} t={reloj.t} tUtc={reloj.tUtc} escala={escala} alPulsarTecla={alPulsarTecla} idTitulo={idTitulo}
            semilla={sitio.site_id} alArrastrarTiempo={reloj.arrastrarA} alSoltarTiempo={reloj.irA} incertidumbre={incertidumbre} eventos={eventos} />
        ) : (
          <Suspense fallback={<EstadoCarga />}>
            <div tabIndex={0} role="group" aria-labelledby={idTitulo} aria-keyshortcuts={t.teclas} onKeyDown={teclas} className="panel py-6 md:pb-40">
              <CieloCenital filas={filas} t={reloj.t} tUtc={reloj.tUtc} idTitulo={idTitulo} />
            </div>
          </Suspense>
        )}
        <div data-transporte className="max-md:material-denso max-md:sticky max-md:bottom-[calc(var(--barra-inferior-alto)+var(--bandeja-alto)+env(safe-area-inset-bottom))] max-md:z-20 max-md:-mx-(--margen) max-md:border-t max-md:border-texto/10 max-md:px-(--margen) max-md:pt-1 max-md:pb-2 md:material md:absolute md:inset-x-4 md:bottom-12 md:rounded-panel md:border md:border-texto/10 md:px-4 md:pt-3 md:pb-2 md:shadow-flotante">
          <Transporte filas={filas} control={controlDeReloj(reloj, filas)} conHoras={esEscritorio} />
        </div>
      </div>
      <PanelLectura utc={reloj.tUtc} posicion={posicion} eventos={eventos} periodo={periodo} className="panel mt-4 p-4 md:p-5" />
      <AvisoHorizonteIdeal className="mt-4" />

      <div className="mt-8">
        <Desplegable titulo={t.tabla} className="border-b"><TablaCielo filas={filas} indice={reloj.indice} /></Desplegable>
      </div>
    </div>
  );
}

export default function Cielo() {
  const { sitio, desde, hasta } = useContextoSitio();
  const { abrirCarga } = useApp();
  const { esProyeccion } = usePeriodo();
  const efemerides = useEfemerides(sitio.site_id, { desde, hasta }, {}, !esProyeccion);
  const simulacion = useSimulacion(sitio.site_id, { desde, hasta }, esProyeccion);
  const { isPending, error, refetch } = esProyeccion ? simulacion : efemerides;
  const data = esProyeccion ? (simulacion.data && { filas: simulacion.data.puntos }) : efemerides.data;
  if (isPending) return <div className="contenedor min-h-[70svh]"><EstadoCarga texto={T.cielo.cargando} /></div>;
  if (error || !data?.filas.length) {
    const sinEfemerides = !esProyeccion && error instanceof ApiError && error.esNoEncontrado;
    return (
      <div className="contenedor py-10">
        <EstadoError error={esProyeccion ? undefined : (error ?? undefined)} titulo={esProyeccion ? T.cielo.proyeccionSinApi : sinEfemerides ? T.errores.sinEfemerides : !error ? T.errores.sinDatosRango : undefined}
          alReintentar={sinEfemerides ? undefined : () => void refetch()}>
          {sinEfemerides && <Boton variante="primario" onClick={abrirCarga}>{T.nav.subir}</Boton>}
        </EstadoError>
      </div>
    );
  }
  return <Instrumento key={`${sitio.site_id}-${desde}`} sitio={sitio} filas={data.filas} periodo={{ desde, hasta }} />;
}
