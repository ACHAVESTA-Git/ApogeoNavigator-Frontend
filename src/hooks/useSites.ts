import { useQuery } from "@tanstack/react-query";
import { obtenerSitios } from "../lib/api";
import { CLAVES } from "../lib/queryClient";

export const consultaSitios = { queryKey: CLAVES.sites, queryFn: ({ signal }: { signal: AbortSignal }) => obtenerSitios({ signal }) };
export const useSites = () => useQuery(consultaSitios);
