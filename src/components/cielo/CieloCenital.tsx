import type { MotionValue } from "motion/react";
import { useId } from "react";
import { useValorMotion } from "../../hooks/useValorMotion";
import { CLAVE_AZIMUT, CLAVE_ELEVACION, sobreHorizonte } from "../../lib/astro";
import { ELEVACION_MAX_DEG, PANORAMA } from "../../lib/constants";
import { grados } from "../../lib/formato";
import { interpolarFila } from "../../lib/interpolar";
import { NOMBRE_ASTRO, T, describirCielo } from "../../lib/textos";
import type { Astro, FilaEfemeride, Utc } from "../../lib/tipos";
import { SolSvg, TierraSvg } from "../glifos/Astros";
import { useAnclaHorizonte } from "../layout/horizonteContexto";
import { useTransform } from "motion/react";

const L = 480;
const C = L / 2;
const R = 190; // radio del horizonte
const R_MAX = 228; // los astros ocultos se dibujan fuera del anillo, hasta aquí
const RAD = Math.PI / 180;
const ANILLOS = [30, 60];
const ASTROS: readonly Astro[] = ["tierra", "sol"];
const pct = (v: number) => `${(v / L) * 100}%`;

/** Distancia al cenit: lineal sobre el horizonte; bajo él, comprimida fuera del anillo. */
const radio = (el: number): number =>
  el >= 0 ? ((ELEVACION_MAX_DEG - el) / ELEVACION_MAX_DEG) * R : R + Math.min(1, -el / ELEVACION_MAX_DEG) * (R_MAX - R);

/** Vista alternativa clásica: cenit en el centro, horizonte en el borde (aquí, el anillo del horizonte continuo). */
export default function CieloCenital({ filas, t, tUtc, idTitulo }: { filas: readonly FilaEfemeride[]; t: MotionValue<number>; tUtc: Utc; idTitulo: string }) {
  const id = useId();
  const lectura = useValorMotion(useTransform(t, (ms) => interpolarFila(filas, ms)));
  const ancla = useAnclaHorizonte("anillo");
  return (
    <figure className="relative m-0 mx-auto aspect-square w-full max-w-[480px]">
      <svg role="img" aria-labelledby={idTitulo} aria-describedby={`${id}-desc`} viewBox={`0 0 ${L} ${L}`} className="size-full overflow-visible">
        <g aria-hidden="true">
          {ANILLOS.map((el) => (
            <g key={el}>
              <circle cx={C} cy={C} r={radio(el)} className="stroke-linea fill-none" strokeDasharray="1 5" />
              <text x={C + 4} y={C - radio(el) - 4} className="fill-texto-3 font-mono text-[12px]">{grados(el, 0, true)}</text>
            </g>
          ))}
          <path d={`M${C - 5} ${C}H${C + 5}M${C} ${C - 5}V${C + 5}`} className="stroke-horizonte" />
          <text x={C + 8} y={C + 16} className="fill-texto-3 font-mono text-[12px]">{T.cielo.cenit}</text>
          {PANORAMA.CARDINALES.map(({ deg, letra }) => (
            <text key={letra} x={C + (R_MAX + 14) * Math.sin(deg * RAD)} y={C - (R_MAX + 14) * Math.cos(deg * RAD) + 4} textAnchor="middle"
              className="fill-texto-2 font-mono text-[13px]">{letra}</text>
          ))}
        </g>
        {ASTROS.map((astro) => {
          const el = lectura[CLAVE_ELEVACION[astro]];
          const az = lectura[CLAVE_AZIMUT[astro]] * RAD;
          const r = radio(el);
          const oculto = !sobreHorizonte(el);
          return (
            <g key={astro} transform={`translate(${C + r * Math.sin(az)} ${C - r * Math.cos(az)})`}>
              {astro === "sol" ? <SolSvg r={PANORAMA.RADIO_SOL} fantasma={oculto} /> : <TierraSvg r={PANORAMA.RADIO_TIERRA} fantasma={oculto} />}
              <text y={-13} textAnchor="middle" aria-hidden="true" className={`font-mono text-[12px] ${oculto ? "fill-texto-2" : astro === "sol" ? "fill-sol" : "fill-tierra"}`}>
                {NOMBRE_ASTRO[astro]} {grados(el, 1, true)}
              </text>
            </g>
          );
        })}
      </svg>
      <div ref={ancla} aria-hidden="true" className="pointer-events-none absolute"
        style={{ left: pct(C - R), top: pct(C - R), width: pct(2 * R), height: pct(2 * R) }} />
      <figcaption id={`${id}-desc`} className="sr-only">{T.cielo.cenitalDescripcion} {describirCielo(tUtc, lectura)}</figcaption>
    </figure>
  );
}
