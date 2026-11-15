import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { obtenerVentanasAlunizaje } from "../lib/api";
import { ALUNIZAJE } from "../lib/constants";
import { CLAVES } from "../lib/queryClient";
import type { EstanciaH } from "../lib/tipos";

/** Ventanas de alunizaje de 1 a 5 sitios para una estancia. Al cambiar de estancia se conserva lo anterior hasta que llega lo nuevo. */
export const useVentanasAlunizaje = (ids: readonly string[], estanciaH: EstanciaH, activo = true) =>
  useQuery({
    queryKey: CLAVES.ventanasAlunizaje(ids, estanciaH),
    queryFn: ({ signal }) => obtenerVentanasAlunizaje(ids, estanciaH, { signal }),
    enabled: activo && ids.length >= 1 && ids.length <= ALUNIZAJE.MAX_SITIOS,
    placeholderData: keepPreviousData,
  });
