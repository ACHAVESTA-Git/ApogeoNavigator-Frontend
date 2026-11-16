import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { obtenerMetricas } from "../lib/api";
import { DATOS } from "../lib/constants";
import { trocear } from "../lib/estadistica";
import { CLAVES } from "../lib/queryClient";
import type { Metrica, Rango } from "../lib/tipos";

/**
 * Métricas de todos los sitios dados, por `site_id`. Una petición por grupo del máximo que admite la API (misma
 * clave de caché que `useMediaCatalogo`: no se pide dos veces). Cada tarjeta se llena cuando llega su grupo;
 * mientras tanto, o si su grupo falla, no hay entrada y la tarjeta deja el hueco («Sin dato»).
 */
export function useMetricasCatalogo(ids: readonly string[], rango: Rango): ReadonlyMap<string, Metrica> {
  const grupos = useMemo(() => trocear([...ids], DATOS.MAX_COMPARAR), [ids]);
  const consultas = useQueries({
    queries: grupos.map((grupo) => ({
      queryKey: CLAVES.metricas(grupo, rango.desde, rango.hasta),
      queryFn: ({ signal }: { signal: AbortSignal }) => obtenerMetricas(grupo, rango, { signal }),
    })),
    combine: (resultados) => resultados.map((r) => r.data),
  });
  return useMemo(() => new Map(consultas.flatMap((d) => d?.resultados ?? []).map((m) => [m.site_id, m] as const)), [consultas]);
}
