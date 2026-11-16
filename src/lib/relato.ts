// Relato con scroll de la portada: del progreso del desplazamiento (0…1) al acto y al instante real que se ve.
import { RELATO } from "./constants";
import { limitar } from "./fechas";

type Cortes = readonly number[];

/** Acto (0, 1, 2…) que corresponde a un progreso del scroll. */
export const actoDe = (p: number, cortes: Cortes = RELATO.CORTES): number => cortes.filter((c) => p >= c).length;

/**
 * Instante (ms) que se ve con el progreso `p`: cada acto recorre a ritmo constante su tramo entre dos hitos
 * (`hitos` tiene un elemento más que actos: el inicio, cada frontera y el final).
 */
export function instanteDelRelato(p: number, hitos: readonly number[], cortes: Cortes = RELATO.CORTES): number {
  const tramos = [0, ...cortes, 1];
  const i = Math.min(actoDe(limitar(p, 0, 1), cortes), tramos.length - 2);
  const f = limitar((p - tramos[i]) / (tramos[i + 1] - tramos[i]), 0, 1);
  return hitos[i] + f * (hitos[i + 1] - hitos[i]);
}
