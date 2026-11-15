import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { obtenerEfemerides } from "../lib/api";
import { CLAVES } from "../lib/queryClient";
import type { Rango } from "../lib/tipos";

export const consultaEfemerides = (id: string, rango: Rango = {}) => ({
  queryKey: CLAVES.efemerides(id, rango.desde, rango.hasta),
  queryFn: ({ signal }: { signal: AbortSignal }) => obtenerEfemerides(id, rango, { signal }),
});
/** Efemérides de un sitio en [desde, hasta] (extremos incluidos). Una petición por sitio y rango, en caché. */
export const useEfemerides = (id: string | undefined, rango: Rango = {}, { mantener = false } = {}, activo = true) =>
  useQuery({ ...consultaEfemerides(id ?? "", rango), enabled: Boolean(id) && activo, placeholderData: mantener ? keepPreviousData : undefined });
