import { scaleLinear } from "d3-scale";
import { area, line } from "d3-shape";
import { useId, useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import { estadoValidacion, lienzoGrafico, rmseDeValidacion, type Analisis } from "../../lib/analisis";
import { ANALISIS_GRAFICO, CONFIANZA } from "../../lib/constants";
import { aUtc, diaCorto, diaLima, fechaHora, horaLima, limitar, soloFecha } from "../../lib/fechas";
import { grados, numero, numeroCorto } from "../../lib/formato";
import { momentosClave, puntosCursor, type Momento, type PuntoCursor } from "../../lib/informe";
import { useDimensiones } from "../../hooks/useDimensiones";
import { T } from "../../lib/textos";
import { Desplegable } from "../ui/Desplegable";
import { unir } from "../ui/clases";

type Punto = { t: number; v: number };
const de = (puntos: readonly PuntoCursor[], campo: "observado" | "ajustado" | "proyectado"): Punto[] =>
  puntos.flatMap((p) => (p[campo] === null ? [] : [{ t: p.t, v: p[campo] as number }]));
const valorDe = (p: PuntoCursor): number | null => p.observado ?? p.proyectado ?? p.ajustado;

/**
 * Acto 2 · Evidencia: lo observado y lo ajustado (solo dentro de los datos) frente a lo proyectado (solo después, a
 * trazos y con la banda de ± RMSE de validación, que es optimista y no es un intervalo). Un cursor recorre la serie
 * con el puntero o el teclado, y los momentos clave (mayor desvío, cruces del horizonte) salen de la propia serie.
 */
export function GraficoSerie({ analisis }: { analisis: Analisis }) {
  const t = T.analisis.serie;
  const te = T.analisis.informe.evidencia;
  const idTitulo = useId();
  const idTeclas = useId();
  const { serie, validacion } = analisis;
  const [refLienzo, { ancho }] = useDimensiones();
  const { ANCHO, ALTO, MARGEN, marcasX: MARCAS_X } = lienzoGrafico(ancho, ANALISIS_GRAFICO.SERIE_AMPLIA);
  const puntos = useMemo(() => puntosCursor(serie), [serie]);
  const momentos = useMemo(() => momentosClave(puntos, serie.variable), [puntos, serie.variable]);
  // El cursor arranca en la frontera: la última muestra con dato real, justo antes de la proyección.
  const ultimoReal = useMemo(() => Math.max(0, puntos.reduce((u, p, i) => (p.observado !== null ? i : u), 0)), [puntos]);
  const [elegido, setElegido] = useState<number | null>(null);
  const indice = limitar(elegido ?? ultimoReal, 0, Math.max(0, puntos.length - 1));
  const rmse = rmseDeValidacion(validacion, serie.variable);

  const g = useMemo(() => {
    if (!puntos.length) return null;
    const tramos = { observado: de(puntos, "observado"), ajustado: de(puntos, "ajustado"), proyectado: de(puntos, "proyectado") };
    const valores = [...tramos.observado, ...tramos.ajustado, ...tramos.proyectado].map((p) => p.v);
    const holgura = rmse ?? 0;
    const x = scaleLinear([puntos[0].t, puntos[puntos.length - 1].t], [MARGEN.izq, ANCHO - MARGEN.der]);
    const y = scaleLinear([Math.min(...valores) - holgura, Math.max(...valores) + holgura], [ALTO - MARGEN.inf, MARGEN.sup]).nice(5);
    const trazo = line<Punto>().x((p) => x(p.t)).y((p) => y(p.v));
    const banda = rmse ? area<Punto>().x((p) => x(p.t)).y0((p) => y(p.v - rmse)).y1((p) => y(p.v + rmse))(tramos.proyectado) : null;
    return { x, y, banda, conProyeccion: tramos.proyectado.length > 0, d: { observado: trazo(tramos.observado), ajustado: trazo(tramos.ajustado), proyectado: trazo(tramos.proyectado) } };
  }, [puntos, rmse, ANCHO, ALTO, MARGEN]);

  const nombre = t.variables[serie.variable] ?? serie.nombre;
  const finMs = Date.parse(serie.fin_datos_utc.replace("Z", ":00Z"));
  // Capa fija (ejes, banda, trazos y marcas): memorizada, para que mover el cursor solo repinte el cursor.
  const fondo = useMemo(() => {
    if (!g) return null;
    const xFin = g.x(finMs);
    const yDe = (m: Momento) => (m.tipo === "desvio" ? g.y(valorDe(puntos[m.indice]) ?? 0) : g.y(0));
    return (
      <>
        {g.y.ticks(5).map((v) => (
          <g key={v}>
            <line x1={MARGEN.izq} x2={ANCHO - MARGEN.der} y1={g.y(v)} y2={g.y(v)} className={v === 0 ? "stroke-horizonte" : "stroke-linea"} strokeWidth={v === 0 ? 1.25 : 0.5} />
            <text x={MARGEN.izq - 6} y={g.y(v)} dy="0.32em" textAnchor="end" className="fill-texto-3 font-mono text-[12px]">{numero(v, Math.abs(v) < 10 ? 1 : 0)}°</text>
          </g>
        ))}
        {g.x.ticks(MARCAS_X).map((ms) => (
          <text key={ms} x={g.x(ms)} y={ALTO - 8} textAnchor="middle" className="fill-texto-3 font-mono text-[12px]">{diaCorto(aUtc(ms))}</text>
        ))}
        {g.conProyeccion && (
          <>
            {/* La zona proyectada se tiñe: ahí ya no hay datos, solo estimación. */}
            <rect x={xFin} y={MARGEN.sup} width={ANCHO - MARGEN.der - xFin} height={ALTO - MARGEN.inf - MARGEN.sup} className="fill-tierra opacity-[0.05]" />
            <line x1={xFin} x2={xFin} y1={MARGEN.sup - 6} y2={ALTO - MARGEN.inf} className="stroke-texto-2" strokeDasharray="2 3" />
            <text x={xFin - 6} y={MARGEN.sup - 8} textAnchor="end" className="fill-texto-2 text-[12px]">{t.finDatos}</text>
          </>
        )}
        {g.banda && <path d={g.banda} className="fill-tierra opacity-25" />}
        {/* El ajuste va debajo y más ancho: si el modelo calca los datos, se ve como un halo alrededor de lo observado. */}
        {g.d.ajustado && <path d={g.d.ajustado} fill="none" className="stroke-sol opacity-60" strokeWidth={5} strokeLinejoin="round" />}
        {g.d.observado && <path d={g.d.observado} fill="none" className="stroke-texto" strokeWidth={1.5} strokeLinejoin="round" />}
        {g.d.proyectado && <path d={g.d.proyectado} fill="none" className="stroke-tierra" strokeWidth={1.75} strokeDasharray="5 4" strokeLinejoin="round" />}
        {momentos.map((m, i) => (
          <g key={m.tipo} transform={`translate(${g.x(puntos[m.indice].t)} ${yDe(m)})`}>
            <circle r={10} className="fill-vacio stroke-texto" strokeWidth={1.25} />
            <text dy="0.36em" textAnchor="middle" className="fill-texto font-mono text-[12px] font-semibold">{i + 1}</text>
          </g>
        ))}
      </>
    );
  }, [g, puntos, momentos, finMs, ANCHO, ALTO, MARGEN, MARCAS_X, t.finDatos]);
  if (!g || !fondo) return null;

  const p = puntos[indice];
  const proyeccion = p.proyectado !== null;
  const referencia = estadoValidacion(validacion) === "referencia";
  const desvio = p.observado !== null && p.ajustado !== null ? Math.abs(p.observado - p.ajustado) : null;
  const lectura: { clave: string; rotulo: string; valor: string; tono?: string }[] = proyeccion
    ? [{ clave: "p", rotulo: te.proyectado, valor: grados(p.proyectado as number, 2), tono: "text-tierra" },
       ...(rmse !== null ? [{ clave: "m", rotulo: te.margenRotulo, valor: te.margen(grados(rmse, 2)) }] : [])]
    : [...(p.observado !== null ? [{ clave: "o", rotulo: te.observado, valor: grados(p.observado, 2) }] : []),
       ...(p.ajustado !== null ? [{ clave: "a", rotulo: te.ajustado, valor: grados(p.ajustado, 2), tono: "text-sol" }] : []),
       ...(desvio !== null ? [{ clave: "d", rotulo: te.desvio, valor: grados(desvio, 2) }] : [])];
  const textoCursor = `${fechaHora(p.utc)} ${te.utc} · ${proyeccion ? te.zonaProyeccion : te.zonaDatos} · ${lectura.map((l) => `${l.rotulo} ${l.valor}`).join(" · ")}`;

  const mover = (i: number) => setElegido(limitar(i, 0, puntos.length - 1));
  const alPuntero = (e: PointerEvent<HTMLDivElement>) => {
    // El ratón recorre la serie al pasar; el dedo, solo mientras arrastra (el gesto vertical sigue desplazando la página).
    if (e.pointerType !== "mouse" && e.buttons === 0 && e.type !== "pointerdown") return;
    const caja = e.currentTarget.getBoundingClientRect();
    const ms = g.x.invert(((e.clientX - caja.left) / caja.width) * ANCHO);
    const paso = (puntos[puntos.length - 1].t - puntos[0].t) / Math.max(1, puntos.length - 1);
    let cerca = limitar(Math.round((ms - puntos[0].t) / paso), 0, puntos.length - 1);
    // La serie puede no ser uniforme en la frontera: se afina con los vecinos.
    for (const j of [cerca - 1, cerca + 1]) if (puntos[j] && Math.abs(puntos[j].t - ms) < Math.abs(puntos[cerca].t - ms)) cerca = j;
    if (cerca !== indice) mover(cerca);
  };
  const alPulsar = (e: KeyboardEvent<HTMLDivElement>) => {
    const salto: Record<string, number> = {
      ArrowLeft: indice - 1, ArrowDown: indice - 1, ArrowRight: indice + 1, ArrowUp: indice + 1,
      PageDown: indice - CONFIANZA.CURSOR_PASO_LARGO, PageUp: indice + CONFIANZA.CURSOR_PASO_LARGO, Home: 0, End: puntos.length - 1,
    };
    if (!(e.key in salto)) return;
    e.preventDefault();
    e.stopPropagation(); // estas teclas no deben mover también el reloj global
    mover(salto[e.key]);
  };
  const xCursor = g.x(p.t);
  const astro = T.analisis.informe.evidencia.momentos.astros[serie.variable.startsWith("sol") ? "sol" : "tierra"];
  const fraseMomento = (m: Momento) => {
    const fecha = fechaHora(puntos[m.indice].utc);
    if (m.tipo === "desvio") return te.momentos.desvio(grados(m.valor ?? 0, 2), fecha);
    return te.momentos[m.tipo](astro, m.sube ? te.momentos.sale : te.momentos.sePone, fecha);
  };
  const leyenda = [
    { clave: "observado", etiqueta: t.observado, clase: "bg-texto" },
    { clave: "ajustado", etiqueta: t.ajustado, clase: "bg-sol h-1! opacity-60" },
    ...(g.conProyeccion ? [{ clave: "proyectado", etiqueta: t.proyectado, clase: "border-tierra border-t-2 border-dashed bg-transparent" }] : []),
  ];
  return (
    <figure className="mt-5">
      {/* Lectura del cursor: alto reservado para que cambiar de zona no mueva el gráfico. */}
      <div className="flex min-h-[4.75rem] flex-wrap items-end justify-between gap-x-8 gap-y-3" data-lectura-cursor="">
        <div className="min-w-0">
          <p className="text-dato-lg text-texto font-mono font-medium whitespace-nowrap" data-dato>
            {fechaHora(p.utc)} <span className="text-texto-2 text-dato-sm font-light">{te.utc}</span>
          </p>
          <p className="text-apoyo text-texto-2 mt-1">
            <span className={unir("font-semibold", proyeccion ? "text-tierra" : "text-texto")}>{proyeccion ? te.zonaProyeccion : te.zonaDatos}</span>
            {" · "}{te.lima(horaLima(p.utc), diaLima(p.utc))}
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-x-6 text-left sm:min-w-[22rem]">
          {lectura.map((l) => (
            <div key={l.clave} className="min-w-0">
              <dt className="text-texto-2 text-[0.75rem]">{l.rotulo}</dt>
              <dd className={unir("text-dato font-mono font-medium whitespace-nowrap", l.tono ?? "text-texto")} data-dato>{l.valor}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div ref={refLienzo} className="relative mt-3">
        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-labelledby={idTitulo} className="block h-auto w-full">
          <title id={idTitulo}>{t.alt(nombre, soloFecha(puntos[0].utc), soloFecha(serie.fin_datos_utc), soloFecha(puntos[puntos.length - 1].utc))}</title>
          {fondo}
          <g transform={`translate(${xCursor} 0)`} data-cursor="">
            <line y1={MARGEN.sup} y2={ALTO - MARGEN.inf} className="stroke-texto" strokeWidth={1.25} />
            {([["ajustado", "fill-sol"], ["observado", "fill-texto"], ["proyectado", "fill-tierra"]] as const).map(([campo, clase]) =>
              p[campo] !== null && <circle key={campo} cy={g.y(p[campo] as number)} r={4.5} className={unir(clase, "stroke-vacio")} strokeWidth={1.5} />)}
          </g>
        </svg>
        {/* El cursor es un deslizador real: puntero (arrastre o paso del ratón) y teclado. */}
        <div role="slider" tabIndex={0} aria-label={te.cursor} aria-describedby={idTeclas} aria-orientation="horizontal"
          aria-valuemin={0} aria-valuemax={puntos.length - 1} aria-valuenow={indice} aria-valuetext={textoCursor}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); alPuntero(e); }} onPointerMove={alPuntero} onKeyDown={alPulsar}
          className="rounded-control absolute inset-0 cursor-ew-resize touch-pan-y select-none" />
      </div>
      <figcaption className="text-apoyo text-texto-2 mt-2">
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {leyenda.map((l) => (
            <li key={l.clave} className="flex items-center gap-2"><span aria-hidden="true" className={`inline-block h-0.5 w-5 ${l.clase}`} />{l.etiqueta}</li>
          ))}
        </ul>
        {g.conProyeccion && rmse !== null && <p className="mt-2">{(referencia ? t.bandaReferencia : t.banda)(grados(rmse, 2))}</p>}
        <p id={idTeclas} className="mt-1 max-md:sr-only">{te.teclas}</p>
      </figcaption>
      {momentos.length > 0 && (
        <section aria-label={te.momentos.titulo} className="mt-6">
          <p className="rotulo">{te.momentos.titulo}</p>
          <ol className="mt-3 grid gap-3 lg:grid-cols-3">
            {momentos.map((m, i) => (
              <li key={m.tipo} className="min-w-0">
                <button type="button" onClick={() => mover(m.indice)} aria-pressed={indice === m.indice} title={te.momentos.ir}
                  className={unir("rounded-panel text-apoyo flex h-full w-full items-start gap-3 border p-3 text-left transition-[background-color,border-color,transform] duration-(--dur-micro) ease-salida active:scale-[0.99]",
                    indice === m.indice ? "border-texto/25 bg-texto/[0.06] text-texto" : "border-texto/8 text-texto-2 hover:text-texto")}>
                  <span aria-hidden="true" className="border-texto text-texto grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[0.75rem] font-semibold">{i + 1}</span>
                  <span className="min-w-0">{fraseMomento(m)}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="text-texto-2 mt-3 text-[0.75rem]">{te.momentos.nota(numeroCorto(serie.paso_horas))}</p>
        </section>
      )}
      <Desplegable titulo={t.tabla} className="mt-5 border-y">
        <div className="max-h-72 overflow-auto overscroll-contain">
          <table className="w-full min-w-[26rem] border-collapse text-left text-[0.8125rem]">
            <caption className="sr-only">{nombre}</caption>
            <thead><tr className="text-texto-3">{t.columnas.map((c) => <th key={c} scope="col" className="bg-regolito sticky top-0 py-1.5 pr-3 font-normal">{c}</th>)}</tr></thead>
            <tbody className="font-mono" data-dato>
              {puntos.map((f) => (
                <tr key={f.utc} className="capilar-t">
                  <th scope="row" className="text-texto-2 py-1 pr-3 font-normal whitespace-nowrap">{fechaHora(f.utc)}</th>
                  {[f.observado, f.ajustado, f.proyectado].map((v, i) => <td key={i} className="text-texto py-1 pr-3">{v === null ? "—" : grados(v, 2)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Desplegable>
    </figure>
  );
}
