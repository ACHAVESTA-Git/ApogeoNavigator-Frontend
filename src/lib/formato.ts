// Formato de cifras para la interfaz (coma decimal). En la API y los CSV sigue el punto.
import { LOCALE_NUMEROS, MAPA } from "./constants";

const MENOS = "−";
const cache = new Map<number, Intl.NumberFormat>();
function fmt(decimales: number): Intl.NumberFormat {
  let f = cache.get(decimales);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE_NUMEROS, { minimumFractionDigits: decimales, maximumFractionDigits: decimales, useGrouping: false });
    cache.set(decimales, f);
  }
  return f;
}
const fmtFlexible = new Intl.NumberFormat(LOCALE_NUMEROS, { maximumFractionDigits: 2, useGrouping: false });

export const numero = (valor: number, decimales = 2): string => fmt(decimales).format(valor).replace("-", MENOS);
/** Sin ceros de relleno: 100 → '100', 39.11 → '39,11'. */
export const numeroCorto = (valor: number): string => fmtFlexible.format(valor).replace("-", MENOS);

/** '+1,17°' con signo (elevaciones) o '151,40°' sin él (azimut). */
export function grados(valor: number, decimales = 2, conSigno = false): string {
  const signo = conSigno && valor >= 0 ? "+" : "";
  return `${signo}${numero(valor, decimales)}°`;
}
export const pct = (valor: number): string => `${numeroCorto(valor)} %`;
export const horas = (valor: number): string => `${numeroCorto(valor)} h`;

export const latitud = (lat: number, decimales = 2): string => `${numero(Math.abs(lat), decimales)}° ${lat < 0 ? "S" : "N"}`;
export const longitud = (lon: number, decimales = 2): string => `${numero(Math.abs(lon), decimales)}° ${lon < 0 ? "O" : "E"}`;
export const coordenadas = (lat: number, lon: number): string => `${latitud(lat)} · ${longitud(lon)}`;

/** 'Apolo 11' de 'Apolo 11 - Mar de la Tranquilidad'. */
export const nombreCorto = (nombre: string): string => nombre.split(MAPA.SEPARADOR_NOMBRE)[0];

const KB = 1024;
export function tamanoArchivo(bytes: number): string {
  if (bytes < KB) return `${bytes} B`;
  if (bytes < KB * KB) return `${numero(bytes / KB, 1)} KB`;
  return `${numero(bytes / (KB * KB), 1)} MB`;
}
