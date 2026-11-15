import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useDimensiones } from "../../hooks/useDimensiones";
import { useFilasPortada } from "../../hooks/useFilasPortada";
import { useDesde } from "../../hooks/useMedia";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { useVisibleEnPantalla } from "../../hooks/useVisibleEnPantalla";
import { DATOS, ESCENA, GRADOS_VUELTA, HERO, MS_POR_HORA, PORTADA } from "../../lib/constants";
import { lupa } from "../../lib/escalas";
import { aMs, aUtc, fechaHora, horaLima, limitar, soloFecha } from "../../lib/fechas";
import { grados } from "../../lib/formato";
import { interpolarFila } from "../../lib/interpolar";
import { centroDeVista, fraccionDelCiclo, type DiaPortada } from "../../lib/portada";
import { fijarInstanteGlobal } from "../../lib/relojGlobal";
import { NOMBRE_ASTRO, T, horaLocal } from "../../lib/textos";
import { crearPaisaje, leerColores, pintarEscena, semillaDe, type Colores } from "../cielo/lienzoLunar";
import { useAnclaHorizonte } from "../layout/horizonteContexto";
import { unir } from "../ui/clases";

const ASTROS = ["sol", "tierra"] as const;

/**
 * Portada inmersiva: la escena lunar a pantalla completa recorre en bucle el día real (UTC) de Shackleton, hora a
 * hora, con las posiciones de la efeméride. Es el único elemento que se mueve; el texto y la acción están quietos.
 * Con movimiento reducido la escena se queda en el instante de referencia. Si hoy no tiene datos, se dice cuál se ve.
 */
export function HeroPortada({ dia, hoy, titulo, cta }: { dia: DiaPortada; hoy: string; titulo: ReactNode; cta: ReactNode }) {
  const t = T.inicio.hero;
  const lienzo = useRef<HTMLCanvasElement>(null);
  const colores = useRef<Colores | null>(null);
  const reloj = useRef<HTMLTimeElement>(null);
  const relojLima = useRef<HTMLSpanElement>(null);
  const etiquetas = useRef<Record<(typeof ASTROS)[number], HTMLParagraphElement | null>>({ sol: null, tierra: null });
  const [refCaja, { ancho, alto }] = useDimensiones<HTMLDivElement>();
  const { ref: refSeccion, visible } = useVisibleEnPantalla<HTMLElement>();
  const esEscritorio = useDesde("md");
  const reducido = useMovimientoReducido();
  const paisaje = useMemo(() => crearPaisaje(semillaDe(DATOS.SITIO_DESTACADO)), []);
  const ancla = useAnclaHorizonte("linea");
  const { filas, fallo } = useFilasPortada(dia);

  const [desde, hasta, referencia] = [aMs(dia.desde), aMs(dia.hasta), aMs(dia.referencia)];
  const tamano = esEscritorio ? "escritorio" : "movil";
  const yHorizonte = Math.round(alto * PORTADA.HORIZONTE_FRACCION[tamano]);
  const ventana = HERO.RELATO.VENTANA_DEG[tamano];
  const ppd = ancho / ventana;
  const medio = filas.length ? filas[Math.floor(filas.length / 2)] : null;
  const centro = medio ? centroDeVista(medio.sol_az_deg, medio.tierra_az_deg, ventana, PORTADA.TIERRA_FRACCION_X[tamano]) : 0;
  const escalaPx = Math.min(yHorizonte * 0.5, PORTADA.LUPA_MAX_PX);
  const yDe = useCallback((el: number) => yHorizonte - lupa(el) * escalaPx, [yHorizonte, escalaPx]);

  const horaPintada = useRef(Number.NaN);
  const pintar = useCallback(
    (ms: number) => {
      const el = lienzo.current;
      const ctx = el?.getContext("2d");
      if (!el || !ctx || !ancho || !filas.length) return;
      const dpr = Math.min(window.devicePixelRatio || 1, ESCENA.DPR_MAX);
      if (el.width !== Math.round(ancho * dpr) || el.height !== Math.round(alto * dpr)) {
        el.width = Math.round(ancho * dpr);
        el.height = Math.round(alto * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      colores.current ??= leerColores(el);
      const pos = interpolarFila(filas, ms);
      pintarEscena(ctx, { ancho, alto, yHorizonte, ppd, centro, yDe, incertidumbre: 0 }, pos, paisaje, colores.current);
      // Rótulos que siguen a los astros y lectura de la hora: se escriben en el DOM sin pasar por React.
      for (const astro of ASTROS) {
        const nodo = etiquetas.current[astro];
        if (!nodo) continue;
        const elev = pos[`${astro}_el_deg`];
        const delta = ((pos[`${astro}_az_deg`] - centro + 540) % GRADOS_VUELTA) - 180;
        const x = ancho / 2 + delta * ppd;
        const radio = astro === "sol" ? ESCENA.RADIO_SOL_PX : ESCENA.RADIO_SOL_PX * ESCENA.RAZON_TIERRA_SOL;
        // Sobre el horizonte el rótulo va encima del astro; bajo él, debajo de su fantasma.
        const yRotulo = elev > 0 ? yDe(elev) - radio - HERO.RELATO.ROTULO.SOBRE_PX : yDe(elev) + radio + HERO.RELATO.ROTULO.BAJO_PX;
        nodo.style.transform = `translate(${limitar(x, PORTADA.ROTULO_MARGEN_PX, ancho - PORTADA.ROTULO_MARGEN_PX)}px, ${yRotulo}px) translateX(-50%)`;
        nodo.style.opacity = x > 0 && x < ancho ? "1" : "0";
        const texto = `${NOMBRE_ASTRO[astro].toUpperCase()} ${grados(elev, 1, true)}`;
        if (nodo.textContent !== texto) nodo.textContent = texto; // solo se escribe al cambiar: sin layout por cuadro
      }
      const hora = Math.floor(ms / MS_POR_HORA) * MS_POR_HORA;
      if (hora === horaPintada.current) return;
      horaPintada.current = hora;
      const utc = aUtc(hora);
      if (reloj.current) {
        reloj.current.dateTime = utc;
        reloj.current.textContent = fechaHora(utc);
      }
      if (relojLima.current) relojLima.current.textContent = horaLocal(horaLima(utc));
      fijarInstanteGlobal(utc);
    },
    [ancho, alto, yHorizonte, ppd, centro, yDe, paisaje, filas],
  );

  // El día avanza solo mientras la portada está en pantalla y la pestaña visible; el ciclo se reanuda donde quedó.
  const transcurrido = useRef(0);
  useEffect(() => {
    if (reducido) return pintar(referencia);
    if (!visible) return pintar(desde + fraccionDelCiclo(transcurrido.current) * (hasta - desde));
    let cuadro = 0;
    let previo = performance.now();
    const avanzar = (ahora: number) => {
      transcurrido.current += Math.min(ahora - previo, PORTADA.SALTO_MAX_MS);
      previo = ahora;
      pintar(desde + fraccionDelCiclo(transcurrido.current) * (hasta - desde));
      cuadro = requestAnimationFrame(avanzar);
    };
    cuadro = requestAnimationFrame(avanzar);
    return () => cancelAnimationFrame(cuadro);
  }, [pintar, reducido, visible, desde, hasta, referencia]);

  const inicial = reducido ? dia.referencia : dia.desde;
  const diaVisto = soloFecha(dia.desde);
  return (
    <section ref={refSeccion} className="relative h-[calc(100svh-var(--nav-alto-movil)-var(--barra-inferior-alto))] min-h-[35rem] overflow-hidden md:h-[calc(100svh-var(--nav-alto))]">
      <div ref={refCaja} className="absolute inset-0">
        <canvas ref={lienzo} role="img" aria-label={t.escena(diaVisto)} className="absolute inset-0 size-full" />
        <div ref={ancla} aria-hidden="true" className="pointer-events-none absolute inset-x-0 h-px" style={{ top: yHorizonte }} />
        {ASTROS.map((astro) => (
          <p key={astro} ref={(n) => { etiquetas.current[astro] = n; }} aria-hidden="true"
            className={unir("pointer-events-none absolute top-0 left-0 font-mono text-[12px] font-medium whitespace-nowrap opacity-0 [text-shadow:0_0_4px_var(--color-vacio),0_0_10px_var(--color-vacio)] transition-opacity duration-(--dur-corta)", astro === "sol" ? "text-sol" : "text-tierra")} />
        ))}
      </div>

      <div className="contenedor relative flex h-full flex-col justify-between pt-6 pb-4 max-md:pb-6 md:pt-[9svh]">
        <div>
          <p className="rotulo">{t.lugar(diaVisto)}</p>
          {titulo}
          {/* Alto reservado como el del titular: 3 líneas hasta 419 px (391 px en inglés) y 2 desde ahí. */}
          <p className="text-entrada text-texto-2 mt-4 max-w-[44ch] min-h-[3lh] min-[26.25rem]:min-h-[2lh] min-[24.5rem]:[:lang(en)_&]:min-h-[2lh]">{T.inicio.apoyo}</p>
          <div className="mt-6">{cta}</div>
        </div>

        {/* Lectura del instante: sobre un velo opaco (sin desenfoque: debajo hay un lienzo que se repinta). */}
        <div className="bg-velo border-texto/8 w-fit max-w-full rounded-lg border px-3 py-2">
          <p className="text-dato-sm text-texto font-mono" data-dato>
            <time ref={reloj} dateTime={inicial}>{fechaHora(inicial)}</time> <span className="text-texto-2">{T.utc}</span>
            <span className="text-texto-2"> · <span ref={relojLima}>{horaLocal(horaLima(inicial))}</span></span>
          </p>
          <p className="text-texto-2 max-w-medida mt-1 text-[0.75rem]">
            {fallo ? t.sinEfemeride : dia.fuera ? t.fuera[dia.fuera](hoy, diaVisto) : t.hoy} {T.avisoHorizonteCorto}
          </p>
        </div>
      </div>
    </section>
  );
}
