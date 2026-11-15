import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { obtenerMetricas } from "../lib/api";
import { ordenarRanking, rachaDe } from "../lib/comparar";
import { DATOS } from "../lib/constants";
import { CLAVES } from "../lib/queryClient";
import type { Metrica, Racha, Site, Utc } from "../lib/tipos";

export interface PuestoRanking {
  sitio: Site;
  metrica: Metrica;
  /** Ventana continua con Sol y Tierra (`indicadores_astronauta`); null si la API no la trae. */
  ventana: Racha | null;
  ventana_h: number | null;
  semaforo: Metrica["semaforo"];
  puesto: number;
}

/**
 * Ranking de TODOS los sitios del catálogo en un periodo, con datos de `/api/metricas` (que admite de 1 a 3 sitios
 * por petición: se pide por lotes). El orden lo decide `ordenarRanking`; aquí no hay listas fijas ni umbrales.
 * Al cambiar de periodo se conserva el ranking anterior hasta que llega el nuevo (las filas se recolocan).
 */
export function useRanking(sitios: readonly Site[], desde: Utc, hasta: Utc) {
  const lotes: string[][] = [];
  for (let i = 0; i < sitios.length; i += DATOS.MAX_COMPARAR) lotes.push(sitios.slice(i, i + DATOS.MAX_COMPARAR).map((s) => s.site_id));
  const consultas = useQueries({
    queries: lotes.map((ids) => ({
      queryKey: CLAVES.metricas(ids, desde, hasta),
      queryFn: ({ signal }: { signal: AbortSignal }) => obtenerMetricas(ids, { desde, hasta }, { signal }),
      placeholderData: keepPreviousData,
    })),
  });
  const metricas = new Map(consultas.flatMap((c) => c.data?.resultados ?? []).map((m) => [m.site_id, m]));
  const completo = consultas.length > 0 && consultas.every((c) => c.data) && sitios.every((s) => metricas.has(s.site_id));
  const ranking: PuestoRanking[] = completo
    ? ordenarRanking(sitios.map((sitio) => {
      const metrica = metricas.get(sitio.site_id)!;
      const ventana = rachaDe(metrica.indicadores_astronauta, "ventana_sol_y_tierra");
      return { sitio, metrica, ventana, ventana_h: ventana?.horas ?? null, semaforo: metrica.semaforo };
    }))
    : [];
  return {
    ranking,
    listo: completo,
    actualizando: consultas.some((c) => c.isPlaceholderData),
    error: consultas.find((c) => c.error)?.error ?? null,
    reintentar: () => consultas.forEach((c) => c.error && void c.refetch()),
  };
}
