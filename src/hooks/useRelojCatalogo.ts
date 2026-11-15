import { useAnimationFrame, useMotionValue, useMotionValueEvent, type MotionValue } from "motion/react";
import { useEffect, useState } from "react";
import { MOVIMIENTO, MS_POR_HORA, VELOCIDAD_POR_DEFECTO } from "../lib/constants";
import { aMs, aUtc } from "../lib/fechas";
import { fijarInstanteGlobal } from "../lib/relojGlobal";
import type { Utc } from "../lib/tipos";
import { avanzarReloj } from "../lib/vivo";
import { useMovimientoReducido } from "./useMovimientoReducido";

export interface RelojCatalogo {
  /** Instante continuo en ms: lo leen los mini horizontes en cada fotograma, sin rerenderizar React. */
  t: MotionValue<number>;
  vivo: boolean;
  alternar: () => void;
}

/**
 * Reloj del catálogo: recorre el periodo a 6 h/s y vuelve a empezar. Arranca solo, salvo con movimiento reducido
 * (entonces queda quieto en `inicio` y, si la persona lo pide, salta 1 h por segundo). Lleva el reloj UTC de la
 * cabecera a la hora en curso (como mucho una actualización por hora simulada).
 */
export function useRelojCatalogo(desde: Utc, hasta: Utc, inicio: Utc): RelojCatalogo {
  const reducido = useMovimientoReducido();
  const [desdeMs, hastaMs] = [aMs(desde), aMs(hasta)];
  const t = useMotionValue(aMs(inicio));
  const [vivo, setVivo] = useState(!reducido);
  useAnimationFrame((_, delta) => {
    if (vivo && !reducido) t.set(avanzarReloj(t.get(), Math.min(delta, 100), VELOCIDAD_POR_DEFECTO, desdeMs, hastaMs));
  });
  useEffect(() => {
    if (!vivo || !reducido) return;
    const reloj = setInterval(() => t.set(avanzarReloj(t.get(), 1000, 1, desdeMs, hastaMs)), MOVIMIENTO.PASO_REDUCIDO_MS);
    return () => clearInterval(reloj);
  }, [vivo, reducido, t, desdeMs, hastaMs]);
  useMotionValueEvent(t, "change", (ms) => fijarInstanteGlobal(aUtc(Math.floor(ms / MS_POR_HORA) * MS_POR_HORA)));
  useEffect(() => fijarInstanteGlobal(aUtc(Math.floor(t.get() / MS_POR_HORA) * MS_POR_HORA)), [t]);
  return { t, vivo, alternar: () => setVivo((v) => !v) };
}
