import { m, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import muestra from "../../assets/hero-shackleton.json";
import { useCifraAlEntrar } from "../../hooks/useCifraAlEntrar";
import { useDimensiones } from "../../hooks/useDimensiones";
import { useEfemerides } from "../../hooks/useEfemerides";
import { useDesde } from "../../hooks/useMedia";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { DATOS, ESCENA, GRADOS_VUELTA, HERO, MOVIMIENTO, MS_POR_HORA, PORTADA, RELATO } from "../../lib/constants";
import { lupa } from "../../lib/escalas";
import { aMs, aUtc, fechaHora, horaLima, limitar, soloFecha } from "../../lib/fechas";
import { grados, horas } from "../../lib/formato";
import { interpolarFila } from "../../lib/interpolar";
import { centroDeVista } from "../../lib/portada";
import { actoDe, instanteDelRelato } from "../../lib/relato";
import { fijarInstanteGlobal } from "../../lib/relojGlobal";
import { NOMBRE_ASTRO, T, horaLocal } from "../../lib/textos";
import type { Efemerides } from "../../lib/tipos";
import { crearPaisaje, leerColores, pintarEscena, semillaDe, type Colores } from "../cielo/lienzoLunar";
import { unir } from "../ui/clases";

const FILAS_MES = (muestra as Efemerides).filas; // diciembre de 2026 cada 3 h (mismo CSV que la API): respaldo mientras llega
const R = muestra.resumen; // hechos del periodo calculados con las filas horarias del CSV (coinciden con /api/metricas)
const ASTROS = ["sol", "tierra"] as const;
const { CORTES } = RELATO;
const TRAMOS = [0, ...CORTES, 1];
const TITULAR = "titulo-instrumento text-titulo text-texto mt-2 max-w-[22ch] text-balance md:mt-3";

/** Bloque de un acto: entra y sale con el scroll (opacidad y un desplazamiento corto), nunca con un temporizador. */
function Acto({ progreso, desde, hasta, children }: { progreso: MotionValue<number>; desde: number; hasta: number; children: ReactNode }) {
  // Entrada y salida en tramos disjuntos: el acto anterior termina de irse justo cuando empieza a entrar el siguiente.
  const { MARGEN, DESPLAZAMIENTO_PX } = RELATO.ACTO;
  const [entra, sale] = [desde > 0, hasta < 1];
  const puntos = [...(entra ? [desde, desde + MARGEN] : [0]), ...(sale ? [hasta - MARGEN, hasta] : [1])];
  const opacity = useTransform(progreso, puntos, [...(entra ? [0, 1] : [1]), ...(sale ? [1, 0] : [1])]);
  const y = useTransform(progreso, puntos, [...(entra ? [DESPLAZAMIENTO_PX, 0] : [0]), ...(sale ? [0, -DESPLAZAMIENTO_PX] : [0])]);
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? "auto" : "none"));
  return <m.div style={{ opacity, y, pointerEvents }} className="absolute inset-x-0 top-0 motion-reduce:transform-none!">{children}</m.div>;
}

/** Cifra del acto: cuenta una vez al entrar su acto; debajo, con qué se compara y por qué importa. */
function Kpi({ rotulo, valor, total, contexto, activa, tono }: { rotulo: string; valor: number; total: number; contexto: string; activa: boolean; tono: "sol" | "tierra" }) {
  const formato = useCallback((v: number) => String(Math.round(v)).padStart(String(valor).length, " "), [valor]);
  const ref = useCifraAlEntrar<HTMLSpanElement>(valor, formato, activa);
  return (
    <div className="mt-4 md:mt-6">
      <p className="rotulo">{rotulo}</p>
      <p className="mt-1.5 font-mono whitespace-nowrap" data-dato>
        <span ref={ref} className={unir("text-dato-xl font-medium tabular-nums", tono === "sol" ? "text-sol" : "text-tierra")}>{valor}</span>
        <span className="text-dato text-texto-2"> {T.inicio.relato.de(horas(total))}</span>
      </p>
      <div aria-hidden="true" className="bg-texto/10 mt-3 h-1 overflow-hidden rounded-full">
        <div className={unir("h-full origin-left rounded-full transition-transform duration-(--dur-larga) ease-salida motion-reduce:transition-none", tono === "sol" ? "bg-sol" : "bg-tierra")}
          style={{ transform: `scaleX(${activa ? valor / total : 0})` }} />
      </div>
      <p className="text-apoyo text-texto-2 mt-3">{contexto}</p>
    </div>
  );
}

/**
 * Relato inmersivo bajo la portada: tres actos sobre una escena fija. El desplazamiento hace avanzar el cielo real
 * de Shackleton (efeméride de la API, de diciembre de 2026 a la puesta del Sol de enero de 2027):
 * 1 · el Sol no se pone; 2 · la Tierra sí se esconde; 3 · el Sol también se pone: elige dónde aterrizar.
 */
export default function RelatoInicio({ cta }: { cta: ReactNode }) {
  const t = T.inicio.relato;
  const a = T.inicio.actos;
  const seccion = useRef<HTMLElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const colores = useRef<Colores | null>(null);
  const reloj = useRef<HTMLTimeElement>(null);
  const relojLima = useRef<HTMLSpanElement>(null);
  const etiquetas = useRef<Record<(typeof ASTROS)[number], HTMLParagraphElement | null>>({ sol: null, tierra: null });
  const [refCaja, { ancho, alto }] = useDimensiones<HTMLDivElement>();
  const esEscritorio = useDesde("md");
  const reducido = useMovimientoReducido();
  const { scrollYProgress } = useScroll({ target: seccion, offset: ["start start", "end end"] });
  const [acto, setActo] = useState(0);
  const paisaje = useMemo(() => crearPaisaje(semillaDe(DATOS.SITIO_DESTACADO)), []);

  // Posiciones reales: dos meses de la API, hora a hora. Mientras llega el primero, las filas de diciembre que viajan con la app.
  const dic = useEfemerides(DATOS.SITIO_DESTACADO, RELATO.TRAMOS[0]);
  const ene = useEfemerides(DATOS.SITIO_DESTACADO, RELATO.TRAMOS[1]);
  const filas = useMemo(() => {
    const [d, e] = [dic.data?.filas, ene.data?.filas];
    return d?.length ? [...d, ...(e?.length ? e.slice(1) : [])] : FILAS_MES;
  }, [dic.data, ene.data]);
  // Hitos del relato: salida y puesta de la Tierra y, si ya llegó enero, la puesta del Sol; si no, el último instante con filas.
  const hitos = useMemo(() => {
    const fin = aMs(filas[filas.length - 1].utc);
    return [aMs(filas[0].utc), aMs(R.tierra_salida_utc), aMs(R.tierra_puesta_utc), Math.max(aMs(R.tierra_puesta_utc), Math.min(fin, aMs(R.sol_puesta_utc)))];
  }, [filas]);

  const tamano = esEscritorio ? "escritorio" : "movil";
  const astros = PORTADA.ASTROS[tamano];
  const yHorizonte = Math.round(alto * RELATO.HORIZONTE_FRACCION[tamano]);
  const ventana = HERO.RELATO.VENTANA_DEG[tamano];
  const ppd = ancho / ventana;
  // La Tierra queda a la derecha, lejos del texto; el Sol cruza la vista a lo largo del relato.
  const azTierra = interpolarFila(filas, (hitos[1] + hitos[2]) / 2).tierra_az_deg;
  const centro = centroDeVista(azTierra + GRADOS_VUELTA / 2, azTierra, ventana, RELATO.TIERRA_FRACCION_X[tamano], 0);
  const escalaPx = Math.min(yHorizonte * 0.5, PORTADA.LUPA_MAX_PX);
  const yDe = useCallback((el: number) => yHorizonte - lupa(el) * escalaPx, [yHorizonte, escalaPx]);

  const pendiente = useRef(0);
  const horaPintada = useRef(Number.NaN);
  const pintar = useCallback(
    (p: number) => {
      cancelAnimationFrame(pendiente.current);
      pendiente.current = requestAnimationFrame(() => {
        const el = lienzo.current;
        const ctx = el?.getContext("2d");
        if (!el || !ctx || !ancho) return;
        const dpr = Math.min(window.devicePixelRatio || 1, ESCENA.DPR_MAX);
        if (el.width !== Math.round(ancho * dpr) || el.height !== Math.round(alto * dpr)) {
          el.width = Math.round(ancho * dpr);
          el.height = Math.round(alto * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        colores.current ??= leerColores(el);
        const ms = instanteDelRelato(p, hitos);
        const pos = interpolarFila(filas, ms);
        pintarEscena(ctx, { ancho, alto, yHorizonte, ppd, centro, yDe, incertidumbre: 0, astros }, pos, paisaje, colores.current);
        // Rótulos que siguen a los astros y lectura de la hora: se escriben en el DOM sin pasar por React.
        for (const astro of ASTROS) {
          const nodo = etiquetas.current[astro];
          if (!nodo) continue;
          const elev = pos[`${astro}_el_deg`];
          const delta = ((pos[`${astro}_az_deg`] - centro + 540) % GRADOS_VUELTA) - 180;
          const x = ancho / 2 + delta * ppd;
          const radio = astro === "sol" ? astros.radioSol : astros.radioTierra;
          const yRotulo = elev > 0 ? yDe(elev) - radio - HERO.RELATO.ROTULO.SOBRE_PX : yDe(elev) + radio + HERO.RELATO.ROTULO.BAJO_PX;
          nodo.style.transform = `translate(${limitar(x, PORTADA.ROTULO_MARGEN_PX, ancho - PORTADA.ROTULO_MARGEN_PX)}px, ${yRotulo}px) translateX(-50%)`;
          nodo.style.opacity = x > 0 && x < ancho ? "1" : "0";
          const texto = `${NOMBRE_ASTRO[astro].toUpperCase()} ${grados(elev, 1, true)}`;
          if (nodo.textContent !== texto) nodo.textContent = texto;
        }
        const hora = Math.round(ms / MS_POR_HORA) * MS_POR_HORA;
        if (hora === horaPintada.current) return;
        horaPintada.current = hora;
        const utc = aUtc(hora);
        if (reloj.current) {
          reloj.current.dateTime = utc;
          reloj.current.textContent = fechaHora(utc);
        }
        if (relojLima.current) relojLima.current.textContent = horaLocal(horaLima(utc));
        if (p > 0) fijarInstanteGlobal(utc); // el reloj de la cabecera sigue al relato desde que se empieza a recorrer
      });
    },
    [ancho, alto, yHorizonte, ppd, centro, yDe, paisaje, filas, hitos, astros],
  );
  useEffect(() => {
    pintar(scrollYProgress.get());
    return () => cancelAnimationFrame(pendiente.current);
  }, [pintar, scrollYProgress]);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    pintar(p);
    setActo(actoDe(p));
  });

  const irA = (n: number) => {
    const el = seccion.current;
    if (!el) return;
    const recorrido = el.offsetHeight - window.innerHeight;
    const top = el.getBoundingClientRect().top + window.scrollY + recorrido * (TRAMOS[n] + RELATO.SALTO);
    window.scrollTo({ top, behavior: reducido ? "auto" : "smooth" });
  };
  const inicial = aUtc(hitos[0]);
  const puestaSol = R.sol_puesta_utc;

  return (
    <section ref={seccion} aria-label={t.progreso} className="bg-vacio relative" style={{ height: `${RELATO.ALTO_SVH}svh` }}>
      <div ref={refCaja} className="sticky top-(--nav-alto-movil) h-[calc(100svh-var(--nav-alto-movil)-var(--barra-inferior-alto))] min-h-[35rem] overflow-hidden md:top-(--nav-alto) md:h-[calc(100svh-var(--nav-alto))]">
        <canvas ref={lienzo} role="img" aria-label={t.escena(soloFecha(RELATO.TRAMOS[0].desde), soloFecha(puestaSol))} className="absolute inset-0 size-full" />
        {ASTROS.map((astro) => (
          <p key={astro} ref={(n) => { etiquetas.current[astro] = n; }} aria-hidden="true"
            className={unir("pointer-events-none absolute top-0 left-0 font-mono text-[12px] font-medium whitespace-nowrap opacity-0 [text-shadow:0_0_4px_var(--color-vacio),0_0_10px_var(--color-vacio)] transition-opacity duration-(--dur-corta)", astro === "sol" ? "text-sol" : "text-tierra")} />
        ))}

        <div className="contenedor relative h-full pt-5 md:pt-[7svh]">
          {/* Los actos van sobre un velo opaco: el Sol cruza por detrás y el texto se lee siempre. */}
          <div className="relative w-full max-w-md">
            <Acto progreso={scrollYProgress} desde={0} hasta={CORTES[0]}>
              <div className="bg-velo border-texto/8 rounded-lg border p-4 md:p-5">
                <p className="rotulo">{t.uno.rotulo}</p>
                <h2 className={TITULAR}>{t.uno.titular.antes}<span className="text-sol">{t.uno.titular.acento}</span>{t.uno.titular.despues}</h2>
                <Kpi rotulo={t.uno.kpi} valor={R.horas_sol} total={R.horas_total} activa={acto === 0} tono="sol"
                  contexto={a.uno.contexto(grados(R.sol_el_min_deg, 2, true), grados(R.sol_el_max_deg, 2, true))} />
              </div>
            </Acto>
            <Acto progreso={scrollYProgress} desde={CORTES[0]} hasta={CORTES[1]}>
              <div className="bg-velo border-texto/8 rounded-lg border p-4 md:p-5">
                <p className="rotulo">{t.dos.rotulo}</p>
                <h2 className={TITULAR}>{t.dos.titular.antes}<span className="text-tierra">{t.dos.titular.acento}</span>{t.dos.titular.despues}</h2>
                <Kpi rotulo={t.dos.kpi} valor={R.horas_tierra} total={R.horas_total} activa={acto === 1} tono="tierra"
                  contexto={a.dos.contexto(a.momento(R.tierra_salida_utc), a.momento(R.tierra_puesta_utc), horas(R.horas_total - R.horas_tierra))} />
              </div>
            </Acto>
            <Acto progreso={scrollYProgress} desde={CORTES[1]} hasta={1}>
              <div className="bg-velo border-texto/8 rounded-lg border p-4 md:p-5">
                <p className="rotulo">{t.tres.rotulo}</p>
                <h2 className={TITULAR}>{t.tres.titular}</h2>
                <div className="mt-4 md:mt-6">
                  <p className="rotulo">{t.tres.kpi}</p>
                  <p className="text-dato-lg text-sol mt-1.5 font-mono font-medium" data-dato>
                    <time dateTime={puestaSol}>{fechaHora(puestaSol)}</time> <span className="text-dato text-texto-2 font-normal">{T.utc}</span>
                    <span className="text-dato-sm text-texto-2 block font-normal">{horaLocal(horaLima(puestaSol))}</span>
                  </p>
                  <p className="text-apoyo text-texto-2 mt-3">{a.tres.contexto(a.momento(puestaSol))}</p>
                </div>
                <div className="mt-4">{cta}</div>
              </div>
            </Acto>
          </div>

          {/* Lectura del instante y progreso de actos, siempre visibles */}
          <div className="absolute inset-x-(--margen) bottom-4 flex items-end justify-between gap-3 max-md:bottom-5">
            <div className="bg-velo border-texto/8 min-w-0 rounded-lg border px-4 py-3">
              <p className="rotulo">{T.inicio.hero.instante}</p>
              <p className="text-dato text-texto mt-1.5 font-mono font-medium" data-dato>
                <time ref={reloj} dateTime={inicial}>{fechaHora(inicial)}</time> <span className="text-texto-2">{T.utc}</span>
                <span ref={relojLima} className="text-dato-sm text-texto-2 block font-normal">{horaLocal(horaLima(inicial))}</span>
              </p>
              <p className="text-texto-2 max-w-medida mt-1.5 text-[0.75rem]">{t.sigue} {T.avisoHorizonteCorto} {t.nota}</p>
            </div>
            <nav aria-label={t.progreso} className="flex shrink-0 gap-1">
              {[0, 1, 2].map((n) => (
                <button key={n} type="button" onClick={() => irA(n)} aria-label={t.ir(n + 1)} aria-current={acto === n ? "step" : undefined}
                  className="group flex h-11 w-8 items-center justify-center">
                  <span className={unir("bg-texto h-1 w-6 origin-center rounded-full transition-[opacity,transform] duration-(--dur-corta) ease-salida", acto === n ? "opacity-100" : "scale-x-50 opacity-40 group-hover:opacity-70")} />
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
