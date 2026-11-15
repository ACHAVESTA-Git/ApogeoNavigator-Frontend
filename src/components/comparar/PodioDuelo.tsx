import { Award, TriangleAlert } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { memo, type ReactNode } from "react";
import { useCifraAnimada } from "../../hooks/useCifraAnimada";
import type { DatosFila } from "../../hooks/useFilasComparacion";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { avisoDeRelieve } from "../../lib/astro";
import { cifrasPodio, decidir, diferencias, esTruncada, protagonista, rachaDe, RACHAS, varianteRacha, type CifraPodio, type ClaveRacha } from "../../lib/comparar";
import { COMPARAR, MOVIMIENTO } from "../../lib/constants";
import { esMesCompleto, horasEntre } from "../../lib/fechas";
import { horas, numeroCorto, pct } from "../../lib/formato";
import { T, partesDecision, periodoLegible, relatoDiferencia } from "../../lib/textos";
import type { Astro, Metrica, NivelSemaforo } from "../../lib/tipos";
import { GlifoAstro } from "../glifos/Astros";
import { GlifoSemaforo } from "../glifos/GlifoSemaforo";
import { CifraHeroe, PanelVidrio, Veredicto } from "../lujo";
import { Desplegable } from "../ui/Desplegable";
import { unir } from "../ui/clases";

type Modo = "sitios" | "fechas";
const S = 1000;
const RELLENO: Record<Astro, string> = { sol: "bg-sol", tierra: "bg-tierra" };
/** Rejilla del duelo: en móvil la etiqueta ocupa su propia línea; desde md va en la primera columna. */
const REJILLA: Record<number, string> = {
  2: "grid-cols-2 md:grid-cols-[minmax(0,15rem)_repeat(2,minmax(0,1fr))]",
  3: "grid-cols-3 md:grid-cols-[minmax(0,15rem)_repeat(3,minmax(0,1fr))]",
};
const conSigno = (v: number): string => `${v > 0 ? "+" : ""}${numeroCorto(Math.round(v))}`;

/** Una celda del duelo: al cambiar la selección, las que siguen se recolocan y las nuevas aparecen en su sitio. */
function Celda({ children, className, encabezado }: { children: ReactNode; className?: string; encabezado?: boolean }) {
  const reducido = useMovimientoReducido();
  return (
    <m.div role={encabezado ? "columnheader" : "cell"} layout={reducido ? false : "position"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: MOVIMIENTO.CORTA / S, ease: MOVIMIENTO.EASE_SALIDA } }}
      exit={{ opacity: 0, transition: { duration: MOVIMIENTO.MICRO / S, ease: MOVIMIENTO.EASE_SALIDA } }}
      transition={{ layout: MOVIMIENTO.SPRING_SUAVE }} className={unir("min-w-0", className)}>
      {children}
    </m.div>
  );
}

function Fila({ etiqueta, ayuda, astros, columnas, children }: { etiqueta: string; ayuda?: string; astros: Astro[]; columnas: number; children: ReactNode }) {
  return (
    <div role="row" className={unir("capilar-t grid items-start gap-x-4 gap-y-2 py-4 md:gap-x-6", REJILLA[columnas])}>
      <div role="rowheader" className="col-span-full min-w-0 md:col-span-1">
        <p className="text-texto text-apoyo flex items-center gap-1.5 font-semibold">
          {astros.map((a) => <GlifoAstro key={a} astro={a} px={12} />)}
          {etiqueta}
        </p>
        {ayuda && <p className="text-texto-2 mt-1 text-[0.75rem] text-pretty">{ayuda}</p>}
      </div>
      <AnimatePresence mode="popLayout" initial={false}>{children}</AnimatePresence>
    </div>
  );
}

/** Barra emparejada: la parte del periodo con el astro sobre el horizonte. Crece una vez y se reajusta al cambiar el dato. */
function Barra({ astro, valor, nivel, metrica, orden }: { astro: Astro; valor: number; nivel: NivelSemaforo; metrica?: Metrica; orden: number }) {
  const reducido = useMovimientoReducido();
  const cifra = useCifraAnimada<HTMLSpanElement>(valor, pct);
  const aviso = metrica && avisoDeRelieve(metrica);
  const escala = Math.min(1, Math.max(0, valor / 100));
  return (
    <>
      <p className="flex items-center gap-2 whitespace-nowrap">
        <span ref={cifra} className="text-dato-lg text-texto font-mono font-medium" data-dato>{pct(valor)}</span>
        <GlifoSemaforo nivel={nivel} conTexto={false} nota={Boolean(aviso)} />
      </p>
      <div aria-hidden="true" className="bg-linea mt-2 h-1.5 overflow-hidden rounded-full">
        <m.div className={unir("h-full origin-left rounded-full", RELLENO[astro])}
          initial={reducido ? false : { scaleX: 0 }} animate={{ scaleX: escala }}
          transition={{ duration: reducido ? 0 : MOVIMIENTO.MEDIA / S, delay: reducido ? 0 : (orden * COMPARAR.PODIO_STAGGER_MS) / S, ease: MOVIMIENTO.EASE_SALIDA }} />
      </div>
      {aviso && (
        <p title={aviso.mensaje} className="text-reservas mt-2 flex items-center gap-1 text-[0.75rem] font-medium">
          <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
          <span>{T.comparar.podio.sensible}<span className="sr-only">: {aviso.mensaje}</span></span>
        </p>
      )}
    </>
  );
}

function Diferencia({ cifra, principal }: { cifra: CifraPodio; principal: boolean }) {
  const t = T.comparar.podio;
  return (
    <CifraHeroe valor={cifra.valor} formato={conSigno} unidad={cifra.unidad} tamano={principal ? "heroe" : "media"}
      tono={principal && cifra.eje === "sol" ? "sol" : "texto"}
      rotulo={cifra.valor < 0 ? t.cede : principal ? t.ventaja : t.segundaVentaja}
      contexto={<span className="flex items-center gap-1.5"><GlifoAstro astro={cifra.eje} px={12} />{cifra.eje === "sol" ? t.deSol(cifra.rival) : t.deTierra(cifra.rival)}</span>} />
  );
}

/**
 * Podio del duelo (acto 1 y arranque del acto 2): el veredicto en una frase con su estado, la diferencia que lo
 * explica en cifras héroe y las filas enfrentadas en barras emparejadas de energía y comunicación. Decide con el
 * semáforo y los avisos de la API; todas las cifras salen de `/api/metricas` (aquí solo se restan y se ordenan).
 */
function Podio({ filas, modo }: { filas: DatosFila[]; modo: Modo }) {
  const t = T.comparar;
  const conDatos = filas.filter((f) => f.metrica);
  if (conDatos.length < 2) return null;
  const lineas = conDatos.map((d) => ({ nombre: d.etiqueta, ...d.metrica!, sensible: Boolean(avisoDeRelieve(d.metrica!)) }));
  const decision = decidir(lineas);
  const frase = partesDecision(lineas, modo === "sitios" ? periodoLegible(conDatos[0].desde, conDatos[0].hasta) : conDatos[0].detalle);
  const lider = protagonista(decision);
  const cifras = lider === null ? [] : cifrasPodio(lineas, lider);
  const recomendadas = new Set(decision?.recomendadas);
  const difs = diferencias(lineas);
  const n = conDatos.length;
  const hayRachas = conDatos.some((d) => RACHAS.some((r) => rachaDe(d.metrica!.indicadores_astronauta, r)));
  const fraseDe = (d: DatosFila, clave: ClaveRacha): string | null => {
    const racha = rachaDe(d.metrica!.indicadores_astronauta, clave);
    if (!racha) return null;
    const variante = varianteRacha(racha, horasEntre(d.desde, d.hasta), esMesCompleto(d.desde, d.hasta));
    return t.podio.frases[clave][variante]({ horas: horas(racha.horas), sitio: modo === "sitios" ? d.etiqueta : d.detalle, mes: periodoLegible(d.desde, d.hasta) });
  };

  return (
    <PanelVidrio como="section" className="mt-6" aria-labelledby="podio-veredicto">
      <div className="grid items-end gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div key={frase.principal} aria-live="polite" className="animate-aparecer min-w-0">
          <p className="rotulo mb-3">{t.veredicto}</p>
          <Veredicto nivel={conDatos[decision!.recomendadas[0]].metrica!.semaforo.global} como="h2">
            <span id="podio-veredicto">{frase.principal}</span>
          </Veredicto>
          {frase.matices.length > 0 && (
            <ul className="text-apoyo text-texto-2 mt-4 max-w-medida space-y-1">
              {frase.matices.map((matiz) => <li key={matiz} className="flex gap-2"><span aria-hidden="true" className="bg-texto-2 mt-[0.6em] size-1 shrink-0 rounded-full" />{matiz}</li>)}
            </ul>
          )}
        </div>
        {cifras.length > 0 && (
          <div className="flex flex-wrap items-end gap-x-10 gap-y-5">
            {cifras.map((c, i) => <Diferencia key={c.eje} cifra={c} principal={i === 0} />)}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="rotulo">{t.podio.duelo}</h3>
        <p className="text-texto-2 mt-1 text-[0.75rem]">{t.podio.dueloAyuda}</p>
        <div role="table" aria-label={t.podio.tablaDuelo} className="mt-3">
          <div role="row" className={unir("grid items-end gap-x-4 gap-y-2 pb-4 md:gap-x-6", REJILLA[n])}>
            <div role="presentation" className="max-md:hidden" />
            <AnimatePresence mode="popLayout" initial={false}>
              {conDatos.map((d, i) => (
                <Celda key={d.clave} encabezado>
                  {recomendadas.has(i) && (
                    <p className="border-linea text-texto mb-2 inline-flex max-w-full items-center gap-1 rounded-full border py-0.5 pr-2.5 pl-1.5 text-[0.75rem] font-semibold">
                      <Award aria-hidden="true" className="text-sol size-3.5 shrink-0" /><span className="truncate">{t.recomendada}</span>
                    </p>
                  )}
                  <p className="text-texto line-clamp-2 font-semibold first-letter:uppercase">{d.etiqueta}</p>
                  <p className="text-texto-2 truncate font-mono text-[0.75rem]" data-dato>{d.detalle}</p>
                  <GlifoSemaforo nivel={d.metrica!.semaforo.global} className="mt-1.5" />
                  <p className="text-texto-2 mt-1.5 text-[0.75rem] text-pretty first-letter:uppercase max-md:hidden" data-dato>{relatoDiferencia(difs[i])}</p>
                </Celda>
              ))}
            </AnimatePresence>
          </div>
          <Fila etiqueta={t.podio.energia} astros={["sol"]} columnas={n}>
            {conDatos.map((d, i) => <Celda key={d.clave}><Barra astro="sol" valor={d.metrica!.pct_sol} nivel={d.metrica!.semaforo.energia} metrica={d.metrica} orden={i} /></Celda>)}
          </Fila>
          <Fila etiqueta={t.podio.comunicacion} astros={["tierra"]} columnas={n}>
            {conDatos.map((d, i) => <Celda key={d.clave}><Barra astro="tierra" valor={d.metrica!.pct_tierra} nivel={d.metrica!.semaforo.comunicacion} orden={i + 1} /></Celda>)}
          </Fila>
          {hayRachas && RACHAS.map((clave) => (
            <Fila key={clave} etiqueta={t.podio.rachas[clave]} ayuda={t.podio.definiciones[clave]} columnas={n}
              astros={clave === "noche_mas_larga" ? ["sol"] : clave === "apagon_tierra_mas_largo" ? ["tierra"] : ["sol", "tierra"]}>
              {conDatos.map((d) => {
                const racha = rachaDe(d.metrica!.indicadores_astronauta, clave);
                return (
                  <Celda key={d.clave}>
                    {racha ? (
                      <p className="text-dato-lg text-texto font-mono font-medium whitespace-nowrap" data-dato>
                        {esTruncada(racha)
                          ? <><span aria-hidden="true">{t.podio.alMenos(horas(racha.horas))}</span><span className="sr-only">{t.podio.alMenosLeido(horas(racha.horas))}</span></>
                          : horas(racha.horas)}
                      </p>
                    ) : <p className="text-apoyo text-texto-2">{t.podio.sinDato}</p>}
                  </Celda>
                );
              })}
            </Fila>
          ))}
        </div>
      </div>

      {hayRachas && (
        <Desplegable titulo={t.podio.mision} className="mt-2">
          <dl className="grid gap-x-8 gap-y-5 pb-2 md:grid-cols-3">
            {RACHAS.map((clave) => (
              <div key={clave} className="min-w-0">
                <dt className="rotulo">{t.podio.rachas[clave]}</dt>
                {conDatos.map((d) => {
                  const texto = fraseDe(d, clave);
                  return texto && (
                    <dd key={d.clave} className="text-apoyo text-texto-2 mt-2 text-pretty">
                      <span className="text-texto font-semibold first-letter:uppercase">{d.etiqueta}. </span>{texto}
                    </dd>
                  );
                })}
              </div>
            ))}
          </dl>
          <p className="text-texto-2 mt-3 text-[0.75rem]">{t.podio.avisoRachas}</p>
        </Desplegable>
      )}
    </PanelVidrio>
  );
}

/** El podio no depende del instante: mientras el cursor se mueve (20 Hz al reproducir) no se vuelve a pintar. */
export const PodioDuelo = memo(Podio, (a, b) =>
  a.modo === b.modo && a.filas.length === b.filas.length &&
  a.filas.every((f, i) => f.clave === b.filas[i].clave && f.metrica === b.filas[i].metrica && f.etiqueta === b.filas[i].etiqueta && f.detalle === b.filas[i].detalle));
