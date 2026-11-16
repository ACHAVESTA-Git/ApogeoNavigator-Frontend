// Indicadores para astronautas (docs/datos/indicadores-astronauta.md). Las cifras llegan de `GET /api/metricas`
// (`indicadores_astronauta`); aquí solo se decide QUÉ frase es cierta para cada dato (§6 del documento) y se
// agrupan las ventanas Sol+Tierra de la serie que ya llega. Sin DOM, con prueba.
import { filasEnIntervalo, pasoHoras, sobreHorizonte } from "./astro";
import { MS_POR_HORA } from "./constants";
import { aMs, esUtc, horasEntre } from "./fechas";
import type { FilaEfemeride, Racha, Utc } from "./tipos";

/**
 * Qué variante de frase le corresponde a una racha:
 *  - `sinDato`: la API no trae el campo (o no es una racha válida). No se muestra ninguna cifra: sin dato no es cero.
 *  - `cero`: 0 h. · `todo`: ocupa todo el periodo. · `cortada`: toca un borde del periodo (el valor es un mínimo, «≥»).
 *  - `normal`: racha completa dentro del periodo.
 */
export type VarianteRacha = "sinDato" | "cero" | "todo" | "cortada" | "normal";

export const esRacha = (valor: unknown): valor is Racha => {
  if (typeof valor !== "object" || valor === null) return false;
  const r = valor as Partial<Racha>;
  return typeof r.horas === "number" && Number.isFinite(r.horas) && r.horas >= 0;
};

/** La racha toca un borde del periodo: sigue fuera de él y su duración real es igual o mayor. */
export const esRachaCortada = (racha: Racha): boolean => racha.horas > 0 && (racha.trunca_inicio === true || racha.trunca_fin === true);

export function varianteRacha(racha: unknown, horasPeriodo: number): VarianteRacha {
  if (!esRacha(racha)) return "sinDato";
  if (racha.horas === 0) return "cero";
  if (horasPeriodo > 0 && racha.horas >= horasPeriodo) return "todo";
  return esRachaCortada(racha) ? "cortada" : "normal";
}

/** Horas enteras desde `desde` hasta un evento posterior; `null` si no hay evento o no es posterior (nunca se inventa). */
export function horasHasta(desde: Utc, evento: unknown): number | null {
  if (!esUtc(evento) || !esUtc(desde)) return null;
  const h = horasEntre(desde, evento);
  return h > 0 ? Math.round(h) : null;
}

/**
 * Qué decir cuando la API no da próxima puesta (`null`) dentro del periodo (indicadores-astronauta §6):
 *  - `noSale`: el astro no está sobre el horizonte en ninguna hora del periodo (caso «0»). Decir «sin puesta antes
 *    de…» sugeriría que está a la vista: es falso.
 *  - `sinPuesta`: está a la vista y no llega a ponerse antes del fin del periodo.
 */
export function motivoSinPuesta(horasVisible: number): "noSale" | "sinPuesta" {
  return horasVisible > 0 ? "sinPuesta" : "noSale";
}

export interface VentanaConjunta {
  inicioMs: number;
  /** Exclusivo: fin de la última hora de la ventana. */
  finMs: number;
  horas: number;
  /** La ventana toca el primer o el último instante de la serie pedida: continúa fuera. */
  cortada: boolean;
}

/** Tramos continuos de [desde, hasta) en los que se cumple `visible` (una fila = un paso). */
function tramos(filas: readonly FilaEfemeride[], desde: Utc, hasta: Utc, visible: (fila: FilaEfemeride) => boolean): VentanaConjunta[] {
  const dentro = filasEnIntervalo(filas, desde, hasta);
  const pasoMs = pasoHoras(filas) * MS_POR_HORA;
  const salida: VentanaConjunta[] = [];
  let actual: VentanaConjunta | null = null;
  dentro.forEach((fila, i) => {
    const t = aMs(fila.utc);
    if (!visible(fila)) { actual = null; return; }
    if (actual && actual.finMs === t) {
      actual.finMs = t + pasoMs;
      actual.horas += pasoMs / MS_POR_HORA;
    } else {
      actual = { inicioMs: t, finMs: t + pasoMs, horas: pasoMs / MS_POR_HORA, cortada: i === 0 };
      salida.push(actual);
    }
    if (i === dentro.length - 1) actual.cortada = true;
  });
  return salida;
}

/** Ventanas con el Sol Y la Tierra a la vez sobre el horizonte ideal (operación con energía solar y enlace directo). */
export const ventanasConjuntas = (filas: readonly FilaEfemeride[], desde: Utc, hasta: Utc): VentanaConjunta[] =>
  tramos(filas, desde, hasta, (f) => sobreHorizonte(f.sol_el_deg) && sobreHorizonte(f.tierra_el_deg));

/** Ventanas de un solo astro sobre el horizonte ideal, con la misma forma que las conjuntas. */
export const ventanasDe = (filas: readonly FilaEfemeride[], astro: "sol" | "tierra", desde: Utc, hasta: Utc): VentanaConjunta[] =>
  tramos(filas, desde, hasta, (f) => sobreHorizonte(f[`${astro}_el_deg`]));

/** La ventana más larga (la primera si hay empate); `null` si no hay ninguna. */
export const ventanaMasLarga = (ventanas: readonly VentanaConjunta[]): VentanaConjunta | null =>
  ventanas.reduce<VentanaConjunta | null>((mejor, v) => (!mejor || v.horas > mejor.horas ? v : mejor), null);
