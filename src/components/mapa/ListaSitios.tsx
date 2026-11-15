import { Info } from "lucide-react";
import { m, type MotionValue } from "motion/react";
import { Link } from "react-router";
import type { CSSProperties } from "react";
import { CATEGORIAS, ENTRADA_LUJO, ID_MEDIDORES_SITIO, ID_NOMBRE_SITIO, MOVIMIENTO, RUTAS } from "../../lib/constants";
import { recordarOrigen } from "../../lib/motion/vuelo";
import { latitud } from "../../lib/formato";
import { NOMBRE_CATEGORIA, T, agenciaLegible } from "../../lib/textos";
import type { FilaEfemeride, Metrica, Site } from "../../lib/tipos";
import { GlifoCategoria } from "../glifos/GlifoCategoria";
import { PanelVidrio } from "../lujo";
import { ChipNivel } from "../mision/ChipNivel";
import { MedidoresMision } from "../mision/MedidoresMision";
import { MiniHorizonte } from "../mision/MiniHorizonte";
import { unir } from "../ui/clases";

/**
 * Catálogo en tarjetas vivas, agrupadas por categoría: nombre, mini horizonte (el Sol y la Tierra en el instante del
 * reloj del catálogo), medidor doble (energía y comunicación del periodo, de `/api/metricas`) y el veredicto global en
 * una palabra. Un solo gesto principal: toda la tarjeta lleva al cielo del sitio (el enlace es el nombre y se estira
 * sobre ella). La ficha queda en un botón secundario; pasar el ratón o el foco resalta su punto en el mapa.
 */
export function ListaSitios({ sitios, metricas, series, reloj, periodo, activo, alActivar, alSeleccionar, compartir = false }: {
  sitios: readonly Site[]; metricas: ReadonlyMap<string, Metrica>; periodo: string;
  /** Efemérides por sitio y el instante (ms) que mueve los mini horizontes. */
  series: ReadonlyMap<string, readonly FilaEfemeride[]>; reloj: MotionValue<number>;
  activo: string | null; alActivar: (id: string | null) => void; alSeleccionar: (id: string) => void;
  /** El nombre y los medidores son los mismos elementos que los de la ficha (transición compartida). */
  compartir?: boolean;
}) {
  const grupos = CATEGORIAS.map((c) => ({ categoria: c, sitios: sitios.filter((s) => s.categoria === c) })).filter((g) => g.sitios.length);
  if (!grupos.length) return <p className="text-texto-2 py-6">{T.sitios.sinCategoria}</p>;
  let orden = 0;
  return (
    <div aria-label={T.sitios.lista} role="group">
      {grupos.map((g) => (
        <section key={g.categoria} className="mt-7 first:mt-0">
          <h2 className="rotulo flex items-center gap-2">
            <GlifoCategoria categoria={g.categoria} className="size-3" />
            {NOMBRE_CATEGORIA[g.categoria]}
          </h2>
          <ul className="mt-3 grid grid-cols-1 gap-3 min-[30rem]:grid-cols-2">
            {g.sitios.map((s) => {
              const metrica = metricas.get(s.site_id);
              // Escalonado no uniforme y acotado: las primeras tarjetas entran en ola; el resto, con la última.
              const retraso = Math.min(orden++, ENTRADA_LUJO.MAX_ESCALONADAS) * ENTRADA_LUJO.PASO_MS;
              return (
                <PanelVidrio key={s.site_id} como="li" elevable relleno="compacto" data-activo={s.site_id === activo || undefined}
                  onPointerEnter={() => alActivar(s.site_id)} onPointerLeave={() => alActivar(null)}
                  style={{ "--retraso": `${retraso}ms` } as CSSProperties}
                  className="entrada-lujo relative flex flex-col gap-3 has-[a:active]:scale-[0.99] data-activo:border-texto/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link to={RUTAS.CIELO(s.site_id)} aria-label={T.sitios.verCieloDe(s.nombre)}
                        onClick={(e) => recordarOrigen(ID_NOMBRE_SITIO(s.site_id), e.currentTarget.firstElementChild)}
                        onFocus={() => alActivar(s.site_id)} onBlur={() => alActivar(null)}
                        className="text-texto block max-w-full font-medium after:absolute after:inset-0 after:rounded-panel focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-foco">
                        <m.span layoutId={compartir ? ID_NOMBRE_SITIO(s.site_id) : undefined} layout="position" transition={MOVIMIENTO.SPRING_SUAVE} className="block truncate">{s.nombre}</m.span>
                      </Link>
                      <p className="text-apoyo text-texto-2 truncate">
                        {agenciaLegible(s.agencia)} · <span className="font-mono" data-dato>{latitud(s.lat_deg)}</span>
                      </p>
                    </div>
                    {/* Secundario: la ficha (datos del catálogo y fuente). Por encima del enlace estirado; 48 px. */}
                    <button type="button" aria-label={T.sitios.ficha(s.nombre)} onClick={() => alSeleccionar(s.site_id)}
                      className="text-texto-2 hover:text-texto relative z-10 -mt-2 -mr-2 grid size-12 shrink-0 place-content-center rounded-full transition-transform duration-(--dur-micro) ease-salida active:scale-[0.94]">
                      <Info aria-hidden="true" className="size-5" />
                    </button>
                  </div>
                  <MiniHorizonte filas={series.get(s.site_id)} t={reloj} />
                  <m.div layoutId={compartir ? ID_MEDIDORES_SITIO(s.site_id) : undefined} layout="position" transition={MOVIMIENTO.SPRING_SUAVE}>
                    <MedidoresMision metrica={metrica} etiqueta={T.sitios.medidores(periodo)} />
                  </m.div>
                  {/* El veredicto reserva su alto: la tarjeta no cambia de tamaño cuando llega la métrica. */}
                  <p className="flex min-h-7 items-center justify-center">
                    {metrica ? <ChipNivel nivel={metrica.semaforo.global} rotulo={T.sitios.veredicto} /> : <span className="text-apoyo text-texto-2">{T.lujo.sinDato}</span>}
                  </p>
                </PanelVidrio>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
