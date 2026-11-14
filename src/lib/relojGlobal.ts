// Instante de la simulación que muestra el reloj de la cabecera. Lo actualizan el Cielo, el Día lunar y el hero.
import { motionValue } from "motion/react";
import { useSyncExternalStore } from "react";
import { DATOS } from "./constants";
import type { Utc } from "./tipos";

let instante: Utc = DATOS.T_POR_DEFECTO;
const oyentes = new Set<() => void>();

export function fijarInstanteGlobal(utc: Utc): void {
  if (utc === instante) return;
  instante = utc;
  oyentes.forEach((avisar) => avisar());
}
export const useInstanteGlobal = (): Utc =>
  useSyncExternalStore(
    (avisar) => {
      oyentes.add(avisar);
      return () => oyentes.delete(avisar);
    },
    () => instante,
    () => instante,
  );

/**
 * Franja de tiempo que se está mirando dentro del periodo, en % (0–100): alimenta la barra de 2 px bajo las
 * pestañas del sitio. En el Cielo y el Día lunar va de 0 al instante `t`; en Ventanas, el rango elegido.
 */
export const franjaTiempo = { desde: motionValue(0), hasta: motionValue(0) };
export function fijarFranjaTiempo(desde: number, hasta: number): void {
  franjaTiempo.desde.set(desde * 100);
  franjaTiempo.hasta.set(hasta * 100);
}
