import { m, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import datos from "../../assets/hero-shackleton.json";
import { useCifraAlEntrar } from "../../hooks/useCifraAlEntrar";
import { useDimensiones } from "../../hooks/useDimensiones";
import { useDesde } from "../../hooks/useMedia";
import { DATOS, ESCENA, GRADOS_VUELTA, HERO } from "../../lib/constants";
import { lupa } from "../../lib/escalas";
import { aMs, aUtc, fechaHora, horaLima, redondearHora } from "../../lib/fechas";
import { grados, horas } from "../../lib/formato";
import { interpolarFila } from "../../lib/interpolar";
import { fijarInstanteGlobal } from "../../lib/relojGlobal";
import { NOMBRE_ASTRO, T, horaLocal } from "../../lib/textos";
import type { Efemerides } from "../../lib/tipos";
import { crearPaisaje, leerColores, pintarEscena, semillaDe, type Colores } from "../cielo/lienzoLunar";
import { useAnclaHorizonte } from "../layout/horizonteContexto";
import { unir } from "../ui/clases";

const FILAS = (datos as Efemerides).filas;
const R = datos.resumen; // cifras exactas del mes, calculadas por el script con las filas horarias
const T0 = aMs(FILAS[0].utc);
const T1 = aMs(FILAS[FILAS.length - 1].utc);
const { CORTES, FECHAS } = HERO.RELATO;
const HITOS = [T0, aMs(FECHAS[0]), aMs(FECHAS[1]), T1];
const TRAMOS = [0, ...CORTES, 1];
/** Del progreso del scroll (0…1) al instante del mes: cada acto recorre su tramo de fechas. */
function instanteDe(p: number): number {
  const i = Math.min(TRAMOS.length - 2, Math.max(0, TRAMOS.findIndex((c) => p < c) - 1));
  const f = (p - TRAMOS[i]) / (TRAMOS[i + 1] - TRAMOS[i]);
  return HITOS[i] + Math.min(1, Math.max(0, f)) * (HITOS[i + 1] - HITOS[i]);
}
const actoDe = (p: number): number => (p < CORTES[0] ? 0 : p < CORTES[1] ? 1 : 2);
const AZ_TIERRA = FILAS.reduce((s, f) => s + f.tierra_az_deg, 0) / FILAS.length;

/** Bloque de un acto: entra y sale con el scroll (opacidad y un desplazamiento corto), nunca con un temporizador. */
function Acto({ progreso, desde, hasta, children }: { progreso: MotionValue<number>; desde: number; hasta: number; children: ReactNode }) {
  const margen = 0.045;
  // Tramos dentro de 0…1 (el primero ya está dentro al cargar y el último no sale): la línea de tiempo de scroll
  // no admite desplazamientos fuera de ese intervalo.
  const [entra, sale] = [desde > 0, hasta < 1];
  const puntos = [...(entra ? [desde - margen, desde + margen] : [0]), ...(sale ? [hasta - margen, hasta + margen] : [1])];
  const opacity = useTransform(progreso, puntos, [...(entra ? [0, 1] : [1]), ...(sale ? [1, 0] : [1])]);
  const y = useTransform(progreso, puntos, [...(entra ? [28, 0] : [0]), ...(sale ? [0, -28] : [0])]);
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? "auto" : "none"));
  return <m.div style={{ opacity, y, pointerEvents }} className="absolute inset-x-0 top-0 motion-reduce:transform-none!">{children}</m.div>;
}

/** KPI con relato: la cifra cuenta al entrar su acto y debajo lleva con qué se compara y por qué importa. */
function Kpi({ rotulo, valor, total, contexto, activa, color }: { rotulo: string; valor: number; total?: number; contexto: string; activa: boolean; color?: string }) {
  const formato = useCallback((v: number) => String(Math.round(v)), []);
  const ref = useCifraAlEntrar<HTMLSpanElement>(valor, formato, activa);
  return (
    <div className="panel mt-6 max-w-md p-4 md:mt-8 md:p-5">
      <p className="rotulo">{rotulo}</p>
      <p className="mt-2 font-mono" data-dato>
        <span ref={ref} className={unir("text-dato-xl font-medium", color ?? "text-texto")}>{valor}</span>
        {total !== undefined && <span className="text-dato text-texto-2"> {T.inicio.actos.de(horas(total))}</span>}
      </p>
      {total !== undefined && (
        <div aria-hidden="true" className="bg-texto/10 mt-3 h-1 overflow-hidden rounded-full">
          <div className={unir("h-full origin-left rounded-full transition-transform duration-[900ms] ease-salida", color === "text-tierra" ? "bg-tierra" : "bg-sol")}
            style={{ transform: `scaleX(${activa ? valor / total : 0})` }} />
        </div>
      )}
      <p className="text-apoyo text-texto-2 mt-3">{contexto}</p>
    </div>
  );
}

/**
 * Inicio como relato con scroll en tres actos sobre una misma escena fija: el desplazamiento mueve el mes real
 * de Shackleton (diciembre de 2026). 1 · el Sol no se pone; 2 · la Tierra sí se esconde; 3 · elige dónde aterrizar.
 */
export function RelatoInicio({ titulo, cta }: { titulo: ReactNode; cta: ReactNode }) {
  const t = T.inicio.actos;
  const seccion = useRef<HTMLElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const colores = useRef<Colores | null>(null);
  const [refCaja, { ancho, alto }] = useDimensiones<HTMLDivElement>();
  const esEscritorio = useDesde("md");
  const { scrollYProgress } = useScroll({ target: seccion, offset: ["start start", "end end"] });
  const [acto, setActo] = useState(0);
  const [ms, setMs] = useState(T0);
  const paisaje = useMemo(() => crearPaisaje(semillaDe(DATOS.SITIO_DESTACADO)), []);
  const ancla = useAnclaHorizonte("linea");

  const yHorizonte = Math.round(alto * (esEscritorio ? 0.7 : 0.74));
  const ventana = HERO.RELATO.VENTANA_DEG[esEscritorio ? "escritorio" : "movil"];
  const ppd = ancho / ventana;
  // La Tierra queda a la derecha, lejos del texto; el Sol cruza toda la vista a lo largo del mes.
  const centro = AZ_TIERRA - (esEscritorio ? 0.2 : 0.22) * ventana;
  const escalaPx = Math.min(yHorizonte * 0.5, 320);
  const yDe = useCallback((el: number) => yHorizonte - lupa(el) * escalaPx, [yHorizonte, escalaPx]);

  const etiquetas = useRef<Record<"sol" | "tierra", HTMLParagraphElement | null>>({ sol: null, tierra: null });
  const pendiente = useRef(0);
  const pintar = useCallback(
    (p: number) => {
      cancelAnimationFrame(pendiente.current);
      pendiente.current = requestAnimationFrame(() => {
        const el = lienzo.current;
        const ctx = el?.getContext("2d");
        if (!el || !ctx || !ancho) return;
        const dpr = Math.min(window.devicePixelRatio || 1, ESCENA.DPR_MAX);
        if (el.width !== Math.round(ancho * dpr)) {
          el.width = Math.round(ancho * dpr);
          el.height = Math.round(alto * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        colores.current ??= leerColores(el);
        const pos = interpolarFila(FILAS, instanteDe(p));
        pintarEscena(ctx, { ancho, alto, yHorizonte, ppd, centro, yDe, incertidumbre: 0 }, pos, paisaje, colores.current);
        // Rótulos que siguen a los astros (sin pasar por React).
        for (const astro of ["sol", "tierra"] as const) {
          const nodo = etiquetas.current[astro];
          if (!nodo) continue;
          const elev = pos[`${astro}_el_deg`];
          const delta = ((pos[`${astro}_az_deg`] - centro + 540) % GRADOS_VUELTA) - 180;
          const x = ancho / 2 + delta * ppd;
          const radio = astro === "sol" ? ESCENA.RADIO_SOL_PX : ESCENA.RADIO_SOL_PX * ESCENA.RAZON_TIERRA_SOL;
          nodo.style.transform = `translate(${Math.min(ancho - 70, Math.max(70, x))}px, ${yDe(elev) - radio - 30}px) translateX(-50%)`;
          nodo.style.opacity = elev > 0 && x > 0 && x < ancho ? "1" : "0";
          nodo.textContent = `${NOMBRE_ASTRO[astro].toUpperCase()} ${grados(elev, 1, true)}`;
        }
      });
    },
    [ancho, alto, yHorizonte, ppd, centro, yDe, paisaje],
  );
  useEffect(() => pintar(scrollYProgress.get()), [pintar, scrollYProgress]);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    pintar(p);
    setActo(actoDe(p));
    setMs(redondearHora(instanteDe(p)));
  });
  const utc = aUtc(ms);
  useEffect(() => fijarInstanteGlobal(utc), [utc]);

  const irA = (n: number) => {
    const el = seccion.current;
    if (!el) return;
    const recorrido = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: el.offsetTop + recorrido * (TRAMOS[n] + 0.02), behavior: "smooth" });
  };
  const dia = (u: string) => `${Number(u.slice(8, 10))}/${u.slice(5, 7)} a las ${u.slice(11, 16)}`;

  return (
    <section ref={seccion} className="relative" style={{ height: `${HERO.RELATO.ALTO_SVH}svh` }}>
      <div ref={refCaja} className="sticky top-(--nav-alto-movil) h-[calc(100svh-var(--nav-alto-movil)-var(--barra-inferior-alto))] overflow-hidden md:top-(--nav-alto) md:h-[calc(100svh-var(--nav-alto))]">
        <canvas ref={lienzo} role="img" aria-label={T.inicio.escena} className="absolute inset-0 size-full" />
        <div ref={ancla} aria-hidden="true" className="pointer-events-none absolute inset-x-0 h-px" style={{ top: yHorizonte }} />
        {(["sol", "tierra"] as const).map((astro) => (
          <p key={astro} ref={(n) => { etiquetas.current[astro] = n; }} aria-hidden="true"
            className={unir("pointer-events-none absolute top-0 left-0 font-mono text-[12px] whitespace-nowrap transition-opacity duration-(--dur-corta)", astro === "sol" ? "text-sol" : "text-tierra")} />
        ))}

        <div className="contenedor relative h-full">
          <div className="relative mt-6 md:mt-[9svh]">
            <Acto progreso={scrollYProgress} desde={0} hasta={CORTES[0]}>
              <p className="rotulo">{t.uno.rotulo}</p>
              {titulo}
              <Kpi rotulo={t.uno.kpi} valor={R.horas_sol} total={R.horas_total} activa={acto === 0}
                contexto={t.uno.contexto(grados(R.sol_el_min_deg, 2, true), grados(R.sol_el_max_deg, 2, true))} color="text-sol" />
            </Acto>
            <Acto progreso={scrollYProgress} desde={CORTES[0]} hasta={CORTES[1]}>
              <p className="rotulo">{t.dos.rotulo}</p>
              <h2 className="titulo-instrumento text-display text-texto mt-3 max-w-[14ch] text-balance md:mt-5">
                {t.dos.titular.antes}<span className="text-tierra">{t.dos.titular.acento}</span>{t.dos.titular.despues}
              </h2>
              <Kpi rotulo={t.dos.kpi} valor={R.horas_tierra} total={R.horas_total} activa={acto === 1} color="text-tierra"
                contexto={t.dos.contexto(dia(R.tierra_salida_utc), dia(R.tierra_puesta_utc), horas(R.horas_total - R.horas_tierra))} />
            </Acto>
            <Acto progreso={scrollYProgress} desde={CORTES[1]} hasta={1}>
              <p className="rotulo">{t.tres.rotulo}</p>
              <h2 className="titulo-instrumento text-display text-texto mt-3 max-w-[14ch] text-balance md:mt-5">{t.tres.titular}</h2>
              <Kpi rotulo={t.tres.kpi} valor={R.sitios} activa={acto === 2} contexto={t.tres.contexto(dia(R.sol_puesta_utc))} />
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">{cta}</div>
            </Acto>
          </div>

          {/* Lectura del instante y progreso de actos, siempre visibles */}
          <div className="absolute inset-x-(--margen) bottom-4 flex items-end justify-between gap-4">
            <p className="text-dato-sm text-texto font-mono" data-dato>
              <time dateTime={utc}>{fechaHora(utc)}</time> <span className="text-texto-2">{T.utc}</span>
              <span className="text-texto-3 max-sm:hidden"> · {horaLocal(horaLima(utc))}</span>
              <span className="text-texto-3 mt-0.5 block font-sans text-[0.75rem]">
                {acto < 2 ? t.sigue : T.inicio.datosReales}<span className="max-md:hidden"> · {T.cielo.relieve}</span>
              </span>
            </p>
            <nav aria-label={t.progreso} className="flex shrink-0 gap-1.5">
              {[0, 1, 2].map((n) => (
                <button key={n} type="button" onClick={() => irA(n)} aria-label={t.ir(n + 1)} aria-current={acto === n ? "step" : undefined}
                  className="group flex h-11 w-9 items-center justify-center">
                  <span className={unir("h-1 rounded-full transition-[width,background-color] duration-(--dur-corta) ease-salida", acto === n ? "bg-texto w-8" : "bg-texto/30 group-hover:bg-texto/60 w-4")} />
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
