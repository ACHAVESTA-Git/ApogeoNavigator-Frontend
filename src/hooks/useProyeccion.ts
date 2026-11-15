import { useQuery } from "@tanstack/react-query";
import { obtenerProyeccion } from "../lib/api";
import type { PasoHorasProyeccion } from "../lib/proyeccionModelo";
import { CLAVES } from "../lib/queryClient";

/**
 * Proyección del modelo de un sitio (solo rol admin). Con `activa` en false no se pide nada: quien no es admin no
 * llega a preguntar al servidor.
 */
export const useProyeccion = (id: string, pasoHoras: PasoHorasProyeccion, activa: boolean) =>
  useQuery({
    queryKey: CLAVES.proyeccion(id, pasoHoras),
    queryFn: ({ signal }) => obtenerProyeccion(id, pasoHoras, {}, { signal }),
    enabled: activa && Boolean(id),
    placeholderData: (anterior) => (anterior?.resultados?.some((r) => r.site_id === id) ? anterior : undefined), // al cambiar el paso no parpadea
  });
