import { ChevronLeft, ChevronRight } from "lucide-react";
import { animate, m, useMotionValue, useMotionValueEvent, useSpring, useTransform, type MotionValue } from "motion/react";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useDimensiones } from "../../hooks/useDimensiones";
import { useDesde } from "../../hooks/useMedia";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { useValorMotion } from "../../hooks/useValorMotion";
import { CLAVE_AZIMUT, CLAVE_ELEVACION, sobreHorizonte } from "../../lib/astro";
import { ESCENA, GRADOS_VUELTA, MOVIMIENTO, MS_POR_HORA, PANORAMA } from "../../lib/constants";
import { desenrollar, diferenciaAngular, elevacionAY, escalaMixta, normalizarAz } from "../../lib/escalas";
import { limitar } from "../../lib/fechas";
import { grados } from "../../lib/formato";
import { indiceEn, interpolarFila } from "../../lib/interpolar";
import { NOMBRE_ASTRO, T, describirCielo } from "../../lib/textos";
import type { Astro, EventosAstro, FilaEfemeride, Utc } from "../../lib/tipos";
import { GlifoAstro, SolSvg, TierraSvg } from "../glifos/Astros";
import { useAnclaHorizonte } from "../layout/horizonteContexto";
import { ContextoAstro } from "./ContextoAstro";
import { crearPaisaje, leerColores, pintarEscena, semillaDe, type Colores } from "./lienzoLunar";
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
export function PanoramaCielo({ filas, t, tUtc, escala, alPulsarTecla, idTitulo, semilla, alArrastrarTiempo, alSoltarTiempo, incertidumbre = 0, azimutFiable, eventos, altoReservado, accion }: {
  filas: readonly FilaEfemeride[]; t: MotionValue<number>; tUtc: Utc; escala: Escala;
  alPulsarTecla: (e: KeyboardEvent, girar: (grados: number) => void) => void; idTitulo: string;
  /** Texto que fija el paisaje ilustrativo (el id del sitio): cada sitio tiene siempre el mismo relieve. */
  semilla: string;
  /** Arrastrar el suelo mueve el tiempo: recibe el instante en ms mientras se arrastra y al soltar. */
  alArrastrarTiempo: (ms: number) => void; alSoltarTiempo: (ms: number) => void;
  /** Incertidumbre de la proyección en grados (0 = dato de Horizons). */
  incertidumbre?: number;
  /** en una proyección, false donde el azimut no tiene banda acotable: su etiqueta se atenúa y lo avisa */
  azimutFiable?: Record<Astro, boolean>;
  /** Próximo cruce del horizonte de cada astro (para la tarjeta de datos en contexto). */
  eventos?: Record<Astro, EventosAstro> | null;
  /**
   * Alto máximo que alcanzará la escena mientras cambia de tamaño (al entrar o salir de pantalla completa): el
   * lienzo se reserva una vez a ese alto en lugar de volver a crearse en cada fotograma.
   */
  altoReservado?: number;
  /** Botón extra junto a los de centrar y girar (en móvil, el de pantalla completa). */
  accion?: ReactNode;
}) {
  const id = useId();
  const reducido = useMovimientoReducido();
  const esTableta = useDesde("md");
  const esEscritorio = useDesde("lg");
  // La escena llena la caja que la contiene: el alto lo decide quien la coloca (página o pantalla completa).
  const [refCaja, dimensiones] = useDimensiones<HTMLDivElement>({ sincrono: true });
  const ancho = dimensiones.ancho;
  const alto = Math.round(dimensiones.alto);
  const ventana = PANORAMA.VENTANA_DEG[esEscritorio ? "escritorio" : esTableta ? "tableta" : "movil"];
  const ppd = ancho / ventana; // píxeles por grado de azimut
  const reserva = esTableta ? PANORAMA.ZONA_TRANSPORTE_PX : 0;
  const yHorizonte = Math.round(alto * ESCENA.HORIZONTE_FRACCION);
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
  // Manipulación directa, 1:1 con el dedo: arrastrar el CIELO gira la mirada; arrastrar el SUELO mueve el tiempo.
  const arrastre = useRef<{ x: number; t: number; v: number; tiempo: number | null } | null>(null);
  const [zona, setZona] = useState<"cielo" | "suelo">("cielo");
  const [contexto, setContexto] = useState<Astro | null>(null); // astro con la tarjeta de datos abierta
  const msPorPx = ancho ? (ESCENA.HORAS_POR_ANCHO * MS_POR_HORA) / ancho : 0;
  // Profundidad: con ratón, las capas cercanas del suelo se desplazan un poco con el puntero (los astros y el
  // horizonte, que son dato, no se mueven). Decorativo, con muelle; no existe en táctil ni con movimiento reducido.
  const puntero = useMotionValue(0);
  const paralaje = useSpring(puntero, MOVIMIENTO.SPRING_PARALAJE);
  const alBajar = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest("button, input, [data-transporte]")) return;
    setContexto(null); // tocar la escena cierra la tarjeta (en táctil no hay «salir» del astro)
    e.currentTarget.setPointerCapture(e.pointerId);
    centro.stop();
    const enSuelo = e.clientY - e.currentTarget.getBoundingClientRect().top > yHorizonte;
    arrastre.current = { x: e.clientX, t: e.timeStamp, v: 0, tiempo: enSuelo ? t.get() : null };
  };
  const alMover = (e: PointerEvent<HTMLDivElement>) => {
    const a = arrastre.current;
    if (!a) {
      const caja = e.currentTarget.getBoundingClientRect();
      setZona(e.clientY - caja.top > yHorizonte ? "suelo" : "cielo");
      if (e.pointerType === "mouse" && !reducido && caja.width) puntero.set(((e.clientX - caja.left) / caja.width) * 2 - 1);
      return;
    }
    if (!ppd) return;
    const dx = e.clientX - a.x;
    if (a.tiempo !== null) {
      a.tiempo += dx * msPorPx; // hacia la derecha, el tiempo avanza
      a.x = e.clientX;
      alArrastrarTiempo(a.tiempo);
      return;
    }
    const dt = Math.max(1, e.timeStamp - a.t);
    centro.set(centro.get() - dx / ppd);
    arrastre.current = { ...a, x: e.clientX, t: e.timeStamp, v: (-dx / ppd / dt) * 1000 }; // grados por segundo
  };
  const alSoltar = () => {
    const a = arrastre.current;
    arrastre.current = null;
    if (!a) return;
    if (a.tiempo !== null) return alSoltarTiempo(a.tiempo);
    // Inercia con spring sembrado con la velocidad del gesto: cada lanzamiento aterriza distinto.
    if (!reducido && Math.abs(a.v) > 20) animate(centro, centro.get() + a.v * 0.28, { ...MOVIMIENTO.SPRING_SUAVE, velocity: a.v });
  };

  // Lienzo: se repinta solo cuando cambia algo (tiempo, giro, escala o tamaño), no en un bucle continuo.
  const lienzo = useRef<HTMLCanvasElement>(null);
  const colores = useRef<Colores | null>(null);
  const paisaje = useMemo(() => crearPaisaje(semillaDe(semilla)), [semilla]);
  const pendiente = useRef(0);
  const ultimoPintado = useRef(0);
  const nitidez = useRef(0);
  // Pedir un pintado es idempotente: si ya hay uno pendiente para el próximo fotograma, no se cancela ni se
  // vuelve a pedir. (Cancelar y volver a pedir dejaba la escena sin pintar cuando dos fuentes la pedían en cada
  // fotograma, p. ej. el cambio de tamaño y el muelle del paralaje.) El pintado usa siempre los valores del último render.
  const dibujar = useRef<() => void>(() => undefined);
  const pintar = useCallback(() => {
    if (pendiente.current) return;
    pendiente.current = requestAnimationFrame(() => {
      pendiente.current = 0;
      dibujar.current();
    });
  }, []);
  useLayoutEffect(() => {
    dibujar.current = () => {
      const el = lienzo.current;
      const ctx = el?.getContext("2d");
      if (!el || !ctx || !ancho || !alto) return;
      // Resolución adaptativa: si el fotograma anterior fue hace nada, la escena se está moviendo.
      const ahora = performance.now();
      const enMovimiento = ahora - ultimoPintado.current < ESCENA.MOVIMIENTO_SI_MS;
      ultimoPintado.current = ahora;
      clearTimeout(nitidez.current);
      if (enMovimiento) nitidez.current = window.setTimeout(pintar, ESCENA.NITIDEZ_TRAS_MS);
      const dpr = Math.min(window.devicePixelRatio || 1, enMovimiento ? ESCENA.DPR_MOVIMIENTO : ESCENA.DPR_MAX);
      const altoLienzo = Math.max(alto, altoReservado ?? 0);
      if (el.width !== Math.round(ancho * dpr) || el.height !== Math.round(altoLienzo * dpr)) {
        el.width = Math.round(ancho * dpr);
        el.height = Math.round(altoLienzo * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      colores.current ??= leerColores(el);
      pintarEscena(ctx, {
        ancho, alto, yHorizonte, ppd, centro: centro.get(), incertidumbre, realista: { paralaje: paralaje.get() },
        yDe: elevacionAY(escalaMixta(mezcla.get()), yHorizonte, altoCielo, altoSubsuelo),
      }, posicion.get(), paisaje, colores.current);
    };
    pintar(); // cambió el tamaño, el paisaje o la proyección: se repinta
  }, [ancho, alto, altoReservado, yHorizonte, ppd, altoCielo, altoSubsuelo, centro, mezcla, posicion, paisaje, paralaje, incertidumbre, pintar]);
  useEffect(() => {
    const bajas = [posicion.on("change", pintar), centro.on("change", pintar), mezcla.on("change", pintar), paralaje.on("change", pintar)];
    return () => {
      bajas.forEach((baja) => baja());
      cancelAnimationFrame(pendiente.current);
      pendiente.current = 0;
      clearTimeout(nitidez.current);
    };
  }, [pintar, posicion, centro, mezcla, paralaje]);

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
      if (visibles.every((v) => Math.abs(yDe(v) - yDe(e)) >= PANORAMA.SEPARACION_MARCAS_PX) && Math.abs(yDe(e) - yHorizonte) >= PANORAMA.SEPARACION_MARCAS_PX && yDe(e) < alto - reserva) visibles.push(e);
    }
    return visibles;
  }, [escala, yDe, yHorizonte, alto, reserva]);
  const { ANCHO_MAX_PX, ANCHO_MIN_PX, HASTA_DEG, ALTO_PX } = PANORAMA.RESPLANDOR;
  const fRasante = Math.min(1, Math.max(0, lectura.sol_el_deg / HASTA_DEG));
  const rxRasante = (ANCHO_MAX_PX - (ANCHO_MAX_PX - ANCHO_MIN_PX) * fRasante) / 2;
  const marcasAz = Array.from({ length: GRADOS_VUELTA / PANORAMA.MARCA_AZIMUT_CADA }, (_, k) => k * PANORAMA.MARCA_AZIMUT_CADA);

  const rSol = ESCENA.RADIO_SOL_PX;
  const rTierra = rSol * ESCENA.RAZON_TIERRA_SOL;
  const azDudoso = (astro: Astro) => azimutFiable?.[astro] === false;
  const etiqueta = (astro: Astro) => {
    const el = lectura[CLAVE_ELEVACION[astro]];
    const az = lectura[CLAVE_AZIMUT[astro]];
    const texto = azDudoso(astro)
      ? T.cielo.etiquetaAzDudoso(NOMBRE_ASTRO[astro], grados(az, 0), grados(el, 2, true))
      : T.cielo.etiqueta(NOMBRE_ASTRO[astro], grados(az, 1), grados(el, 2, true));
    return sobreHorizonte(el) ? texto : `${texto} ${T.cielo.bajo}`;
  };
  const botonGiro = clasesBoton("secundario", "material px-0");

  return (
    <figure className="m-0 h-full">
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
        onPointerLeave={() => puntero.set(0)}
        onWheel={(e) => Math.abs(e.deltaX) > Math.abs(e.deltaY) && ppd && centro.set(centro.get() + e.deltaX / ppd)}
        // Entrada: la escena se abre desde la línea del horizonte (56 % = ESCENA.HORIZONTE_FRACCION), una sola vez.
        className={unir("relative h-full touch-pan-y overflow-clip select-none [clip-path:inset(0)] transition-[clip-path] duration-(--dur-escena-entrada) ease-salida starting:[clip-path:inset(56%_0_44%_0)]",
          zona === "suelo" ? "cursor-ew-resize" : "cursor-grab active:cursor-grabbing")}
      >
        <canvas ref={lienzo} aria-hidden="true" className="absolute top-0 left-0 w-full" style={{ height: Math.max(alto, altoReservado ?? 0) }} />
        {ancho > 0 && alto > 0 && (
          <svg role="img" aria-labelledby={idTitulo} aria-describedby={`${id}-desc`} width={ancho} height={alto} className="relative block">
            <defs>
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
            </defs>
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
                </g>
              ))}
            </m.g>
            </g>
          </svg>
        )}
        {ancho > 0 && ASTROS.map((astro) => (
          <EtiquetaAstro key={astro} texto={etiqueta(astro)} xPantalla={xPantalla[astro]} yGlifo={y[astro]} ancho={ancho} alto={alto}
            radio={astro === "sol" ? rSol + 4 : rTierra}
            debajo={!sobreHorizonte(lectura[CLAVE_ELEVACION[astro]])} oculta={contexto === astro} reserva={reserva}
            rival={astro === "sol" && contexto !== "tierra" ? { texto: etiqueta("tierra"), xPantalla: xPantalla.tierra, yGlifo: y.tierra, radio: rTierra, debajo: !sobreHorizonte(lectura.tierra_el_deg) } : undefined}
            className={sobreHorizonte(lectura[CLAVE_ELEVACION[astro]]) && !azDudoso(astro) ? COLOR_TEXTO[astro] : "text-texto-2"} />
        ))}
        {ancho > 0 && ASTROS.map((astro) => (
          <ContextoAstro key={astro} astro={astro} xPantalla={xPantalla[astro]} yGlifo={y[astro]} ancho={ancho} alto={alto - reserva}
            radio={astro === "sol" ? rSol + 4 : rTierra} az={lectura[CLAVE_AZIMUT[astro]]} el={lectura[CLAVE_ELEVACION[astro]]} utc={tUtc}
            evento={eventos?.[astro]} abierto={contexto === astro} alAbrir={() => setContexto(astro)}
            alCerrar={() => setContexto((actual) => (actual === astro ? null : actual))} />
        ))}
        {/* Astros fuera de la ventana visible: una flecha en el borde que dice hacia dónde y cuánto girar */}
        {ventana < GRADOS_VUELTA && (
          <div className="pointer-events-none absolute top-16 right-2 left-12 flex flex-col gap-1">
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

        <p className="text-texto-3 pointer-events-none absolute top-3 left-16 text-[0.75rem] max-md:hidden">{escala === "lupa" ? T.cielo.escalaLupa : T.cielo.escalaLineal}</p>
        <div className="pointer-events-none absolute top-3 right-3 flex flex-col items-end gap-2">
          <div className="pointer-events-auto flex gap-2">
            {ASTROS.slice().reverse().map((astro) => (
              <button key={astro} type="button" className={botonGiro} aria-label={T.cielo.centrar(NOMBRE_ASTRO[astro])} title={T.cielo.centrar(NOMBRE_ASTRO[astro])} onClick={() => centrarEn(astro)}>
                <GlifoAstro astro={astro} px={16} />
              </button>
            ))}
            <button type="button" className={botonGiro} aria-label={T.cielo.girarIzq(PANORAMA.GIRO_DEG)} onClick={() => girar(-PANORAMA.GIRO_DEG)}>
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            <button type="button" className={botonGiro} aria-label={T.cielo.girarDer(PANORAMA.GIRO_DEG)} onClick={() => girar(PANORAMA.GIRO_DEG)}>
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
            {accion}
          </div>
        </div>
        {/* Avisos de honestidad, siempre visibles dentro de la escena */}
        <p className="text-texto-3 pointer-events-none absolute right-3 font-mono text-[0.75rem]" style={{ top: yHorizonte - 18 }}>{T.cielo.horizonteIdeal}</p>
        {/* En móvil el aviso largo pisaba la cota de −5° y lo cortaba el control de tiempo: va corto y sobre el horizonte. */}
        <p className="text-texto-2 pointer-events-none absolute left-14 text-[0.75rem] max-sm:hidden" style={{ top: yHorizonte + 34 }}>{T.cielo.relieve}</p>
        <p className="text-texto-2 pointer-events-none absolute left-14 text-[0.75rem] sm:hidden" style={{ top: yHorizonte - 18 }}>{T.cielo.relieveCorto}</p>
      </div>
      <figcaption id={`${id}-desc`} className="sr-only">{describirCielo(tUtc, filas[i0])} {T.cielo.relieve}</figcaption>
    </figure>
  );
}

/**
 * Etiqueta de un astro en coordenadas de pantalla: sigue al glifo, pero no se sale por los bordes ni se mete en
 * la esquina de los botones de giro. Si el astro está fuera de la ventana visible, no se dibuja.
 */
/** Lo que hace falta para situar la etiqueta de un astro. */
interface DatosEtiqueta { texto: string; xPantalla: MotionValue<number>; yGlifo: MotionValue<number>; radio: number; debajo: boolean }
/** Esquina superior izquierda de la etiqueta de un astro, antes de mirar si choca con la del otro. */
function cajaEtiqueta({ texto, xPantalla, yGlifo, radio, debajo }: DatosEtiqueta, ancho: number, alto: number, reserva: number) {
  const { ANCHO_CARACTER_PX, MARGEN_PX, MARGEN_IZQ_PX, SEPARACION_PX, ALTO_PX } = PANORAMA.ETIQUETA;
  const mitad = (texto.length * ANCHO_CARACTER_PX) / 2;
  const x = limitar(xPantalla.get(), mitad + MARGEN_IZQ_PX, Math.max(mitad + MARGEN_IZQ_PX, ancho - mitad - MARGEN_PX)) - mitad; // a la izquierda viven las cotas
  const yg = yGlifo.get();
  const abajo = yg + radio + SEPARACION_PX - 4;
  // Bajo el horizonte la etiqueta va debajo del glifo, salvo que caiga en la zona de los botones o fuera del marco.
  const limite = alto - reserva; // por debajo vive el control de tiempo flotante
  const arriba = yg - radio - SEPARACION_PX - ALTO_PX + 2;
  // Arriba a la derecha viven los botones de centrar y girar: ahí la etiqueta pasa debajo del glifo.
  const enEsquina = arriba < PANORAMA.ZONA_SUPERIOR.ALTO_PX && x + 2 * mitad > ancho - PANORAMA.ZONA_SUPERIOR.ANCHO_PX;
  // Astro casi en el cénit: arriba la etiqueta rozaría el borde y pisaría la nota de la escala.
  const pegadaArriba = arriba < PANORAMA.ZONA_NOTA_ALTO_PX;
  const destino = (debajo && abajo + ALTO_PX < limite) || enEsquina || pegadaArriba ? abajo : arriba;
  // Astro hundido bajo el control de tiempo: su etiqueta se queda justo encima del panel, no debajo.
  return { x, y: Math.min(destino, limite - ALTO_PX - 4), anchoPx: 2 * mitad };
}

function EtiquetaAstro({ texto, xPantalla, yGlifo, ancho, alto, radio, debajo, oculta = false, reserva = 0, rival, className }: DatosEtiqueta & {
  ancho: number; alto: number; oculta?: boolean; reserva?: number; className: string;
  /** etiqueta del otro astro: si las dos cajas se cortan, esta se aparta una línea (la otra no se mueve) */
  rival?: DatosEtiqueta;
}) {
  const { ALTO_PX, SEPARACION_ENTRE_PX } = PANORAMA.ETIQUETA;
  const propia = { texto, xPantalla, yGlifo, radio, debajo };
  const x = useTransform(() => cajaEtiqueta(propia, ancho, alto, reserva).x);
  const y = useTransform(() => {
    const yo = cajaEtiqueta(propia, ancho, alto, reserva);
    if (!rival) return yo.y;
    const otra = cajaEtiqueta(rival, ancho, alto, reserva);
    const seCortan = yo.x < otra.x + otra.anchoPx + SEPARACION_ENTRE_PX && otra.x < yo.x + yo.anchoPx + SEPARACION_ENTRE_PX && Math.abs(yo.y - otra.y) < ALTO_PX + SEPARACION_ENTRE_PX;
    if (!seCortan) return yo.y;
    // Se aparta hacia arriba: por debajo puede vivir el control de tiempo.
    return otra.y - ALTO_PX - SEPARACION_ENTRE_PX;
  });
  const opacity = useTransform(() => (xPantalla.get() > ancho + radio ? 0 : 1));
  return (
    <m.p aria-hidden="true" style={{ x, y, opacity, visibility: oculta ? "hidden" : "visible" }}
      className={unir("pointer-events-none absolute top-0 left-0 font-mono text-[12px] leading-4 whitespace-nowrap", className)}>
      {texto}
    </m.p>
  );
}
