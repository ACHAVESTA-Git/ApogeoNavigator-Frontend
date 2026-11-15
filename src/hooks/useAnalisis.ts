import { useQuery } from "@tanstack/react-query";
import type { VariableAnalisis } from "../lib/analisis";
import { obtenerAnalisis } from "../lib/api";
import { CLAVES } from "../lib/queryClient";

/** Análisis de transparencia de un sitio (pipeline, espectro, modelo, validación y serie de una variable). */
export const useAnalisis = (id: string | undefined, variable?: VariableAnalisis) =>
  useQuery({
    queryKey: CLAVES.analisis(id ?? "", variable),
    queryFn: ({ signal }) => obtenerAnalisis(id ?? "", variable, { signal }),
    enabled: Boolean(id),
    placeholderData: (anterior) => (anterior?.site_id === id ? anterior : undefined), // al cambiar de variable no parpadea
  });
