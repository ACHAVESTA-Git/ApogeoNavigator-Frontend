import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { DATOS, PARAM_URL, REGEX } from "../lib/constants";
import { aMs, diasEntre, esUtc, inicioDeMes, sumarMeses } from "../lib/fechas";
import type { Utc } from "../lib/tipos";

type Cambios = Record<string, string | null>;
/** Escribe varios parámetros de una vez (null los borra). Por defecto reemplaza la entrada del historial. */
export function useEscribirUrl() {
  const [, setParams] = useSearchParams();
  return useCallback(
    (cambios: Cambios, { reemplazar = true } = {}) =>
      setParams(
        (previos) => {
          const nuevos = new URLSearchParams(previos);
          for (const [clave, valor] of Object.entries(cambios)) {
            if (valor === null) nuevos.delete(clave);
            else nuevos.set(clave, valor);
          }
          return nuevos;
        },
        { replace: reemplazar, preventScrollReset: true },
      ),
    [setParams],
  );
}

export function rangoValido(desde: unknown, hasta: unknown): boolean {
  return esUtc(desde) && esUtc(hasta) && aMs(hasta) > aMs(desde) && diasEntre(desde, hasta) <= DATOS.RANGO_MAX_DIAS;
}

/** Periodo [desde, hasta) de la URL; si falta o no es válido, el periodo por defecto (diciembre de 2026). */
export function usePeriodo() {
  const [params] = useSearchParams();
  const escribir = useEscribirUrl();
  const d = params.get(PARAM_URL.DESDE);
  const h = params.get(PARAM_URL.HASTA);
  const valido = rangoValido(d, h);
  const desde: Utc = valido ? (d as Utc) : DATOS.DESDE_POR_DEFECTO;
  const hasta: Utc = valido ? (h as Utc) : DATOS.HASTA_POR_DEFECTO;
  const fijar = useCallback(
    (nuevoDesde: Utc, nuevoHasta: Utc) => {
      const porDefecto = nuevoDesde === DATOS.DESDE_POR_DEFECTO && nuevoHasta === DATOS.HASTA_POR_DEFECTO;
      // Al cambiar de periodo el instante `t` deja de tener sentido: se recalcula.
      escribir({ [PARAM_URL.DESDE]: porDefecto ? null : nuevoDesde, [PARAM_URL.HASTA]: porDefecto ? null : nuevoHasta, [PARAM_URL.T]: null }, { reemplazar: false });
    },
    [escribir],
  );
  return useMemo(() => {
    const mes = inicioDeMes(desde);
    const moverMes = (meses: number) => fijar(sumarMeses(mes, meses), sumarMeses(mes, meses + 1));
    return {
      desde, hasta, fijar, moverMes,
      hayAnterior: aMs(sumarMeses(mes, -1)) >= aMs(DATOS.COBERTURA.DESDE),
      haySiguiente: aMs(sumarMeses(mes, 2)) <= aMs(sumarMeses(DATOS.COBERTURA.HASTA, DATOS.PROYECCION_MESES)),
      /** El periodo queda más allá de los datos: solo existe como proyección de /api/simulacion. */
      esProyeccion: aMs(desde) >= aMs(DATOS.COBERTURA.HASTA),
      /** Parámetros para conservar el periodo al cambiar de pestaña. */
      consulta: valido ? `?${new URLSearchParams({ [PARAM_URL.DESDE]: desde, [PARAM_URL.HASTA]: hasta })}` : "",
    };
  }, [desde, hasta, fijar, valido]);
}

/** Lista `s=a,b,c` de Comparar: ids válidos, sin repetir, máximo 3. */
export function useSitiosUrl(): string[] {
  const [params] = useSearchParams();
  const crudo = params.get(PARAM_URL.SITIOS) ?? "";
  return useMemo(
    () => [...new Set(crudo.split(",").filter((id) => REGEX.SITE_ID.test(id)))].slice(0, DATOS.MAX_COMPARAR),
    [crudo],
  );
}
