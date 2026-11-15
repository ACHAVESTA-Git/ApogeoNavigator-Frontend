import { scaleLinear } from "d3-scale";
import { area, line } from "d3-shape";
import { useId, useMemo } from "react";
import { estadoValidacion, lienzoGrafico, rmseDeValidacion, tramosSerie, type Analisis } from "../../lib/analisis";
import { ANALISIS_GRAFICO } from "../../lib/constants";
import { aUtc, diaCorto, fechaHora, soloFecha } from "../../lib/fechas";
import { grados, numero } from "../../lib/formato";
import { useDimensiones } from "../../hooks/useDimensiones";
import { T } from "../../lib/textos";
import { Desplegable } from "../ui/Desplegable";

type Punto = { t: number; v: number };

/**
 * Observado, ajustado y proyectado de una variable. Lo observado y lo ajustado solo existen dentro de los
 * datos; lo proyectado, solo después, a trazos y con una banda de ± RMSE de validación (no es un intervalo).
 */
export function GraficoSerie({ analisis }: { analisis: Analisis }) {
  const t = T.analisis.serie;
  const idTitulo = useId();
  const { serie, validacion } = analisis;
  const [refLienzo, { ancho }] = useDimensiones();
  const { ANCHO, ALTO, MARGEN, marcasX: MARCAS_X } = lienzoGrafico(ancho, ANALISIS_GRAFICO.SERIE);
  const g = useMemo(() => {
    const tramos = tramosSerie(serie.puntos, serie.fin_datos_utc);
    const todos = [...tramos.observado, ...tramos.ajustado, ...tramos.proyectado];
    if (!todos.length) return null;
    const rmse = rmseDeValidacion(validacion, serie.variable);
    const [tMin, tMax] = [Math.min(...todos.map((p) => p.t)), Math.max(...todos.map((p) => p.t))];
    const holgura = rmse ?? 0;
    const [vMin, vMax] = [Math.min(...todos.map((p) => p.v)) - holgura, Math.max(...todos.map((p) => p.v)) + holgura];
    const x = scaleLinear([tMin, tMax], [MARGEN.izq, ANCHO - MARGEN.der]);
    const y = scaleLinear([vMin, vMax], [ALTO - MARGEN.inf, MARGEN.sup]).nice(5);
    const trazo = line<Punto>().x((p) => x(p.t)).y((p) => y(p.v));
    const banda = rmse ? area<Punto>().x((p) => x(p.t)).y0((p) => y(p.v - rmse)).y1((p) => y(p.v + rmse))(tramos.proyectado) : null;
    return { tramos, x, y, rmse, banda, tMin, tMax, d: { observado: trazo(tramos.observado), ajustado: trazo(tramos.ajustado), proyectado: trazo(tramos.proyectado) } };
  }, [serie, validacion, ANCHO, ALTO, MARGEN]);
  if (!g) return null;

  const nombre = t.variables[serie.variable] ?? serie.nombre;
  const xFin = g.x(g.tramos.finMs);
  const conProyeccion = g.tramos.proyectado.length > 0;
  const marcasX = g.x.ticks(MARCAS_X).map((ms) => ({ ms, etiqueta: diaCorto(aUtc(ms)) }));
  const referencia = estadoValidacion(validacion) === "referencia";
  const leyenda = [
    { clave: "observado", etiqueta: t.observado, clase: "bg-texto" },
    { clave: "ajustado", etiqueta: t.ajustado, clase: "bg-sol h-1! opacity-60" },
    ...(conProyeccion ? [{ clave: "proyectado", etiqueta: t.proyectado, clase: "border-tierra border-t-2 border-dashed bg-transparent" }] : []),
  ];
  return (
    <figure className="mt-4">
      <div ref={refLienzo}>
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-labelledby={idTitulo} className="h-auto w-full">
        <title id={idTitulo}>{t.alt(nombre, soloFecha(aUtc(g.tMin)), soloFecha(serie.fin_datos_utc), soloFecha(aUtc(g.tMax)))}</title>
        {g.y.ticks(5).map((v) => (
          <g key={v}>
            <line x1={MARGEN.izq} x2={ANCHO - MARGEN.der} y1={g.y(v)} y2={g.y(v)} className={v === 0 ? "stroke-horizonte" : "stroke-linea"} strokeWidth={v === 0 ? 1.25 : 0.5} />
            <text x={MARGEN.izq - 6} y={g.y(v)} dy="0.32em" textAnchor="end" className="fill-texto-3 font-mono text-[12px]">{numero(v, Math.abs(v) < 10 ? 1 : 0)}°</text>
          </g>
        ))}
        {marcasX.map((m) => (
          <text key={m.ms} x={g.x(m.ms)} y={ALTO - 8} textAnchor="middle" className="fill-texto-3 font-mono text-[12px]">{m.etiqueta}</text>
        ))}
        {conProyeccion && (
          <>
            {/* La zona proyectada se tiñe: ahí ya no hay datos, solo estimación. */}
            <rect x={xFin} y={MARGEN.sup} width={ANCHO - MARGEN.der - xFin} height={ALTO - MARGEN.inf - MARGEN.sup} className="fill-tierra opacity-[0.05]" />
            <line x1={xFin} x2={xFin} y1={MARGEN.sup - 6} y2={ALTO - MARGEN.inf} className="stroke-texto-2" strokeDasharray="2 3" />
            <text x={xFin - 6} y={MARGEN.sup + 4} textAnchor="end" className="fill-texto-2 text-[12px]">{t.finDatos}</text>
          </>
        )}
        {g.banda && <path d={g.banda} className="fill-tierra opacity-25" />}
        {/* El ajuste va debajo y más ancho: si el modelo calca los datos, se ve como un halo alrededor de lo observado. */}
        {g.d.ajustado && <path d={g.d.ajustado} fill="none" className="stroke-sol opacity-60" strokeWidth={5} strokeLinejoin="round" />}
        {g.d.observado && <path d={g.d.observado} fill="none" className="stroke-texto" strokeWidth={1.5} strokeLinejoin="round" />}
        {g.d.proyectado && <path d={g.d.proyectado} fill="none" className="stroke-tierra" strokeWidth={1.75} strokeDasharray="5 4" strokeLinejoin="round" />}
      </svg>
      </div>
      <figcaption className="text-apoyo text-texto-2 mt-2">
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {leyenda.map((l) => (
            <li key={l.clave} className="flex items-center gap-2"><span aria-hidden="true" className={`inline-block h-0.5 w-5 ${l.clase}`} />{l.etiqueta}</li>
          ))}
        </ul>
        {conProyeccion && g.rmse !== null && <p className="mt-2">{(referencia ? t.bandaReferencia : t.banda)(grados(g.rmse, 2))}</p>}
      </figcaption>
      <Desplegable titulo={t.tabla} className="mt-3 border-y">
        <div className="max-h-72 overflow-auto overscroll-contain">
          <table className="w-full min-w-[26rem] border-collapse text-left text-[0.8125rem]">
            <caption className="sr-only">{nombre}</caption>
            <thead><tr className="text-texto-3">{t.columnas.map((c) => <th key={c} scope="col" className="bg-regolito sticky top-0 py-1.5 pr-3 font-normal">{c}</th>)}</tr></thead>
            <tbody className="font-mono" data-dato>
              {serie.puntos.map((p) => (
                <tr key={p.utc} className="capilar-t">
                  <th scope="row" className="text-texto-2 py-1 pr-3 font-normal whitespace-nowrap">{fechaHora(p.utc)}</th>
                  {[p.observado, p.ajustado, p.proyectado].map((v, i) => <td key={i} className="text-texto py-1 pr-3">{v === null ? "—" : grados(v, 2)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Desplegable>
    </figure>
  );
}
