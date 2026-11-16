import { ArrowRight } from "lucide-react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router";
import resumenMes from "../../assets/hero-shackleton.json";
import { useAnalisis } from "../../hooks/useAnalisis";
import { useFilasPortada } from "../../hooks/useFilasPortada";
import { useMetricas } from "../../hooks/useMetricas";
import { useRevelado } from "../../hooks/useRevelado";
import { useSites } from "../../hooks/useSites";
import { textoFirma } from "../../lib/analisis";
import { DATOS, MOVIMIENTO, PORTADA, RANGO_POR_DEFECTO, RUTAS } from "../../lib/constants";
import { aMs, fechaHora, mesLargo, soloFecha } from "../../lib/fechas";
import { grados, horas, nombreCorto } from "../../lib/formato";
import { interpolarFila } from "../../lib/interpolar";
import { abreviarHuella } from "../../lib/lujo";
import { horasCubiertas, type DiaPortada } from "../../lib/portada";
import { NOMBRE_ASTRO, T } from "../../lib/textos";
import { CifraHeroe, PanelVidrio, Sello, Veredicto } from "../lujo";
import { unir } from "../ui/clases";

const R = resumenMes.resumen; // hechos de diciembre de 2026 calculados con las filas horarias del CSV
const ELEVACION = (v: number) => grados(v, 2, true);
const ENTERO = (v: number) => String(Math.round(v));
// Mientras cuenta, la cifra ocupa ya el ancho de su valor final (espacios de cifra a la izquierda): la unidad no se mueve.
const enteroDeAncho = (final: number) => (v: number) => ENTERO(v).padStart(ENTERO(final).length, "\u2007");
const REVELADO = "opacity-0 translate-y-3 transition-[opacity,translate] duration-(--dur-media) ease-salida data-visto:translate-y-0 data-visto:opacity-100 motion-reduce:translate-y-0";

/** Bloque que entra una sola vez al llegar a pantalla (opacidad y 12 px de subida; con movimiento reducido, solo opacidad). */
function Revelar({ retraso = 0, className, children }: { retraso?: number; className?: string; children: (visto: boolean) => ReactNode }) {
  const { ref, visto } = useRevelado();
  return (
    <div ref={ref} data-visto={visto || undefined} className={unir(REVELADO, className)} style={{ transitionDelay: `${retraso}ms` } as CSSProperties}>
      {children(visto)}
    </div>
  );
}

/** Hueco de una cifra que aún no ha llegado: reserva su alto para que nada salte cuando llegue. */
const Hueco = ({ fallo }: { fallo: boolean }) => (
  <p className="text-dato-xl text-texto-2 font-mono font-medium" data-dato aria-busy={!fallo}>{fallo ? T.lujo.sinDato : <span aria-hidden="true" className="bg-texto/10 inline-block h-[0.8em] w-[4ch] rounded" />}</p>
);

function Cifra({ rotulo, contexto, listo, fallo, children }: { rotulo: string; contexto: ReactNode; listo: boolean; fallo: boolean; children: () => ReactNode }) {
  return (
    <li className="min-w-0">
      {listo ? children() : (
        <>
          <p className="rotulo mb-2">{rotulo}</p>
          <Hueco fallo={fallo} />
          <p className="text-apoyo text-texto-2 mt-2">{contexto}</p>
        </>
      )}
    </li>
  );
}

/** Acto 2 (evidencia): tres cifras del catálogo real. Cada una cuenta hacia su valor una sola vez, al entrar en pantalla. */
function Cifras() {
  const t = T.inicio.cifras;
  const sitios = useSites();
  const analisis = useAnalisis(DATOS.SITIO_DESTACADO);
  const entrada = analisis.data?.entrada;
  const periodo = entrada ? t.horas.contexto(soloFecha(entrada.inicio_utc), soloFecha(entrada.fin_utc)) : t.horas.contexto(soloFecha(DATOS.COBERTURA.DESDE), soloFecha(DATOS.COBERTURA.HASTA));
  const firma = t.huella.contexto(textoFirma(entrada?.origen.manifiesto?.firmado));
  return (
    <section aria-labelledby="cifras" className="contenedor py-14 md:py-20">
      <h2 id="cifras" className="rotulo">{t.titulo}</h2>
      <Revelar className="mt-6">
        {(visto) => (
          <PanelVidrio>
            <ul className="grid gap-8 lg:grid-cols-3 lg:gap-10">
              <Cifra rotulo={t.sitios.rotulo} contexto={t.sitios.contexto} listo={visto && Boolean(sitios.data)} fallo={sitios.isError}>
                {() => <CifraHeroe tamano="media" valor={sitios.data?.length ?? 0} formato={ENTERO} rotulo={t.sitios.rotulo} contexto={t.sitios.contexto} />}
              </Cifra>
              <Cifra rotulo={t.horas.rotulo} contexto={periodo} listo={visto && Boolean(entrada)} fallo={analisis.isError}>
                {() => <CifraHeroe tamano="media" tono="sol" valor={entrada ? horasCubiertas(entrada) : 0} formato={enteroDeAncho(entrada ? horasCubiertas(entrada) : 0)} unidad="h" rotulo={t.horas.rotulo} contexto={periodo} />}
              </Cifra>
              <Cifra rotulo={t.huella.rotulo} contexto={firma} listo={Boolean(entrada)} fallo={analisis.isError}>
                {() => {
                  const huella = abreviarHuella(entrada?.origen.sha3_256 ?? "", PORTADA.HUELLA_CARACTERES);
                  return (
                    <>
                      <p className="rotulo mb-2">{t.huella.rotulo}</p>
                      <p className="text-dato-xl text-texto font-mono font-medium whitespace-nowrap" data-dato>
                        <span className="sr-only">{t.huella.completa(huella)}</span>
                        <span aria-hidden="true">{huella}</span>
                      </p>
                      <p className="text-apoyo text-texto-2 mt-2">{firma}</p>
                    </>
                  );
                }}
              </Cifra>
            </ul>
          </PanelVidrio>
        )}
      </Revelar>
    </section>
  );
}

const ENLACE = "tactil text-texto decoration-horizonte hover:decoration-texto mt-4 inline-flex items-center gap-1.5 font-medium underline underline-offset-4 transition-colors duration-(--dur-corta)";

const PASOS = ["cielo", "comparar", "analisis"] as const;
const ID_PASO = (paso: (typeof PASOS)[number]) => `paso-${paso}`;

/** Índice del paso que cruza la franja central de la pantalla (0 mientras no haya entrado ninguno). */
function usePasoActivo(): number {
  const [activo, setActivo] = useState(0);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observador = new IntersectionObserver((entradas) => {
      for (const e of entradas) if (e.isIntersecting) setActivo(PASOS.findIndex((p) => ID_PASO(p) === e.target.id));
    }, { rootMargin: PORTADA.PASO_ACTIVO_MARGEN });
    for (const p of PASOS) {
      const el = document.getElementById(ID_PASO(p));
      if (el) observador.observe(el);
    }
    return () => observador.disconnect();
  }, []);
  return activo;
}

/**
 * Índice fijo del recorrido (solo en escritorio): acompaña el scroll y marca el paso que se está leyendo con el
 * número en ámbar, el nombre en negrita y `aria-current`. Son enlaces: también sirve para saltar a un paso.
 */
function IndiceRecorrido({ activo }: { activo: number }) {
  const t = T.inicio.recorrido;
  return (
    <nav aria-label={t.indice} className="sticky top-[calc(var(--nav-alto)+2.5rem)] hidden self-start lg:block">
      <ol>
        {PASOS.map((paso, i) => (
          <li key={paso}>
            <a href={`#${ID_PASO(paso)}`} aria-current={activo === i ? "step" : undefined}
              className={unir("tactil flex items-center gap-3 transition-colors duration-(--dur-corta)", activo === i ? "text-texto font-semibold" : "text-texto-2 hover:text-texto")}>
              <span className={unir("text-dato-sm font-mono tabular-nums transition-colors duration-(--dur-corta)", activo === i ? "text-sol" : "text-texto-3")} data-dato>{`0${i + 1}`}</span>
              {t[paso].nombre}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Paso({ id, n, nombre, titulo, texto, enlace, a, altoPanel, children }: { id: string; n: number; nombre: string; titulo: string; texto: ReactNode; enlace: string; a: string; altoPanel: string; children: (visto: boolean) => ReactNode }) {
  return (
    <li id={id} className="grid gap-x-6 gap-y-6 md:grid-cols-12 md:items-center">
      <Revelar className="md:col-span-5">
        {() => (
          <>
            <p className="rotulo">{T.inicio.recorrido.paso(n, nombre)}</p>
            <h3 className="text-titulo text-texto mt-3 font-semibold text-balance">{titulo}</h3>
            <div className="text-texto-2 max-w-medida mt-3 space-y-3">{texto}</div>
            <Link to={a} className={ENLACE}>{enlace}<ArrowRight aria-hidden="true" className="size-4" /></Link>
          </>
        )}
      </Revelar>
      <Revelar retraso={MOVIMIENTO.STAGGER} className="md:col-span-6 md:col-start-7">
        {(visto) => <div className={altoPanel}>{children(visto)}</div>}
      </Revelar>
    </li>
  );
}

const SinDatos = ({ cargando }: { cargando: boolean }) => (
  <PanelVidrio className="flex h-full items-center" aria-busy={cargando}>
    {!cargando && <p className="text-texto-2">{T.inicio.recorrido.sinDatos}</p>}
  </PanelVidrio>
);

/** Paso 1: la lectura del cielo de Shackleton en el instante de referencia de la portada (componentes vivos). */
function PanelCielo({ dia, visto }: { dia: DiaPortada; visto: boolean }) {
  const t = T.inicio.recorrido.cielo;
  const { filas, fallo } = useFilasPortada(dia);
  if (!filas.length || !visto) return <SinDatos cargando={!fallo} />;
  const pos = interpolarFila(filas, aMs(dia.referencia));
  return (
    <PanelVidrio className="h-full">
      <div className="grid grid-cols-2 gap-6">
        {(["sol", "tierra"] as const).map((astro) => (
          <CifraHeroe key={astro} tamano="media" tono={astro} valor={pos[`${astro}_el_deg`]} formato={ELEVACION}
            rotulo={t.elevacion(NOMBRE_ASTRO[astro])} contexto={pos[`${astro}_el_deg`] > 0 ? t.sobre : t.bajo} />
        ))}
      </div>
      <p className="text-dato-sm text-texto-2 mt-6 font-mono" data-dato>{t.instante(fechaHora(dia.referencia))}</p>
      <p className="text-apoyo text-texto-2 mt-1">{T.avisoHorizonteCorto}</p>
    </PanelVidrio>
  );
}

/** Paso 2: el veredicto de viabilidad (viene de la API) de la comparación sugerida, en el mes por defecto. */
function PanelComparar() {
  const t = T.inicio.recorrido.comparar;
  const metricas = useMetricas([...DATOS.COMPARACION_SUGERIDA], RANGO_POR_DEFECTO);
  const sitios = useSites();
  if (!metricas.data) return <SinDatos cargando={!metricas.isError} />;
  const nombre = (id: string) => nombreCorto(sitios.data?.find((s) => s.site_id === id)?.nombre ?? id);
  return (
    <PanelVidrio className="h-full">
      <p className="rotulo">{t.periodo(mesLargo(RANGO_POR_DEFECTO.desde))}</p>
      <ul className="mt-4 space-y-4">
        {metricas.data.resultados.map((m) => (
          <li key={m.site_id}>
            <Veredicto nivel={m.semaforo.global} tamano="entrada">
              {nombre(m.site_id)}
              <span className="text-apoyo text-texto-2 block font-normal">{t.fila(horas(m.horas_sol), horas(m.horas_tierra_visible))}</span>
            </Veredicto>
          </li>
        ))}
      </ul>
      <p className="text-apoyo text-texto-2 mt-4">{T.avisoHorizonteCorto}</p>
    </PanelVidrio>
  );
}

/** Paso 3: el certificado de procedencia del archivo de Shackleton, tal como lo da el análisis. */
function PanelAnalisis() {
  const analisis = useAnalisis(DATOS.SITIO_DESTACADO);
  if (!analisis.data) return <SinDatos cargando={!analisis.isError} />;
  return <Sello origen={analisis.data.entrada.origen} titulo="h3" className="h-full" />;
}

/** Bajo la portada: las tres cifras del catálogo y el recorrido Cielo → Comparar → Análisis con componentes vivos. */
export default function RecorridoInicio({ dia }: { dia: DiaPortada }) {
  const t = T.inicio.recorrido;
  const a = T.inicio.actos;
  const activo = usePasoActivo();
  return (
    <>
      <Cifras />
      <section aria-labelledby="recorrido" className="border-linea contenedor border-t py-14 md:py-20">
        <h2 id="recorrido" className="rotulo">{t.titulo}</h2>
        <div className="mt-10 lg:grid lg:grid-cols-[9rem_minmax(0,1fr)] lg:gap-x-10">
        <IndiceRecorrido activo={activo} />
        <ol className="space-y-16 md:space-y-24">
          <Paso id={ID_PASO("cielo")} n={1} nombre={t.cielo.nombre} titulo={t.cielo.titulo} enlace={t.cielo.enlace} a={RUTAS.CIELO(DATOS.SITIO_DESTACADO)} altoPanel="min-h-52"
            texto={<>
              <p>{a.uno.contexto(grados(R.sol_el_min_deg, 2, true), grados(R.sol_el_max_deg, 2, true))}</p>
              <p>{t.cielo.tierra} {a.dos.contexto(a.momento(R.tierra_salida_utc), a.momento(R.tierra_puesta_utc), horas(R.horas_total - R.horas_tierra))}</p>
            </>}>
            {(visto) => <PanelCielo dia={dia} visto={visto} />}
          </Paso>
          <Paso id={ID_PASO("comparar")} n={2} nombre={t.comparar.nombre} titulo={t.comparar.titulo} enlace={t.comparar.enlace} a={RUTAS.COMPARAR} altoPanel="min-h-80"
            texto={<p>{a.tres.contexto(a.momento(R.sol_puesta_utc))}</p>}>
            {() => <PanelComparar />}
          </Paso>
          <Paso id={ID_PASO("analisis")} n={3} nombre={t.analisis.nombre} titulo={t.analisis.titulo} enlace={t.analisis.enlace} a={RUTAS.ANALISIS(DATOS.SITIO_DESTACADO)} altoPanel="min-h-64"
            texto={<p>{t.analisis.texto}</p>}>
            {() => <PanelAnalisis />}
          </Paso>
        </ol>
        </div>
      </section>
    </>
  );
}
