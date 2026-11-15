import { area, curveMonotoneX, line } from "d3-shape";
import { m, useTransform } from "motion/react";
import { useMemo, type KeyboardEvent, type PointerEvent } from "react";
import { useDimensiones } from "../../hooks/useDimensiones";
import { useDesde } from "../../hooks/useMedia";
import type { RelojSimulacion } from "../../hooks/useRelojSimulacion";
import { CLAVE_ELEVACION, eventosCruce, mediasNoches, tramosVisibles, type EventoCruce } from "../../lib/astro";
import { BANDA, DIA_LUNAR, HORAS_POR_DIA, MS_POR_HORA, PANORAMA } from "../../lib/constants";
import { elevacionAY, escalaLineal, lupa } from "../../lib/escalas";
import { aMs, aUtc, diaCorto, diaDelMes, fechaHora, limitar } from "../../lib/fechas";
import { grados } from "../../lib/formato";
import { ARTICULO_ASTRO, T } from "../../lib/textos";
import type { Astro, FilaEfemeride } from "../../lib/tipos";
import { useAnclaHorizonte } from "../layout/horizonteContexto";

const ASTROS: readonly Astro[] = ["tierra", "sol"];
const TRAZO: Record<Astro, string> = { sol: "stroke-sol", tierra: "stroke-tierra" };
const RELLENO: Record<Astro, string> = { sol: "fill-sol-tenue", tierra: "fill-tierra-tenue" };
const MARCAS = [60, 10, 2, -5, -30];

/**
 * El mes en un gesto: curvas de elevación del Sol y de la Tierra (escala de lupa) sobre el horizonte, que hace
 * de eje del tiempo. Muescas ▲/▼ en cada salida y puesta, noche solar sombreada y cursor ligado al reloj.
 * Arrastrar o pulsar mueve el instante; con el foco, las flechas también.
 */
export function GraficoDiaLunar({ filas, reloj, alPulsarTecla, etiqueta }: {
  filas: readonly FilaEfemeride[]; reloj: RelojSimulacion; alPulsarTecla: (e: KeyboardEvent) => void; etiqueta: string;
}) {
  const [refCaja, { ancho: anchoCaja }] = useDimensiones<HTMLDivElement>();
  const esTableta = useDesde("md");
  const alto = DIA_LUNAR.ALTO_PX[esTableta ? "escritorio" : "movil"];
  const dias = (reloj.hastaMs - reloj.desdeMs) / (HORAS_POR_DIA * MS_POR_HORA);
  // En móvil el gráfico se desplaza dentro de su contenedor (24 px por día), nunca la página.
  const ancho = Math.max(anchoCaja, esTableta ? 0 : dias * DIA_LUNAR.PX_POR_DIA_MOVIL + DIA_LUNAR.MARGEN_IZQ);
  const yH = Math.round(alto * 0.6);
  const x = useMemo(() => escalaLineal(reloj.desdeMs, reloj.hastaMs, DIA_LUNAR.MARGEN_IZQ, ancho - 8), [reloj.desdeMs, reloj.hastaMs, ancho]);
  const y = useMemo(() => elevacionAY(lupa, yH, yH - DIA_LUNAR.MARGEN_SUP, alto - yH - DIA_LUNAR.MARGEN_INF), [yH, alto]);

  const trazos = useMemo(() => ASTROS.map((astro) => {
    const clave = CLAVE_ELEVACION[astro];
    const px = (f: FilaEfemeride) => x(aMs(f.utc));
    return {
      astro,
      linea: line<FilaEfemeride>().x(px).y((f) => y(f[clave])).curve(curveMonotoneX)([...filas]) ?? "",
      // el relleno solo existe por encima del horizonte: elevaciones negativas se recortan a 0
      area: area<FilaEfemeride>().x(px).y0(yH).y1((f) => y(Math.max(0, f[clave]))).curve(curveMonotoneX)([...filas]) ?? "",
      eventos: eventosCruce(filas, astro),
    };
  }), [filas, x, y, yH]);
  const noches = useMemo(() => {
    const [desde, hasta] = [aUtc(reloj.desdeMs), aUtc(reloj.hastaMs + MS_POR_HORA)];
    const dia = tramosVisibles(filas, "sol", desde, hasta);
    const cortes = [reloj.desdeMs, ...dia.flatMap((t) => [t.inicioMs, Math.min(t.finMs, reloj.hastaMs)]), reloj.hastaMs];
    return Array.from({ length: cortes.length / 2 }, (_, i) => [cortes[2 * i], cortes[2 * i + 1]] as const).filter(([a, b]) => b > a);
  }, [filas, reloj.desdeMs, reloj.hastaMs]);
  const medias = useMemo(() => mediasNoches(reloj.desdeMs, reloj.hastaMs), [reloj.desdeMs, reloj.hastaMs]);
  const xCursor = useTransform(reloj.t, (ms) => x(ms));
  const ancla = useAnclaHorizonte("linea");

  const msDe = (e: PointerEvent<SVGSVGElement>) => {
    const caja = e.currentTarget.getBoundingClientRect();
    return limitar(reloj.desdeMs + ((e.clientX - caja.left - DIA_LUNAR.MARGEN_IZQ) / (ancho - 8 - DIA_LUNAR.MARGEN_IZQ)) * (reloj.hastaMs - reloj.desdeMs), reloj.desdeMs, reloj.hastaMs);
  };
  const fila = filas[reloj.indice];
  const muesca = (e: EventoCruce) => {
    const [cx, sube] = [x(aMs(e.utc)), e.tipo === "salida"];
    return (
      <g key={`${e.astro}${e.utc}`} className="group" tabIndex={0} role="img" aria-label={T.diaLunar.evento(ARTICULO_ASTRO[e.astro], e.tipo, fechaHora(e.utc))}>
        <path d={sube ? `M${cx - 5} ${yH + 9}L${cx} ${yH + 1}L${cx + 5} ${yH + 9}Z` : `M${cx - 5} ${yH - 9}L${cx} ${yH - 1}L${cx + 5} ${yH - 9}Z`}
          className={e.astro === "sol" ? "fill-sol" : "fill-tierra"} />
        <circle cx={cx} cy={yH} r={14} className="fill-transparent" />
        <text x={limitar(cx, 90, ancho - 90)} y={sube ? yH + 26 : yH - 16} textAnchor="middle"
          className="fill-texto font-mono text-[12px] opacity-0 transition-opacity duration-(--dur-corta) group-hover:opacity-100 group-focus:opacity-100">
          {sube ? "▲" : "▼"} {fechaHora(e.utc)}
        </text>
      </g>
    );
  };

  return (
    <div ref={refCaja} className="panel relative overflow-x-auto overscroll-x-contain">
      <div className="relative" style={{ width: ancho, height: alto }}>
        {anchoCaja > 0 && (
          <svg width={ancho} height={alto} tabIndex={0} role="group" aria-roledescription={T.diaLunar.rol} aria-label={etiqueta}
            aria-keyshortcuts={T.cielo.teclas} onKeyDown={alPulsarTecla}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); reloj.arrastrarA(msDe(e)); }}
            onPointerMove={(e) => e.buttons === 1 && reloj.arrastrarA(msDe(e))}
            onPointerUp={(e) => reloj.irA(msDe(e))}
            className="block cursor-ew-resize touch-pan-y select-none">
            {/* noche solar */}
            {noches.map(([a, b]) => <rect key={a} x={x(a)} width={x(b) - x(a)} y={0} height={alto} className="fill-vacio" opacity={0.55} />)}
            <g aria-hidden="true">
              {MARCAS.map((e) => (
                <g key={e} transform={`translate(0 ${y(e)})`}>
                  <line x1={DIA_LUNAR.MARGEN_IZQ} x2={ancho} className="stroke-linea" strokeDasharray="1 6" />
                  <text x={6} y={4} className="fill-texto-3 font-mono text-[12px]">{grados(e, 0, true)}</text>
                </g>
              ))}
              {medias.map((ms, i) => (
                <g key={ms}>
                  <line x1={x(ms)} x2={x(ms)} y1={yH} y2={yH + (i % BANDA.DIAS_ETIQUETA === 0 ? 8 : 4)} className="stroke-horizonte" />
                  {i % BANDA.DIAS_ETIQUETA === 0 && x(ms) < ancho - 40 && (
                    <text x={x(ms) + 3} y={alto - 8} className="fill-texto-3 font-mono text-[12px]">
                      {i === 0 || diaDelMes(aUtc(ms)) <= BANDA.DIAS_ETIQUETA ? diaCorto(aUtc(ms)) : diaDelMes(aUtc(ms))}
                    </text>
                  )}
                </g>
              ))}
            </g>
            {trazos.map((t) => (
              <g key={t.astro} aria-hidden="true">
                <path d={t.area} className={RELLENO[t.astro]} />
                {/* la curva se traza una vez al aparecer (escena de 600 ms) */}
                <m.path d={t.linea} className={`fill-none ${TRAZO[t.astro]}`} strokeWidth={2} strokeLinejoin="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }} />
              </g>
            ))}
            {trazos.flatMap((t) => t.eventos.map(muesca))}
            {/* cursor ligado al reloj */}
            <m.g style={{ x: xCursor }} aria-hidden="true">
              <line y1={8} y2={alto - 22} className="stroke-texto" strokeWidth={1.5} />
              <circle cy={y(fila.sol_el_deg)} r={PANORAMA.RADIO_SOL - 2} className="fill-sol stroke-vacio" strokeWidth={2} />
              <circle cy={y(fila.tierra_el_deg)} r={PANORAMA.RADIO_TIERRA - 1} className="fill-tierra stroke-vacio" strokeWidth={2} />
            </m.g>
          </svg>
        )}
        <div ref={ancla} aria-hidden="true" className="pointer-events-none absolute h-px" style={{ top: yH, left: DIA_LUNAR.MARGEN_IZQ, right: 8 }} />
      </div>
    </div>
  );
}
