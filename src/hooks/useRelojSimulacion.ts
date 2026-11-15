import { useAnimationFrame, useMotionValue, type MotionValue } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useApp } from "../components/layout/contexto";
import { instantePorDefecto } from "../lib/astro";
import { DATOS, MOVIMIENTO, MS_POR_HORA, PARAM_URL, VELOCIDAD_POR_DEFECTO } from "../lib/constants";
import { aMs, esUtc, limitar } from "../lib/fechas";
import { fijarFranjaTiempo, fijarInstanteGlobal } from "../lib/relojGlobal";
import type { FilaEfemeride, Utc } from "../lib/tipos";
import { useMovimientoReducido } from "./useMovimientoReducido";
import { useEscribirUrl } from "./useParametrosUrl";

export interface RelojSimulacion {
  /** Instante continuo en ms: lo leen los glifos en cada fotograma sin rerenderizar React. */
  t: MotionValue<number>;
  /** Hora en curso (última fila con utc ≤ t): cambia como mucho una vez por hora simulada. */
  tUtc: Utc;
  indice: number;
  desdeMs: number;
  hastaMs: number;
  reproduciendo: boolean;
  reproducir: () => void;
  pausar: () => void;
  alternar: () => void;
  irA: (ms: number) => void;
  arrastrarA: (ms: number) => void;
  paso: (horas: number) => void;
  velocidad: number;
  setVelocidad: (horasPorSegundo: number) => void;
  /** El `t` de la URL quedaba fuera del periodo y se ajustó. */
  ajustado: boolean;
}

/** Instante inicial: el de la URL si es válido; si no, el instante con historia del sitio destacado o la regla general. */
function instanteInicial(filas: readonly FilaEfemeride[], deUrl: string | null, siteId: string): { ms: number; ajustado: boolean } {
  const [t0, t1] = [aMs(filas[0].utc), aMs(filas[filas.length - 1].utc)];
  if (esUtc(deUrl)) {
    const ms = aMs(deUrl);
    return { ms: limitar(ms, t0, t1), ajustado: ms < t0 || ms > t1 };
  }
  const destacado = aMs(DATOS.T_POR_DEFECTO);
  if (siteId === DATOS.SITIO_DESTACADO && destacado >= t0 && destacado <= t1) return { ms: destacado, ajustado: false };
  return { ms: aMs(instantePorDefecto(filas) ?? filas[0].utc), ajustado: false };
}

/**
 * Reloj compartido por el Cielo y el Día lunar. El instante vive en `?t=` (replace con debounce: no crea una
 * entrada de historial por hora). Se pausa con un modal abierto; con movimiento reducido salta 1 h por segundo.
 */
export function useRelojSimulacion(filas: readonly FilaEfemeride[], siteId: string): RelojSimulacion {
  const [params] = useSearchParams();
  const escribir = useEscribirUrl();
  const reducido = useMovimientoReducido();
  const { modalAbierto } = useApp();
  const desdeMs = aMs(filas[0].utc);
  const hastaMs = aMs(filas[filas.length - 1].utc);
  const pasoMs = filas.length > 1 ? aMs(filas[1].utc) - desdeMs : MS_POR_HORA;

  const inicial = useMemo(() => instanteInicial(filas, params.get(PARAM_URL.T), siteId), [filas, siteId]); // eslint-disable-line react-hooks/exhaustive-deps
  const t = useMotionValue(inicial.ms);
  const [indice, setIndice] = useState(() => Math.floor((inicial.ms - desdeMs) / pasoMs));
  const [reproduciendo, setReproduciendo] = useState(false);
  useEffect(() => {
    fijarFranjaTiempo(0, (t.get() - desdeMs) / (hastaMs - desdeMs));
    return () => fijarFranjaTiempo(0, 0);
  }, [t, desdeMs, hastaMs]);
  const [velocidad, setVelocidad] = useState<number>(VELOCIDAD_POR_DEFECTO);

  const fijar = useCallback(
    (ms: number) => {
      const v = limitar(ms, desdeMs, hastaMs);
      t.set(v);
      fijarFranjaTiempo(0, (v - desdeMs) / (hastaMs - desdeMs));
      setIndice(Math.floor((v - desdeMs) / pasoMs));
    },
    [t, desdeMs, hastaMs, pasoMs],
  );
  // Cambió el periodo o el sitio: el reloj vuelve a su instante inicial.
  const filasPrevias = useRef(filas);
  useEffect(() => {
    if (filasPrevias.current === filas) return;
    filasPrevias.current = filas;
    setReproduciendo(false);
    fijar(inicial.ms);
  }, [filas, inicial, fijar]);

  const activo = reproduciendo && !modalAbierto;
  useAnimationFrame((_, delta) => {
    if (!activo || reducido) return;
    const siguiente = t.get() + (Math.min(delta, 100) / 1000) * velocidad * MS_POR_HORA;
    if (siguiente >= hastaMs) setReproduciendo(false);
    fijar(siguiente);
  });
  useEffect(() => {
    if (!activo || !reducido) return;
    const reloj = setInterval(() => {
      if (t.get() >= hastaMs) setReproduciendo(false);
      else fijar(t.get() + pasoMs);
    }, MOVIMIENTO.PASO_REDUCIDO_MS);
    return () => clearInterval(reloj);
  }, [activo, reducido, t, hastaMs, pasoMs, fijar]);

  const tUtc = filas[Math.min(indice, filas.length - 1)].utc;
  useEffect(() => {
    fijarInstanteGlobal(tUtc);
    const reloj = setTimeout(() => escribir({ [PARAM_URL.T]: tUtc }), MOVIMIENTO.DEBOUNCE_URL_MS);
    return () => clearTimeout(reloj);
  }, [tUtc, escribir]);

  /** Al pausar o saltar, el instante cae siempre en una fila exacta. */
  const irA = useCallback(
    (ms: number) => {
      setReproduciendo(false);
      fijar(desdeMs + Math.round((ms - desdeMs) / pasoMs) * pasoMs);
    },
    [fijar, desdeMs, pasoMs],
  );
  /** Arrastre directo del tiempo: sigue al dedo de forma continua (sin saltar de hora en hora) y pausa. */
  const arrastrarA = useCallback(
    (ms: number) => {
      setReproduciendo(false);
      fijar(ms);
    },
    [fijar],
  );
  const pausar = useCallback(() => irA(t.get()), [irA, t]);
  const reproducir = useCallback(() => {
    if (t.get() >= hastaMs) fijar(desdeMs); // al final del periodo, vuelve a empezar
    setReproduciendo(true);
  }, [t, hastaMs, desdeMs, fijar]);

  return {
    t, tUtc, indice, desdeMs, hastaMs, reproduciendo, reproducir, pausar,
    alternar: reproduciendo ? pausar : reproducir,
    irA, arrastrarA,
    paso: useCallback((h: number) => irA(t.get() + h * MS_POR_HORA), [irA, t]),
    velocidad, setVelocidad, ajustado: inicial.ajustado,
  };
}
