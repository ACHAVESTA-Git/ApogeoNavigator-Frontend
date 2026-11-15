// Lógica de la pantalla Comparar: ordena y resta lo que ya da la API. Aquí no hay umbrales: los niveles del
// semáforo llegan decididos y solo se comparan entre sí.
import type { NivelSemaforo, Semaforo } from "./tipos";

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
