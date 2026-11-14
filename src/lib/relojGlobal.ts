// Instante de la simulación que muestra el reloj de la cabecera. Lo actualizan el Cielo, el Día lunar y el hero.
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
