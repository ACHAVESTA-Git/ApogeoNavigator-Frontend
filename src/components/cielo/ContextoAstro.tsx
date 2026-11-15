import { AnimatePresence, m, useTransform, type MotionValue } from "motion/react";
import { useId, type MouseEvent } from "react";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { sobreHorizonte } from "../../lib/astro";
import { MOVIMIENTO, PANORAMA } from "../../lib/constants";
import { fechaHora, limitar } from "../../lib/fechas";
import { grados } from "../../lib/formato";
import { NOMBRE_ASTRO, T, faltanPara } from "../../lib/textos";
import type { Astro, EventosAstro, Utc } from "../../lib/tipos";
import { GlifoAstro } from "../glifos/Astros";
import { unir } from "../ui/clases";

const PUNTERO_FINO = "(hover: hover) and (pointer: fine)";
const S = 1000;

/**
 * Datos en contexto de un astro, sobre la propia escena: elevación, azimut, hora UTC y cuánto falta para que
 * cruce el horizonte. Se abre al pasar el ratón (solo con puntero fino), al pulsar (táctil) y con el foco del
 * teclado; Escape la cierra. Mientras está abierta sustituye a la etiqueta corta del astro: no se tapan.
 */
export function ContextoAstro({ astro, xPantalla, yGlifo, ancho, alto, radio, az, el, utc, evento, abierto, alAbrir, alCerrar }: {
  astro: Astro; xPantalla: MotionValue<number>; yGlifo: MotionValue<number>; ancho: number; alto: number; radio: number;
  az: number; el: number; utc: Utc; evento?: EventosAstro | null; abierto: boolean; alAbrir: () => void; alCerrar: () => void;
}) {
  const id = useId();
  const reducido = useMovimientoReducido();
  const { ANCHO_PX, ALTO_PX, SEPARACION_PX, BLANCO_PX, MARGEN_PX } = PANORAMA.CONTEXTO;
  const fuera = () => xPantalla.get() > ancho + radio;
  const blanco = Math.max(BLANCO_PX, 2 * radio); // nunca menor que el objetivo táctil mínimo
  const xBlanco = useTransform(() => xPantalla.get() - blanco / 2);
  const yBlanco = useTransform(() => yGlifo.get() - blanco / 2);
  const visibility = useTransform(() => (fuera() ? "hidden" : "visible"));
  const xTarjeta = useTransform(() => limitar(xPantalla.get() - ANCHO_PX / 2, MARGEN_PX, Math.max(MARGEN_PX, ancho - ANCHO_PX - MARGEN_PX)));
  // Arriba del astro si cabe y no cae bajo los botones de la esquina; si no, debajo.
  const arriba = () => {
    const tope = yGlifo.get() - radio - SEPARACION_PX - ALTO_PX;
    const enBotones = tope < PANORAMA.ZONA_SUPERIOR.ALTO_PX && xTarjeta.get() + ANCHO_PX > ancho - PANORAMA.ZONA_SUPERIOR.ANCHO_PX;
    if (enBotones) return false;
    // Si no cabe entera en ningún lado (escena baja en móvil), va donde haya más sitio.
    return tope >= MARGEN_PX || yGlifo.get() > alto / 2;
  };
  const yTarjeta = useTransform(() => (arriba() ? Math.max(yGlifo.get() - radio - SEPARACION_PX, ALTO_PX + MARGEN_PX) : Math.min(yGlifo.get() + radio + SEPARACION_PX, alto - ALTO_PX - MARGEN_PX)));
  const yInterior = useTransform(() => (arriba() ? "-100%" : "0%"));
  const visible = sobreHorizonte(el);
  const t = T.cielo.contexto;

  const alPulsar = (e: MouseEvent) => {
    // El ratón ya la abrió al entrar; con el dedo o el teclado, pulsar alterna.
    const tipo = (e.nativeEvent as PointerEvent).pointerType;
    if (tipo === "mouse" || !abierto) alAbrir();
    else alCerrar();
  };
  return (
    <>
      <m.button type="button" style={{ x: xBlanco, y: yBlanco, visibility, width: blanco, height: blanco }}
        aria-label={t.abrir(NOMBRE_ASTRO[astro])} aria-expanded={abierto} aria-describedby={abierto ? id : undefined}
        onPointerEnter={(e) => e.pointerType === "mouse" && window.matchMedia(PUNTERO_FINO).matches && alAbrir()}
        onPointerLeave={(e) => e.pointerType === "mouse" && alCerrar()}
        onFocus={(e) => e.currentTarget.matches(":focus-visible") && alAbrir()}
        onBlur={alCerrar}
        onClick={alPulsar}
        onKeyDown={(e) => {
          if (e.key !== "Escape" || !abierto) return;
          e.stopPropagation();
          alCerrar();
        }}
        className="absolute top-0 left-0 cursor-help rounded-full" />
      <AnimatePresence>
        {abierto && (
          <m.div key="tarjeta" style={{ x: xTarjeta, y: yTarjeta, width: ANCHO_PX }} className="pointer-events-none absolute top-0 left-0 z-10"
            initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: MOVIMIENTO.MICRO / S, ease: MOVIMIENTO.EASE_SALIDA } }}
            exit={{ opacity: 0, transition: { duration: reducido ? 0 : MOVIMIENTO.MICRO / S / 1.5, ease: MOVIMIENTO.EASE_SALIDA } }}>
            <m.div id={id} role="tooltip" style={{ y: yInterior }} data-dato
              className="bg-elevada shadow-flotante rounded-control border border-texto/10 px-3.5 py-3 font-mono">
              <p className="rotulo flex items-center gap-2 font-sans">
                <GlifoAstro astro={astro} px={12} fantasma={!visible} />
                {NOMBRE_ASTRO[astro]}
                <span className={unir("ml-auto whitespace-nowrap normal-case tracking-normal", visible ? (astro === "sol" ? "text-sol" : "text-tierra") : "text-texto-2")}>{visible ? t.arriba : t.abajo}</span>
              </p>
              <dl className="text-dato-sm mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <dt className="text-texto-2 font-sans">{t.elevacion}</dt>
                <dd className="text-texto text-right">{grados(el, 2, true)}</dd>
                <dt className="text-texto-2 font-sans">{t.azimut}</dt>
                <dd className="text-texto text-right">{grados(az, 1)}</dd>
                <dt className="text-texto-2 font-sans">{T.utc}</dt>
                <dd className="text-texto text-right"><time dateTime={utc}>{fechaHora(utc)}</time></dd>
              </dl>
              <p className="text-dato-sm text-texto capilar-t mt-2 pt-2 font-sans">{evento ? faltanPara(astro, evento) : t.sinEvento}</p>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
