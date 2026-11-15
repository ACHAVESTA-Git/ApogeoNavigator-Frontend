// Portada: qué día de efemérides muestra la escena y cómo se recorre. Sin datos inventados: si «hoy» queda
// fuera del periodo con datos, se toma el día con datos más cercano y la interfaz lo dice.
import { DATOS, HORAS_POR_DIA, MS_POR_HORA, PORTADA } from "./constants";
import { aMs, aUtc, limitar } from "./fechas";
import type { Utc } from "./tipos";

const MS_POR_DIA = MS_POR_HORA * HORAS_POR_DIA;

export interface DiaPortada {
  /** Primer y último instante del día que recorre la escena (24 h, extremos incluidos). */
  desde: Utc;
  hasta: Utc;
  /** Instante en reposo (movimiento reducido): la hora actual si hay datos; si no, el instante con datos más cercano. */
  referencia: Utc;
  /** `antes` o `despues` si hoy queda fuera del periodo con datos; `null` si hoy tiene datos. */
  fuera: "antes" | "despues" | null;
}

/** Día (UTC) de la portada para el instante `ahoraMs`, acotado a la cobertura de los datos. */
export function diaPortada(ahoraMs: number, cobertura: { DESDE: Utc; HASTA: Utc } = DATOS.COBERTURA): DiaPortada {
  const [ini, fin] = [aMs(cobertura.DESDE), aMs(cobertura.HASTA)];
  const fuera = ahoraMs < ini ? "antes" : ahoraMs > fin ? "despues" : null;
  const referencia = Math.floor(limitar(ahoraMs, ini, fin) / MS_POR_HORA) * MS_POR_HORA;
  const medianoche = Math.floor(referencia / MS_POR_DIA) * MS_POR_DIA;
  const desde = Math.max(ini, Math.min(medianoche, fin - MS_POR_DIA));
  return { desde: aUtc(desde), hasta: aUtc(Math.min(fin, desde + MS_POR_DIA)), referencia: aUtc(referencia), fuera };
}

/**
 * Fracción del día (0…1) en el milisegundo `t` del ciclo de la escena: avanza a ritmo constante (el tiempo pasa
 * de forma lineal), se detiene al final del día y vuelve al inicio con una curva suave (nunca un salto).
 */
export function fraccionDelCiclo(t: number, ciclo: { AVANCE_MS: number; PAUSA_MS: number; RETORNO_MS: number } = PORTADA.CICLO): number {
  const total = ciclo.AVANCE_MS + ciclo.PAUSA_MS + ciclo.RETORNO_MS;
  const fase = ((t % total) + total) % total;
  if (fase < ciclo.AVANCE_MS) return fase / ciclo.AVANCE_MS;
  if (fase < ciclo.AVANCE_MS + ciclo.PAUSA_MS) return 1;
  const k = (fase - ciclo.AVANCE_MS - ciclo.PAUSA_MS) / ciclo.RETORNO_MS;
  return 1 - k * k * (3 - 2 * k);
}

/** Horas que cubre un archivo de efemérides, de su primera a su última fila. */
export const horasCubiertas = (entrada: { inicio_utc: Utc; fin_utc: Utc }): number =>
  Math.max(0, (aMs(entrada.fin_utc) - aMs(entrada.inicio_utc)) / MS_POR_HORA);

/**
 * Azimut del centro de la vista: si el Sol y la Tierra caben juntos en la ventana, se centra entre los dos;
 * si no, la Tierra queda en `fraccionTierra` del ancho (como en el panorama completo).
 */
export function centroDeVista(azSol: number, azTierra: number, ventanaDeg: number, fraccionTierra: number, holgura: number = PORTADA.HOLGURA_VENTANA): number {
  const separacion = ((azSol - azTierra + 540) % 360) - 180; // −180…180: dónde está el Sol respecto a la Tierra
  if (ventanaDeg < 360 && Math.abs(separacion) <= ventanaDeg * holgura) return (azTierra + separacion / 2 + 360) % 360;
  return (azTierra - (fraccionTierra - 0.5) * ventanaDeg + 360) % 360;
}
