import { Check, MapPin, TriangleAlert } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useCifraAnimada } from "../../hooks/useCifraAnimada";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import type { PuestoRanking } from "../../hooks/useRanking";
import { avisoDeRelieve } from "../../lib/astro";
import { esPolarSur, esTruncada, frenteAlRanking } from "../../lib/comparar";
import { MOVIMIENTO, RANKING, SEMAFORO } from "../../lib/constants";
import { horas, latitud, nombreCorto, numeroCorto } from "../../lib/formato";
import { T } from "../../lib/textos";
import { Medidor, PanelVidrio, Veredicto } from "../lujo";
import { unir } from "../ui/clases";
import { Insignia } from "./Monograma";

const S = 1000;
const UMBRALES = {
  energia: { viable: SEMAFORO.ENERGIA.VERDE_MIN, reservas: SEMAFORO.ENERGIA.AMARILLO_MIN },
  comunicacion: { viable: SEMAFORO.COMUNICACION.VERDE_MIN, reservas: SEMAFORO.COMUNICACION.AMARILLO_MIN },
};
/** Alto reservado de una fila (también del hueco de carga): nada salta cuando llegan los datos. */
const ALTO_FILA = "min-h-[30.5rem] lg:min-h-[15.1875rem]";
const REJILLA = "grid items-center gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(13rem,17rem)]";

/** La cifra decisiva: horas seguidas con Sol y Tierra a la vez. Interpola solo cuando cambia el periodo. */
function CifraDecisiva({ fila, ranking }: { fila: PuestoRanking; ranking: readonly PuestoRanking[] }) {
  const t = T.comparar;
  const valor = fila.ventana?.horas ?? 0;
  const cifra = useCifraAnimada<HTMLSpanElement>(valor, numeroCorto);
  if (!fila.ventana) return <p className="text-apoyo text-texto-2">{t.top.sinVentana}</p>;
  const cortada = esTruncada(fila.ventana);
  const leido = horas(valor);
  const frente = frenteAlRanking(ranking, fila);
  return (
    <div className="min-w-0 max-lg:order-2">
      <p className="text-dato-xl text-texto font-mono font-medium whitespace-nowrap" data-dato>
        <span className="sr-only">{t.top.decisivaLeida(cortada ? t.podio.alMenosLeido(leido) : leido)}</span>
        <span aria-hidden="true">
          {cortada && <span className="text-texto-2 mr-[0.2em] font-light">≥</span>}
          <span ref={cifra}>{numeroCorto(valor)}</span>
          <span className="text-texto-2 ml-[0.18em] text-[0.5em] font-light">h</span>
        </span>
      </p>
      <p aria-hidden="true" className="text-apoyo text-texto-2 mt-1.5 text-pretty">{t.top.decisiva}</p>
      {frente && (
        <p className="text-apoyo text-texto mt-1 font-medium text-pretty" data-dato>
          {t.top.frente(frente.dif_h, horas(Math.abs(frente.dif_h)), nombreCorto(frente.rival.sitio.nombre), frente.rival.puesto)}
        </p>
      )}
    </div>
  );
}

function Fila({ fila, ranking, elegido, alAlternar }: { fila: PuestoRanking; ranking: readonly PuestoRanking[]; elegido: boolean; alAlternar: () => void }) {
  const t = T.comparar;
  const reducido = useMovimientoReducido();
  const { sitio, metrica } = fila;
  const nombre = nombreCorto(sitio.nombre);
  const aviso = avisoDeRelieve(metrica);
  return (
    <m.li layout={reducido ? false : "position"} transition={{ layout: MOVIMIENTO.SPRING_SUAVE }}
      initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: MOVIMIENTO.CORTA / S, ease: MOVIMIENTO.EASE_SALIDA } }}
      exit={{ opacity: 0, transition: { duration: MOVIMIENTO.MICRO / S, ease: MOVIMIENTO.EASE_SALIDA } }}
      className="relative" data-puesto={fila.puesto} data-sitio={sitio.site_id}>
      <PanelVidrio className={unir(REJILLA, ALTO_FILA, elegido && "outline-texto/70 outline-2 -outline-offset-2")}>
        <div className="flex min-w-0 items-start gap-4">
          <p className="text-dato-xl text-texto-2 w-[1.4ch] shrink-0 text-center font-mono font-medium" data-dato>
            <span className="sr-only">{t.top.puesto(fila.puesto)}</span><span aria-hidden="true">{fila.puesto}</span>
          </p>
          <Insignia siteId={sitio.site_id} nombre={sitio.nombre} />
          <div className="min-w-0 flex-1">
            <Veredicto nivel={metrica.semaforo.global} como="h3" tamano="seccion">{nombre}</Veredicto>
            <p className="text-apoyo text-texto-2 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{sitio.agencia}</span>
              <span className="font-mono" data-dato>{latitud(sitio.lat_deg)}</span>
            </p>
            <div className="mt-2 flex min-h-6 flex-wrap items-center gap-x-4 gap-y-1.5">
              {esPolarSur(sitio.lat_deg) && (
                <p className="text-texto bg-texto/8 inline-flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-1.5 text-[0.75rem] font-semibold">
                  <MapPin aria-hidden="true" className="size-3.5 shrink-0" />{t.top.polarSur}
                </p>
              )}
              {aviso && (
                <p className="text-reservas flex items-center gap-1 text-[0.75rem] font-semibold">
                  <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                  {t.podio.sensible}<span className="sr-only">: {aviso.mensaje}</span>
                </p>
              )}
              {elegido && (
                <p className="text-texto flex items-center gap-1 text-[0.75rem] font-semibold">
                  <Check aria-hidden="true" className="size-3.5 shrink-0" />{t.top.enDetalle}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-4 max-lg:order-3 sm:gap-8 lg:justify-end">
          <Medidor valor={metrica.pct_sol} umbrales={UMBRALES.energia} rotulo={t.filas.energia} unidad="%" tamano="md" animar={false} />
          <Medidor valor={metrica.pct_tierra} umbrales={UMBRALES.comunicacion} rotulo={t.filas.comunicacion} unidad="%" tamano="md" animar={false} />
        </div>
        <CifraDecisiva fila={fila} ranking={ranking} />
      </PanelVidrio>
      {/* Toda la fila es el objetivo táctil: un toque abre (o cierra) su detalle. El contenido queda debajo, legible. */}
      <button type="button" aria-pressed={elegido} aria-label={elegido ? t.top.quitar(nombre) : t.top.elegir(nombre)} onClick={alAlternar}
        className="rounded-panel absolute inset-0 cursor-pointer transition-transform duration-(--dur-micro) ease-salida active:scale-[0.995]" />
    </m.li>
  );
}

/**
 * Ranking de sitios para el periodo elegido. Cada fila: puesto, monograma, nombre con su veredicto (icono +
 * palabra), dos medidores (energía y comunicación) y la cifra decisiva. Al cambiar de periodo las filas se
 * recolocan (el cambio de puesto es el mensaje). Mientras carga se reserva el alto de los puestos.
 */
export function TopSitios({ filas, ranking, elegidos, alAlternar, cargando, vacio }: {
  filas: PuestoRanking[]; ranking: readonly PuestoRanking[]; elegidos: readonly string[]; alAlternar: (id: string) => void; cargando: boolean; vacio: string;
}) {
  const t = T.comparar.top;
  if (cargando) {
    return (
      <ol aria-busy="true" aria-label={t.lista(RANKING.PUESTOS)} className="mt-4 grid gap-3">
        {Array.from({ length: RANKING.PUESTOS }, (_, i) => <li key={i} className={unir("vidrio opacity-60", ALTO_FILA)} />)}
      </ol>
    );
  }
  if (!filas.length) return <p role="status" className="text-entrada text-texto-2 mt-6">{vacio}</p>;
  return (
    <ol aria-label={t.lista(Math.min(RANKING.PUESTOS, filas.length))} className="mt-4 grid gap-3">
      <AnimatePresence mode="popLayout" initial={false}>
        {filas.map((f) => <Fila key={f.sitio.site_id} fila={f} ranking={ranking} elegido={elegidos.includes(f.sitio.site_id)} alAlternar={() => alAlternar(f.sitio.site_id)} />)}
      </AnimatePresence>
    </ol>
  );
}
