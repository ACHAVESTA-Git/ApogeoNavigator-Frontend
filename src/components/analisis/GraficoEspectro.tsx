import { scaleLinear, scaleLog } from "d3-scale";
import { useId } from "react";
import type { Analisis } from "../../lib/analisis";
import { ANALISIS_GRAFICO } from "../../lib/constants";
import { numero } from "../../lib/formato";
import { T } from "../../lib/textos";
import { Desplegable } from "../ui/Desplegable";

const { ANCHO, ALTO, MARGEN, PERIODO_MIN_DIAS } = ANALISIS_GRAFICO.ESPECTRO;
const MARCAS = [7, 14, 30, 60, 120, 240];

/** Espectro de una variable: cada pico es un ritmo (periodo en días) con su peso relativo. Barras, no curva: son pocos picos. */
export function GraficoEspectro({ serie, sinodico }: { serie: Analisis["espectro"]["series"][number]; sinodico: number }) {
  const t = T.analisis.espectro;
  const idTitulo = useId();
  const picos = [...serie.picos].sort((a, b) => b.amplitud_rel - a.amplitud_rel);
  if (!picos.length) return null;
  const maxPeriodo = Math.max(...picos.map((p) => p.periodo_dias), sinodico * 2);
  const x = scaleLog([Math.min(PERIODO_MIN_DIAS, ...picos.map((p) => p.periodo_dias)), maxPeriodo * 1.15], [MARGEN.izq, ANCHO - MARGEN.der]);
  const y = scaleLinear([0, 1], [ALTO - MARGEN.inf, MARGEN.sup]);
  const nombres = (candidatos: string[]) => (candidatos.length ? candidatos.map((c) => t.candidatos[c] ?? c).join(", ") : t.ninguno);
  return (
    <figure className="mt-4">
      <figcaption className="text-apoyo text-texto font-semibold">{serie.nombre}</figcaption>
      <div className="overflow-x-auto overscroll-x-contain" tabIndex={0} role="group" aria-labelledby={idTitulo}>
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-labelledby={idTitulo} className="mt-1 h-auto w-full min-w-[34rem]">
        <title id={idTitulo}>{t.alt(serie.nombre, picos.length, numero(picos[0].periodo_dias, 1))}</title>
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={MARGEN.izq} x2={ANCHO - MARGEN.der} y1={y(v)} y2={y(v)} className={v === 0 ? "stroke-horizonte" : "stroke-linea"} strokeWidth={v === 0 ? 1.25 : 0.5} />
            <text x={MARGEN.izq - 6} y={y(v)} dy="0.32em" textAnchor="end" className="fill-texto-3 font-mono text-[11px]">{numero(v, 1)}</text>
          </g>
        ))}
        {MARCAS.filter((d) => d < maxPeriodo * 1.15).map((d) => (
          <text key={d} x={x(d)} y={ALTO - 14} textAnchor="middle" className="fill-texto-3 font-mono text-[11px]">{d}</text>
        ))}
        <text x={ANCHO - MARGEN.der} y={ALTO - 1} textAnchor="end" className="fill-texto-3 text-[11px]">{t.ejeX}</text>
        {/* Referencia física: el mes sinódico teórico */}
        <line x1={x(sinodico)} x2={x(sinodico)} y1={MARGEN.sup - 8} y2={y(0)} className="stroke-texto-2" strokeDasharray="2 3" />
        <text x={x(sinodico) + 6} y={MARGEN.sup - 10} className="fill-texto-2 text-[11px]">{t.sinodico(numero(sinodico, 2))}</text>
        {picos.map((p) => (
          <g key={p.periodo_dias}>
            <line x1={x(p.periodo_dias)} x2={x(p.periodo_dias)} y1={y(0)} y2={y(p.amplitud_rel)} className={p.es_sinodico ? "stroke-sol" : "stroke-texto-2"} strokeWidth={p.es_sinodico ? 3 : 2} strokeLinecap="round" />
            <circle cx={x(p.periodo_dias)} cy={y(p.amplitud_rel)} r={p.es_sinodico ? 4.5 : 3.5} className={p.es_sinodico ? "fill-sol" : "fill-texto-2"} />
          </g>
        ))}
      </svg>
      </div>
      <Desplegable titulo={t.tabla} className="mt-2 border-y">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[22rem] border-collapse text-left text-[0.8125rem]">
            <caption className="sr-only">{serie.nombre}</caption>
            <thead><tr className="text-texto-3">{t.columnas.map((c) => <th key={c} scope="col" className="py-1.5 pr-3 font-normal">{c}</th>)}</tr></thead>
            <tbody>
              {picos.map((p) => (
                <tr key={p.periodo_dias} className="capilar-t">
                  <td className="text-texto py-1 pr-3 font-mono" data-dato>{numero(p.periodo_dias, 2)}</td>
                  <td className="text-texto py-1 pr-3 font-mono" data-dato>{numero(p.amplitud_rel, 2)}</td>
                  <td className="text-texto-2 py-1">{nombres(p.candidatos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Desplegable>
    </figure>
  );
}
