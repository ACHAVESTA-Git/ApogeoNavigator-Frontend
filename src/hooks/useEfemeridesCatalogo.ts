import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import type { FilaEfemeride, Rango } from "../lib/tipos";
import { consultaEfemerides } from "./useEfemerides";

/**
 * Efemérides de varios sitios, por `site_id` (una petición por sitio, la misma clave de caché que usa su Cielo:
 * quien entra después al sitio ya la tiene). Mientras falte una, su tarjeta dibuja solo el horizonte.
 */
export function useEfemeridesCatalogo(ids: readonly string[], rango: Rango): ReadonlyMap<string, readonly FilaEfemeride[]> {
  const series = useQueries({
    queries: ids.map((id) => consultaEfemerides(id, rango)),
    combine: (resultados) => resultados.map((r) => r.data),
  });
  return useMemo(() => new Map(series.flatMap((d) => (d?.filas.length ? [[d.site_id, d.filas] as const] : []))), [series]);
}
