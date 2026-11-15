import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useSearchParams } from "react-router";
import { CifrasLider } from "../components/comparar/CifrasLider";
import { FilaHorizonte } from "../components/comparar/FilaHorizonte";
import { SelectorMultiple, type Opcion } from "../components/comparar/SelectorSitios";
import { TablaComparacion } from "../components/comparar/TablaComparacion";
import { AvisoHorizonteIdeal } from "../components/layout/AvisoHorizonteIdeal";
import { TituloPagina } from "../components/layout/TituloPagina";
import { Boton } from "../components/ui/Boton";
import { Desplegable } from "../components/ui/Desplegable";
import { EstadoCarga, EstadoError } from "../components/ui/Estados";
import { Segmentado } from "../components/ui/Segmentado";
import { SelectorMes } from "../components/ui/SelectorMes";
import { clasesBoton } from "../components/ui/clases";
import { comparacion, useComparacion } from "../hooks/useComparacion";
import { useFilasComparacion, type FilaComparacion } from "../hooks/useFilasComparacion";
import { useEscribirUrl, usePeriodo, useSitiosUrl } from "../hooks/useParametrosUrl";
import { useSites } from "../hooks/useSites";
import { esSensibleAlRelieve } from "../lib/astro";
import { DATOS, HORAS_POR_DIA, PARAM_URL } from "../lib/constants";
import { aMs, fechaHora, horasEntre, limitar, mesLargo, sumarHoras, sumarMeses } from "../lib/fechas";
import { latitud, nombreCorto } from "../lib/formato";
import { T, periodoLegible, veredicto, veredictoFechas } from "../lib/textos";
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
  const { datos, listo, error, reintentar } = useFilasComparacion(filas);
  const [hora, setHora] = useState<number | null>(null);
  const horasMax = Math.max(...filas.map((f) => horasEntre(f.desde, f.hasta))) - 1;

  const frase = useMemo(() => {
    if (!listo) return "";
    const lineas = datos.map((d) => ({ nombre: d.etiqueta, ...d.metrica!, sensible: esSensibleAlRelieve(d.metrica!) }));
    return modo === "sitios" ? veredicto(lineas, periodoLegible(filas[0].desde, filas[0].hasta)) : veredictoFechas(lineas, filas[0].detalle);
  }, [listo, datos, filas, modo]);

  const mover = (delta: number) => setHora((h) => limitar((h ?? 0) + delta, 0, horasMax));
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
    const banda = e.currentTarget.querySelector("[data-banda]")?.getBoundingClientRect();
    if (!banda || e.clientX < banda.left || e.clientX > banda.right) return;
    setHora(Math.round(((e.clientX - banda.left) / banda.width) * horasMax));
  };

  if (error) return <EstadoError error={error} alReintentar={reintentar} className="mt-8" />;
  if (!listo) return <EstadoCarga texto={t.cargando} className="min-h-[40svh]" />;
  const instante = hora === null ? null : modo === "sitios" ? `${fechaHora(sumarHoras(filas[0].desde, hora))} ${T.utc}` : t.hora(hora + 1);
  return (
    <>
      <p key={frase} aria-live="polite" className="text-subtitulo text-texto animate-aparecer mt-5 max-w-[60ch] text-balance">{frase}</p>
      <CifrasLider filas={datos} />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="text-dato-sm text-texto-2 min-h-[1.3em] font-mono" data-dato>
          {instante ? <><span className="rotulo">{t.cursor}</span> <span className="text-texto">{instante}</span></> : <span className="text-apoyo text-texto-3 font-sans">{t.sinCursor}</span>}
        </p>
        <div className="flex gap-2">
          <button type="button" className={clasesBoton("secundario", "border-linea px-0")} aria-label={t.menosDia} onClick={() => mover(-HORAS_POR_DIA)}>
            <ChevronsLeft aria-hidden="true" className="size-4" />
          </button>
          <button type="button" className={clasesBoton("secundario", "border-linea px-0")} aria-label={t.masDia} onClick={() => mover(HORAS_POR_DIA)}>
            <ChevronsRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
      <ol tabIndex={0} aria-label={t.grafico} onKeyDown={alPulsar} onPointerMove={alMover} onPointerDown={alMover}
        className="mt-2 touch-pan-y [&_[data-banda]]:cursor-crosshair">
        {datos.map((d, i) => <FilaHorizonte key={d.clave} fila={d} indice={i} horaCursor={hora} />)}
      </ol>
      <p className="text-texto-3 mt-2 text-[0.75rem]">{T.semaforo.leyenda}</p>
      <AvisoHorizonteIdeal className="mt-2" />
      <Desplegable titulo={t.tabla} className="mt-8 border-b"><TablaComparacion filas={datos} /></Desplegable>
    </>
  );
}

export default function Comparar() {
  const t = T.comparar;
  const { data: sitios, isPending, error, refetch } = useSites();
  const [params] = useSearchParams();
  const escribir = useEscribirUrl();
  const periodo = usePeriodo();
  const fijados = useComparacion().ids;
  const deUrl = useSitiosUrl();
  const modo: Modo = params.get(PARAM_URL.MODO) === "fechas" ? "fechas" : "sitios";
  const [editando, setEditando] = useState(false);

  const existe = (id: string) => Boolean(sitios?.some((s) => s.site_id === id));
  const enUrl = deUrl.filter(existe);
  // Sin selección en la URL no hay pantalla vacía: se compara lo fijado en la bandeja o la comparación sugerida.
  const sugeridos = (fijados.length >= DATOS.MIN_COMPARAR ? fijados : [...DATOS.COMPARACION_SUGERIDA]).filter(existe);
  const ids = enUrl.length >= DATOS.MIN_COMPARAR ? enUrl : sugeridos;
  const mesesUrl = (params.get(PARAM_URL.MESES) ?? "").split(",").map((m) => MESES.find((mes) => idMes(mes) === m)).filter((m): m is Utc => Boolean(m)).slice(0, DATOS.MAX_COMPARAR);
  const meses = mesesUrl.length >= DATOS.MIN_COMPARAR ? mesesUrl : MESES.filter((_, i) => i % 2 === 0).slice(0, DATOS.MAX_COMPARAR);
  const esSugerida = modo === "sitios" ? enUrl.length < DATOS.MIN_COMPARAR : mesesUrl.length < DATOS.MIN_COMPARAR;
  const sitioFechas = sitios?.find((s) => s.site_id === params.get(PARAM_URL.SITIO)) ?? sitios?.find((s) => s.site_id === DATOS.SITIO_DESTACADO) ?? sitios?.[0];

  const filas: FilaComparacion[] = useMemo(() => {
    const porId = (id: string) => sitios?.find((s) => s.site_id === id) as Site;
    if (modo === "sitios") {
      return ids.map((id) => ({ clave: id, siteId: id, desde: periodo.desde, hasta: periodo.hasta, etiqueta: nombreCorto(porId(id).nombre), detalle: latitud(porId(id).lat_deg) }));
    }
    if (!sitioFechas) return [];
    return meses.map((mes) => ({ clave: mes, siteId: sitioFechas.site_id, desde: mes, hasta: sumarMeses(mes, 1), etiqueta: mesLargo(mes), detalle: nombreCorto(sitioFechas.nombre) }));
  }, [modo, ids.join(), meses.join(), sitioFechas, periodo.desde, periodo.hasta, sitios]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isPending) return <div className="contenedor min-h-[60svh]"><EstadoCarga /></div>;
  if (error || !sitios) return <div className="contenedor py-12"><EstadoError error={error} alReintentar={() => void refetch()} /></div>;

  const suficientes = filas.length >= DATOS.MIN_COMPARAR;
  const eligiendo = esSugerida || editando;
  const opcionesSitios: Opcion[] = sitios.map((s) => ({ valor: s.site_id, etiqueta: s.nombre, sitio: s }));
  const opcionesMeses: Opcion[] = MESES.map((mes) => ({ valor: idMes(mes), etiqueta: mesLargo(mes) }));
  const titulo = !suficientes ? t.tituloElegir : modo === "sitios" ? t.titulo(periodoLegible(periodo.desde, periodo.hasta)) : t.tituloFechas(sitioFechas?.nombre ?? "");

  return (
    <div className="contenedor py-8 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="rotulo">{t.rotulo}</p>
          <TituloPagina documento={t.documento} className="mt-2">{titulo}</TituloPagina>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {suficientes && modo === "sitios" && <SelectorMes periodo={periodo} />}
          {suficientes && !esSugerida && <Boton aria-expanded={editando} onClick={() => setEditando((v) => !v)}>{t.cambiar}</Boton>}
        </div>
      </div>

      {eligiendo && (
        <section className="capilar-b mt-6 pb-8">
          <Segmentado etiqueta={t.modo} opciones={MODOS} valor={modo} className="mb-5"
            alCambiar={(v) => escribir({ [PARAM_URL.MODO]: v === "sitios" ? null : v })} />
          {modo === "sitios" ? (
            <>
              <SelectorMultiple key="sitios" titulo={t.elegirSitios(DATOS.MIN_COMPARAR, DATOS.MAX_COMPARAR)} opciones={opcionesSitios} inicial={ids}
                alComparar={(v) => { comparacion.fijar(v); escribir({ [PARAM_URL.SITIOS]: v.join(",") }, { reemplazar: false }); setEditando(false); }} />
              {esSugerida && fijados.length < DATOS.MIN_COMPARAR && <p className="text-apoyo text-texto-3 mt-3">{t.sugerida}</p>}
            </>
          ) : (
            <>
              <label className="mb-5 block max-w-sm">
                <span className="rotulo">{t.sitio}</span>
                <select value={sitioFechas?.site_id} onChange={(e) => escribir({ [PARAM_URL.SITIO]: e.target.value })}
                  className="tactil bg-superficie border-linea text-texto mt-1.5 w-full rounded-control border px-3">
                  {sitios.map((s) => <option key={s.site_id} value={s.site_id}>{s.nombre}</option>)}
                </select>
              </label>
              <SelectorMultiple key="meses" titulo={t.elegirMeses(DATOS.MIN_COMPARAR, DATOS.MAX_COMPARAR)} opciones={opcionesMeses}
                inicial={meses.map(idMes)}
                alComparar={(v) => { escribir({ [PARAM_URL.MESES]: [...v].sort().join(","), [PARAM_URL.SITIO]: sitioFechas?.site_id ?? null }, { reemplazar: false }); setEditando(false); }} />
            </>
          )}
        </section>
      )}

      {suficientes && <Comparacion key={modo} filas={filas} modo={modo} />}
    </div>
  );
}
