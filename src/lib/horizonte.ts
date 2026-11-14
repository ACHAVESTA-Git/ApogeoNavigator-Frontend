// Formas del horizonte continuo: siempre HORIZONTE_PUNTOS puntos en el mismo orden (izquierda → derecha),
// para poder interpolar entre rutas sin que la línea se cruce consigo misma.
import { HORIZONTE_PUNTOS } from "./constants";

export type Punto = readonly [number, number];
export type Trazo = readonly Punto[];
export interface Caja {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

const fraccion = (i: number): number => i / (HORIZONTE_PUNTOS - 1);
const serie = (fn: (f: number) => Punto): Trazo => Array.from({ length: HORIZONTE_PUNTOS }, (_, i) => fn(fraccion(i)));

/** Línea recta a lo ancho de la caja, en su borde superior. */
export const trazoLinea = (caja: Caja): Trazo => serie((f) => [caja.x + f * caja.ancho, caja.y]);

/** Arco del limbo lunar: el centro queda en el borde superior y los extremos caen `caja.alto`. */
export const trazoArco = (caja: Caja): Trazo =>
  serie((f) => {
    const u = 2 * f - 1;
    return [caja.x + f * caja.ancho, caja.y + caja.alto * u * u];
  });

/** Anillo inscrito en la caja. Empieza a la izquierda y gira por arriba, como una línea que se enrolla. */
export const trazoAnillo = (caja: Caja): Trazo => {
  const r = Math.min(caja.ancho, caja.alto) / 2;
  const cx = caja.x + caja.ancho / 2;
  const cy = caja.y + caja.alto / 2;
  return serie((f) => {
    const a = Math.PI + f * 2 * Math.PI;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
};

export const mezclarTrazos = (a: Trazo, b: Trazo, f: number): Trazo =>
  a.map(([ax, ay], i) => [ax + (b[i][0] - ax) * f, ay + (b[i][1] - ay) * f] as const);

const redondear = (v: number): number => Math.round(v * 10) / 10;
export const trazoAPath = (trazo: Trazo): string =>
  trazo.map(([x, y], i) => `${i === 0 ? "M" : "L"}${redondear(x)} ${redondear(y)}`).join("");

export const trazosIguales = (a: Trazo, b: Trazo): boolean =>
  a.length === b.length && a.every(([x, y], i) => Math.abs(x - b[i][0]) < 0.5 && Math.abs(y - b[i][1]) < 0.5);
