import { useQuery } from "@tanstack/react-query";
import { obtenerPuestas } from "../lib/api";
import { CLAVES } from "../lib/queryClient";
import type { Utc } from "../lib/tipos";

/** Próxima puesta y salida desde `desde` (ya redondeado a la hora: la clave no cambia en cada fotograma). */
export const usePuestas = (id: string | undefined, desde: Utc, activo = true) =>
  useQuery({
    queryKey: CLAVES.puestas(id ?? "", desde),
    queryFn: ({ signal }) => obtenerPuestas(id ?? "", desde, { signal }),
    enabled: Boolean(id) && activo,
  });
