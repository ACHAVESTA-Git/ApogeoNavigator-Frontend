// Lógica de la pantalla Comparar: ordena y resta lo que ya da la API. Aquí no hay umbrales: los niveles del
// semáforo llegan decididos y solo se comparan entre sí.
import type { IndicadoresAstronauta, NivelSemaforo, Racha, Semaforo } from "./tipos";

/** Una fila de la comparación con sus métricas (un sitio o un periodo). */
export interface LineaComparada {
  nombre: string;
  horas_sol: number;
  pct_sol: number;
  horas_tierra_visible: number;
  pct_tierra: number;
  semaforo: Semaforo;
  /** La API avisó de que las horas de sol dependen del relieve. */
  sensible?: boolean;
}

const ORDEN: Record<NivelSemaforo, number> = { verde: 0, amarillo: 1, rojo: 2 };

/** Lo que una fila gana o pierde frente a la mejor de las demás en cada eje. */
export interface Diferencia {
  nombre: string;
  /** horas de sol de más (+) o de menos (−) */
  sol_h: number;
  rivalSol: string;
  /** horas con la Tierra visible de más o de menos, y lo mismo en % relativo (null si el rival no la ve) */
  tierra_h: number;
  tierra_pct: number | null;
  rivalTierra: string;
}

export function diferencias(lineas: readonly LineaComparada[]): Diferencia[] {
  if (lineas.length < 2) return [];
  return lineas.map((linea, i) => {
    const otras = lineas.filter((_, k) => k !== i);
    const mejor = (clave: "horas_sol" | "horas_tierra_visible") => otras.reduce((a, b) => (b[clave] > a[clave] ? b : a));
    const rivalSol = mejor("horas_sol");
    const rivalTierra = mejor("horas_tierra_visible");
    const tierra_h = linea.horas_tierra_visible - rivalTierra.horas_tierra_visible;
    return {
      nombre: linea.nombre,
      sol_h: linea.horas_sol - rivalSol.horas_sol,
      rivalSol: rivalSol.nombre,
      tierra_h,
      tierra_pct: rivalTierra.horas_tierra_visible > 0 ? (tierra_h / rivalTierra.horas_tierra_visible) * 100 : null,
      rivalTierra: rivalTierra.nombre,
    };
  });
}

export interface Decision {
  /** índices de las filas con mejor semáforo (más de una si empatan) */
  recomendadas: number[];
  /** entre las recomendadas, la que tiene más horas de sol y la que más ve la Tierra (null si igualan o solo hay una) */
  liderSol: number | null;
  liderTierra: number | null;
  /** la fila no recomendada con más sol: lo que se deja de ganar al seguir la recomendación */
  contrapartida: number | null;
}

/**
 * Decide con el semáforo de la API: primero el nivel global y, a igualdad, la suma de los niveles de energía y
 * de comunicación. Si aun así empatan, se recomiendan todas las empatadas y deciden las cifras.
 */
export function decidir(lineas: readonly LineaComparada[]): Decision | null {
  if (lineas.length < 2) return null;
  const puntos = lineas.map((l) => ORDEN[l.semaforo.global] * 10 + ORDEN[l.semaforo.energia] + ORDEN[l.semaforo.comunicacion]);
  const mejor = Math.min(...puntos);
  const recomendadas = puntos.flatMap((p, i) => (p === mejor ? [i] : []));
  // Los líderes sirven para decidir un empate: se buscan solo entre las filas recomendadas.
  const lider = (clave: "horas_sol" | "horas_tierra_visible"): number | null => {
    const maximo = Math.max(...recomendadas.map((i) => lineas[i][clave]));
    return recomendadas.every((i) => lineas[i][clave] === maximo) ? null : recomendadas.find((i) => lineas[i][clave] === maximo)!;
  };
  const resto = lineas.map((_, i) => i).filter((i) => !recomendadas.includes(i));
  const contrapartida = resto.length ? resto.reduce((a, b) => (lineas[b].horas_sol > lineas[a].horas_sol ? b : a)) : null;
  return { recomendadas, liderSol: lider("horas_sol"), liderTierra: lider("horas_tierra_visible"), contrapartida };
}

/** Fila protagonista del podio: la única recomendada o, si empatan en el semáforo, la que decide por cifras. */
export const protagonista = (d: Decision | null): number | null =>
  !d ? null : d.recomendadas.length === 1 ? d.recomendadas[0] : d.liderSol ?? d.liderTierra;

/** Una diferencia del podio: horas de sol, o Tierra en % relativo (en horas si el rival no la ve). */
export interface CifraPodio {
  eje: "sol" | "tierra";
  /** con signo: de más (+) o de menos (−) frente al rival */
  valor: number;
  unidad: "h" | "%";
  rival: string;
}

/**
 * Las diferencias de una fila frente a la mejor de las demás, ordenadas para el podio: primero la mayor ventaja
 * relativa (la cifra héroe) y después la otra (lo que cede o su segunda ventaja). Una diferencia nula no se muestra.
 */
export function cifrasPodio(lineas: readonly LineaComparada[], indice: number): CifraPodio[] {
  const d = diferencias(lineas)[indice];
  if (!d) return [];
  const rivalSol = lineas.find((l, k) => k !== indice && l.nombre === d.rivalSol);
  // Peso relativo solo para ordenar: frente a un rival con 0 h, cualquier diferencia es la mayor posible.
  const relativo = (dif: number, base: number | undefined) => (base ? dif / base : Math.sign(dif) * Infinity);
  const cifras: (CifraPodio & { peso: number })[] = [
    { eje: "sol", valor: d.sol_h, unidad: "h", rival: d.rivalSol, peso: relativo(d.sol_h, rivalSol?.horas_sol) },
    {
      eje: "tierra", valor: d.tierra_pct === null ? d.tierra_h : Math.round(d.tierra_pct), unidad: d.tierra_pct === null ? "h" : "%",
      rival: d.rivalTierra, peso: d.tierra_pct === null ? Math.sign(d.tierra_h) * Infinity : d.tierra_pct / 100,
    },
  ];
  return cifras.filter((c) => c.valor !== 0).sort((a, b) => b.peso - a.peso).map(({ peso: _peso, ...c }) => c);
}

/** Los tres indicadores de racha que se enfrentan en el duelo (campos de `indicadores_astronauta`). */
export const RACHAS = ["noche_mas_larga", "apagon_tierra_mas_largo", "ventana_sol_y_tierra"] as const;
export type ClaveRacha = (typeof RACHAS)[number];

/** La racha de un indicador, o null si la API no la trae o no es válida: sin dato no es cero. */
export function rachaDe(indicadores: IndicadoresAstronauta | undefined, clave: ClaveRacha): Racha | null {
  const r = indicadores?.[clave];
  return r && typeof r.horas === "number" && Number.isFinite(r.horas) && r.horas >= 0 ? r : null;
}

export const esTruncada = (r: Racha): boolean => Boolean(r.trunca_inicio || r.trunca_fin);

/**
 * Qué frase corresponde a una racha (docs/datos/indicadores-astronauta.md, §4 y §6):
 *  - `cero`: no hay racha · `todo`: ocupa todo el periodo · `normal`: racha completa dentro del periodo.
 *  - `sigue`: la corta el final de un mes natural (continúa el mes siguiente).
 *  - `borde`: la corta el borde en cualquier otro caso (empezó antes, o el periodo no es un mes natural).
 */
export type VarianteRacha = "normal" | "cero" | "sigue" | "borde" | "todo";
/** Lo que rellena una frase de racha: las horas ya con su unidad, el sitio y el periodo legible. */
export interface FraseRacha { horas: string; sitio: string; mes: string }
export function varianteRacha(r: Racha, horasPeriodo: number, mesCompleto: boolean): VarianteRacha {
  if (r.horas === 0) return "cero";
  if (r.horas >= horasPeriodo) return "todo";
  if (r.trunca_fin && mesCompleto) return "sigue";
  return esTruncada(r) ? "borde" : "normal";
}
