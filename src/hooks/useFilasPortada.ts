import { useMemo } from "react";
import muestra from "../assets/hero-shackleton.json";
import { DATOS } from "../lib/constants";
import type { DiaPortada } from "../lib/portada";
import type { Efemerides, FilaEfemeride } from "../lib/tipos";
import { useEfemerides } from "./useEfemerides";

const FILAS_MES = (muestra as Efemerides).filas; // diciembre de 2026 cada 3 h, del mismo CSV que sirve la API

/**
 * Filas (reales) del día de la portada. La API da el día hora a hora; mientras llega, o si falla, se usan las filas
 * de ese mismo día que ya viajan con la app (si el día cae en su mes). Sin filas, la escena no dibuja astros.
 */
export function useFilasPortada(dia: DiaPortada): { filas: readonly FilaEfemeride[]; fallo: boolean } {
  const consulta = useEfemerides(DATOS.SITIO_DESTACADO, { desde: dia.desde, hasta: dia.hasta });
  const locales = useMemo(() => FILAS_MES.filter((f) => f.utc >= dia.desde && f.utc <= dia.hasta), [dia.desde, dia.hasta]);
  const filas = consulta.data?.filas.length ? consulta.data.filas : locales.length > 1 ? locales : [];
  return { filas, fallo: consulta.isError && filas.length === 0 };
}
