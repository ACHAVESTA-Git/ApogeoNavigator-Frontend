import { AnimatePresence, m } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router";
import type { DatosFila } from "../../hooks/useFilasComparacion";
import { useDimensiones } from "../../hooks/useDimensiones";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { sobreHorizonte } from "../../lib/astro";
import { COMPARAR, ESCENA, GRADOS_VUELTA, MOVIMIENTO, MS_POR_HORA, PANORAMA, PARAM_URL, RUTAS } from "../../lib/constants";
import { elevacionAY, escalaMixta } from "../../lib/escalas";
import { aMs, aUtc } from "../../lib/fechas";
import { grados } from "../../lib/formato";
import { interpolarFila, type PosicionCielo } from "../../lib/interpolar";
import { NOMBRE_ASTRO, T, describirCielo } from "../../lib/textos";
import type { Astro, FilaEfemeride } from "../../lib/tipos";
import { crearPaisaje, leerColores, pintarEscena, semillaDe, type Colores } from "../cielo/lienzoLunar";
import { GlifoAstro } from "../glifos/Astros";
import { GlifoSemaforo } from "../glifos/GlifoSemaforo";
import { unir } from "../ui/clases";

const ASTROS: readonly Astro[] = ["sol", "tierra"];
const COLOR: Record<Astro, string> = { sol: "text-sol", tierra: "text-tierra" };
const S = 1000;

/**
 * Horizonte de una fila en un instante: la misma escena de la vista del cielo, en pequeño. El panorama abarca
 * los 360° con el sur en el centro, así que todas las filas comparten encuadre y lo único que cambia entre
 * ellas es dónde están el Sol y la Tierra (azimut y elevación de la API).
 */
function HorizonteMini({ filas, ms, semilla }: { filas: readonly FilaEfemeride[]; ms: number; semilla: string }) {
  const [refCaja, { ancho, alto }] = useDimensiones<HTMLDivElement>();
  const lienzo = useRef<HTMLCanvasElement>(null);
  const colores = useRef<Colores | null>(null);
  // El mismo paisaje que en la vista del cielo del sitio, aligerado: en una escena pequeña, las rocas y los
  // cráteres del primer plano (los más grandes) la llenarían.
  const paisaje = useMemo(() => {
    const completo = crearPaisaje(semillaDe(semilla));
    const lejos = <F extends { fondo: number }>(lista: F[]) => lista.filter((x, i) => x.fondo < COMPARAR.FONDO_MAX && i % COMPARAR.UNA_DE_CADA === 0);
    return { ...completo, rocas: lejos(completo.rocas), crateres: lejos(completo.crateres) };
  }, [semilla]);
  const yHorizonte = Math.round(alto * COMPARAR.HORIZONTE_FRACCION);
  useEffect(() => {
    const el = lienzo.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx || !ancho || !alto) return;
    const pendiente = requestAnimationFrame(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, ESCENA.DPR_MAX);
      if (el.width !== Math.round(ancho * dpr) || el.height !== Math.round(alto * dpr)) {
        el.width = Math.round(ancho * dpr);
        el.height = Math.round(alto * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      colores.current ??= leerColores(el);
      pintarEscena(ctx, {
        ancho, alto, yHorizonte, ppd: ancho / GRADOS_VUELTA, centro: COMPARAR.AZIMUT_CENTRO, incertidumbre: 0, realista: { paralaje: 0 },
        yDe: elevacionAY(escalaMixta(0), yHorizonte, yHorizonte - COMPARAR.MARGEN_PX, alto - yHorizonte - COMPARAR.MARGEN_PX),
      }, interpolarFila(filas, ms), paisaje, colores.current);
    });
    return () => cancelAnimationFrame(pendiente);
  }, [ancho, alto, yHorizonte, filas, ms, paisaje]);
  return (
    <div ref={refCaja} className="relative h-36 overflow-clip rounded-control md:h-44">
      <canvas ref={lienzo} aria-hidden="true" className="absolute inset-0 size-full" />
      {/* Cardinales bajo la línea: el encuadre es el mismo en todas las filas. */}
      {ancho > 0 && PANORAMA.CARDINALES.filter(({ deg }) => deg % GRADOS_VUELTA !== 0).map(({ deg, letra }) => (
        <span key={letra} aria-hidden="true" className="text-texto-2 absolute -translate-x-1/2 font-mono text-[0.75rem]"
          style={{ left: ancho / 2 + ((deg - COMPARAR.AZIMUT_CENTRO) * ancho) / GRADOS_VUELTA, top: yHorizonte + 6 }}>{letra}</span>
      ))}
    </div>
  );
}

function Lectura({ astro, posicion }: { astro: Astro; posicion: PosicionCielo }) {
  const el = astro === "sol" ? posicion.sol_el_deg : posicion.tierra_el_deg;
  const visible = sobreHorizonte(el);
  return (
    <p className="flex items-center gap-1.5 whitespace-nowrap">
      <GlifoAstro astro={astro} px={12} />
      <span className="sr-only">{NOMBRE_ASTRO[astro]}:</span>
      <span className={unir("text-dato-sm font-mono", visible ? COLOR[astro] : "text-texto-2")} data-dato>{grados(el, 1, true)}</span>
      {!visible && <span className="text-texto-3 text-[0.75rem]">{T.comparar.bajo}</span>}
    </p>
  );
}

/**
 * Los horizontes de las filas comparadas, uno junto a otro y en el mismo instante. Un único control de tiempo
 * (en la pantalla) los mueve a la vez: ver el Sol rasante en una fila y alto en otra, a la misma hora, es la
 * comparación. Al cambiar la selección, las tarjetas que siguen se recolocan y las nuevas aparecen en su sitio.
 */
export function HorizontesSincronizados({ filas, hora, recomendadas }: { filas: DatosFila[]; hora: number; recomendadas: ReadonlySet<string> }) {
  const t = T.comparar;
  const reducido = useMovimientoReducido();
  return (
    <ul className={unir("mt-3 grid gap-3", filas.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
      <AnimatePresence mode="popLayout" initial={false}>
        {filas.map((fila) => {
          if (!fila.metrica || !fila.efemerides) return null;
          const ms = aMs(fila.desde) + hora * MS_POR_HORA;
          const posicion = interpolarFila(fila.efemerides.filas, ms);
          const enlace = `${RUTAS.CIELO(fila.siteId)}?${new URLSearchParams({ [PARAM_URL.T]: aUtc(ms) })}`;
          return (
            <m.li key={fila.clave} layout={!reducido}
              initial={{ opacity: 0, scale: reducido ? 1 : 0.97 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: MOVIMIENTO.CORTA / S, ease: MOVIMIENTO.EASE_SALIDA } }}
              exit={{ opacity: 0, scale: reducido ? 1 : 0.97, transition: { duration: MOVIMIENTO.MICRO / S, ease: MOVIMIENTO.EASE_SALIDA } }}
              transition={{ layout: MOVIMIENTO.SPRING_SUAVE }}
              className={unir("panel min-w-0 p-3", recomendadas.has(fila.clave) && "outline-viable/50 outline-1")}>
              <figure className="m-0">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={enlace} aria-label={t.verCielo(fila.etiqueta)} className="text-texto decoration-horizonte line-clamp-1 font-semibold underline-offset-4 first-letter:uppercase hover:underline">
                      {fila.etiqueta}
                    </Link>
                    <p className="text-texto-3 truncate font-mono text-[0.75rem]" data-dato>{fila.detalle}</p>
                  </div>
                  <GlifoSemaforo nivel={fila.metrica.semaforo.global} className="shrink-0" />
                </div>
                <HorizonteMini filas={fila.efemerides.filas} ms={ms} semilla={fila.siteId} />
                <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <span className="sr-only">{t.horizonteDe(fila.etiqueta)}. {describirCielo(aUtc(ms), posicion)}</span>
                  <span className="flex gap-x-4">{ASTROS.map((astro) => <Lectura key={astro} astro={astro} posicion={posicion} />)}</span>
                  {recomendadas.has(fila.clave) && <span className="text-viable text-[0.75rem] font-semibold">{t.recomendada}</span>}
                </figcaption>
              </figure>
            </m.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
