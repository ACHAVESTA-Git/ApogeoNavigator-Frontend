// Escalas compartidas por todos los gráficos: lupa de elevación, azimut con envoltura y tiempo.
import { ELEVACION_MAX_DEG, GRADOS_VUELTA, LUPA_K_DEG } from "./constants";

/** Escala de lupa: amplía el tramo cercano al horizonte. Devuelve −1…1 para −90°…+90°. */
export function lupa(elevacion: number, k = LUPA_K_DEG): number {
  return (Math.sign(elevacion) * Math.log1p(Math.abs(elevacion) / k)) / Math.log1p(ELEVACION_MAX_DEG / k);
}
/** Inversa de `lupa`: de −1…1 a grados. */
export function lupaInversa(valor: number, k = LUPA_K_DEG): number {
  return Math.sign(valor) * k * Math.expm1(Math.abs(valor) * Math.log1p(ELEVACION_MAX_DEG / k));
}
export const lineal = (elevacion: number): number => elevacion / ELEVACION_MAX_DEG;
export type EscalaElevacion = (elevacion: number) => number;

/** Convierte elevación a píxeles con el horizonte en `yHorizonte`; el cielo y el subsuelo pueden medir distinto. */
export function elevacionAY(escala: EscalaElevacion, yHorizonte: number, altoCielo: number, altoSubsuelo: number) {
  return (elevacion: number): number => {
    const v = escala(elevacion);
    return yHorizonte - v * (v >= 0 ? altoCielo : altoSubsuelo);
  };
}

export const normalizarAz = (az: number): number => ((az % GRADOS_VUELTA) + GRADOS_VUELTA) % GRADOS_VUELTA;
/** Diferencia con signo por el camino corto (−180…180] de `desde` a `hasta`. */
export function diferenciaAngular(desde: number, hasta: number): number {
  const d = normalizarAz(hasta - desde);
  return d > GRADOS_VUELTA / 2 ? d - GRADOS_VUELTA : d;
}
/** Serie de azimuts sin saltos de 359° → 0° (para trazar rastros continuos). */
export function desenrollar(azimuts: readonly number[]): number[] {
  const salida: number[] = [];
  azimuts.forEach((az, i) => {
    salida.push(i === 0 ? az : salida[i - 1] + diferenciaAngular(salida[i - 1], az));
  });
  return salida;
}
/** Escala lineal de dominio a rango (lo mínimo; d3-scale queda para las rutas con gráficos). */
export function escalaLineal(d0: number, d1: number, r0: number, r1: number) {
  const factor = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (valor: number): number => r0 + (valor - d0) * factor;
}

/** Mezcla entre la lupa (0) y la escala lineal (1): permite animar el cambio de escala. */
export const escalaMixta = (mezcla: number): EscalaElevacion => (e) => lupa(e) * (1 - mezcla) + lineal(e) * mezcla;
