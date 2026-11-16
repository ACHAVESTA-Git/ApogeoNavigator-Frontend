import { ChevronsLeft, ChevronsRight, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { FilaHorizonte } from "../components/comparar/FilaHorizonte";
import { FrasesMision } from "../components/comparar/FrasesMision";
import { TopSitios } from "../components/comparar/TopSitios";
import { HorizontesSincronizados } from "../components/comparar/HorizontesSincronizados";
import { SelectorMultiple, type Opcion } from "../components/comparar/SelectorSitios";
import { TablaComparacion } from "../components/comparar/TablaComparacion";
import { AvisoHorizonteIdeal } from "../components/layout/AvisoHorizonteIdeal";
import { TituloPagina } from "../components/layout/TituloPagina";
import { Boton } from "../components/ui/Boton";
import { Desplegable } from "../components/ui/Desplegable";
import { EstadoCarga, EstadoError } from "../components/ui/Estados";
import { Veredicto } from "../components/lujo";
import { Segmentado } from "../components/ui/Segmentado";
import { SelectorMes } from "../components/ui/SelectorMes";
import { clasesBoton, unir } from "../components/ui/clases";
import { comparacion, useComparacion } from "../hooks/useComparacion";
import { useFilasComparacion, type DatosFila, type FilaComparacion } from "../hooks/useFilasComparacion";
import { useMovimientoReducido } from "../hooks/useMovimientoReducido";
import { useEscribirUrl, usePeriodo, useSitiosUrl } from "../hooks/useParametrosUrl";
import { useRanking } from "../hooks/useRanking";
import { useSites } from "../hooks/useSites";
import { esSensibleAlRelieve, sobreHorizonte } from "../lib/astro";
import { interpolarFila } from "../lib/interpolar";
import { decidir, esPolarSur, visiblesDelRanking } from "../lib/comparar";
import { COMPARAR, DATOS, HORAS_POR_DIA, MOVIMIENTO, MS_POR_HORA, PARAM_URL, RANKING, RUTAS } from "../lib/constants";
import { aMs, fechaHora, horaLima, horasEntre, limitar, mesLargo, sumarHoras, sumarMeses } from "../lib/fechas";
import { grados, latitud, nombreCorto } from "../lib/formato";
import { T, horaLocal, partesDecision, periodoLegible } from "../lib/textos";
import type { Site, Utc } from "../lib/tipos";

type Modo = "sitios" | "fechas";
const MODOS = [{ valor: "sitios" as Modo, etiqueta: T.comparar.modoSitios }, { valor: "fechas" as Modo, etiqueta: T.comparar.modoFechas }];
/** Meses con datos (primer instante de cada uno). */
const MESES: Utc[] = (() => {
  const meses: Utc[] = [];
  for (let m = DATOS.COBERTURA.DESDE as Utc; aMs(m) < aMs(DATOS.COBERTURA.HASTA); m = sumarMeses(m, 1)) meses.push(m);
  return meses;
})();
const idMes = (mes: Utc) => mes.slice(0, 7);

function Comparacion({ filas, modo }: { filas: FilaComparacion[]; modo: Modo }) {
  const t = T.comparar;
  const reducido = useMovimientoReducido();
  const { datos, listo, error, reintentar } = useFilasComparacion(filas);
  // Mientras llegan los datos de una selección nueva se sigue viendo la anterior, atenuada: las tarjetas se
  // recolocan cuando llegan en lugar de desaparecer tras un indicador de carga.
  const ultimos = useRef<DatosFila[] | null>(null);
  if (listo) ultimos.current = datos;
  const visibles = listo ? datos : ultimos.current;
  const horasMax = Math.max(2, ...(visibles ?? filas).map((f) => horasEntre(f.desde, f.hasta))) - 1;
  const [horaElegida, setHora] = useState<number | null>(null);
  const hora = Math.min(horaElegida ?? Math.round(horasMax / 2), horasMax); // por defecto, la mitad del periodo
  const [reproduciendo, setReproduciendo] = useState(false);
  useEffect(() => {
    if (!reproduciendo) return;
    const reloj = setInterval(() => setHora((h) => ((h ?? 0) >= horasMax ? 0 : (h ?? 0) + 1)), reducido ? MOVIMIENTO.PASO_REDUCIDO_MS : COMPARAR.PASO_MS);
    return () => clearInterval(reloj);
  }, [reproduciendo, horasMax, reducido]);

  const mover = (delta: number) => setHora(limitar(hora + delta, 0, horasMax));
  const alPulsar = (e: KeyboardEvent) => {
    const paso = e.shiftKey ? HORAS_POR_DIA : 1;
    if (e.key === "ArrowLeft") mover(-paso);
    else if (e.key === "ArrowRight") mover(paso);
    else if (e.key === "Home") setHora(0);
    else if (e.key === "End") setHora(horasMax);
    else return;
    e.preventDefault();
  };
  /** El cursor sigue al puntero sin retardo, medido sobre la columna de bandas de la primera fila. */
  const alMover = (e: PointerEvent<HTMLOListElement>) => {
    if (reproduciendo && e.type !== "pointerdown") return; // reproduciendo, solo un toque mueve el cursor
    const banda = e.currentTarget.querySelector("[data-banda]")?.getBoundingClientRect();
    if (!banda || e.clientX < banda.left || e.clientX > banda.right) return;
    setReproduciendo(false);
    setHora(Math.round(((e.clientX - banda.left) / banda.width) * horasMax));
  };

  if (error) return <EstadoError error={error} alReintentar={reintentar} className="mt-8" />;
  if (!visibles) return <EstadoCarga texto={t.cargando} className="min-h-[40svh]" />;
  const lineas = visibles.map((d) => ({ nombre: d.etiqueta, ...d.metrica!, sensible: esSensibleAlRelieve(d.metrica!) }));
  const decision = decidir(lineas);
  const frase = partesDecision(lineas, modo === "sitios" ? periodoLegible(visibles[0].desde, visibles[0].hasta) : visibles[0].detalle);
  const recomendadas = new Set(decision?.recomendadas.map((i) => visibles[i].clave));
  const utc = sumarHoras(visibles[0].desde, hora);
  const instante = modo === "sitios" ? `${fechaHora(utc)} ${T.utc} · ${horaLocal(horaLima(utc))}` : t.hora(hora + 1);
  // Cuántas filas tienen cada astro sobre el horizonte ideal en el instante del cursor (misma interpolación que las escenas).
  const ahora = visibles.map((d) => interpolarFila(d.efemerides!.filas, aMs(d.desde) + hora * MS_POR_HORA));
  const conSol = ahora.filter((p) => sobreHorizonte(p.sol_el_deg)).length;
  const conTierra = ahora.filter((p) => sobreHorizonte(p.tierra_el_deg)).length;
  const IconoReproducir = reproduciendo ? Pause : Play;
  return (
    <div aria-busy={!listo} className={unir("transition-opacity duration-(--dur-corta)", !listo && "opacity-60")}>
      {!listo && <p role="status" className="sr-only">{t.actualizando}</p>}
      {/* 1 · Veredicto entre las filas elegidas (según el semáforo de la API), con sus matices: lo que cuesta y la cautela. */}
      {decision && (
        <section key={frase.principal} aria-live="polite" className="animate-aparecer mt-6">
          <Veredicto nivel={visibles[decision.recomendadas[0]].metrica!.semaforo.global} como="h2">{frase.principal}</Veredicto>
          {frase.matices.length > 0 && (
            <ul className="text-apoyo text-texto-2 mt-3 space-y-1">
              {frase.matices.map((matiz) => <li key={matiz} className="flex gap-2"><span aria-hidden="true" className="bg-texto-2 mt-[0.6em] size-1 shrink-0 rounded-full" />{matiz}</li>)}
            </ul>
          )}
        </section>
      )}

      {/* 2 · El mismo instante en cada horizonte, con un único control de tiempo. */}
      <section className="mt-8">
        {visibles.length > 1 && (
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
            <h2 className="rotulo">{t.mismoInstante(visibles.length)}</h2>
            <p className="text-texto-3 text-[0.75rem]">{t.mismoInstanteAyuda}</p>
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <button type="button" className={clasesBoton("primario", "px-0")} aria-label={reproduciendo ? t.pausar : t.reproducir} onClick={() => setReproduciendo((v) => !v)}>
            <IconoReproducir aria-hidden="true" className="size-4" />
          </button>
          <button type="button" className={clasesBoton("secundario", "border-linea px-0")} aria-label={t.menosDia} onClick={() => mover(-HORAS_POR_DIA)}>
            <ChevronsLeft aria-hidden="true" className="size-4" />
          </button>
          <button type="button" className={clasesBoton("secundario", "border-linea px-0")} aria-label={t.masDia} onClick={() => mover(HORAS_POR_DIA)}>
            <ChevronsRight aria-hidden="true" className="size-4" />
          </button>
          <div className="relative min-w-40 flex-1">
            <div aria-hidden="true" className="bg-linea absolute inset-x-0 top-1/2 h-px" />
            <input type="range" className="regla-tiempo relative block" aria-label={t.tiempo} aria-valuetext={instante} min={0} max={horasMax} step={1} value={hora}
              onChange={(e) => { setReproduciendo(false); setHora(Number(e.target.value)); }} />
          </div>
          <p className="text-dato-sm text-texto font-mono max-md:w-full" data-dato><span className="rotulo">{t.instante}</span> {instante}</p>
        </div>
        {visibles.length > 1 && <p className="text-apoyo text-texto-2 mt-2" data-dato>{t.podio.enInstante(conSol, conTierra, visibles.length)}</p>}
        <HorizontesSincronizados filas={visibles} hora={hora} recomendadas={recomendadas} />
        <p className="text-texto-3 mt-2 text-[0.75rem]">{T.cielo.relieve}</p>
      </section>

      <ol tabIndex={0} aria-label={t.grafico} onKeyDown={alPulsar} onPointerMove={alMover} onPointerDown={alMover}
        className="mt-6 touch-pan-y [&_[data-banda]]:cursor-crosshair">
        {visibles.map((d, i) => <FilaHorizonte key={d.clave} fila={d} indice={i} horaCursor={hora} />)}
      </ol>
      <p className="text-texto-3 mt-2 text-[0.75rem]">{T.semaforo.leyenda}</p>
      <AvisoHorizonteIdeal className="mt-2" />
      <FrasesMision filas={visibles} modo={modo} className="mt-8" />
      <Desplegable titulo={t.tabla} className="border-b"><TablaComparacion filas={visibles} /></Desplegable>
    </div>
  );
}

type Zona = "todos" | "polar";
const ZONAS = [{ valor: "todos" as Zona, etiqueta: T.comparar.top.todos }, { valor: "polar" as Zona, etiqueta: T.comparar.top.polarSur }];
/** Controles de la cabecera con objetivo táctil de 48 px (astronauta con guantes): se amplían los botones que contienen. */
const TACTIL_48 = "[&_button]:min-h-12 [&_button]:min-w-12";
const ID_DETALLE = "detalle-comparar";

/**
 * Modo «sitios»: el ranking de todos los sitios del catálogo para el periodo elegido (acto 1 y 2) y, al tocar una
 * fila, el detalle con su horizonte (acto 3; hasta 3 a la vez). La selección vive en la URL (`s`) y en la bandeja.
 */
function Ranking({ sitios, periodo }: { sitios: Site[]; periodo: ReturnType<typeof usePeriodo> }) {
  const t = T.comparar;
  const [params] = useSearchParams();
  const escribir = useEscribirUrl();
  const fijados = useComparacion().ids;
  const deUrl = useSitiosUrl();
  const zona: Zona = params.get(PARAM_URL.ZONA) === "polar" ? "polar" : "todos";
  const { ranking, listo, actualizando, error, reintentar } = useRanking(sitios, periodo.desde, periodo.hasta);
  const [aviso, setAviso] = useState("");

  const existe = (id: string) => sitios.some((s) => s.site_id === id);
  // La selección de la URL manda; sin ella, lo fijado en la bandeja. Sin nada elegido no hay detalle.
  const elegidos = (params.has(PARAM_URL.SITIOS) ? deUrl : fijados).filter(existe);
  const enZona = zona === "polar" ? ranking.filter((f) => esPolarSur(f.sitio.lat_deg)) : ranking;
  // El puesto es siempre el del ranking completo; el conmutador solo deja ver los de la región polar sur.
  const filas = zona === "polar" ? enZona : visiblesDelRanking(enZona, (f) => elegidos.includes(f.sitio.site_id));
  const alternar = (id: string) => {
    const quitar = elegidos.includes(id);
    if (!quitar && elegidos.length >= DATOS.MAX_COMPARAR) return setAviso(t.maximo(DATOS.MAX_COMPARAR));
    const siguientes = quitar ? elegidos.filter((v) => v !== id) : [...elegidos, id];
    setAviso("");
    comparacion.fijar(siguientes);
    escribir({ [PARAM_URL.SITIOS]: siguientes.join(",") });
  };
  const filasDetalle: FilaComparacion[] = useMemo(
    () => elegidos.map((id) => {
      const sitio = sitios.find((s) => s.site_id === id) as Site;
      return { clave: id, siteId: id, desde: periodo.desde, hasta: periodo.hasta, etiqueta: nombreCorto(sitio.nombre), detalle: latitud(sitio.lat_deg) };
    }),
    [elegidos.join(), periodo.desde, periodo.hasta, sitios], // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (error) return <EstadoError error={error} alReintentar={reintentar} className="mt-8" />;
  return (
    <>
      <section aria-busy={!listo || actualizando} className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <p className="text-apoyo text-texto-2 max-w-medida text-pretty">{t.top.criterio}</p>
          <Segmentado etiqueta={t.top.zona} opciones={ZONAS} valor={zona} className={TACTIL_48}
            alCambiar={(v) => escribir({ [PARAM_URL.ZONA]: v === "todos" ? null : v })} />
        </div>
        {zona === "polar" && <p className="text-texto-2 mt-2 text-[0.75rem]">{t.top.polarSurAyuda(grados(Math.abs(RANKING.POLAR_SUR_LAT_MAX_DEG), 0))}</p>}
        <div className={unir("transition-opacity duration-(--dur-corta)", actualizando && "opacity-60")}>
          <TopSitios filas={filas} ranking={ranking} elegidos={elegidos} alAlternar={alternar} cargando={!listo} vacio={t.top.sinPolares} />
        </div>
        <div className="mt-3 flex min-h-12 flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p role="status" className="text-apoyo text-texto-2">
            {aviso || (elegidos.length ? t.top.elegidos(elegidos.length, DATOS.MAX_COMPARAR) : t.top.tocar)}
          </p>
          {elegidos.length > 0 && <a href={`#${ID_DETALLE}`} className={clasesBoton("secundario", "border-linea min-h-12")}>{t.top.irAlDetalle}</a>}
        </div>
        <AvisoHorizonteIdeal className="mt-2" />
      </section>

      {filasDetalle.length > 0 && (
        <section id={ID_DETALLE} tabIndex={-1} aria-labelledby={`${ID_DETALLE}-titulo`} className="capilar-t mt-10 scroll-mt-20 pt-8">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <p className="rotulo">{t.top.detalle}</p>
              <h2 id={`${ID_DETALLE}-titulo`} className="titulo-instrumento text-seccion text-texto mt-1">{t.top.detalleDe(filasDetalle.map((f) => f.etiqueta).join(" · "))}</h2>
            </div>
            {RANKING.VENTANA_ALUNIZAJE && (
              <ul className="flex flex-wrap gap-2">
                {filasDetalle.map((f) => (
                  <li key={f.clave}>
                    <Link to={RUTAS.VENTANA_ALUNIZAJE(f.siteId)} aria-label={t.top.planearDe(f.etiqueta)} className={clasesBoton("primario", "min-h-12")}>
                      {filasDetalle.length > 1 ? `${t.top.planear} · ${f.etiqueta}` : t.top.planear}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Comparacion filas={filasDetalle} modo="sitios" />
        </section>
      )}
    </>
  );
}

export default function Comparar() {
  const t = T.comparar;
  const { data: sitios, isPending, error, refetch } = useSites();
  const [params] = useSearchParams();
  const escribir = useEscribirUrl();
  const periodo = usePeriodo();
  const modo: Modo = params.get(PARAM_URL.MODO) === "fechas" ? "fechas" : "sitios";
  const [editando, setEditando] = useState(false);

  const mesesUrl = (params.get(PARAM_URL.MESES) ?? "").split(",").map((m) => MESES.find((mes) => idMes(mes) === m)).filter((m): m is Utc => Boolean(m)).slice(0, DATOS.MAX_COMPARAR);
  const meses = mesesUrl.length >= DATOS.MIN_COMPARAR ? mesesUrl : MESES.filter((_, i) => i % 2 === 0).slice(0, DATOS.MAX_COMPARAR);
  const sitioFechas = sitios?.find((s) => s.site_id === params.get(PARAM_URL.SITIO)) ?? sitios?.find((s) => s.site_id === DATOS.SITIO_DESTACADO) ?? sitios?.[0];

  const filasFechas: FilaComparacion[] = useMemo(() => {
    if (modo !== "fechas" || !sitioFechas) return [];
    return meses.map((mes) => ({ clave: mes, siteId: sitioFechas.site_id, desde: mes, hasta: sumarMeses(mes, 1), etiqueta: mesLargo(mes), detalle: nombreCorto(sitioFechas.nombre) }));
  }, [modo, meses.join(), sitioFechas]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isPending) return <div className="contenedor min-h-[60svh]"><EstadoCarga /></div>;
  if (error || !sitios) return <div className="contenedor py-12"><EstadoError error={error} alReintentar={() => void refetch()} /></div>;

  const opcionesMeses: Opcion[] = MESES.map((mes) => ({ valor: idMes(mes), etiqueta: mesLargo(mes) }));
  const titulo = modo === "sitios" ? t.top.titulo(Math.min(RANKING.PUESTOS, sitios.length), periodoLegible(periodo.desde, periodo.hasta)) : t.tituloFechas(sitioFechas?.nombre ?? "");

  return (
    <div className="contenedor py-8 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <p className="rotulo">{t.rotulo}</p>
          <TituloPagina documento={t.documento} className="mt-2">{titulo}</TituloPagina>
        </div>
        {/* Como máximo tres controles a la vista: qué comparar, el periodo (o la selección de fechas) y, en el ranking, la zona. */}
        <div className="flex flex-wrap items-center gap-3">
          <Segmentado etiqueta={t.modo} opciones={MODOS} valor={modo} className={TACTIL_48}
            alCambiar={(v) => { setEditando(false); escribir({ [PARAM_URL.MODO]: v === "sitios" ? null : v }); }} />
          {modo === "sitios"
            ? <div className={TACTIL_48}><SelectorMes periodo={periodo} /></div>
            : <Boton aria-expanded={editando} className="min-h-12" onClick={() => setEditando((v) => !v)}>{t.cambiar}</Boton>}
        </div>
      </div>

      {modo === "fechas" && editando && (
        <section className="capilar-b mt-6 pb-8">
          <label className="mb-5 block max-w-sm">
            <span className="rotulo">{t.sitio}</span>
            <select value={sitioFechas?.site_id} onChange={(e) => escribir({ [PARAM_URL.SITIO]: e.target.value })}
              className="tactil bg-superficie border-linea text-texto mt-1.5 min-h-12 w-full rounded-control border px-3">
              {sitios.map((s) => <option key={s.site_id} value={s.site_id}>{s.nombre}</option>)}
            </select>
          </label>
          <SelectorMultiple key="meses" titulo={t.elegirMeses(DATOS.MIN_COMPARAR, DATOS.MAX_COMPARAR)} opciones={opcionesMeses}
            inicial={meses.map(idMes)}
            alComparar={(v) => { escribir({ [PARAM_URL.MESES]: [...v].sort().join(","), [PARAM_URL.SITIO]: sitioFechas?.site_id ?? null }, { reemplazar: false }); setEditando(false); }} />
        </section>
      )}

      {modo === "sitios" ? <Ranking sitios={sitios} periodo={periodo} /> : filasFechas.length >= DATOS.MIN_COMPARAR && <Comparacion key="fechas" filas={filasFechas} modo="fechas" />}
    </div>
  );
}
