// Interpolación entre filas horarias: posición continua de los astros para animar sin saltos.
import { diferenciaAngular, normalizarAz } from "./escalas";
import { aMs } from "./fechas";
import type { FilaEfemeride } from "./tipos";

export interface PosicionCielo {
  sol_az_deg: number;
  sol_el_deg: number;
  tierra_az_deg: number;
  tierra_el_deg: number;
}

/** Índice de la última fila con utc ≤ ms (0 si ms es anterior a todas). Supone paso constante. */
export function indiceEn(filas: readonly FilaEfemeride[], ms: number): number {
  if (filas.length < 2) return 0;
  const t0 = aMs(filas[0].utc);
  const paso = aMs(filas[1].utc) - t0;
  return Math.min(filas.length - 1, Math.max(0, Math.floor((ms - t0) / paso)));
}

const mezclar = (a: number, b: number, f: number): number => a + (b - a) * f;
const mezclarAz = (a: number, b: number, f: number): number => normalizarAz(a + diferenciaAngular(a, b) * f);

/** Posición en un instante cualquiera; el azimut se interpola por el camino corto. */
export function interpolarFila(filas: readonly FilaEfemeride[], ms: number): PosicionCielo {
  const i = indiceEn(filas, ms);
  const a = filas[i];
  const b = filas[Math.min(i + 1, filas.length - 1)];
  const ta = aMs(a.utc);
  const tb = aMs(b.utc);
  const f = tb === ta ? 0 : Math.min(1, Math.max(0, (ms - ta) / (tb - ta)));
  return {
    sol_az_deg: mezclarAz(a.sol_az_deg, b.sol_az_deg, f),
    sol_el_deg: mezclar(a.sol_el_deg, b.sol_el_deg, f),
    tierra_az_deg: mezclarAz(a.tierra_az_deg, b.tierra_az_deg, f),
    tierra_el_deg: mezclar(a.tierra_el_deg, b.tierra_el_deg, f),
  };
}
