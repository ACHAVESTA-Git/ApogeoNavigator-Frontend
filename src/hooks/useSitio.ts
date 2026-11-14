import { REGEX } from "../lib/constants";
import type { Site } from "../lib/tipos";
import { useSites } from "./useSites";

export type EstadoSitio = "cargando" | "ok" | "desconocido" | "error";
/** Deriva un sitio del catálogo; «desconocido» si el id no cumple el estándar o no está en /api/sites. */
export function useSitio(id: string | undefined): { sitio?: Site; estado: EstadoSitio; reintentar: () => void } {
  const { data, isPending, isError, refetch } = useSites();
  const reintentar = () => void refetch();
  if (!id || !REGEX.SITE_ID.test(id)) return { estado: "desconocido", reintentar };
  if (isPending) return { estado: "cargando", reintentar };
  if (isError) return { estado: "error", reintentar };
  const sitio = data.find((s) => s.site_id === id);
  return sitio ? { sitio, estado: "ok", reintentar } : { estado: "desconocido", reintentar };
}
