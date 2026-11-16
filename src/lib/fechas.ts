// Fechas en UTC con el formato del estándar CSV ('YYYY-MM-DDTHH:MMZ') y hora local de Lima.
import { HORAS_POR_DIA, LOCALE, MS_POR_HORA, REGEX, ZONA_HORARIA_LOCAL } from "./constants";
import type { Utc } from "./tipos";

const SEGUNDOS = ":00Z";
const LARGO_MINUTOS = 16; // 'YYYY-MM-DDTHH:MM'

export const esUtc = (valor: unknown): valor is Utc => typeof valor === "string" && REGEX.UTC.test(valor);

export function aMs(utc: Utc): number {
  return Date.parse(utc.replace("Z", SEGUNDOS));
}
export function aUtc(ms: number): Utc {
  return `${new Date(ms).toISOString().slice(0, LARGO_MINUTOS)}Z`;
}
export const sumarHoras = (utc: Utc, horas: number): Utc => aUtc(aMs(utc) + horas * MS_POR_HORA);
export const horasEntre = (desde: Utc, hasta: Utc): number => (aMs(hasta) - aMs(desde)) / MS_POR_HORA;
export const diasEntre = (desde: Utc, hasta: Utc): number => horasEntre(desde, hasta) / HORAS_POR_DIA;
export const redondearHora = (ms: number): number => Math.round(ms / MS_POR_HORA) * MS_POR_HORA;
export const limitar = (valor: number, min: number, max: number): number => Math.min(max, Math.max(min, valor));

/** '2026-12-14 23:00' (sin sufijo; la interfaz añade «UTC» como rótulo). */
export const fechaHora = (utc: Utc): string => utc.slice(0, LARGO_MINUTOS).replace("T", " ");
export const soloFecha = (utc: Utc): string => utc.slice(0, 10);
export const soloHora = (utc: Utc): string => utc.slice(11, LARGO_MINUTOS);
export const diaDelMes = (utc: Utc): number => Number(utc.slice(8, 10));

const fmtLima = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA_HORARIA_LOCAL.IANA, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
const fmtLimaDia = new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA_HORARIA_LOCAL.IANA, day: "numeric", month: "short" });
const fmtLarga = new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
const fmtDiaMes = new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", day: "numeric", month: "short" });
const fmtMes = new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", month: "long", year: "numeric" });

/** '18:00' en Lima para un instante UTC. */
export const horaLima = (utc: Utc): string => fmtLima.format(aMs(utc));
/** '14 dic' en Lima (puede diferir del día UTC). */
export const diaLima = (utc: Utc): string => fmtLimaDia.format(aMs(utc));
/** '14 de diciembre de 2026, 23:00 UTC'. */
export const fechaLarga = (utc: Utc): string => `${fmtLarga.format(aMs(utc))}, ${soloHora(utc)} UTC`;
/** '14 dic'. */
export const diaCorto = (utc: Utc): string => fmtDiaMes.format(aMs(utc));
/** 'dic 2026' (mes abreviado y año, para rejillas de meses). */
const fmtMesAnio = new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", month: "short", year: "numeric" });
export const mesAnio = (utc: Utc): string => fmtMesAnio.format(aMs(utc));
const fmtMesCorto = new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", month: "short" });
/** 'dic'. */
export const mesCorto = (utc: Utc): string => fmtMesCorto.format(aMs(utc)).replace(".", "");
/** 'diciembre de 2026'. */
export const mesLargo = (utc: Utc): string => fmtMes.format(aMs(utc));

/** Valor para <input type="datetime-local"> interpretado como UTC. */
export const aCampoLocal = (utc: Utc): string => utc.slice(0, LARGO_MINUTOS);
export function desdeCampoLocal(valor: string): Utc | null {
  const utc = `${valor.slice(0, LARGO_MINUTOS)}Z`;
  return esUtc(utc) && !Number.isNaN(aMs(utc)) ? utc : null;
}

/** Primer instante del mes siguiente (o anterior con `meses` negativo) al mes de `utc`. */
export function sumarMeses(utc: Utc, meses: number): Utc {
  const d = new Date(aMs(utc));
  return aUtc(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + meses, 1));
}
export const inicioDeMes = (utc: Utc): Utc => sumarMeses(utc, 0);
export const esMesCompleto = (desde: Utc, hasta: Utc): boolean => inicioDeMes(desde) === desde && sumarMeses(desde, 1) === hasta;
