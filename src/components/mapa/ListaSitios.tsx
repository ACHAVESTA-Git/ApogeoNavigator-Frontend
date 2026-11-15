import { ChevronRight } from "lucide-react";
import { m } from "motion/react";
import type { CSSProperties } from "react";
import { CATEGORIAS, ENTRADA_LUJO, ID_MEDIDORES_SITIO, ID_NOMBRE_SITIO, MOVIMIENTO } from "../../lib/constants";
import { latitud } from "../../lib/formato";
import { NOMBRE_CATEGORIA, T } from "../../lib/textos";
import type { Metrica, Site } from "../../lib/tipos";
import { GlifoCategoria } from "../glifos/GlifoCategoria";
import { PanelVidrio } from "../lujo";
import { ChipNivel } from "../mision/ChipNivel";
import { MedidoresMision } from "../mision/MedidoresMision";
import { unir } from "../ui/clases";

/**
 * Catálogo en tarjetas de vidrio, agrupadas por categoría: nombre, medidor doble (energía y comunicación del periodo,
 * de `/api/metricas`) y el veredicto global en una palabra. Toda la tarjeta abre la ficha (el botón es el nombre y se
 * estira sobre ella); pasar el ratón o el foco resalta su punto y su anillo en el mapa.
 */
export function ListaSitios({ sitios, metricas, periodo, activo, alActivar, alSeleccionar, compartir = false }: {
  sitios: readonly Site[]; metricas: ReadonlyMap<string, Metrica>; periodo: string;
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
                  className="entrada-lujo relative flex flex-col gap-3 has-[button:active]:scale-[0.99] data-activo:border-texto/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <button type="button" aria-label={T.sitios.tarjeta(s.nombre)} onClick={() => alSeleccionar(s.site_id)}
                        onFocus={() => alActivar(s.site_id)} onBlur={() => alActivar(null)}
                        className="text-texto block max-w-full text-left font-medium after:absolute after:inset-0 after:rounded-panel focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-foco">
                        <m.span layoutId={compartir ? ID_NOMBRE_SITIO(s.site_id) : undefined} layout="position" transition={MOVIMIENTO.SPRING_SUAVE} className="block truncate">{s.nombre}</m.span>
                      </button>
                      <p className="text-apoyo text-texto-2 truncate">
                        {s.agencia} · <span className="font-mono" data-dato>{latitud(s.lat_deg)}</span>
                      </p>
                    </div>
                    <ChevronRight aria-hidden="true" className="text-texto-2 mt-1 size-4 shrink-0" />
                  </div>
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
