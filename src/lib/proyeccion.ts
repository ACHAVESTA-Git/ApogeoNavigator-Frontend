// Fiabilidad de un punto de /api/simulacion: banda de incertidumbre acotada y azimut poco fiable.
// Cerca del cénit o del nadir el azimut está mal condicionado: el backend lo marca con
// `azimut_solar_fiable: false` y su RMSE puede llegar a 180°. Esa cifra nunca se pinta como banda.
import { PROYECCION } from "./constants";
import type { Astro, FilaEfemeride, PuntoSimulacion } from "./tipos";

export interface FiabilidadProyeccion {
  /** false si es un dato de Horizons (sin incertidumbre) */
  esProyeccion: boolean;
  /** banda ± en grados que sí se puede dibujar y citar (0 si es dato); nunca supera BANDA_MAX_DEG */
  bandaDeg: number;
  /** por astro: ¿su azimut se puede leer con una banda acotada? */
  azimutFiable: Record<Astro, boolean>;
}

const DATO: FiabilidadProyeccion = { esProyeccion: false, bandaDeg: 0, azimutFiable: { sol: true, tierra: true } };
const valido = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;

/** Banda ± de un componente: FACTOR_BANDA × RMSE (cubre el 98–100 % de los puntos), o null si no es acotable. */
export function bandaAcotada(rmse: unknown): number | null {
  if (!valido(rmse)) return null;
  const banda = rmse * PROYECCION.FACTOR_BANDA;
  return banda <= PROYECCION.BANDA_MAX_DEG ? banda : null;
}

export function fiabilidadDe(fila: FilaEfemeride | undefined): FiabilidadProyeccion {
  const punto = fila as Partial<PuntoSimulacion> | undefined;
  const u = punto?.incertidumbre_deg;
  if (!u) return DATO;
  const azSol = punto.azimut_solar_fiable === false ? null : bandaAcotada(u.sol_az_deg);
  const azTierra = bandaAcotada(u.tierra_az_deg);
  // Un azimut no acotable no ensancha la banda: se avisa aparte, con texto.
  const bandas = [azSol, azTierra, bandaAcotada(u.sol_el_deg), bandaAcotada(u.tierra_el_deg)].filter((b): b is number => b !== null);
  return {
    esProyeccion: true,
    bandaDeg: bandas.length ? Math.max(...bandas) : 0,
    azimutFiable: { sol: azSol !== null, tierra: azTierra !== null },
  };
}
