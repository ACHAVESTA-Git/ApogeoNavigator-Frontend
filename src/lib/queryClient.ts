import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./errores";

const REINTENTOS = 1;
/** Los datos son estáticos durante la sesión: se piden una vez y se comparten entre pantallas. */
export const crearQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        // Un 4xx es una respuesta real (sitio inexistente, rango inválido): no se reintenta.
        retry: (intentos, error) => !(error instanceof ApiError) && intentos < REINTENTOS,
      },
    },
  });

export const CLAVES = {
  sites: ["sites"] as const,
  efemerides: (id: string, desde?: string, hasta?: string) => ["efemerides", id, desde, hasta] as const,
  efemeridesDe: (id: string) => ["efemerides", id] as const,
  metricas: (ids: readonly string[], desde?: string, hasta?: string) => ["metricas", [...ids].sort(), desde, hasta] as const,
  metricasTodas: ["metricas"] as const,
  puestas: (id: string, desde: string) => ["puestas", id, desde] as const,
};
