import { useQuery } from "@tanstack/react-query";
import { obtenerMetricas } from "../lib/api";
import { DATOS } from "../lib/constants";
import { CLAVES } from "../lib/queryClient";
import type { Rango } from "../lib/tipos";

/** Métricas de 1 a 3 sitios en [desde, hasta): una sola petición con `site_id` repetido. */
export const useMetricas = (ids: string[], rango: Rango = {}) =>
  useQuery({
    queryKey: CLAVES.metricas(ids, rango.desde, rango.hasta),
    queryFn: ({ signal }) => obtenerMetricas(ids, rango, { signal }),
    enabled: ids.length >= 1 && ids.length <= DATOS.MAX_COMPARAR,
  });
