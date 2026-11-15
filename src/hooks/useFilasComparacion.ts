import { useQueries } from "@tanstack/react-query";
import { obtenerMetricas } from "../lib/api";
import { CLAVES } from "../lib/queryClient";
import type { Efemerides, Metrica, Utc } from "../lib/tipos";
import { consultaEfemerides } from "./useEfemerides";
import { useMetricas } from "./useMetricas";

/** Una fila de la comparación: un sitio en un rango. Sirve igual para «sitios distintos» y «fechas distintas». */
export interface FilaComparacion {
  clave: string;
  siteId: string;
  desde: Utc;
  hasta: Utc;
  etiqueta: string;
  detalle: string;
}
export interface DatosFila extends FilaComparacion {
  metrica?: Metrica;
  efemerides?: Efemerides;
}

/**
 * Datos de cada fila. Si todas comparten rango (modo sitios), las métricas salen de UNA sola petición con
 * `site_id` repetido; si comparten sitio (modo fechas), de una petición por rango.
 */
export function useFilasComparacion(filas: FilaComparacion[]) {
  const mismoRango = filas.every((f) => f.desde === filas[0]?.desde && f.hasta === filas[0]?.hasta);
  const conjunta = useMetricas(mismoRango ? filas.map((f) => f.siteId) : [], { desde: filas[0]?.desde, hasta: filas[0]?.hasta }, { mantener: true });
  const porRango = useQueries({
    queries: (mismoRango ? [] : filas).map((f) => ({
      queryKey: CLAVES.metricas([f.siteId], f.desde, f.hasta),
      queryFn: ({ signal }: { signal: AbortSignal }) => obtenerMetricas([f.siteId], { desde: f.desde, hasta: f.hasta }, { signal }),
    })),
  });
  const efemerides = useQueries({ queries: filas.map((f) => consultaEfemerides(f.siteId, { desde: f.desde, hasta: f.hasta })) });

  const datos: DatosFila[] = filas.map((f, i) => ({
    ...f,
    metrica: mismoRango
      ? conjunta.data?.resultados.find((m) => m.site_id === f.siteId && m.inicio_utc === f.desde)
      : porRango[i]?.data?.resultados[0],
    efemerides: efemerides[i]?.data,
  }));
  const consultas = [...(mismoRango ? [conjunta] : porRango), ...efemerides];
  return {
    datos,
    listo: datos.length > 0 && datos.every((d) => d.metrica && d.efemerides),
    error: consultas.find((c) => c.error)?.error ?? null,
    reintentar: () => consultas.forEach((c) => c.error && void c.refetch()),
  };
}
