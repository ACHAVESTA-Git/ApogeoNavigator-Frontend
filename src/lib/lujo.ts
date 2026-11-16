// Cálculo puro de las primitivas «lujo» (src/components/lujo): sin DOM, con prueba.
import type { NivelSemaforo } from "./tipos";

/**
 * Umbrales de un medidor. El sentido se deduce del orden:
 *  - `viable` > `reservas` → cuanto MÁS, mejor (R², aciertos): viable desde `viable`, con reservas desde `reservas`.
 *  - `viable` < `reservas` → cuanto MENOS, mejor (error): viable hasta `viable`, con reservas hasta `reservas`.
 */
export interface UmbralesMedidor { reservas: number; viable: number }

export const masEsMejor = (u: UmbralesMedidor): boolean => u.viable >= u.reservas;

/** Nivel de un valor frente a sus umbrales (los límites son inclusivos hacia el lado bueno). */
export function nivelPorUmbrales(valor: number, u: UmbralesMedidor): NivelSemaforo {
  if (masEsMejor(u)) return valor >= u.viable ? "verde" : valor >= u.reservas ? "amarillo" : "rojo";
  return valor <= u.viable ? "verde" : valor <= u.reservas ? "amarillo" : "rojo";
}

/** Posición de un valor en la escala [min, max], recortada a 0–1. Un rango vacío o un valor no finito dan 0. */
export function fraccion(valor: number, min: number, max: number): number {
  if (!Number.isFinite(valor) || !(max > min)) return 0;
  return Math.min(1, Math.max(0, (valor - min) / (max - min)));
}

/** Punto de una circunferencia (ángulo en grados, 0° = las 3, creciendo en sentido horario como en SVG). */
export function puntoArco(cx: number, cy: number, radio: number, grados: number): [number, number] {
  const rad = (grados * Math.PI) / 180;
  return [cx + radio * Math.cos(rad), cy + radio * Math.sin(rad)];
}

/** Primeros caracteres de una huella + elipsis; una huella que ya cabe se deja entera. */
export const abreviarHuella = (huella: string, caracteres: number): string =>
  huella.length > caracteres ? `${huella.slice(0, caracteres)}…` : huella;
