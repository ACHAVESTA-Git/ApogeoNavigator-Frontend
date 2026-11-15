import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { obtenerMetricas } from "../lib/api";
import { DATOS } from "../lib/constants";
import { media, trocear } from "../lib/estadistica";
import { CLAVES } from "../lib/queryClient";
import type { Rango } from "../lib/tipos";
import { useSites } from "./useSites";

export interface MediaCatalogo {
  /** Sitios que entran en la media. */
  n: number;
  pct_sol: number;
  pct_tierra: number;
}

/**
 * Media de todos los sitios del catálogo en un rango: es «con qué se compara» cada cifra. Sale de las mismas
 * métricas de la API (en grupos del máximo que admite por petición); mientras falte alguna, no hay media.
 */
export function useMediaCatalogo(rango: Rango): MediaCatalogo | null {
  const { data: sitios } = useSites();
  const grupos = useMemo(() => trocear((sitios ?? []).map((s) => s.site_id), DATOS.MAX_COMPARAR), [sitios]);
  const consultas = useQueries({
    queries: grupos.map((ids) => ({
      queryKey: CLAVES.metricas(ids, rango.desde, rango.hasta),
      queryFn: ({ signal }: { signal: AbortSignal }) => obtenerMetricas(ids, rango, { signal }),
      placeholderData: keepPreviousData, // al cambiar de rango la raya no desaparece: se mueve cuando llega la nueva
    })),
  });
  if (!grupos.length || consultas.some((c) => !c.data)) return null;
  const todas = consultas.flatMap((c) => c.data!.resultados);
  const sol = media(todas.map((m) => m.pct_sol));
  const tierra = media(todas.map((m) => m.pct_tierra));
  return sol === null || tierra === null ? null : { n: todas.length, pct_sol: sol, pct_tierra: tierra };
}
