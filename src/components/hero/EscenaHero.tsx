import { useAnimationFrame } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import datos from "../../assets/hero-shackleton.json";
import { useDimensiones } from "../../hooks/useDimensiones";
import { useDesde } from "../../hooks/useMedia";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { useVisibleEnPantalla } from "../../hooks/useVisibleEnPantalla";
import { sobreHorizonte } from "../../lib/astro";
import { GRADOS_VUELTA, HERO, MOVIMIENTO, PANORAMA } from "../../lib/constants";
import { lupa, normalizarAz } from "../../lib/escalas";
import { aMs, aUtc, fechaHora, horaLima, limitar, redondearHora } from "../../lib/fechas";
import { grados } from "../../lib/formato";
import { trazoAPath, trazoArco } from "../../lib/horizonte";
import { indiceEn, interpolarFila, type PosicionCielo } from "../../lib/interpolar";
import { fijarInstanteGlobal } from "../../lib/relojGlobal";
import { NOMBRE_ASTRO, T, horaLocal } from "../../lib/textos";
import type { Efemerides } from "../../lib/tipos";
import { SolSvg, TierraSvg } from "../glifos/Astros";
import { useApp } from "../layout/contexto";
import { useAnclaHorizonte } from "../layout/horizonteContexto";
import { ContornosRegolito } from "./ContornosRegolito";
import { Transporte } from "../tiempo/Transporte";

const FILAS = (datos as Efemerides).filas;
const T0 = aMs(FILAS[0].utc);
const T1 = aMs(FILAS[FILAS.length - 1].utc);
/** Azimut que queda en el centro del panorama: la Tierra cae a la derecha, lejos del titular. */
const AZ_CENTRO =
  FILAS.reduce((suma, f) => suma + f.tierra_az_deg, 0) / FILAS.length - (HERO.TIERRA_FRACCION_X - 0.5) * GRADOS_VUELTA;
const INTERVALO_LECTURA = 1000 / MOVIMIENTO.REFRESCO_LECTURA_HZ;

interface Lectura extends PosicionCielo {
  ms: number;
}
const leer = (ms: number): Lectura => ({ ms, ...interpolarFila(FILAS, ms) });

/**
 * Primer pliegue: panorama real de 360° del horizonte de Shackleton en diciembre de 2026.
 * El Sol rueda por la línea sin ponerse y la Tierra sale por detrás del limbo a su hora real.
 */
export function EscenaHero({ children }: { children: React.ReactNode }) {
  const reducido = useMovimientoReducido();
  const esEscritorio = useDesde("md");
  const clave = esEscritorio ? "escritorio" : "movil";
  const [refCaja, { ancho, alto }] = useDimensiones<HTMLDivElement>();
  const { ref: refVisible, visible } = useVisibleEnPantalla<HTMLElement>();
  const { modalAbierto } = useApp();
  const id = useId();

  const inicial = reducido ? aMs(HERO.FOTOGRAMA_REDUCIDO) : aMs(HERO.INICIO_RELATO);
  const ms = useRef(inicial);
  const [lectura, setLectura] = useState<Lectura>(() => leer(inicial));
  const [reproduciendo, setReproduciendo] = useState(!reducido);
  const ultimaLectura = useRef(0);
  // Rótulos de los glifos: se ocultan mientras se cruzan con el bloque de texto o se saldrían por un borde.
  const texto = useRef<HTMLDivElement>(null);
  const [rotulos, setRotulos] = useState({ sol: true, gemelo: false, tierra: true });
  useEffect(() => setReproduciendo(!reducido), [reducido]);

  const yHorizonte = Math.round(alto * HERO.HORIZONTE_FRACCION[clave]);
  const curvatura = HERO.CURVATURA_PX[clave];
  const escalaPx = Math.min(yHorizonte * HERO.LUPA_PX.fraccionCielo[clave], HERO.LUPA_PX.max);
  const rSol = HERO.RADIO_SOL[clave];
  const rTierra = HERO.RADIO_TIERRA[clave];

  const xDeAz = useCallback((az: number) => (normalizarAz(az - AZ_CENTRO + GRADOS_VUELTA / 2) / GRADOS_VUELTA) * ancho, [ancho]);
  const yDelArco = useCallback(
    (x: number) => {
      const u = (2 * x) / Math.max(1, ancho) - 1;
      return yHorizonte + curvatura * u * u;
    },
    [ancho, yHorizonte, curvatura],
  );
  const yDe = useCallback((x: number, el: number) => yDelArco(x) - lupa(el) * escalaPx, [yDelArco, escalaPx]);

  // Nodos que se mueven en cada fotograma sin pasar por React.
  const sol = useRef<SVGGElement>(null);
  const solGemelo = useRef<SVGGElement>(null);
  const tierra = useRef<SVGGElement>(null);
  const resplandor = useRef<SVGEllipseElement>(null);
  const degradado = useRef<SVGLinearGradientElement>(null);

  const colocar = useCallback(
    (p: PosicionCielo) => {
      if (!ancho) return;
      const xs = xDeAz(p.sol_az_deg);
      const ys = yDe(xs, p.sol_el_deg);
      sol.current?.setAttribute("transform", `translate(${xs} ${ys})`);
      // Gemelo a una vuelta de distancia: el Sol sale por un borde mientras entra por el otro.
      const xg = xs < ancho / 2 ? xs + ancho : xs - ancho;
      solGemelo.current?.setAttribute("transform", `translate(${xg} ${yDe(Math.min(ancho, Math.max(0, xg)), p.sol_el_deg)})`);
      const xt = xDeAz(p.tierra_az_deg);
      tierra.current?.setAttribute("transform", `translate(${xt} ${yDe(xt, p.tierra_el_deg)})`);
      // Resplandor rasante: cuanto más bajo el Sol, más ancho.
      const { ANCHO_MAX_PX, ANCHO_MIN_PX, HASTA_DEG } = PANORAMA.RESPLANDOR;
      const f = Math.min(1, Math.max(0, p.sol_el_deg / HASTA_DEG));
      resplandor.current?.setAttribute("cx", String(xs));
      resplandor.current?.setAttribute("cy", String(yDelArco(xs)));
      resplandor.current?.setAttribute("rx", String(Math.min(ancho * 0.45, (ANCHO_MAX_PX - (ANCHO_MAX_PX - ANCHO_MIN_PX) * f) / 2)));
      // Degradado de periodo = ancho (360°): el barrido también da la vuelta con el Sol.
      degradado.current?.setAttribute("x1", String(xs - ancho / 2));
      degradado.current?.setAttribute("x2", String(xs + ancho / 2));
    },
    [ancho, xDeAz, yDe, yDelArco],
  );

  const rotulosVisibles = useCallback(
    (p: PosicionCielo) => {
      // Caja que ocupa de verdad el texto (titular, apoyo y botones), relativa a la sección.
      const hijos = [...(texto.current?.children ?? [])].map((h) => h.getBoundingClientRect());
      const base = texto.current?.getBoundingClientRect();
      const derecha = Math.max(0, ...hijos.map((h) => h.right - (base?.left ?? 0))) + (base?.left ?? 0);
      const abajo = Math.max(0, ...hijos.map((h) => h.bottom)) - (texto.current?.closest("section")?.getBoundingClientRect().top ?? 0);
      const libre = (x: number, y: number, r: number) =>
        x > HERO.ROTULO_MEDIO_PX && x < ancho - HERO.ROTULO_MEDIO_PX && !(x - HERO.ROTULO_MEDIO_PX < derecha && y - r - HERO.ROTULO_ALTO_PX < abajo);
      const xs = xDeAz(p.sol_az_deg);
      const xg = xs < ancho / 2 ? xs + ancho : xs - ancho;
      const xt = xDeAz(p.tierra_az_deg);
      return { sol: libre(xs, yDe(xs, p.sol_el_deg), rSol), gemelo: libre(xg, yDe(limitar(xg, 0, ancho), p.sol_el_deg), rSol), tierra: libre(xt, yDe(xt, p.tierra_el_deg), rTierra) };
    },
    [ancho, xDeAz, yDe, rSol, rTierra],
  );

  const mostrar = useCallback(
    (nuevo: number, forzar = false) => {
      ms.current = nuevo;
      const posicion = interpolarFila(FILAS, nuevo);
      colocar(posicion);
      const ahora = performance.now();
      if (forzar || ahora - ultimaLectura.current >= INTERVALO_LECTURA) {
        ultimaLectura.current = ahora;
        setLectura({ ms: nuevo, ...posicion });
        setRotulos(rotulosVisibles(posicion));
      }
    },
    [colocar, rotulosVisibles],
  );
  useEffect(() => mostrar(ms.current, true), [mostrar]);

  const activo = reproduciendo && visible && !modalAbierto && !reducido;
  useAnimationFrame((_, delta) => {
    if (!activo) return;
    const avance = (Math.min(delta, 100) / MOVIMIENTO.HERO_CICLO) * (T1 - T0);
    mostrar(T0 + ((ms.current - T0 + avance) % (T1 - T0)));
  });

  const utc = aUtc(redondearHora(lectura.ms));
  useEffect(() => fijarInstanteGlobal(utc), [utc]);

  const ancla = useAnclaHorizonte("arco");
  const suelo = useMemo(() => {
    if (!ancho) return "";
    const arco = trazoArco({ x: 0, y: yHorizonte, ancho, alto: curvatura });
    return `${trazoAPath(arco)}L${ancho} ${alto}L0 ${alto}Z`;
  }, [ancho, alto, yHorizonte, curvatura]);

  const tierraVisible = sobreHorizonte(lectura.tierra_el_deg);
  const estadoTierra = tierraVisible ? grados(lectura.tierra_el_deg, 1, true) : T.bajoHorizonte.toLowerCase();

  return (
    <section ref={refVisible} className="relative isolate h-[calc(100svh-var(--nav-alto-movil)-var(--barra-inferior-alto))] min-h-[730px] md:h-[calc(100svh-var(--nav-alto))] md:min-h-[640px]">
      <div ref={refCaja} className="absolute inset-0 -z-10 overflow-hidden">
        {ancho > 0 && (
          <svg role="img" aria-label={T.inicio.escena} width={ancho} height={alto} className="block">
            <defs>
              <filter id={`${id}-halo`} x="-300%" y="-300%" width="700%" height="700%">
                <feGaussianBlur stdDeviation={rSol * 1.1} />
              </filter>
              <radialGradient id={`${id}-rasante`}>
                <stop offset="0" className="[stop-color:var(--color-sol)]" stopOpacity="0.4" />
                <stop offset="1" className="[stop-color:var(--color-sol)]" stopOpacity="0" />
              </radialGradient>
              <linearGradient ref={degradado} id={`${id}-barrido`} gradientUnits="userSpaceOnUse" spreadMethod="repeat" y1="0" y2="0">
                <stop offset={0.5 - HERO.BARRIDO.MITAD} className="[stop-color:var(--color-sol)]" stopOpacity="0" />
                <stop offset="0.5" className="[stop-color:var(--color-sol)]" stopOpacity={HERO.BARRIDO.OPACIDAD} />
                <stop offset={0.5 + HERO.BARRIDO.MITAD} className="[stop-color:var(--color-sol)]" stopOpacity="0" />
              </linearGradient>
              <clipPath id={`${id}-cielo`}>
                <path d={`M0 0H${ancho}V${yHorizonte + curvatura}${trazoAPath(trazoArco({ x: 0, y: yHorizonte, ancho, alto: curvatura }).slice().reverse()).replace("M", "L")}Z`} />
              </clipPath>
            </defs>

            {/* Marcas de la escala de lupa, a la derecha */}
            <g aria-hidden="true" className="max-md:hidden">
              {HERO.MARCAS_ELEVACION.map((e) => {
                const y = yDe(ancho, e);
                return (
                  <g key={e}>
                    <line x1={ancho - 14} x2={ancho} y1={y} y2={y} className="stroke-horizonte" />
                    <text x={ancho - 20} y={y + 4} textAnchor="end" className="fill-texto-3 font-mono text-[11px]">{grados(e, 0, true)}</text>
                  </g>
                );
              })}
            </g>

            {/* La Tierra queda recortada por el limbo: asoma por detrás del horizonte al salir */}
            <g clipPath={`url(#${id}-cielo)`}>
              <g ref={tierra}>
                <circle r={rTierra * 1.9} className="fill-tierra" opacity={0.16} filter={`url(#${id}-halo)`} />
                <TierraSvg r={rTierra} />
                <text y={-rTierra - 10} textAnchor="middle" className="fill-tierra font-mono text-[12px]" aria-hidden="true">
                  {tierraVisible && rotulos.tierra ? `${NOMBRE_ASTRO.tierra.toUpperCase()} ${grados(lectura.tierra_el_deg, 1, true)}` : ""}
                </text>
              </g>
            </g>

            <path d={suelo} className="fill-regolito" />
            <ContornosRegolito ancho={ancho} alto={alto} yHorizonte={yHorizonte} curvatura={curvatura} idDegradado={`${id}-barrido`} />
            <ellipse ref={resplandor} ry={PANORAMA.RESPLANDOR.ALTO_PX} fill={`url(#${id}-rasante)`} />

            {[sol, solGemelo].map((ref, i) => (
              <g key={i} ref={ref}>
                <circle r={rSol * 1.6} className="fill-sol" opacity={0.55} filter={`url(#${id}-halo)`} />
                <SolSvg r={rSol} />
                <text y={-rSol - 12} textAnchor="middle" className="fill-sol font-mono text-[12px]" aria-hidden="true">
                  {(i === 0 ? rotulos.sol : rotulos.gemelo) ? `${NOMBRE_ASTRO.sol.toUpperCase()} ${grados(lectura.sol_el_deg, 1, true)}` : ""}
                </text>
              </g>
            ))}

            {/* Cardinales sobre el horizonte: el panorama cubre los 360° */}
            <g aria-hidden="true">
              {PANORAMA.CARDINALES.map(({ deg, letra }) => {
                const x = xDeAz(deg);
                const y = yDelArco(x);
                return (
                  <g key={letra}>
                    <line x1={x} x2={x} y1={y} y2={y + 7} className="stroke-horizonte" />
                    <text x={x} y={y + 21} textAnchor="middle" className="fill-texto-3 font-mono text-[11px]">{letra}</text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>

      {/* Ancla del horizonte continuo: el arco del limbo */}
      <div ref={ancla} aria-hidden="true" className="pointer-events-none absolute inset-x-0" style={{ top: yHorizonte, height: curvatura }} />

      <div className="contenedor flex h-full flex-col">
        <div ref={texto} className="flex flex-col pt-5 md:justify-center md:pt-0" style={{ height: yHorizonte ? yHorizonte - rSol * 3 : "58%" }}>{children}</div>
        <div className="mt-auto pb-4 md:pb-6">
          <p className="text-dato-sm text-texto font-mono" data-dato>
            <time dateTime={utc}>{fechaHora(utc)}</time> <span className="text-texto-2">{T.utc}</span>
            <span className="text-texto-3"> · {horaLocal(horaLima(utc))}</span>
          </p>
          <p className="text-dato-sm mt-1 font-mono" data-dato>
            <span className="text-sol">{NOMBRE_ASTRO.sol.toUpperCase()} {grados(lectura.sol_el_deg, 2, true)}</span>
            <span className="text-texto-3"> · </span>
            <span className={tierraVisible ? "text-tierra" : "text-texto-2"}>{NOMBRE_ASTRO.tierra.toUpperCase()} {estadoTierra}</span>
          </p>
          <div className="mt-3 max-w-3xl">
            <Transporte
              filas={FILAS}
              variante="minima"
              etiqueta={T.inicio.regla}
              control={{
                indice: indiceEn(FILAS, lectura.ms),
                reproduciendo: reproduciendo && !reducido,
                alternar: () => setReproduciendo((v) => !v),
                // Tocar la regla pausa el bucle: desde ahí el mes lo recorre la persona.
                irAIndice: (i) => {
                  setReproduciendo(false);
                  mostrar(aMs(FILAS[i].utc), true);
                },
              }}
            />
          </div>
          <p className="text-texto-3 mt-1 text-[0.6875rem]">{T.inicio.datosReales} {T.inicio.escala}. {T.avisoHorizonteCorto}</p>
        </div>
      </div>
    </section>
  );
}
