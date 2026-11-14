import { ChevronLeft, ChevronRight } from "lucide-react";
import { animate, m, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useDimensiones } from "../../hooks/useDimensiones";
import { useAltoVentana, useDesde } from "../../hooks/useMedia";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { useValorMotion } from "../../hooks/useValorMotion";
import { CLAVE_AZIMUT, CLAVE_ELEVACION, sobreHorizonte } from "../../lib/astro";
import { GRADOS_VUELTA, MOVIMIENTO, PANORAMA } from "../../lib/constants";
import { desenrollar, diferenciaAngular, elevacionAY, escalaMixta, normalizarAz } from "../../lib/escalas";
import { limitar } from "../../lib/fechas";
import { grados } from "../../lib/formato";
import { indiceEn, interpolarFila } from "../../lib/interpolar";
import { NOMBRE_ASTRO, T, describirCielo } from "../../lib/textos";
import type { Astro, FilaEfemeride, Utc } from "../../lib/tipos";
import { GlifoAstro, SolSvg, TierraSvg } from "../glifos/Astros";
import { useAnclaHorizonte } from "../layout/horizonteContexto";
import { clasesBoton, unir } from "../ui/clases";

const COPIAS = [-1, 0, 1]; // el mundo de 360° se dibuja tres veces: la vista puede girar sin costuras
const ASTROS: readonly Astro[] = ["tierra", "sol"];
const TRAZO: Record<Astro, string> = { sol: "stroke-sol", tierra: "stroke-tierra" };
const COLOR_TEXTO: Record<Astro, string> = { sol: "text-sol", tierra: "text-tierra" };
const S = 1000;

export type Escala = "lupa" | "lineal";

/**
 * Vista principal del cielo: panorama de 360° con el azimut en horizontal y la elevación en vertical con
 * escala de lupa (el tramo 0–5° ocupa buena parte de la altura, porque en el polo los astros viven ahí).
 * Arriba de la línea, el cielo; debajo, el regolito, donde los astros ocultos se dibujan como fantasmas.
 */
export function PanoramaCielo({ filas, t, tUtc, escala, alPulsarTecla, idTitulo }: {
  filas: readonly FilaEfemeride[]; t: MotionValue<number>; tUtc: Utc; escala: Escala;
  alPulsarTecla: (e: KeyboardEvent, girar: (grados: number) => void) => void; idTitulo: string;
}) {
  const id = useId();
  const reducido = useMovimientoReducido();
  const esTableta = useDesde("md");
  const esEscritorio = useDesde("lg");
  const [refCaja, { ancho }] = useDimensiones<HTMLDivElement>();
  const ventana = PANORAMA.VENTANA_DEG[esEscritorio ? "escritorio" : esTableta ? "tableta" : "movil"];
  const altoVentana = useAltoVentana();
  const limites = PANORAMA.ALTO_PX[esTableta ? "escritorio" : "movil"];
  const alto = Math.round(limitar(altoVentana * limites.fraccion, limites.min, limites.max));
  const ppd = ancho / ventana; // píxeles por grado de azimut
  const yHorizonte = Math.round(alto * PANORAMA.HORIZONTE_FRACCION);
  const altoCielo = yHorizonte - PANORAMA.MARGEN_SUPERIOR_PX;
  const altoSubsuelo = alto - yHorizonte - PANORAMA.MARGEN_INFERIOR_PX;

  // Mezcla lupa (0) ↔ lineal (1), animada: ver «caer» el Sol al pasar a lineal es el argumento del proyecto.
  const mezcla = useMotionValue(escala === "lineal" ? 1 : 0);
  const [mz, setMz] = useState(mezcla.get());
  useMotionValueEvent(mezcla, "change", setMz);
  useEffect(() => {
    const destino = escala === "lineal" ? 1 : 0;
    if (reducido) return mezcla.set(destino);
    const control = animate(mezcla, destino, { duration: MOVIMIENTO.MEDIA / S, ease: MOVIMIENTO.EASE_SALIDA });
    return () => control.stop();
  }, [escala, mezcla, reducido]);
  const yDe = useMemo(() => elevacionAY(escalaMixta(mz), yHorizonte, altoCielo, altoSubsuelo), [mz, yHorizonte, altoCielo, altoSubsuelo]);

  // Posición continua de los astros y giro de la mirada.
  const posicion = useTransform(t, (ms) => interpolarFila(filas, ms));
  const lectura = useValorMotion(posicion);
  const centro = useMotionValue(lectura.sol_az_deg);
  const xMundo = useTransform(centro, (c) => ancho / 2 - normalizarAz(c) * ppd);
  const x: Record<Astro, MotionValue<number>> = {
    sol: useTransform(posicion, (p) => p.sol_az_deg * ppd),
    tierra: useTransform(posicion, (p) => p.tierra_az_deg * ppd),
  };
  const yContinua = (astro: Astro) => () =>
    elevacionAY(escalaMixta(mezcla.get()), yHorizonte, altoCielo, altoSubsuelo)(posicion.get()[CLAVE_ELEVACION[astro]]);
  const y: Record<Astro, MotionValue<number>> = { sol: useTransform(yContinua("sol")), tierra: useTransform(yContinua("tierra")) };

  // Posición en pantalla (no en el mundo): las etiquetas se dibujan UNA vez, acotadas a los bordes, y no se
  // parten en la costura de 360°. Fuera de la ventana visible (móvil y tableta) el valor supera `ancho`.
  const xEnPantalla = (astro: Astro) => () => {
    const periodo = GRADOS_VUELTA * ppd;
    if (!periodo) return 0;
    return (((posicion.get()[CLAVE_AZIMUT[astro]] * ppd + xMundo.get()) % periodo) + periodo) % periodo;
  };
  const xPantalla: Record<Astro, MotionValue<number>> = { sol: useTransform(xEnPantalla("sol")), tierra: useTransform(xEnPantalla("tierra")) };
  const centroLeido = useValorMotion(centro);

  const girarA = useCallback(
    (destino: number, duracion: number = MOVIMIENTO.CORTA) => {
      if (reducido) centro.set(destino);
      else animate(centro, destino, { duration: duracion / S, ease: MOVIMIENTO.EASE_SALIDA });
    },
    [centro, reducido],
  );
  const girar = useCallback((g: number) => girarA(centro.get() + g), [centro, girarA]);
  const centrarEn = (astro: Astro) => {
    const actual = centro.get();
    const objetivo = lectura[CLAVE_AZIMUT[astro]];
    girarA(actual + (((objetivo - actual + 540) % GRADOS_VUELTA) - 180)); // por el camino corto
  };
  // Al cargar otro sitio o periodo, la vista se centra en el Sol.
  useEffect(() => centro.set(interpolarFila(filas, t.get()).sol_az_deg), [filas]); // eslint-disable-line react-hooks/exhaustive-deps

  // Arrastre con inercia corta (WCAG 2.5.7: los botones de giro son la alternativa sin arrastre).
  const arrastre = useRef<{ x: number; t: number; v: number } | null>(null);
  const alBajar = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    centro.stop();
    arrastre.current = { x: e.clientX, t: e.timeStamp, v: 0 };
  };
  const alMover = (e: PointerEvent<HTMLDivElement>) => {
    const a = arrastre.current;
    if (!a || !ppd) return;
    const dx = e.clientX - a.x;
    const dt = Math.max(1, e.timeStamp - a.t);
    centro.set(centro.get() - dx / ppd);
    arrastre.current = { x: e.clientX, t: e.timeStamp, v: -dx / ppd / dt };
  };
  const alSoltar = () => {
    const a = arrastre.current;
    arrastre.current = null;
    if (a && !reducido && Math.abs(a.v) > 0.02) girarA(centro.get() + a.v * MOVIMIENTO.INERCIA_MAX * 0.5, MOVIMIENTO.INERCIA_MAX);
  };

  // Rastro: trayectoria de las ±12 h alrededor del instante (hacia dónde se mueve cada astro).
  const i0 = indiceEn(filas, t.get());
  const rastros = useMemo(() => {
    const tramo = filas.slice(Math.max(0, i0 - PANORAMA.RASTRO_HORAS), i0 + PANORAMA.RASTRO_HORAS + 1);
    return ASTROS.map((astro) => {
      const az = desenrollar(tramo.map((f) => f[CLAVE_AZIMUT[astro]]));
      // ancla el tramo desenrollado en el azimut real (0…360) de la fila actual
      const ancla = filas[i0][CLAVE_AZIMUT[astro]] - az[Math.min(i0, PANORAMA.RASTRO_HORAS)];
      return { astro, d: tramo.map((f, k) => `${k ? "L" : "M"}${((az[k] + ancla) * ppd).toFixed(1)} ${yDe(f[CLAVE_ELEVACION[astro]]).toFixed(1)}`).join("") };
    });
  }, [filas, i0, ppd, yDe, tUtc]); // eslint-disable-line react-hooks/exhaustive-deps

  const ancla = useAnclaHorizonte("linea");
  // Marcas de elevación: se descartan las que quedarían pegadas a otra (prioridad a las cercanas al horizonte).
  const marcas = useMemo(() => {
    const visibles: number[] = [];
    const candidatas = escala === "lupa" ? PANORAMA.MARCAS_ELEVACION : PANORAMA.MARCAS_ELEVACION_LINEAL;
    for (const e of [...candidatas].filter((v) => v !== 0).sort((a, b) => Math.abs(a) - Math.abs(b))) {
      if (visibles.every((v) => Math.abs(yDe(v) - yDe(e)) >= PANORAMA.SEPARACION_MARCAS_PX) && Math.abs(yDe(e) - yHorizonte) >= PANORAMA.SEPARACION_MARCAS_PX) visibles.push(e);
    }
    return visibles;
  }, [escala, yDe, yHorizonte]);
  const { ANCHO_MAX_PX, ANCHO_MIN_PX, HASTA_DEG, ALTO_PX } = PANORAMA.RESPLANDOR;
  const fRasante = Math.min(1, Math.max(0, lectura.sol_el_deg / HASTA_DEG));
  const rxRasante = (ANCHO_MAX_PX - (ANCHO_MAX_PX - ANCHO_MIN_PX) * fRasante) / 2;
  const marcasAz = Array.from({ length: GRADOS_VUELTA / PANORAMA.MARCA_AZIMUT_CADA }, (_, k) => k * PANORAMA.MARCA_AZIMUT_CADA);

  const etiqueta = (astro: Astro) => {
    const el = lectura[CLAVE_ELEVACION[astro]];
    const texto = T.cielo.etiqueta(NOMBRE_ASTRO[astro], grados(lectura[CLAVE_AZIMUT[astro]], 1), grados(el, 2, true));
    return sobreHorizonte(el) ? texto : `${texto} ${T.cielo.bajo}`;
  };
  const botonGiro = clasesBoton("secundario", "bg-vacio/80 px-0 border-linea");

  return (
    <figure className="m-0">
      <div
        ref={refCaja}
        tabIndex={0}
        role="group"
        aria-roledescription={T.cielo.rol}
        aria-labelledby={idTitulo}
        aria-describedby={`${id}-desc`}
        aria-keyshortcuts={T.cielo.teclas}
        onKeyDown={(e) => alPulsarTecla(e, girar)}
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        onWheel={(e) => Math.abs(e.deltaX) > Math.abs(e.deltaY) && ppd && centro.set(centro.get() + e.deltaX / ppd)}
        className="relative cursor-grab touch-pan-y overflow-hidden select-none active:cursor-grabbing"
        style={{ height: alto }}
      >
        {ancho > 0 && (
          <svg role="img" aria-labelledby={idTitulo} aria-describedby={`${id}-desc`} width={ancho} height={alto} className="block">
            <defs>
              <filter id={`${id}-halo`} x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation={8} /></filter>
              {/* Lo que cruza la costura de 360° se desvanece en los bordes en vez de cortarse */}
              <linearGradient id={`${id}-fundido`}>
                <stop offset="0" stopColor="black" />
                <stop offset={PANORAMA.DIFUMINADO_BORDE_PX / ancho} stopColor="white" />
                <stop offset={1 - PANORAMA.DIFUMINADO_BORDE_PX / ancho} stopColor="white" />
                <stop offset="1" stopColor="black" />
              </linearGradient>
              <mask id={`${id}-bordes`} maskUnits="userSpaceOnUse" x={0} y={0} width={ancho} height={alto}>
                <rect width={ancho} height={alto} fill={`url(#${id}-fundido)`} />
              </mask>
              <radialGradient id={`${id}-rasante`}>
                <stop offset="0" className="[stop-color:var(--color-sol)]" stopOpacity="0.45" />
                <stop offset="1" className="[stop-color:var(--color-sol)]" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect x={0} y={yHorizonte} width={ancho} height={alto - yHorizonte} className="fill-regolito" />

            {/* Eje de elevación: líneas a todo el ancho con su cota a la izquierda */}
            <g aria-hidden="true">
              {marcas.map((e) => (
                <g key={e} transform={`translate(0 ${yDe(e)})`}>
                  <line x1={0} x2={ancho} className="stroke-linea" strokeDasharray="1 6" />
                  <text x={6} y={-4} className="fill-texto-3 font-mono text-[12px]">{grados(e, 0, true)}</text>
                </g>
              ))}
            </g>

            <g mask={`url(#${id}-bordes)`}>
            <m.g style={{ x: xMundo }}>
              {COPIAS.map((k) => (
                <g key={k} transform={`translate(${k * GRADOS_VUELTA * ppd} 0)`}>
                  {/* Eje de azimut: marcas cada 15° y cardinales bajo la línea */}
                  <g aria-hidden="true">
                    {marcasAz.map((az) => (
                      <line key={az} x1={az * ppd} x2={az * ppd} y1={yHorizonte} y2={yHorizonte + (az % 90 === 0 ? 9 : 5)} className="stroke-horizonte" />
                    ))}
                    {PANORAMA.CARDINALES.map(({ deg, letra }) => (
                      <text key={letra} x={deg * ppd} y={yHorizonte + 24} textAnchor="middle" className="fill-texto-2 font-mono text-[12px]">
                        {letra} {deg}°
                      </text>
                    ))}
                  </g>
                  {rastros.map((r) => (
                    <path key={r.astro} d={r.d} className={unir("fill-none", TRAZO[r.astro])} strokeWidth={1.25} strokeDasharray="2 5" opacity={0.75} />
                  ))}
                  {/* Resplandor rasante: más ancho cuanto más bajo está el Sol */}
                  {sobreHorizonte(lectura.sol_el_deg) && (
                    <m.g style={{ x: x.sol }}>
                      <ellipse cy={yHorizonte} rx={rxRasante} ry={ALTO_PX} fill={`url(#${id}-rasante)`} />
                    </m.g>
                  )}
                  <g className="animate-aparecer" style={{ animationDelay: `${MOVIMIENTO.LARGA}ms` }}>
                    {ASTROS.map((astro) => {
                      const oculto = !sobreHorizonte(lectura[CLAVE_ELEVACION[astro]]);
                      const r = astro === "sol" ? PANORAMA.RADIO_SOL : PANORAMA.RADIO_TIERRA;
                      return (
                        <m.g key={astro} style={{ x: x[astro], y: y[astro] }}>
                          {astro === "sol" && !oculto && <circle r={r * 1.7} className="fill-sol" opacity={0.6} filter={`url(#${id}-halo)`} />}
                          {astro === "sol" ? <SolSvg r={r} fantasma={oculto} /> : <TierraSvg r={r} fantasma={oculto} />}
                        </m.g>
                      );
                    })}
                  </g>
                </g>
              ))}
            </m.g>
            </g>
          </svg>
        )}
        {ancho > 0 && ASTROS.map((astro) => (
          <EtiquetaAstro key={astro} texto={etiqueta(astro)} xPantalla={xPantalla[astro]} yGlifo={y[astro]} ancho={ancho} alto={alto}
            radio={astro === "sol" ? PANORAMA.RADIO_SOL : PANORAMA.RADIO_TIERRA}
            debajo={!sobreHorizonte(lectura[CLAVE_ELEVACION[astro]])}
            className={sobreHorizonte(lectura[CLAVE_ELEVACION[astro]]) ? COLOR_TEXTO[astro] : "text-texto-2"} />
        ))}
        {/* Astros fuera de la ventana visible: una flecha en el borde que dice hacia dónde y cuánto girar */}
        {ventana < GRADOS_VUELTA && (
          <div className="pointer-events-none absolute top-8 right-1 left-12 flex flex-col gap-1">
            {ASTROS.slice().reverse().map((astro) => {
              const delta = diferenciaAngular(centroLeido, lectura[CLAVE_AZIMUT[astro]]);
              if (Math.abs(delta) <= ventana / 2) return null;
              const izquierda = delta < 0;
              const cuanto = grados(Math.abs(delta), 0);
              return (
                <button key={astro} type="button" onClick={() => centrarEn(astro)}
                  aria-label={T.cielo.fueraDeVista(NOMBRE_ASTRO[astro], cuanto, izquierda ? "izquierda" : "derecha")}
                  className={unir("bg-vacio/85 border-linea text-dato-sm pointer-events-auto inline-flex min-h-9 items-center gap-1.5 rounded-control border px-2 font-mono",
                    COLOR_TEXTO[astro], izquierda ? "self-start" : "flex-row-reverse self-end")}>
                  {izquierda ? <ChevronLeft aria-hidden="true" className="size-4" /> : <ChevronRight aria-hidden="true" className="size-4" />}
                  <GlifoAstro astro={astro} px={12} />
                  {NOMBRE_ASTRO[astro]} {cuanto}
                </button>
              );
            })}
          </div>
        )}
        {/* Ancla del horizonte continuo: el eje 0° del panorama */}
        <div ref={ancla} aria-hidden="true" className="pointer-events-none absolute inset-x-0 h-px" style={{ top: yHorizonte }} />

        <p className="text-texto-3 pointer-events-none absolute top-1.5 right-2 text-right text-[0.75rem]">
          {escala === "lupa" ? T.cielo.escalaLupa : T.cielo.escalaLineal}
        </p>
        <div className="absolute right-2 bottom-2 flex gap-2">
          {ASTROS.slice().reverse().map((astro) => (
            <button key={astro} type="button" className={botonGiro} aria-label={T.cielo.centrar(NOMBRE_ASTRO[astro])} onClick={() => centrarEn(astro)}>
              <GlifoAstro astro={astro} px={16} />
            </button>
          ))}
          <button type="button" className={botonGiro} aria-label={T.cielo.girarIzq(PANORAMA.GIRO_DEG)} onClick={() => girar(-PANORAMA.GIRO_DEG)}>
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <button type="button" className={botonGiro} aria-label={T.cielo.girarDer(PANORAMA.GIRO_DEG)} onClick={() => girar(PANORAMA.GIRO_DEG)}>
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
      <figcaption id={`${id}-desc`} className="sr-only">{describirCielo(tUtc, filas[i0])}</figcaption>
    </figure>
  );
}

/**
 * Etiqueta de un astro en coordenadas de pantalla: sigue al glifo, pero no se sale por los bordes ni se mete en
 * la esquina de los botones de giro. Si el astro está fuera de la ventana visible, no se dibuja.
 */
function EtiquetaAstro({ texto, xPantalla, yGlifo, ancho, alto, radio, debajo, className }: {
  texto: string; xPantalla: MotionValue<number>; yGlifo: MotionValue<number>; ancho: number; alto: number; radio: number; debajo: boolean; className: string;
}) {
  const { ANCHO_CARACTER_PX, MARGEN_PX, MARGEN_IZQ_PX, SEPARACION_PX, ALTO_PX } = PANORAMA.ETIQUETA;
  const mitad = (texto.length * ANCHO_CARACTER_PX) / 2;
  const x = useTransform(() => limitar(xPantalla.get(), mitad + MARGEN_IZQ_PX, Math.max(mitad + MARGEN_IZQ_PX, ancho - mitad - MARGEN_PX)) - mitad); // a la izquierda viven las cotas
  const y = useTransform(() => {
    const yg = yGlifo.get();
    const abajo = yg + radio + SEPARACION_PX - 4;
    // Bajo el horizonte la etiqueta va debajo del glifo, salvo que caiga en la zona de los botones o fuera del marco.
    const enBotones = x.get() + 2 * mitad > ancho - PANORAMA.ZONA_BOTONES.ANCHO_PX && abajo + ALTO_PX > alto - PANORAMA.ZONA_BOTONES.ALTO_PX;
    return debajo && !enBotones && abajo + ALTO_PX < alto ? abajo : yg - radio - SEPARACION_PX - ALTO_PX + 2;
  });
  const opacity = useTransform(() => (xPantalla.get() > ancho + radio ? 0 : 1));
  return (
    <m.p aria-hidden="true" style={{ x, y, opacity }}
      className={unir("pointer-events-none absolute top-0 left-0 font-mono text-[12px] leading-4 whitespace-nowrap", className)}>
      {texto}
    </m.p>
  );
}
