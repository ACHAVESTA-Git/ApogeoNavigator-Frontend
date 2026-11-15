// Escena «viva» de Sitios (plan-rediseno-astronauta-fable §3): dónde se dibujan el Sol y la Tierra en el mini
// horizonte de una tarjeta, cómo avanza el reloj del catálogo y cuál es el próximo evento desde un instante.
// Todo sale de la efeméride que ya llega (o de `indicadores_astronauta`). Sin DOM, con prueba.
import { proximosEventos } from "./astro";
import { MINI_HORIZONTE, MS_POR_HORA } from "./constants";
import { lupa, normalizarAz } from "./escalas";
import { aMs, aUtc, esUtc, limitar } from "./fechas";
import { GRADOS_VUELTA } from "./constants";
import type { Astro, FilaEfemeride, IndicadoresAstronauta, Utc } from "./tipos";

/**
 * Posición de un astro en el mini horizonte, en fracciones de su caja: `x` 0–1 de izquierda (norte, 0°) a derecha
 * (360°); `y` 0–1 desde arriba, con el horizonte en `MINI_HORIZONTE.HORIZONTE` y la elevación en escala de lupa
 * (la misma del Cielo). Bajo el horizonte el astro se hunde como mucho hasta el borde inferior.
 */
export function posicionMiniHorizonte(azimut: number, elevacion: number): { x: number; y: number; visible: boolean } {
  const h = MINI_HORIZONTE.HORIZONTE;
  const y = elevacion > 0 ? h * (1 - lupa(elevacion)) : h + (1 - h) * Math.min(1, -lupa(elevacion) * MINI_HORIZONTE.HUNDIDO);
  return { x: normalizarAz(azimut) / GRADOS_VUELTA, y: limitar(y, 0, 1), visible: elevacion > 0 };
}

/** Avanza el reloj del catálogo `deltaMs` reales a `horasPorSegundo`; al llegar al final del periodo vuelve al principio. */
export function avanzarReloj(ms: number, deltaMs: number, horasPorSegundo: number, desdeMs: number, hastaMs: number): number {
  if (!(hastaMs > desdeMs)) return desdeMs;
  const siguiente = ms + (deltaMs / 1000) * horasPorSegundo * MS_POR_HORA;
  return siguiente >= hastaMs || siguiente < desdeMs ? desdeMs : siguiente;
}

export interface ProximoEvento {
  astro: Astro;
  /** Hora entera de la puesta (paso horario, ±1 h). */
  utc: Utc;
  /** Horas enteras desde el instante consultado. */
  horas: number;
}

/**
 * La próxima puesta (del Sol o de la Tierra, la que llegue antes) desde `ahora`. Usa `proxima_puesta_*_utc` de la
 * API mientras siga por delante del instante; si ya pasó (o la API no lo trae), el siguiente cruce de la serie con
 * el mismo criterio que `GET /api/puestas`. `null` si no hay ninguna puesta por delante dentro de los datos.
 */
export function proximoEvento(ahora: Utc, filas: readonly FilaEfemeride[], indicadores?: IndicadoresAstronauta | null): ProximoEvento | null {
  if (!esUtc(ahora)) return null;
  const ms = aMs(ahora);
  const deSerie = filas.length ? proximosEventos(filas, ahora) : null;
  const candidatos = (["sol", "tierra"] as const).flatMap((astro): ProximoEvento[] => {
    const api = indicadores?.[`proxima_puesta_${astro}_utc`];
    const utc = esUtc(api) && aMs(api) > ms ? api : deSerie?.[astro].proxima_puesta_utc;
    if (!esUtc(utc) || aMs(utc) <= ms) return [];
    return [{ astro, utc: aUtc(aMs(utc)), horas: Math.round((aMs(utc) - ms) / MS_POR_HORA) }];
  });
  return candidatos.reduce<ProximoEvento | null>((antes, c) => (!antes || aMs(c.utc) < aMs(antes.utc) ? c : antes), null);
}
