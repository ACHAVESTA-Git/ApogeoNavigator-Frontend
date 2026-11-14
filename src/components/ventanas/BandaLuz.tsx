import { useEffect, useMemo, useRef, useState } from "react";
import { mediasNoches, pasoHoras, siluetasVisibles, type PuntoSilueta } from "../../lib/astro";
import { BANDA, MS_POR_HORA } from "../../lib/constants";
import { lupa } from "../../lib/escalas";
import { aMs, aUtc, diaCorto, diaDelMes } from "../../lib/fechas";
import { SIN_LINEA_DIRECTA, T } from "../../lib/textos";
import type { Astro, FilaEfemeride, Utc } from "../../lib/tipos";
import { useAnclaHorizonte } from "../layout/horizonteContexto";
import { unir } from "../ui/clases";

const ANCHO = 1000; // unidades del viewBox (se estira al ancho real)
const RELLENO: Record<Astro, string> = { sol: "fill-sol", tierra: "fill-tierra" };

/** true la primera vez que el elemento entra en pantalla (dispara el revelado una sola vez). */
function useVisto<E extends Element>() {
  const ref = useRef<E>(null);
  const [visto, setVisto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visto) return;
    const observador = new IntersectionObserver(([e]) => e.isIntersecting && setVisto(true), { threshold: 0.2 });
    observador.observe(el);
    return () => observador.disconnect();
  }, [visto]);
  return { ref, visto };
}

/** Altura en px de una elevación dentro de la banda (lupa), con un mínimo para que un Sol rasante se vea. */
const altura = (elevacion: number, alto: number): number => Math.max(BANDA.MIN_ALTO_PX, lupa(elevacion) * alto);

/** Un polígono por tramo continuo: su silueta es la elevación hora a hora en escala de lupa. */
function Siluetas({ siluetas, astro, alto, x, pasoMs, haciaAbajo }: {
  siluetas: PuntoSilueta[][]; astro: Astro; alto: number; x: (ms: number) => number; pasoMs: number; haciaAbajo: boolean;
}) {
  const base = haciaAbajo ? 0 : alto;
  const y = (elevacion: number) => (haciaAbajo ? altura(elevacion, alto) : alto - altura(elevacion, alto));
  return (
    <svg viewBox={`0 0 ${ANCHO} ${alto}`} preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
      {siluetas.map((tramo) => {
        const fin = Math.max(x(tramo[tramo.length - 1].ms + pasoMs), x(tramo[0].ms) + BANDA.MIN_ANCHO);
        const perfil = tramo.map((p) => `L${x(p.ms).toFixed(1)} ${y(p.elevacion).toFixed(1)}`).join("");
        return (
          <path key={tramo[0].ms} className={RELLENO[astro]} opacity={0.85}
            d={`M${x(tramo[0].ms).toFixed(1)} ${base}${perfil}L${fin.toFixed(1)} ${y(tramo[tramo.length - 1].elevacion).toFixed(1)}L${fin.toFixed(1)} ${base}Z`} />
        );
      })}
    </svg>
  );
}

/**
 * Bandas de luz de un periodo sobre un mismo horizonte: arriba, las horas con Sol (energía); debajo, las horas
 * con la Tierra visible (comunicación). El horizonte es la base común y lo dibuja el horizonte continuo.
 */
export function BandaLuz({ filas, desde, hasta, tamano = "grande", copia = 0, rayado = false, cursorMs, conEjes = true, className }: {
  filas: readonly FilaEfemeride[]; desde: Utc; hasta: Utc; tamano?: keyof typeof BANDA.ALTO_PX; copia?: number;
  /** Datos sensibles al relieve: la banda de Sol se marca con rayado. */
  rayado?: boolean; cursorMs?: number | null; conEjes?: boolean; className?: string;
}) {
  const alto = BANDA.ALTO_PX[tamano];
  const [a, b] = [aMs(desde), aMs(hasta)];
  const x = (ms: number) => ((ms - a) / (b - a)) * ANCHO;
  const { sol, tierra } = useMemo(
    () => ({ sol: siluetasVisibles(filas, "sol", desde, hasta), tierra: siluetasVisibles(filas, "tierra", desde, hasta) }),
    [filas, desde, hasta],
  );
  const pasoMs = pasoHoras(filas) * MS_POR_HORA;
  // El rayado cubre solo la franja iluminada (hasta la mayor altura del Sol), no toda la banda.
  const altoRayado = rayado ? altura(Math.max(0, ...sol.flat().map((p) => p.elevacion)), alto) : 0;
  const dias = useMemo(() => mediasNoches(a, b), [a, b]);
  const ancla = useAnclaHorizonte("linea", copia);
  const { ref, visto } = useVisto<HTMLDivElement>();
  const grande = tamano !== "compacta";

  return (
    <div ref={ref} className={unir("relative", className)}>
      <div className="relative" style={{ height: alto }}>
        <div className="revelar-izq absolute inset-0" data-visto={visto}>
          <Siluetas siluetas={sol} astro="sol" alto={alto} x={x} pasoMs={pasoMs} haciaAbajo={false} />
          {rayado && <div aria-hidden="true" className="rayado-artefacto absolute inset-x-0 bottom-0" style={{ height: altoRayado + 14 }} />}
        </div>
        {sol.length === 0 && grande && <p className="text-apoyo text-texto-2 absolute bottom-2 left-0">{T.ventanas.sinSol}</p>}
      </div>
      <div ref={ancla} aria-hidden="true" className="h-px w-full" />
      <div className="bg-regolito relative" style={{ height: alto }}>
        <div className="revelar-izq absolute inset-0" data-visto={visto}>
          <Siluetas siluetas={tierra} astro="tierra" alto={alto} x={x} pasoMs={pasoMs} haciaAbajo />
        </div>
        {tierra.length === 0 && grande && <p className="text-apoyo text-texto-2 absolute top-2 left-2 max-w-[40ch]">{SIN_LINEA_DIRECTA}</p>}
      </div>
      {cursorMs != null && cursorMs >= a && cursorMs <= b && (
        <div aria-hidden="true" className="bg-texto pointer-events-none absolute inset-y-0 w-px" style={{ left: `${(x(cursorMs) / ANCHO) * 100}%` }} />
      )}
      {conEjes && (
        <div aria-hidden="true" className="relative h-6">
          {dias.map((ms, i) => (
            <span key={ms} className="absolute top-0" style={{ left: `${(x(ms) / ANCHO) * 100}%` }}>
              <span className={unir("block w-px", i % BANDA.DIAS_ETIQUETA === 0 ? "bg-texto-2 h-2" : "bg-linea h-1")} />
              {i % BANDA.DIAS_ETIQUETA === 0 && x(ms) < ANCHO * 0.96 && (
                <span className="text-texto-3 absolute top-2.5 left-0 font-mono text-[0.75rem] whitespace-nowrap" data-dato>
                  {i === 0 || diaDelMes(aUtc(ms)) <= BANDA.DIAS_ETIQUETA ? diaCorto(aUtc(ms)) : diaDelMes(aUtc(ms))}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
