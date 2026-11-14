// Proyección azimutal equidistante centrada en el polo sur lunar (sin d3-geo).
// 0° de longitud apunta hacia arriba (hacia la Tierra) y el este crece en sentido horario.
import { MAPA } from "./constants";

const RAD = Math.PI / 180;
const AMPLITUD = MAPA.LAT_BORDE - MAPA.LAT_POLO; // 120° de latitud del centro al borde

export const radioLatitud = (lat: number, radio: number): number => ((lat - MAPA.LAT_POLO) / AMPLITUD) * radio;

export function proyectarPolar(lat: number, lonEste: number, radio: number): { x: number; y: number } {
  const r = radioLatitud(lat, radio);
  return { x: r * Math.sin(lonEste * RAD), y: -r * Math.cos(lonEste * RAD) };
}
/** La cara oculta nunca ve la Tierra: |longitud| > 90°. */
export const esCaraOculta = (lonEste: number): boolean => Math.abs(lonEste) > MAPA.LON_CARA_OCULTA;
