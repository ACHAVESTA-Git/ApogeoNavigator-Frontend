// Lectura de GET /api/ventanas-alunizaje: escalones del calendario de calor, meses, empates y teclado de la rejilla.
// Aquí no se calcula ninguna ventana: todas las cifras son de la API.
import { ALUNIZAJE, DATOS, HORAS_POR_DIA, MS_POR_HORA, PARAM_URL, RUTAS } from "./constants";
import { aMs, aUtc, inicioDeMes, sumarHoras, sumarMeses } from "./fechas";
import type { DiaVentana, EstanciaH, ResultadoVentanas, Utc, VentanaAlunizaje } from "./tipos";

export type NivelCalor = 0 | 1 | 2 | 3 | 4;
/** Escalón del calendario: 0 = ninguna hora con Sol y Tierra; 4 = el 75 % de la estancia o más. */
export function nivelCalor(pct: number): NivelCalor {
  if (!(pct > 0)) return 0;
  return (1 + ALUNIZAJE.ESCALA_PCT.filter((limite) => pct >= limite).length) as NivelCalor;
}

export const esEstancia = (valor: number): valor is EstanciaH => (ALUNIZAJE.ESTANCIAS_H as readonly number[]).includes(valor);
/** Estancia de la URL (`estancia=72|156|336`); cualquier otra cosa es la de referencia. */
export const estanciaDeUrl = (crudo: string | null): EstanciaH => {
  const valor = Number(crudo);
  return esEstancia(valor) ? valor : ALUNIZAJE.ESTANCIA_POR_DEFECTO;
};

export interface DiaCalendario {
  /** 'YYYY-MM-DD' */
  dia: string;
  /** Sin dato: la estancia que empezaría ese día no cabe en los datos. */
  dato?: DiaVentana;
}
export interface MesCalendario {
  inicio: Utc;
  dias: DiaCalendario[];
  /** Mayor % del mes; null si ningún día tiene dato. */
  maxPct: number | null;
}
const diaDe = (utc: Utc): string => utc.slice(0, 10);
export const utcDeDia = (dia: string): Utc => `${dia}T00:00Z`;
/** Meses [desde, hasta) con todos sus días; cada día lleva su dato de la serie, si lo tiene. */
export function mesesCalendario(serie: readonly DiaVentana[], desde: Utc = DATOS.COBERTURA.DESDE, hasta: Utc = DATOS.COBERTURA.HASTA): MesCalendario[] {
  const porDia = new Map(serie.map((d) => [d.dia_utc, d]));
  const meses: MesCalendario[] = [];
  for (let mes = inicioDeMes(desde); aMs(mes) < aMs(hasta); mes = sumarMeses(mes, 1)) {
    const fin = Math.min(aMs(sumarMeses(mes, 1)), aMs(hasta));
    const dias: DiaCalendario[] = [];
    for (let ms = Math.max(aMs(mes), aMs(desde)); ms < fin; ms += HORAS_POR_DIA * MS_POR_HORA) {
      const dia = diaDe(aUtc(ms));
      dias.push({ dia, dato: porDia.get(dia) });
    }
    const conDato = dias.flatMap((d) => (d.dato ? [d.dato.pct_sol_y_tierra] : []));
    meses.push({ inicio: mes, dias, maxPct: conDato.length ? Math.max(...conDato) : null });
  }
  return meses;
}

/** La mejor ventana no tiene ni una hora con Sol y Tierra a la vez: no hay fecha que recomendar. */
export const sinVentanaUtil = (mejores: readonly VentanaAlunizaje[]): boolean => mejores.length > 0 && !(mejores[0].horas_sol_y_tierra > 0);

/** Varias llegadas alcanzan el mismo máximo: la «mejor» es solo la primera de ellas. */
export function hayEmpate(r: Pick<ResultadoVentanas, "mejores" | "serie_diaria">): boolean {
  const mejor = r.mejores[0];
  if (!mejor || !(mejor.horas_sol_y_tierra > 0)) return false;
  const iguala = (horas: number) => horas >= mejor.horas_sol_y_tierra - ALUNIZAJE.TOLERANCIA_EMPATE_H;
  return r.mejores.slice(1).some((v) => iguala(v.horas_sol_y_tierra)) || r.serie_diaria.filter((d) => iguala(d.horas_sol_y_tierra)).length > 1;
}

/**
 * Estancia [llegada, salida): `salida` es EXCLUSIVA y GET /api/efemerides incluye ambos extremos, así que la
 * última fila que se pide es la de un paso antes de la salida (tantas filas como horas de estancia).
 */
export function rangoEstancia(llegada: Utc, estanciaH: EstanciaH): { salida: Utc; desde: Utc; hasta: Utc } {
  const salida = sumarHoras(llegada, estanciaH);
  return { salida, desde: llegada, hasta: sumarHoras(salida, -DATOS.PASO_HORAS) };
}

/** Mes del Cielo que contiene un instante: el Cielo trabaja por meses completos. */
export const mesDelInstante = (utc: Utc): { desde: Utc; hasta: Utc } => ({ desde: inicioDeMes(utc), hasta: sumarMeses(inicioDeMes(utc), 1) });

/** Columnas que caben con celdas de 48 px y 8 px de separación (entre 5 y 16). */
export function columnasRejilla(anchoPx: number): number {
  const { CELDA_PX, HUECO_PX, COLUMNAS } = ALUNIZAJE;
  return Math.min(COLUMNAS.MAX, Math.max(COLUMNAS.MIN, Math.floor((anchoPx + HUECO_PX) / (CELDA_PX + HUECO_PX))));
}

/** Retraso de entrada de la celda i: pasos cortos con techo (la última sale a los 120 ms y termina antes de 320 ms). */
export const retrasoCelda = (indice: number): number => Math.min(indice * ALUNIZAJE.ENTRADA.PASO_MS, ALUNIZAJE.ENTRADA.RETRASO_MAX_MS);

/**
 * Teclado de la rejilla (patrón grid): flechas ±1 día o ±1 fila, Inicio/Fin a los extremos de la fila.
 * Devuelve el índice de destino dentro de la lista continua de días (todos los meses), o null si la tecla no mueve.
 */
export function moverEnRejilla(tecla: string, indice: number, total: number, columnas: number, inicioMes: number, finMes: number): number | null {
  const fila = Math.floor((indice - inicioMes) / columnas);
  const destino: Record<string, number> = {
    ArrowRight: indice + 1,
    ArrowLeft: indice - 1,
    ArrowDown: indice + columnas > finMes && indice + columnas < total ? Math.max(finMes + 1, indice + 1) : indice + columnas,
    ArrowUp: indice - columnas < inicioMes && indice - columnas >= 0 ? Math.min(inicioMes - 1, indice - 1) : indice - columnas,
    Home: inicioMes + fila * columnas,
    End: Math.min(finMes, inicioMes + fila * columnas + columnas - 1),
  };
  if (!(tecla in destino)) return null;
  return Math.min(total - 1, Math.max(0, destino[tecla]));
}

/** Enlace al Cielo del sitio en un instante (el Cielo trabaja con el mes que lo contiene). */
export function enlaceCielo(siteId: string, utc: Utc): string {
  const { desde, hasta } = mesDelInstante(utc);
  return `${RUTAS.CIELO(siteId)}?${new URLSearchParams({ [PARAM_URL.DESDE]: desde, [PARAM_URL.HASTA]: hasta, [PARAM_URL.T]: utc })}`;
}
