import { scaleLinear } from "d3-scale";
import { area, line } from "d3-shape";
import { useId, useMemo } from "react";
import { useDimensiones } from "../../hooks/useDimensiones";
import { lienzoGrafico } from "../../lib/analisis";
import { PROYECCION_MODELO } from "../../lib/constants";
import { aUtc, diaCorto, mesAnio, soloFecha } from "../../lib/fechas";
import { grados, numero } from "../../lib/formato";
import { bandaError, msDeFecha, type AstroBanda, type ModeloProyeccion } from "../../lib/proyeccionModelo";
import { NOMBRE_ASTRO, T } from "../../lib/textos";
import type { FilaEfemeride } from "../../lib/tipos";

type Punto = { t: number; v: number; e: number };
const ASTROS = [
  { astro: "sol", clave: "sol_el_deg", trazo: "stroke-sol", relleno: "fill-sol", muestra: "bg-sol" },
  { astro: "tierra", clave: "tierra_el_deg", trazo: "stroke-tierra", relleno: "fill-tierra", muestra: "bg-tierra" },
] as const;

/**
 * Acto 2 · Evidencia: elevación proyectada del Sol y de la Tierra, con la banda de ± RMSE que se ensancha con el
 * horizonte (error medido a 1, 3, 6… meses del fin del entrenamiento). `dominio` acerca la serie a un mes. Todo es
 * proyección: el propio gráfico lo rotula. Es estático: lo que se lee no se mueve por estilo.
 */
export function GraficoProyeccion({ serie, modelo, sitio, dominio }: { serie: readonly FilaEfemeride[]; modelo: ModeloProyeccion; sitio: string; dominio: readonly [number, number] | null }) {
  const t = T.proyeccion.serie;
  const idTitulo = useId();
  const [refLienzo, { ancho }] = useDimensiones();
  const { ANCHO, ALTO, MARGEN, marcasX } = lienzoGrafico(ancho, PROYECCION_MODELO.GRAFICO);
  const [d0, d1] = dominio ?? [null, null];

  const g = useMemo(() => {
    const bandas: Record<AstroBanda, ReturnType<typeof bandaError>> = { sol: bandaError(modelo, "sol"), tierra: bandaError(modelo, "tierra") };
    const curvas = ASTROS.map((a) => {
      const banda = bandas[a.astro];
      const puntos: Punto[] = serie.flatMap((f) => {
        const ms = msDeFecha(f.utc);
        const v = f[a.clave];
        if (ms === null || typeof v !== "number" || !Number.isFinite(v) || (d0 !== null && d1 !== null && (ms < d0 || ms >= d1))) return [];
        return [{ t: ms, v, e: banda ? banda.en(ms) : 0 }];
      });
      return { ...a, puntos, conBanda: banda !== null, tipo: banda?.tipo ?? null };
    });
    const todos = curvas.flatMap((c) => c.puntos);
    if (!todos.length) return null;
    const tiempos = todos.map((p) => p.t);
    const x = scaleLinear([d0 ?? Math.min(...tiempos), d1 ?? Math.max(...tiempos)], [MARGEN.izq, ANCHO - MARGEN.der]);
    const y = scaleLinear([Math.min(...todos.map((p) => p.v - p.e)), Math.max(...todos.map((p) => p.v + p.e))], [ALTO - MARGEN.inf, MARGEN.sup]).nice(5);
    const trazo = line<Punto>().x((p) => x(p.t)).y((p) => y(p.v));
    const franja = area<Punto>().x((p) => x(p.t)).y0((p) => y(p.v - p.e)).y1((p) => y(p.v + p.e));
    return {
      x, y, desde: Math.min(...tiempos), hasta: Math.max(...tiempos),
      tipoBanda: curvas.some((c) => c.tipo === "horizonte") ? "horizonte" as const : curvas.some((c) => c.tipo === "fija") ? "fija" as const : null,
      curvas: curvas.filter((c) => c.puntos.length).map((c) => ({
        ...c, d: trazo(c.puntos), banda: c.conBanda ? franja(c.puntos) : null,
        min: Math.min(...c.puntos.map((p) => p.v)), max: Math.max(...c.puntos.map((p) => p.v)),
      })),
    };
  }, [serie, modelo, d0, d1, ANCHO, ALTO, MARGEN]);

  if (!g) return <p className="text-texto-2 mt-5">{t.vacia}</p>;
  const finEntrenamiento = msDeFecha(modelo.entrenado_hasta);
  const xFin = finEntrenamiento !== null && finEntrenamiento > g.x.domain()[0] && finEntrenamiento < g.x.domain()[1] ? g.x(finEntrenamiento) : null;
  const rotuloX = dominio ? diaCorto : mesAnio;
  return (
    <figure className="mt-5" data-banda={g.tipoBanda ?? "ninguna"}>
      <p className="text-apoyo text-tierra flex items-center gap-2 font-semibold">{T.proyeccion.etiqueta}</p>
      <div ref={refLienzo} className="mt-2">
        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-labelledby={idTitulo} className="block h-auto w-full">
          <title id={idTitulo}>{t.alt(sitio, soloFecha(aUtc(g.desde)), soloFecha(aUtc(g.hasta)))}</title>
          {g.y.ticks(5).map((v) => (
            <g key={v}>
              <line x1={MARGEN.izq} x2={ANCHO - MARGEN.der} y1={g.y(v)} y2={g.y(v)} className={v === 0 ? "stroke-horizonte" : "stroke-linea"} strokeWidth={v === 0 ? 1.25 : 0.5} />
              <text x={MARGEN.izq - 6} y={g.y(v)} dy="0.32em" textAnchor="end" className="fill-texto-3 font-mono text-[12px]">{numero(v, Math.abs(v) < 10 ? 1 : 0)}°</text>
            </g>
          ))}
          {g.x.ticks(marcasX).map((ms) => (
            <text key={ms} x={g.x(ms)} y={ALTO - 8} textAnchor="middle" className="fill-texto-3 font-mono text-[12px]">{rotuloX(aUtc(ms))}</text>
          ))}
          {xFin !== null && (
            <>
              <line x1={xFin} x2={xFin} y1={MARGEN.sup - 6} y2={ALTO - MARGEN.inf} className="stroke-texto-2" strokeDasharray="2 3" />
              <text x={xFin + 6} y={MARGEN.sup - 8} className="fill-texto-2 text-[12px]">{t.finEntrenamiento}</text>
            </>
          )}
          {g.curvas.map((c) => c.banda && <path key={`b-${c.astro}`} d={c.banda} className={`${c.relleno} opacity-20`} data-banda-astro={c.astro} />)}
          {/* A trazos, como toda proyección de la app: lo continuo se reserva para los datos de Horizons. */}
          {g.curvas.map((c) => c.d && <path key={c.astro} d={c.d} fill="none" className={c.trazo} strokeWidth={1.75} strokeDasharray="5 4" strokeLinejoin="round" />)}
        </svg>
      </div>
      <figcaption className="text-apoyo text-texto-2 mt-2">
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {g.curvas.map((c) => (
            <li key={c.astro} className="flex items-center gap-2"><span aria-hidden="true" className={`inline-block h-0.5 w-5 ${c.muestra}`} />{t[c.astro]}</li>
          ))}
          {g.tipoBanda && <li className="flex items-center gap-2"><span aria-hidden="true" className="bg-texto/25 inline-block h-2.5 w-5 rounded-xs" />{t.banda}</li>}
        </ul>
        {/* Las cifras del tramo visible, en texto: el gráfico no es la única forma de leerlas. */}
        <p className="text-texto mt-2 font-mono" data-dato>
          {g.curvas.map((c) => t.rango(NOMBRE_ASTRO[c.astro], grados(c.min, 1), grados(c.max, 1))).join(" · ")}
        </p>
        <p className="mt-2 max-w-medida">{g.tipoBanda === "horizonte" ? t.bandaHorizonte : g.tipoBanda === "fija" ? t.bandaFija : t.sinBanda}</p>
        <p className="mt-1">{t.utc}</p>
      </figcaption>
    </figure>
  );
}
