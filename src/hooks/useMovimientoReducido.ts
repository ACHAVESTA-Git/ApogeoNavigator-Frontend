import { useReducedMotion } from "motion/react";

/** Único punto que consulta prefers-reduced-motion (envuelve a motion). */
export const useMovimientoReducido = (): boolean => useReducedMotion() ?? false;
