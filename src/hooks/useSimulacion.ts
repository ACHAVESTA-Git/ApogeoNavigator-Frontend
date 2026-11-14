import { useQuery } from "@tanstack/react-query";
import { obtenerSimulacion } from "../lib/api";
import type { Rango } from "../lib/tipos";

/** Serie de /api/simulacion (datos + proyección marcada). Solo se pide para periodos más allá de los datos. */
export const useSimulacion = (id: string | undefined, rango: Rango, activo: boolean) =>
  useQuery({
    queryKey: ["simulacion", id, rango.desde, rango.hasta],
    queryFn: ({ signal }) => obtenerSimulacion(id ?? "", rango, { signal }),
    enabled: Boolean(id) && activo,
  });
