import { Outlet, useOutletContext, useParams } from "react-router";
import { BotonComparar } from "../components/mapa/BotonComparar";
import { EnlaceBoton } from "../components/ui/Boton";
import { EstadoCarga, EstadoError, EstadoVacio } from "../components/ui/Estados";
import { GlifoCategoria } from "../components/glifos/GlifoCategoria";
import { PestanasRuta } from "../components/ui/Segmentado";
import { SelectorMes } from "../components/ui/SelectorMes";
import { usePeriodo } from "../hooks/useParametrosUrl";
import { useSitio } from "../hooks/useSitio";
import { RUTAS } from "../lib/constants";
import { coordenadas } from "../lib/formato";
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
  ];
  return (
    <>
      <header className="contenedor flex flex-wrap items-end justify-between gap-x-8 gap-y-3 pt-5 md:pt-6">
        <div className="min-w-0">
          <p className="rotulo flex items-center gap-2">
            <GlifoCategoria categoria={sitio.categoria} className="size-3" />
            {NOMBRE_CATEGORIA[sitio.categoria]} · {sitio.agencia}
          </p>
          <p className="titulo-instrumento text-subtitulo text-texto mt-1.5 md:text-[1.5rem]">{sitio.nombre}</p>
          <p className="text-dato-sm text-texto-2 mt-1 font-mono" data-dato>{coordenadas(sitio.lat_deg, sitio.lon_este_deg)}</p>
        </div>
        <div className="flex items-center gap-2 max-sm:w-full max-sm:justify-between sm:gap-3">
          <SelectorMes periodo={periodo} />
          <BotonComparar siteId={id} compacto className="max-sm:px-2.5" />
        </div>
      </header>
      <div className="bg-vacio sticky top-(--nav-alto-movil) z-20 mt-2 md:top-(--nav-alto)">
        <div className="contenedor"><PestanasRuta etiqueta={t.pestanas} pestanas={pestanas} /></div>
      </div>
      <Outlet context={{ sitio, desde: periodo.desde, hasta: periodo.hasta } satisfies ContextoSitio} />
    </>
  );
}
