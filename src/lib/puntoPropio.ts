// Coordenadas propias (HU-13): un punto cualquiera de la Luna consultado en vivo a JPL Horizons a través de
// GET /api/horizons. Las coordenadas viajan dentro del identificador de la ruta («punto_s89p66_e129p2»), que
// cumple el estándar de site_id: así el punto se comporta como cualquier sitio y NO se guarda en ningún
// almacenamiento del navegador ni se envía a otro servicio.
import { ENLACES, PUNTO_PROPIO } from "./constants";
import { T } from "./textos";
import type { Site } from "./tipos";

export interface Punto { lat: number; lon: number }

const { LAT, LON, DECIMALES, PREFIJO } = PUNTO_PROPIO;
const redondear = (v: number): number => Number(v.toFixed(DECIMALES));
const cifra = (v: number): string => String(redondear(Math.abs(v))).replace(".", "p");
const numero = (texto: string): number => Number(texto.replace("p", "."));
const PATRON = new RegExp(`^${PREFIJO}([ns])(\\d{1,2}(?:p\\d{1,${DECIMALES}})?)_([eo])(\\d{1,3}(?:p\\d{1,${DECIMALES}})?)$`);

/** Sur y Oeste negativos: (−89.66, 129.2) → «punto_s89p66_e129p2». */
export const idDePunto = ({ lat, lon }: Punto): string => `${PREFIJO}${lat < 0 ? "s" : "n"}${cifra(lat)}_${lon < 0 ? "o" : "e"}${cifra(lon)}`;

/** Las coordenadas de un identificador de punto propio, o null si el id es de un sitio del catálogo o no es válido. */
export function puntoDeId(id: string | undefined): Punto | null {
  const m = id ? PATRON.exec(id) : null;
  if (!m) return null;
  const lat = (m[1] === "s" ? -1 : 1) * numero(m[2]);
  const lon = (m[3] === "o" ? -1 : 1) * numero(m[4]);
  return lat >= LAT.MIN && lat <= LAT.MAX && lon >= LON.MIN && lon <= LON.MAX ? { lat, lon } : null;
}
export const esPuntoPropio = (id: string | undefined): boolean => puntoDeId(id) !== null;

export type ResultadoCampo = { valor: number; error: null } | { valor: null; error: string };
/** Valida lo que el usuario escribe (admite coma decimal). Vacío no es error todavía: `error` queda en "". */
export function leerCoordenada(texto: string, eje: "lat" | "lon"): ResultadoCampo {
  const t = T.puntoPropio;
  const limpio = texto.trim().replace(",", ".");
  if (limpio === "") return { valor: null, error: "" };
  if (!/^[+-]?\d+(\.\d+)?$/.test(limpio)) return { valor: null, error: t.errores.numero };
  const valor = Number(limpio);
  const { MIN, MAX } = eje === "lat" ? LAT : LON;
  if (valor < MIN || valor > MAX) return { valor: null, error: eje === "lat" ? t.errores.lat : t.errores.lon };
  return { valor: redondear(valor), error: null };
}

/** El punto como un `Site` más, para que Cielo, Ventanas y Día lunar lo traten igual que a los del catálogo. */
export const sitioDePunto = (id: string, { lat, lon }: Punto): Site => ({
  site_id: id,
  nombre: T.puntoPropio.nombre,
  categoria: "personalizado",
  mision: "",
  agencia: T.puntoPropio.fuente,
  lat_deg: lat,
  lon_este_deg: lon,
  alt_km: 0,
  fuente_url: ENLACES.HORIZONS,
  notas: null,
});
