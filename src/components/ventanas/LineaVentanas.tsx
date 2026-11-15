import { useMemo, type CSSProperties } from "react";
import { Link } from "react-router";
import { ENTRADA_LUJO, LINEA_VENTANAS, PARAM_URL, RUTAS } from "../../lib/constants";
import { aMs, aUtc, diaCorto, fechaHora } from "../../lib/fechas";
import { horas } from "../../lib/formato";
import { ventanasConjuntas, ventanasDe, type VentanaConjunta } from "../../lib/indicadores";
import { T, periodoLegible } from "../../lib/textos";
import type { FilaEfemeride, Utc } from "../../lib/tipos";
import { GlifoAstro } from "../glifos/Astros";
import { unir } from "../ui/clases";

type Fila = "ambos" | "sol" | "tierra";
// Una sola luz: solo la fila «Sol + Tierra» (la ventana para operar) brilla; las otras dos son su contexto, apagadas.
const BANDA: Record<Fila, string> = {
  ambos: "bg-sol h-2.5 shadow-[0_0_14px_2px_rgb(from_var(--color-sol)_r_g_b/0.55)]",
  sol: "bg-sol h-1.5",
  tierra: "bg-tierra h-1.5",
};

/**
 * Las ventanas del periodo como bandas sobre una línea de tiempo: Sol + Tierra a la vez (la que brilla), Sol y Tierra.
 * Cada banda es un enlace: clic o Enter llevan a la vista del cielo en el primer instante de esa ventana.
 * Las ventanas se calculan en `lib/indicadores` con la serie que ya llegó (elevación > 0° sobre el horizonte ideal).
 */
export function LineaVentanas({ filas, desde, hasta, siteId, className }: {
  filas: readonly FilaEfemeride[]; desde: Utc; hasta: Utc; siteId: string; className?: string;
}) {
  const t = T.lineaVentanas;
  const [a, b] = [aMs(desde), aMs(hasta)];
  const grupos = useMemo<[Fila, VentanaConjunta[]][]>(() => [
    ["ambos", ventanasConjuntas(filas, desde, hasta)],
    ["sol", ventanasDe(filas, "sol", desde, hasta)],
    ["tierra", ventanasDe(filas, "tierra", desde, hasta)],
  ], [filas, desde, hasta]);
  const enlace = (ms: number) => `${RUTAS.CIELO(siteId)}?${new URLSearchParams({ [PARAM_URL.DESDE]: desde, [PARAM_URL.HASTA]: hasta, [PARAM_URL.T]: aUtc(ms) })}`;
  let orden = 0;
  return (
    <section aria-label={t.grupo(periodoLegible(desde, hasta))} className={className}>
      <h2 className="rotulo">{t.titulo}</h2>
      <div className="mt-2 grid grid-cols-[7.25rem_minmax(0,1fr)] items-center gap-x-3">
        {grupos.map(([fila, ventanas]) => (
          <div key={fila} className="col-span-2 grid grid-cols-subgrid items-center">
            <p className={unir("text-apoyo flex items-center gap-1.5", fila === "ambos" ? "text-texto font-semibold" : "text-texto-2")}>
              {fila !== "tierra" && <GlifoAstro astro="sol" px={12} />}
              {fila !== "sol" && <GlifoAstro astro="tierra" px={12} />}
              <span className="whitespace-nowrap">{t.filas[fila]}</span>
            </p>
            <div className="relative h-11">
              <span aria-hidden="true" className="bg-texto/10 absolute inset-x-0 top-1/2 h-px" />
              {ventanas.length === 0 && <p className="text-texto-2 absolute inset-y-0 left-0 flex items-center text-[0.75rem]"><span className="bg-vacio pr-2">{t.ninguna}</span></p>}
              {ventanas.map((v) => {
                const retraso = Math.min(orden++, ENTRADA_LUJO.MAX_ESCALONADAS) * ENTRADA_LUJO.PASO_MS;
                return (
                  <Link key={v.inicioMs} to={enlace(v.inicioMs)} data-ventana={fila}
                    aria-label={t.ventana(t.detalle[fila], fechaHora(aUtc(v.inicioMs)), horas(v.horas), v.cortada)}
                    title={`${fechaHora(aUtc(v.inicioMs))} UTC · ${v.cortada ? "≥ " : ""}${horas(v.horas)}`}
                    className="entrada-lujo absolute inset-y-0 rounded-xs"
                    style={{ left: `${((v.inicioMs - a) / (b - a)) * 100}%`, width: `${((v.finMs - v.inicioMs) / (b - a)) * 100}%`, minWidth: LINEA_VENTANAS.MIN_ANCHO_PX, "--retraso": `${retraso}ms` } as CSSProperties}>
                    <span aria-hidden="true" data-tenue={fila !== "ambos" || undefined} className={unir("banda-ventana absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full", BANDA[fila])} />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        <div aria-hidden="true" className="text-texto-2 col-start-2 flex justify-between font-mono text-[0.75rem]" data-dato>
          <span>{diaCorto(desde)}</span><span>{diaCorto(hasta)}</span>
        </div>
      </div>
      <p className="text-texto-2 mt-2 text-[0.75rem]">{t.ayuda}</p>
    </section>
  );
}
