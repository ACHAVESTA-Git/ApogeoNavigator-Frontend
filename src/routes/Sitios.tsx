import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, m } from "motion/react";
import { useCallback, useId, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useApp } from "../components/layout/contexto";
import { TituloPagina } from "../components/layout/TituloPagina";
import { CoordenadasPropias } from "../components/mapa/CoordenadasPropias";
import { FichaSitio } from "../components/mapa/FichaSitio";
import { LeyendaCategorias } from "../components/mapa/LeyendaCategorias";
import { ListaSitios } from "../components/mapa/ListaSitios";
import { MapaPolar } from "../components/mapa/MapaPolar";
import { Boton } from "../components/ui/Boton";
import { EstadoError, EstadoVacio } from "../components/ui/Estados";
import { HojaInferior } from "../components/ui/HojaInferior";
import { Segmentado } from "../components/ui/Segmentado";
import { consultaEfemerides } from "../hooks/useEfemerides";
import { useDesde } from "../hooks/useMedia";
import { useMovimientoReducido } from "../hooks/useMovimientoReducido";
import { useEscribirUrl } from "../hooks/useParametrosUrl";
import { useEfemeridesCatalogo } from "../hooks/useEfemeridesCatalogo";
import { useMetricasCatalogo } from "../hooks/useMetricasCatalogo";
import { useRelojCatalogo } from "../hooks/useRelojCatalogo";
import { useSites } from "../hooks/useSites";
import { Pause, Play } from "lucide-react";
import { CATEGORIAS, DATOS, MAPA, MOVIMIENTO, PARAM_URL, RANGO_POR_DEFECTO } from "../lib/constants";
import { NOMBRE_CATEGORIA, T, periodoLegible } from "../lib/textos";
import type { Categoria } from "../lib/tipos";

const TODAS = "todas";
type Filtro = Categoria | typeof TODAS;

export default function Sitios() {
  const t = T.sitios;
  const { data: sitios, isPending, isError, error, refetch } = useSites();
  const { abrirCarga } = useApp();
  const [params] = useSearchParams();
  const escribir = useEscribirUrl();
  const esEscritorio = useDesde("lg");
  const reducido = useMovimientoReducido();
  const idFicha = useId();
  const [activo, setActivo] = useState<string | null>(null);

  const presentes = useMemo(() => CATEGORIAS.filter((c) => sitios?.some((s) => s.categoria === c)), [sitios]);
  const filtro = (presentes.find((c) => c === params.get(PARAM_URL.CATEGORIA)) ?? TODAS) as Filtro;
  const visibles = useMemo(() => (sitios ?? []).filter((s) => filtro === TODAS || s.categoria === filtro), [sitios, filtro]);
  const seleccionado = sitios?.find((s) => s.site_id === params.get(PARAM_URL.SITIO)) ?? null;

  // Las cifras de las tarjetas: todas las métricas del catálogo en el periodo por defecto (un grupo por petición).
  const ids = useMemo(() => (sitios ?? []).map((s) => s.site_id), [sitios]);
  const metricas = useMetricasCatalogo(ids, RANGO_POR_DEFECTO);
  const periodo = periodoLegible(RANGO_POR_DEFECTO.desde, RANGO_POR_DEFECTO.hasta);
  // Tarjetas vivas: la efeméride real de cada sitio y un reloj que recorre el periodo a 6 h/s (se puede pausar).
  const series = useEfemeridesCatalogo(ids, RANGO_POR_DEFECTO);
  const reloj = useRelojCatalogo(RANGO_POR_DEFECTO.desde, RANGO_POR_DEFECTO.hasta, DATOS.T_POR_DEFECTO);

  const queryClient = useQueryClient();
  const seleccionar = useCallback((id: string | null) => escribir({ [PARAM_URL.SITIO]: id }, { reemplazar: false }), [escribir]);
  // Prefetch con intención: quien se detiene en un sitio suele abrir su ficha y después su cielo.
  const activar = useCallback(
    (id: string | null) => {
      setActivo(id);
      if (id) void queryClient.prefetchQuery(consultaEfemerides(id, RANGO_POR_DEFECTO));
    },
    [queryClient],
  );
  const cerrar = useCallback(() => seleccionar(null), [seleccionar]);
  const opciones = [{ valor: TODAS as Filtro, etiqueta: t.todas }, ...presentes.map((c) => ({ valor: c as Filtro, etiqueta: NOMBRE_CATEGORIA[c] }))];

  const lista = (
    <>
      <div className="mb-5 flex items-center justify-between gap-2">
        <Segmentado etiqueta={t.filtro} opciones={opciones} valor={filtro}
          alCambiar={(v) => escribir({ [PARAM_URL.CATEGORIA]: v === TODAS ? null : v })} className="min-w-0" />
        {/* El reloj UTC que mueve las tarjetas es el de la cabecera; aquí solo se pausa o se reanuda. */}
        <button type="button" aria-label={reloj.vivo ? t.relojPausar : t.relojReproducir} onClick={reloj.alternar}
          className="vidrio text-texto grid size-12 shrink-0 place-content-center rounded-full transition-transform duration-(--dur-micro) ease-salida active:scale-[0.94]">
          {reloj.vivo ? <Pause aria-hidden="true" className="size-5" /> : <Play aria-hidden="true" className="size-5" />}
        </button>
      </div>
      <ListaSitios compartir={esEscritorio && !reducido} sitios={visibles} metricas={metricas} series={series} reloj={reloj.t} periodo={periodo} activo={activo} alActivar={activar} alSeleccionar={seleccionar} />
    </>
  );

  return (
    <div className="contenedor grid grid-cols-1 gap-x-6 gap-y-8 py-8 lg:grid-cols-12 lg:py-12">
      {/* El mapa acompaña al recorrer las tarjetas: señalar una tarjeta enciende su punto, y tiene que estar a la vista. */}
      <div className="min-w-0 lg:sticky lg:top-[calc(var(--nav-alto)+1.5rem)] lg:col-span-7 lg:self-start">
        <p className="rotulo">{t.rotulo}</p>
        <TituloPagina documento={t.documento} className="mt-2">{t.titulo}</TituloPagina>
        <p className="text-texto-2 mt-3 max-w-medida">{t.entrada}</p>
        <div className="mt-6 lg:mt-8 lg:pr-10">
          <MapaPolar sitios={visibles} activo={activo} seleccionado={seleccionado?.site_id ?? null}
            alActivar={activar} alSeleccionar={seleccionar} cargando={isPending} />
        </div>
        <div className="mt-5"><LeyendaCategorias categorias={presentes} /></div>
        <CoordenadasPropias className="mt-6 border-y" />
      </div>

      <div className="relative min-w-0 lg:col-span-5 lg:col-start-8 lg:pt-2">
        {isPending && (
          <ul role="status" aria-busy="true" aria-label={T.cargando} className="grid grid-cols-1 gap-3 min-[30rem]:grid-cols-2">
            {Array.from({ length: MAPA.ESQUELETO_FILAS }, (_, i) => <li key={i} className="vidrio h-80" />)}
          </ul>
        )}
        {isError && <EstadoError error={error} alReintentar={() => void refetch()} />}
        {sitios?.length === 0 && (
          <EstadoVacio titulo={t.vacio}><Boton variante="primario" onClick={abrirCarga}>{T.nav.subir}</Boton></EstadoVacio>
        )}
        {sitios && sitios.length > 0 && (
          // Lista y ficha se cruzan en el mismo hueco (popLayout): el nombre del sitio es UN elemento que viaja de su
          // fila al título (layoutId, spring sin rebote) y vuelve por el mismo camino; lo demás solo se funde.
          <AnimatePresence mode="popLayout" initial={false}>
            {esEscritorio && seleccionado ? (
              <m.div key={seleccionado.site_id}
                initial={reducido ? false : { opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: MOVIMIENTO.MEDIA / 1000, ease: MOVIMIENTO.EASE_SALIDA } }}
                exit={reducido ? undefined : { opacity: 0, transition: { duration: MOVIMIENTO.SALIDA_RUTA / 1000, ease: MOVIMIENTO.EASE_ENTRADA } }}>
                <FichaSitio sitio={seleccionado} metrica={metricas.get(seleccionado.site_id)} alVolver={cerrar} idTitulo={idFicha} compartir={!reducido} />
              </m.div>
            ) : (
              <m.div key="lista" initial={reducido ? false : { opacity: 0 }} animate={{ opacity: 1, transition: { duration: MOVIMIENTO.CORTA / 1000 } }}
                exit={reducido ? undefined : { opacity: 0, transition: { duration: MOVIMIENTO.MICRO / 1000 } }}>
                {lista}
              </m.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {!esEscritorio && seleccionado && (
        <HojaInferior etiquetadaPor={idFicha} alCerrar={cerrar}>
          <FichaSitio sitio={seleccionado} metrica={metricas.get(seleccionado.site_id)} idTitulo={idFicha} />
        </HojaInferior>
      )}
    </div>
  );
}
