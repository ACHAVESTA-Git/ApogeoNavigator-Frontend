import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { urlApi } from "../lib/api";
import { cerrarSesion, iniciarSesion, obtenerSesion, type UsuarioSesion } from "../lib/sesion";

const CLAVE_CONSULTA = ["sesion"] as const;
const url = (ruta: string) => urlApi(ruta);

/** Sesión del usuario para toda la app (una sola consulta compartida). `usuario` es null sin sesión. */
export function useSesion() {
  const cliente = useQueryClient();
  const consulta = useQuery({ queryKey: CLAVE_CONSULTA, queryFn: () => obtenerSesion(url), staleTime: Infinity, retry: false });
  const entrada = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => iniciarSesion(url, email, password),
    onSuccess: (usuario) => cliente.setQueryData<UsuarioSesion | null>(CLAVE_CONSULTA, usuario),
  });
  const salida = useMutation({
    mutationFn: () => cerrarSesion(url),
    onSettled: () => {
      cliente.setQueryData<UsuarioSesion | null>(CLAVE_CONSULTA, null);
      cliente.removeQueries({ queryKey: ["claves"] }); // lo que se vio con la sesión no se queda en memoria
    },
  });
  return {
    usuario: consulta.data ?? null,
    /** Aún no se sabe si hay sesión (primera comprobación en curso). */
    comprobando: consulta.isPending,
    entrar: entrada.mutateAsync,
    entrando: entrada.isPending,
    errorEntrada: entrada.error,
    salir: salida.mutateAsync,
    /** La sesión dejó de valer (un 401 con sesión): se olvida sin llamar al servidor. */
    olvidar: () => cliente.setQueryData<UsuarioSesion | null>(CLAVE_CONSULTA, null),
  };
}
