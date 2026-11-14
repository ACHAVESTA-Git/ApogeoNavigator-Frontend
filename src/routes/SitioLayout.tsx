import { ChevronLeft, ChevronRight } from "lucide-react";
import { Outlet, useOutletContext, useParams } from "react-router";
import { BotonComparar } from "../components/mapa/BotonComparar";
import { EnlaceBoton } from "../components/ui/Boton";
import { EstadoCarga, EstadoError, EstadoVacio } from "../components/ui/Estados";
import { GlifoCategoria } from "../components/glifos/GlifoCategoria";
import { PestanasRuta } from "../components/ui/Segmentado";
import { clasesBoton } from "../components/ui/clases";
import { usePeriodo } from "../hooks/useParametrosUrl";
import { useSitio } from "../hooks/useSitio";
import { RUTAS } from "../lib/constants";
import { coordenadas } from "../lib/formato";
import { NOMBRE_CATEGORIA, T, periodoLegible } from "../lib/textos";
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
  const paso = clasesBoton("secundario", "px-0 border-linea");
  return (
    <>
      <header className="contenedor flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pt-6 md:pt-8">
        <div className="min-w-0">
          <p className="rotulo flex items-center gap-2">
            <GlifoCategoria categoria={sitio.categoria} className="size-3" />
            {NOMBRE_CATEGORIA[sitio.categoria]} · {sitio.agencia}
          </p>
          <p className="titulo-instrumento text-subtitulo text-texto mt-1.5 md:text-[1.5rem]">{sitio.nombre}</p>
          <p className="text-dato-sm text-texto-2 mt-1 font-mono" data-dato>{coordenadas(sitio.lat_deg, sitio.lon_este_deg)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label={t.periodo} className="flex items-center">
            <button type="button" className={paso} aria-label={t.mesAnterior} disabled={!periodo.hayAnterior} onClick={() => periodo.moverMes(-1)}>
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            <p aria-live="polite" className="text-apoyo text-texto min-w-40 px-2 text-center font-semibold first-letter:uppercase">
              {periodoLegible(periodo.desde, periodo.hasta)}
            </p>
            <button type="button" className={paso} aria-label={t.mesSiguiente} disabled={!periodo.haySiguiente} onClick={() => periodo.moverMes(1)}>
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>
          <BotonComparar siteId={id} />
        </div>
      </header>
      <div className="bg-vacio sticky top-(--nav-alto-movil) z-20 mt-4 md:top-(--nav-alto)">
        <div className="contenedor"><PestanasRuta etiqueta={t.pestanas} pestanas={pestanas} /></div>
      </div>
      <Outlet context={{ sitio, desde: periodo.desde, hasta: periodo.hasta } satisfies ContextoSitio} />
    </>
  );
}
