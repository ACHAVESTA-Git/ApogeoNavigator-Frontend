import { useQueryClient } from "@tanstack/react-query";
import { m } from "motion/react";
import { useCallback, useId, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useApp } from "../components/layout/contexto";
import { TituloPagina } from "../components/layout/TituloPagina";
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
import { useSites } from "../hooks/useSites";
import { CATEGORIAS, MAPA, MOVIMIENTO, PARAM_URL, RANGO_POR_DEFECTO } from "../lib/constants";
import { NOMBRE_CATEGORIA, T } from "../lib/textos";
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

  const queryClient = useQueryClient();
  const seleccionar = useCallback(
    (id: string | null) => {
      escribir({ [PARAM_URL.SITIO]: id }, { reemplazar: false });
      // Prefetch con intención: quien abre la ficha suele ir después a «Ver su cielo».
      if (id) void queryClient.prefetchQuery(consultaEfemerides(id, RANGO_POR_DEFECTO));
    },
    [escribir, queryClient],
  );
  const cerrar = useCallback(() => seleccionar(null), [seleccionar]);
  const opciones = [{ valor: TODAS as Filtro, etiqueta: t.todas }, ...presentes.map((c) => ({ valor: c as Filtro, etiqueta: NOMBRE_CATEGORIA[c] }))];

  const lista = (
    <>
      <Segmentado etiqueta={t.filtro} opciones={opciones} valor={filtro}
        alCambiar={(v) => escribir({ [PARAM_URL.CATEGORIA]: v === TODAS ? null : v })} className="mb-5" />
      <ListaSitios sitios={visibles} activo={activo} alActivar={setActivo} alSeleccionar={seleccionar} />
    </>
  );

  return (
    <div className="contenedor grid grid-cols-1 gap-x-6 gap-y-8 py-8 lg:grid-cols-12 lg:py-12">
      <div className="min-w-0 lg:col-span-7">
        <p className="rotulo">{t.rotulo}</p>
        <TituloPagina documento={t.documento} className="mt-2">{t.titulo}</TituloPagina>
        <p className="text-texto-2 mt-3 max-w-[52ch]">{t.entrada}</p>
        <div className="mt-6 lg:mt-8 lg:pr-10">
          <MapaPolar sitios={visibles} activo={activo} seleccionado={seleccionado?.site_id ?? null}
            alActivar={setActivo} alSeleccionar={seleccionar} cargando={isPending} />
        </div>
        <div className="mt-5"><LeyendaCategorias categorias={presentes} /></div>
      </div>

      <div className="min-w-0 lg:col-span-5 lg:col-start-8 lg:pt-2">
        {isPending && (
          <ul role="status" aria-busy="true" aria-label={T.cargando}>
            {Array.from({ length: MAPA.ESQUELETO_FILAS }, (_, i) => <li key={i} className="bg-superficie border-vacio h-14 border-b-4" />)}
          </ul>
        )}
        {isError && <EstadoError error={error} alReintentar={() => void refetch()} />}
        {sitios?.length === 0 && (
          <EstadoVacio titulo={t.vacio}><Boton variante="primario" onClick={abrirCarga}>{T.nav.subir}</Boton></EstadoVacio>
        )}
        {sitios && sitios.length > 0 && (
          esEscritorio && seleccionado ? (
            <m.div key={seleccionado.site_id}
              initial={reducido ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: MOVIMIENTO.MEDIA / 1000, ease: MOVIMIENTO.EASE_SALIDA }}>
              <FichaSitio sitio={seleccionado} alVolver={cerrar} idTitulo={idFicha} />
            </m.div>
          ) : lista
        )}
      </div>

      {!esEscritorio && seleccionado && (
        <HojaInferior etiquetadaPor={idFicha} alCerrar={cerrar}>
          <FichaSitio sitio={seleccionado} idTitulo={idFicha} />
        </HojaInferior>
      )}
    </div>
  );
}
