import { Check, Minus, TriangleAlert } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useSearchParams } from "react-router";
import { GraficoEspectro } from "../components/analisis/GraficoEspectro";
import { GraficoSerie } from "../components/analisis/GraficoSerie";
import { TituloPagina } from "../components/layout/TituloPagina";
import { Desplegable } from "../components/ui/Desplegable";
import { EstadoCarga, EstadoError } from "../components/ui/Estados";
import { Segmentado } from "../components/ui/Segmentado";
import { unir } from "../components/ui/clases";
import { useAnalisis } from "../hooks/useAnalisis";
import { useEscribirUrl } from "../hooks/useParametrosUrl";
import {
  VARIABLES_ANALISIS, esVariableAnalisis, estadoValidacion, limitacionesQueAplican, nombreMedida, textoFirma, textoOrigen, textoPaso,
  unidadMedida, valorTextoMedida, type Analisis as DatosAnalisis, type EstadoPaso, type MedidaPaso, type VariableAnalisis,
} from "../lib/analisis";
import { ANALISIS_GRAFICO, PARAM_URL, RUTAS } from "../lib/constants";
import { fechaLarga, soloFecha } from "../lib/fechas";
import { grados, numero, numeroCorto, tamanoArchivo } from "../lib/formato";
import { esPuntoPropio } from "../lib/puntoPropio";
import { T } from "../lib/textos";
import { useContextoSitio } from "./SitioLayout";

const ICONO_ESTADO: Record<EstadoPaso, { Icono: typeof Check; clase: string }> = {
  ok: { Icono: Check, clase: "text-viable" },
  advertencia: { Icono: TriangleAlert, clase: "text-reservas" },
  no_disponible: { Icono: Minus, clase: "text-texto-3" },
};
const VARIABLES = VARIABLES_ANALISIS.map((v) => ({ valor: v, etiqueta: T.analisis.serie.variables[v] }));

function valorMedida(m: MedidaPaso): string {
  if (m.valor === null) return "—";
  if (typeof m.valor === "boolean") return m.valor ? T.analisis.si : T.analisis.no;
  if (typeof m.valor === "string") return valorTextoMedida(m.valor);
  if (m.unidad === "bytes") return tamanoArchivo(m.valor);
  return `${numeroCorto(m.valor)}${m.unidad === "°" ? "°" : m.unidad ? ` ${unidadMedida(m.unidad)}` : ""}`;
}

/** Tarjeta de una cifra con su contexto: qué es, cuánto vale y con qué se compara. */
function Cifra({ rotulo, valor, contexto, tono }: { rotulo: string; valor: string; contexto?: ReactNode; tono?: string }) {
  return (
    <div className="panel min-w-0 p-4">
      <dt className="rotulo">{rotulo}</dt>
      <dd className={unir("text-dato-lg mt-2 font-mono font-medium", tono ?? "text-texto")} data-dato>{valor}</dd>
      {contexto && <dd className="text-apoyo text-texto-2 mt-1.5">{contexto}</dd>}
    </div>
  );
}

function Origen({ a }: { a: DatosAnalisis }) {
  const t = T.analisis.origen;
  const { origen, calidad } = a.entrada;
  const { titulo, texto, esNasa } = textoOrigen(origen, fechaLarga);
  const huella = `${origen.sha3_256.slice(0, ANALISIS_GRAFICO.DECIMALES_HUELLA)}…`;
  // Una firma que no valida es un aviso de primer orden: se dice con icono y texto, y la tarjeta deja de ir en verde.
  const firmaInvalida = origen.manifiesto?.firmado === false;
  const partido = "whitespace-nowrap";
  const conforme = esNasa && !firmaInvalida;
  return (
    <section aria-label={t.rotulo} className="panel mt-6 max-w-3xl p-4 md:p-5">
      <p className="rotulo">{t.rotulo}</p>
      {/* El estado se dice con icono en un halo + el título (texto), nunca con una franja lateral. */}
      <p className="text-subtitulo text-texto mt-2 flex items-start gap-2.5 font-semibold">
        <span aria-hidden="true" className={unir("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", conforme ? "bg-viable/12 text-viable" : "bg-reservas/12 text-reservas")}>
          {conforme ? <Check className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
        </span>
        {titulo}
      </p>
      <p className="text-texto-2 mt-1.5 max-w-medida">{texto}</p>
      <dl className="text-apoyo mt-4 grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        {([
          [t.archivo, a.entrada.archivo],
          [t.filas, <span key="f" className={partido}>{numeroCorto(calidad.filas_validas)} / {numeroCorto(a.entrada.filas)}</span>],
          // El rango solo se parte entre las dos fechas, nunca dentro de una.
          [t.rango, <span key="r"><span className={partido}>{soloFecha(a.entrada.inicio_utc)} →</span> <span className={partido}>{soloFecha(a.entrada.fin_utc)}</span></span>],
          [t.huella, <span key="h" className={partido}>{huella}</span>],
        ] as [string, ReactNode][]).map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-texto-3">{k}</dt>
            <dd className="text-texto font-mono wrap-anywhere" data-dato title={k === t.huella ? origen.sha3_256 : undefined}>{v}</dd>
          </div>
        ))}
      </dl>
      {origen.manifiesto && (firmaInvalida ? (
        <p role="note" className="border-reservas/40 text-apoyo text-texto mt-4 flex items-start gap-2 border-t pt-3">
          <TriangleAlert aria-hidden="true" className="text-reservas mt-0.5 size-4 shrink-0" />
          <span>
            <strong className="text-reservas font-semibold">{t.manifiesto}: {textoFirma(false)}.</strong>
            {origen.manifiesto.firma_nota && <span className="text-texto-2"> {origen.manifiesto.firma_nota}</span>}
          </span>
        </p>
      ) : (
        <p className="text-apoyo text-texto-2 mt-3">
          {t.manifiesto}: <span className={origen.manifiesto.firmado === true ? "text-viable" : "text-reservas"}>{textoFirma(origen.manifiesto.firmado)}</span>
          {origen.manifiesto.firma_nota && <>. {origen.manifiesto.firma_nota}</>}
        </p>
      ))}
    </section>
  );
}

function Modelo({ a }: { a: DatosAnalisis }) {
  const t = T.analisis.modelo;
  return (
    <>
      <p className="text-apoyo text-texto-2 mt-4 max-w-medida">{a.modelo.nota_ajuste || t.r2Nota}</p>
      <dl className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {VARIABLES_ANALISIS.filter((v) => a.modelo.r2[v] !== undefined).map((v) => (
          <Cifra key={v} rotulo={T.analisis.serie.variables[v]} valor={numero(a.modelo.r2[v] as number, 4)}
            contexto={<>{t.r2}{a.modelo.residuos[v] && <> · {t.residuo(grados(a.modelo.residuos[v]!.rmse_deg, 3))}</>}</>} />
        ))}
      </dl>
    </>
  );
}

function Validacion({ a }: { a: DatosAnalisis }) {
  const t = T.analisis.validacion;
  const v = a.validacion;
  const estado = estadoValidacion(v);
  if (estado === "ausente") return <p className="text-texto-2 mt-4">{t.ausente} {v.motivo}</p>;
  const referencia = estado === "referencia";
  const semaforo = v.semaforo_aciertos;
  return (
    <>
      <p className={unir("mt-4 max-w-medida", referencia ? "panel text-texto p-3" : "text-apoyo text-texto-2")}>
        {referencia && (
          <strong className="bg-reservas/12 text-reservas text-apoyo mr-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold tracking-wide uppercase">
            <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />{t.referencia}
          </strong>
        )}
        {referencia ? t.referenciaNota : t.propia}
      </p>
      <p className="rotulo mt-5">{t.rmse}</p>
      <dl className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {VARIABLES_ANALISIS.filter((k) => typeof v.rmse_deg?.[k] === "number").map((k) => (
          <Cifra key={k} rotulo={T.analisis.serie.variables[k]} valor={grados(v.rmse_deg![k] as number, 2)} tono={referencia ? "text-texto-2" : undefined}
            contexto={typeof v.mejora_frente_a_ingenua?.[k] === "number" ? t.frenteIngenua(numero(v.mejora_frente_a_ingenua[k] as number, 1)) : undefined} />
        ))}
        {semaforo && <Cifra rotulo={t.semaforo} valor={t.deMeses(semaforo.aciertos_global, semaforo.meses)} tono={referencia ? "text-texto-2" : undefined} />}
      </dl>
    </>
  );
}

/** El contenido propio de cada paso: los gráficos y cifras van dentro del paso que los produce. */
function detalleDe(id: string, a: DatosAnalisis, variable: VariableAnalisis, alCambiarVariable: (v: VariableAnalisis) => void): ReactNode {
  if (id === "fft") {
    return (
      <>
        <p className="text-apoyo text-texto-2 mt-4 max-w-medida">{T.analisis.espectro.entrada}</p>
        <div className="grid gap-x-8 lg:grid-cols-2">
          {a.espectro.series.map((s) => <GraficoEspectro key={s.variable} serie={s} sinodico={a.espectro.sinodico_teorico_dias} />)}
        </div>
        <p className="text-apoyo text-texto-2 mt-3 max-w-medida">{a.espectro.nota}</p>
      </>
    );
  }
  if (id === "ajuste") return <Modelo a={a} />;
  if (id === "validacion_horizons") return <Validacion a={a} />;
  if (id === "proyeccion") {
    return (
      <>
        <Segmentado comoRadio etiqueta={T.analisis.serie.variable} valor={variable} alCambiar={alCambiarVariable} className="mt-4" opciones={VARIABLES} />
        <GraficoSerie analisis={a} />
      </>
    );
  }
  return null;
}

function Contenido({ a, variable, alCambiarVariable }: { a: DatosAnalisis; variable: VariableAnalisis; alCambiarVariable: (v: VariableAnalisis) => void }) {
  const t = T.analisis;
  const [activo, setActivo] = useState<string | undefined>(a.pasos[0]?.id);
  // Relato con scroll: el índice lateral marca el paso que está pasando por el centro de la pantalla.
  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => e.isIntersecting && setActivo((e.target as HTMLElement).dataset.paso)),
      { rootMargin: "-35% 0px -60% 0px" },
    );
    document.querySelectorAll<HTMLElement>("[data-paso]").forEach((el) => observador.observe(el));
    return () => observador.disconnect();
  }, [a.pasos.length]);
  // Los nombres y descripciones de los pasos llegan de la API en español: se muestran en el idioma de la interfaz.
  const pasos = a.pasos.map((p) => ({ ...p, ...textoPaso(p, a.validacion) }));
  const aplican = limitacionesQueAplican(a);
  const otras = a.limitaciones.filter((l) => !aplican.includes(l));
  return (
    <>
      <Origen a={a} />
      <div className="mt-10 lg:grid lg:grid-cols-12 lg:gap-x-8">
        <nav aria-label={t.pasos.titulo} className="max-lg:hidden lg:col-span-3">
          <ol className="sticky top-[calc(var(--nav-alto)+7rem)] space-y-1">
            {pasos.map((p, i) => (
              <li key={p.id}>
                <a href={`#paso-${p.id}`} aria-current={activo === p.id ? "step" : undefined}
                  className={unir("text-apoyo rounded-control flex items-baseline gap-3 px-3 py-1.5 transition-[color,background-color] duration-(--dur-micro)",
                    activo === p.id ? "bg-sol-tenue text-texto font-semibold" : "text-texto-2 hover:text-texto")}>
                  <span className="font-mono text-[0.75rem]" data-dato>{i + 1}</span>{p.nombre}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <ol className="min-w-0 lg:col-span-9">
          {pasos.map((p, i) => {
            const { Icono, clase } = ICONO_ESTADO[p.estado] ?? ICONO_ESTADO.no_disponible;
            return (
              <li key={p.id} id={`paso-${p.id}`} data-paso={p.id} className="border-linea scroll-mt-40 border-t py-8 first:border-t-0 first:pt-0">
                <p className="rotulo flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{t.pasos.paso(i + 1, a.pasos.length)}</span>
                  <span className={unir("flex items-center gap-1.5", clase)}><Icono aria-hidden="true" className="size-3.5" />{t.pasos.estados[p.estado] ?? p.estado}</span>
                </p>
                <h3 className="titulo-instrumento text-seccion text-texto mt-2">{p.nombre}</h3>
                <p className="text-texto-2 mt-2 max-w-medida">{p.descripcion}</p>
                <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 xl:grid-cols-4">
                  {p.resultado.map((m) => (
                    <div key={m.nombre} className="min-w-0">
                      <dt className="text-apoyo text-texto-3">{nombreMedida(m.nombre)}</dt>
                      <dd className="text-dato text-texto font-mono" data-dato>{valorMedida(m)}</dd>
                    </div>
                  ))}
                </dl>
                {detalleDe(p.id, a, variable, alCambiarVariable)}
              </li>
            );
          })}
        </ol>
      </div>
      <section aria-labelledby="limitaciones" className="border-linea mt-4 max-w-3xl border-t pt-8">
        <h3 id="limitaciones" className="titulo-instrumento text-seccion text-texto">{t.limitaciones.titulo}</h3>
        <ul className="mt-4 space-y-3">
          {aplican.map((l) => (
            <li key={l.codigo} className="text-texto flex gap-3"><TriangleAlert aria-hidden="true" className="text-reservas mt-1 size-4 shrink-0" />{l.mensaje}</li>
          ))}
        </ul>
        {otras.length > 0 && (
          <Desplegable titulo={t.limitaciones.otras} className="mt-5 border-y">
            <ul className="text-apoyo text-texto-2 space-y-2 pb-3">{otras.map((l) => <li key={l.codigo}>{l.mensaje}</li>)}</ul>
          </Desplegable>
        )}
      </section>
    </>
  );
}

/** «Cómo analizamos los datos»: el pipeline del análisis predictivo de un sitio, paso a paso y con sus reservas. */
function AnalisisSitio() {
  const t = T.analisis;
  const { sitio } = useContextoSitio();
  const [params] = useSearchParams();
  const escribir = useEscribirUrl();
  const pedida = params.get(PARAM_URL.VARIABLE);
  const variable: VariableAnalisis = esVariableAnalisis(pedida) ? pedida : "sol_el_deg";
  const { data, isPending, error, refetch } = useAnalisis(sitio.site_id, variable === "sol_el_deg" ? undefined : variable);
  return (
    <div className="contenedor py-8 lg:py-10">
      <p className="rotulo">{t.rotulo}</p>
      <TituloPagina documento={t.documento(sitio.nombre)} className="text-titulo! mt-2">{t.titulo}</TituloPagina>
      <p className="text-texto-2 mt-3 max-w-medida">{t.entrada}</p>
      {isPending && <EstadoCarga texto={t.cargando} className="min-h-[40svh]" />}
      {error && !data && <EstadoError error={error} className="mt-8" alReintentar={() => void refetch()} />}
      {data && <Contenido a={data} variable={variable} alCambiarVariable={(v) => escribir({ [PARAM_URL.VARIABLE]: v === "sol_el_deg" ? null : v })} />}
    </div>
  );
}

/** Un punto propio no tiene archivo que analizar (sus datos se piden en vivo a JPL): su dirección de análisis lleva al cielo. */
export default function Analisis() {
  const { sitio } = useContextoSitio();
  return esPuntoPropio(sitio.site_id) ? <Navigate to={RUTAS.CIELO(sitio.site_id)} replace /> : <AnalisisSitio />;
}
