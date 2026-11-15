import { m, useTransform, type MotionValue } from "motion/react";
import { MINI_HORIZONTE } from "../../lib/constants";
import { interpolarFila } from "../../lib/interpolar";
import { T } from "../../lib/textos";
import type { Astro, FilaEfemeride } from "../../lib/tipos";
import { posicionMiniHorizonte } from "../../lib/vivo";
import { unir } from "../ui/clases";

const PUNTO: Record<Astro, string> = {
  sol: "bg-sol size-2.5 shadow-[0_0_10px_2px_rgb(from_var(--color-sol)_r_g_b/0.6)]",
  tierra: "bg-tierra size-2",
};
const pct = (fraccion: number) => `${(fraccion * 100).toFixed(2)}%`;

/** Un astro: una capa del tamaño de la caja que se traslada en % de sí misma (solo `transform` y `opacity`). */
function Astro({ astro, filas, t }: { astro: Astro; filas: readonly FilaEfemeride[]; t: MotionValue<number> }) {
  const p = useTransform(t, (ms) => {
    const fila = interpolarFila(filas, ms);
    return posicionMiniHorizonte(fila[`${astro}_az_deg`], fila[`${astro}_el_deg`]);
  });
  const x = useTransform(p, (v) => pct(v.x));
  const y = useTransform(p, (v) => pct(v.y));
  const opacity = useTransform(p, (v) => (v.visible ? 1 : 0.4));
  return (
    <m.span className="absolute inset-0" style={{ x, y, opacity }}>
      <span className={unir("absolute top-0 left-0 block -translate-x-1/2 -translate-y-1/2 rounded-full", PUNTO[astro])} />
    </m.span>
  );
}

/**
 * Mini horizonte de una tarjeta: dónde están el Sol y la Tierra en el instante `t` (ms) del reloj del catálogo.
 * El ancho es el azimut (norte a la izquierda), el alto la elevación en escala de lupa y la línea es el horizonte
 * ideal. Lee la efeméride real interpolada; sin serie dibuja solo el horizonte, con el mismo alto.
 */
export function MiniHorizonte({ filas, t, className }: { filas: readonly FilaEfemeride[] | undefined; t: MotionValue<number>; className?: string }) {
  return (
    <div role="img" aria-label={T.sitios.miniHorizonte} className={unir("bg-vacio rounded-control relative overflow-hidden", className)}
      style={{ height: MINI_HORIZONTE.ALTO_PX }} data-mini-horizonte={filas ? "vivo" : "sin-serie"}>
      <span className="bg-texto/6 absolute inset-x-0 bottom-0" style={{ top: pct(MINI_HORIZONTE.HORIZONTE) }} />
      <span className="bg-texto/25 absolute inset-x-0 h-px" style={{ top: pct(MINI_HORIZONTE.HORIZONTE) }} />
      {filas && (
        <>
          <Astro astro="tierra" filas={filas} t={t} />
          <Astro astro="sol" filas={filas} t={t} />
        </>
      )}
    </div>
  );
}
