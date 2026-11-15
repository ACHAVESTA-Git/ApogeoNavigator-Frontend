import { m } from "motion/react";
import { Link } from "react-router";
import { useCifraAnimada } from "../../hooks/useCifraAnimada";
import type { DatosFila } from "../../hooks/useFilasComparacion";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { esSensibleAlRelieve } from "../../lib/astro";
import { MOVIMIENTO, MS_POR_HORA, PARAM_URL, RUTAS } from "../../lib/constants";
import { aMs } from "../../lib/fechas";
import { grados, pct } from "../../lib/formato";
import { interpolarFila } from "../../lib/interpolar";
import { NOMBRE_ASTRO, T } from "../../lib/textos";
import type { Astro, NivelSemaforo } from "../../lib/tipos";
import { GlifoAstro } from "../glifos/Astros";
import { GlifoSemaforo } from "../glifos/GlifoSemaforo";
import { BandaLuz } from "../ventanas/BandaLuz";

function Cifra({ astro, valor, nivel, nota }: { astro: Astro; valor: number; nivel: NivelSemaforo; nota?: boolean }) {
  const ref = useCifraAnimada<HTMLSpanElement>(valor, pct);
  return (
    <p className="flex items-center gap-2 whitespace-nowrap">
      <GlifoAstro astro={astro} px={12} />
      <span className="sr-only">{NOMBRE_ASTRO[astro]}:</span>
      <span ref={ref} className="text-dato text-texto min-w-[5.5ch] font-mono" data-dato>{pct(valor)}</span>
      <GlifoSemaforo nivel={nivel} conTexto={false} nota={nota} />
    </p>
  );
}

/** Un horizonte de la comparación: rótulo, bandas de Sol (arriba) y Tierra (abajo) y las dos cifras con semáforo. */
export function FilaHorizonte({ fila, indice, horaCursor }: { fila: DatosFila; indice: number; horaCursor: number | null }) {
  const reducido = useMovimientoReducido();
  const { metrica: metr, efemerides } = fila;
  if (!metr || !efemerides) return null;
  const cursorMs = horaCursor === null ? null : aMs(fila.desde) + horaCursor * MS_POR_HORA;
  const lectura = cursorMs === null ? null : interpolarFila(efemerides.filas, cursorMs);
  const enlace = `${RUTAS.VENTANAS(fila.siteId)}?${new URLSearchParams({ [PARAM_URL.DESDE]: fila.desde, [PARAM_URL.HASTA]: fila.hasta })}`;
  return (
    <m.li
      // Los horizontes se separan uno tras otro (stagger de 60 ms): mismo eje, varios destinos.
      initial={reducido ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOVIMIENTO.MEDIA / 1000, delay: (indice * MOVIMIENTO.STAGGER) / 1000, ease: MOVIMIENTO.EASE_SALIDA }}
      className="grid grid-cols-[1fr_auto] items-center gap-x-5 gap-y-1 py-3 md:grid-cols-[13rem_1fr_auto]"
    >
      <div className="min-w-0">
        <Link to={enlace} aria-label={T.comparar.verSitio(fila.etiqueta)} className="text-texto decoration-horizonte line-clamp-2 block font-semibold underline-offset-4 hover:underline first-letter:uppercase">
          {fila.etiqueta}
        </Link>
        <p className="text-dato-sm text-texto-2 truncate font-mono" data-dato>{fila.detalle}</p>
        <p className="text-texto-3 min-h-[1.3em] font-mono text-[0.75rem]" data-dato>
          {lectura && <><span className="text-sol">{grados(lectura.sol_el_deg, 1, true)}</span> · <span className="text-tierra">{grados(lectura.tierra_el_deg, 1, true)}</span></>}
        </p>
      </div>
      <div className="max-md:order-last max-md:col-span-2 min-w-0">
        <BandaLuz filas={efemerides.filas} desde={fila.desde} hasta={fila.hasta} tamano="compacta" copia={indice}
          rayado={esSensibleAlRelieve(metr)} cursorMs={cursorMs} conEjes={false} />
      </div>
      <div className="space-y-1">
        <Cifra astro="sol" valor={metr.pct_sol} nivel={metr.semaforo.energia} nota={esSensibleAlRelieve(metr)} />
        <Cifra astro="tierra" valor={metr.pct_tierra} nivel={metr.semaforo.comunicacion} />
      </div>
    </m.li>
  );
}
