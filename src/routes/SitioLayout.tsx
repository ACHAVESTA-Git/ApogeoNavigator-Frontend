import { Outlet, useMatch, useOutletContext, useParams } from "react-router";
import { EstadoMision } from "../components/mision/EstadoMision";
import { BotonComparar } from "../components/mapa/BotonComparar";
import { EnlaceBoton } from "../components/ui/Boton";
import { EstadoCarga, EstadoError, EstadoVacio } from "../components/ui/Estados";
import { GlifoCategoria } from "../components/glifos/GlifoCategoria";
import { BarraTiempo } from "../components/tiempo/BarraTiempo";
import { PestanasRuta } from "../components/ui/Segmentado";
import { SelectorMes } from "../components/ui/SelectorMes";
import { usePeriodo } from "../hooks/useParametrosUrl";
import { useSitio } from "../hooks/useSitio";
import { useLlegadaCompartida } from "../hooks/useLlegadaCompartida";
import { ID_NOMBRE_SITIO, RUTAS } from "../lib/constants";
import { coordenadas } from "../lib/formato";
import { esPuntoPropio } from "../lib/puntoPropio";
import { NOMBRE_CATEGORIA, T } from "../lib/textos";
import type { Site, Utc } from "../lib/tipos";

export interface ContextoSitio {
  sitio: Site;
  desde: Utc;
  hasta: Utc;
}
export const useContextoSitio = () => useOutletContext<ContextoSitio>();

/** Cabecera del sitio (nombre, coordenadas, periodo) + pestañas Cielo · Ventanas · Día lunar. */
export default function SitioLayout() {
  const { siteId } = useParams();
  const { sitio, estado, reintentar } = useSitio(siteId);
  const periodo = usePeriodo();
  const t = T.sitio;
  const propio = esPuntoPropio(siteId);
  const nombre = useLlegadaCompartida<HTMLParagraphElement>(ID_NOMBRE_SITIO(siteId ?? ""));
  // En el Cielo manda la escena: el estado de misión queda plegado (la franja con el veredicto y el resumen).
  const enCielo = useMatch(RUTAS.CIELO(":siteId")) !== null;

  if (estado === "cargando") return <div className="contenedor min-h-[60svh]"><EstadoCarga /></div>;
  if (estado === "error") return <div className="contenedor py-12"><EstadoError alReintentar={reintentar} /></div>;
  if (!sitio) {
    return (
      <div className="contenedor py-12">
        <h1 className="titulo-instrumento text-titulo">{t.desconocido}</h1>
        <EstadoVacio titulo={t.desconocidoTexto}><EnlaceBoton to={RUTAS.SITIOS} variante="primario">{t.irASitios}</EnlaceBoton></EstadoVacio>
      </div>
    );
  }
  const id = sitio.site_id;
  const pestanas = [
    { a: `${RUTAS.CIELO(id)}${periodo.consulta}`, etiqueta: t.cielo },
    { a: `${RUTAS.VENTANAS(id)}${periodo.consulta}`, etiqueta: t.ventanas },
    { a: `${RUTAS.DIA_LUNAR(id)}${periodo.consulta}`, etiqueta: t.diaLunar },
    // El análisis es del archivo entero, no del mes: los puntos propios (sin archivo) no lo tienen.
    ...(propio ? [] : [{ a: `${RUTAS.ANALISIS(id)}${periodo.consulta}`, etiqueta: t.analisis }]),
  ];
  return (
    <>
      <header className="contenedor flex flex-wrap items-end justify-between gap-x-8 gap-y-2 pt-3 md:gap-y-3 md:pt-6">
        <div className="min-w-0">
          <p className="rotulo flex items-center gap-2 max-md:hidden">
            <GlifoCategoria categoria={sitio.categoria} className="size-3" />
            {propio ? T.puntoPropio.marca : `${NOMBRE_CATEGORIA[sitio.categoria]} · ${sitio.agencia}`}
          </p>
          <p ref={nombre} className="titulo-instrumento text-seccion text-texto truncate md:mt-1.5">{sitio.nombre}</p>
          <p className="text-dato-sm text-texto-2 font-mono md:mt-1" data-dato>
            {coordenadas(sitio.lat_deg, sitio.lon_este_deg)}
            {/* En móvil el rótulo de arriba no se ve: la marca del punto propio va junto a las coordenadas. */}
            {propio && <span className="text-texto-3 font-sans md:hidden"> · {T.puntoPropio.fuente}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 max-sm:w-full max-sm:justify-between sm:gap-3">
          <SelectorMes periodo={periodo} />
          {/* Un punto propio no está en el catálogo: no entra en la bandeja de comparación. */}
          {!propio && <BotonComparar siteId={id} compacto className="max-sm:px-2.5" />}
        </div>
      </header>
      <div className="contenedor mt-3 md:mt-4">
        <EstadoMision key={id} sitio={sitio} desde={periodo.desde} hasta={periodo.hasta} plegado={enCielo} />
      </div>
      <div className="material sticky top-(--nav-alto-movil) z-20 mt-1 md:top-(--nav-alto) md:mt-2">
        <div className="contenedor">
          <PestanasRuta etiqueta={t.pestanas} pestanas={pestanas} />
          <div className="-mt-0.5"><BarraTiempo /></div>
        </div>
      </div>
      <Outlet context={{ sitio, desde: periodo.desde, hasta: periodo.hasta } satisfies ContextoSitio} />
    </>
  );
}
