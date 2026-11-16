// Lógica de la pantalla Comparar: ordena y resta lo que ya da la API. Aquí no hay umbrales: los niveles del
// semáforo llegan decididos y solo se comparan entre sí.
import { RANKING } from "./constants";
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

/** Los tres indicadores de racha que se enfrentan en el duelo (campos de `indicadores_astronauta`). */
export const RACHAS = ["noche_mas_larga", "apagon_tierra_mas_largo", "ventana_sol_y_tierra"] as const;
export type ClaveRacha = (typeof RACHAS)[number];

/** La racha de un indicador, o null si la API no la trae o no es válida: sin dato no es cero. */
export function rachaDe(indicadores: IndicadoresAstronauta | null | undefined, clave: ClaveRacha): Racha | null {
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

/** Lo que el ranking necesita de cada sitio: su veredicto (API) y su ventana continua con Sol y Tierra (API). */
export interface Candidato {
  semaforo: Semaforo;
  /** Horas de `indicadores_astronauta.ventana_sol_y_tierra`; null si la API no las trae (va detrás a igualdad). */
  ventana_h: number | null;
}

/**
 * Ordena los sitios para el ranking: primero el veredicto combinado de energía y comunicación (el semáforo global
 * de la API: viable, con reservas, crítico) y, a igualdad, más horas seguidas con Sol y Tierra a la vez. Si aún
 * empatan se conserva el orden de llegada. Cada elemento sale con su puesto (1 = primero). Sin listas fijas.
 */
export function ordenarRanking<C extends Candidato>(candidatos: readonly C[]): (C & { puesto: number })[] {
  return candidatos
    .map((c, i) => ({ c, i }))
    .sort((a, b) => ORDEN[a.c.semaforo.global] - ORDEN[b.c.semaforo.global] || (b.c.ventana_h ?? -1) - (a.c.ventana_h ?? -1) || a.i - b.i)
    .map(({ c }, i) => ({ ...c, puesto: i + 1 }));
}

/**
 * Con qué se compara la cifra decisiva de un puesto: el primero, con el segundo; los demás, con el primero.
 * Devuelve las horas de diferencia (con signo) y el puesto rival, o null si falta el dato o alguna de las dos
 * ventanas está cortada por el borde del periodo (un «≥» no se puede restar sin inventar).
 */
export function frenteAlRanking<C extends { puesto: number; ventana: Racha | null }>(ranking: readonly C[], fila: C): { dif_h: number; rival: C } | null {
  const rival = ranking.find((c) => c.puesto === (fila.puesto === 1 ? 2 : 1));
  if (!rival || !fila.ventana || !rival.ventana || esTruncada(fila.ventana) || esTruncada(rival.ventana)) return null;
  return { dif_h: fila.ventana.horas - rival.ventana.horas, rival };
}

/** Los primeros puestos del ranking más los elegidos que quedan fuera (con su puesto real), en orden de puesto. */
export const visiblesDelRanking = <C extends { puesto: number }>(ranking: readonly C[], elegido: (c: C) => boolean): C[] =>
  ranking.filter((c) => c.puesto <= RANKING.PUESTOS || elegido(c));

/** Región polar sur: latitud en el paralelo 80° S o más al sur. */
export const esPolarSur = (lat_deg: number): boolean => lat_deg <= RANKING.POLAR_SUR_LAT_MAX_DEG;

/**
 * Monograma neutro de un sitio (iniciales generadas del nombre, sin logotipos ni parches): una sigla inicial se
 * deja entera («SLIM», «IM»); si no, las iniciales de hasta dos palabras; después, el primer número del nombre.
 * «Apolo 11» → A11 · «Blue Ghost 1» → BG1 · «Chang'e 4» → C4 · «Cráter Shackleton (centro)» → CS.
 */
export function monograma(nombre: string): string {
  const palabras = nombre.split(/[^\p{L}\p{N}']+/u).filter(Boolean);
  const letras = palabras.filter((p) => /^\p{L}/u.test(p));
  const numero = nombre.match(/\d+/)?.[0] ?? "";
  const sigla = letras[0] && letras[0].length <= RANKING.MONOGRAMA_MAX && letras[0] === letras[0].toUpperCase() && letras[0].length > 1;
  const iniciales = sigla ? letras[0] : letras.slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  return `${iniciales}${numero}`.slice(0, RANKING.MONOGRAMA_MAX);
}
