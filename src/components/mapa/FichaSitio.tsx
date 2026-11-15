import { Link } from "react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { m as motion } from "motion/react";
import { useMetricas } from "../../hooks/useMetricas";
import { esSensibleAlRelieve } from "../../lib/astro";
import { ID_MEDIDORES_SITIO, ID_NOMBRE_SITIO, MOVIMIENTO, RANGO_POR_DEFECTO, RUTAS } from "../../lib/constants";
import { horasEntre } from "../../lib/fechas";
import { coordenadas, horas } from "../../lib/formato";
import { recordarOrigen } from "../../lib/motion/vuelo";
import { NOMBRE_CATEGORIA, T, periodoLegible } from "../../lib/textos";
import type { Metrica, Site } from "../../lib/tipos";
import { GlifoCategoria } from "../glifos/GlifoCategoria";
import { Boton, EnlaceBoton, EnlaceExterno } from "../ui/Boton";
import { Lectura } from "../ui/Lectura";
import { PanelVidrio } from "../lujo";
import { ChipNivel } from "../mision/ChipNivel";
import { MedidoresMision } from "../mision/MedidoresMision";
import { BotonComparar } from "./BotonComparar";

const RANGO = RANGO_POR_DEFECTO;

/** Detalle bajo demanda de un sitio: datos del catálogo, dos mini-lecturas del periodo y las acciones. */
export function FichaSitio({ sitio, metrica, alVolver, idTitulo, compartir = false }: {
  sitio: Site; alVolver?: () => void; idTitulo: string;
  /** La métrica que ya tiene la tarjeta (mismo periodo): la ficha abre con sus cifras, sin hueco ni otra petición. */
  metrica?: Metrica;
  /** El título es el mismo elemento que el nombre de la fila de la lista (transición compartida). */
  compartir?: boolean;
}) {
  const t = T.sitios;
  const { data } = useMetricas(metrica ? [] : [sitio.site_id], RANGO);
  const m = metrica ?? data?.resultados[0];
  const total = horasEntre(RANGO.desde, RANGO.hasta);
  const periodo = t.enPeriodo(periodoLegible(RANGO.desde, RANGO.hasta));
  return (
    <article aria-labelledby={idTitulo}>
      {alVolver && (
        <Boton variante="texto" onClick={alVolver} className="-ml-2">
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t.volver}
        </Boton>
      )}
      <p className="rotulo mt-3 flex items-center gap-2">
        <GlifoCategoria categoria={sitio.categoria} className="size-3" />
        {NOMBRE_CATEGORIA[sitio.categoria]}
      </p>
      <motion.h2 id={idTitulo} tabIndex={-1} layoutId={compartir ? ID_NOMBRE_SITIO(sitio.site_id) : undefined} layout="position" transition={MOVIMIENTO.SPRING_SUAVE}
        className="titulo-instrumento text-titulo text-texto mt-2 text-balance outline-none">{sitio.nombre}</motion.h2>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
        <Lectura rotulo={t.mision}><span className="font-sans">{sitio.mision}</span></Lectura>
        <Lectura rotulo={t.agencia}><span className="font-sans">{sitio.agencia}</span></Lectura>
        <Lectura rotulo={t.coordenadas} className="col-span-2">{coordenadas(sitio.lat_deg, sitio.lon_este_deg)}</Lectura>
      </dl>

      <section aria-busy={!m} aria-label={periodo} className="mt-5">
        {/* Los medidores son los mismos de la tarjeta (layoutId): viajan de la tarjeta a la ficha y vuelven por el mismo camino. */}
        <PanelVidrio relleno="compacto" className="flex flex-col items-center gap-3">
          <motion.div layoutId={compartir ? ID_MEDIDORES_SITIO(sitio.site_id) : undefined} layout="position" transition={MOVIMIENTO.SPRING_SUAVE}>
            <MedidoresMision metrica={m} tamano="md" animar={!compartir} etiqueta={t.medidores(periodoLegible(RANGO.desde, RANGO.hasta))} />
          </motion.div>
          <p className="flex min-h-7 items-center">
            {m ? <ChipNivel nivel={m.semaforo.global} rotulo={T.semaforo.global} /> : <span className="text-apoyo text-texto-2">{T.lujo.sinDato}</span>}
          </p>
          {m && (
            <p className="text-texto-2 text-center text-[0.75rem]">
              {t.solPeriodo}: {T.ventanas.deHoras(horas(m.horas_sol), horas(total))} · {t.tierraPeriodo}: {T.ventanas.deHoras(horas(m.horas_tierra_visible), horas(total))}
            </p>
          )}
        </PanelVidrio>
        <p className="text-texto-3 mt-3 text-[0.75rem] first-letter:uppercase">{periodo}. {T.avisoHorizonteCorto}{m && esSensibleAlRelieve(m) ? ` * ${T.semaforo.sensible}.` : ""}</p>
      </section>

      {sitio.notas && <p className="text-apoyo text-texto-2 mt-4 max-w-medida">{sitio.notas}</p>}
      <p className="text-apoyo mt-3">
        <EnlaceExterno href={sitio.fuente_url}>{T.fuente}: {new URL(sitio.fuente_url).hostname}</EnlaceExterno>
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <EnlaceBoton to={RUTAS.CIELO(sitio.site_id)} variante="primario"
          onClick={() => recordarOrigen(ID_NOMBRE_SITIO(sitio.site_id), document.getElementById(idTitulo))}>
          {t.verCielo}
          <ArrowRight aria-hidden="true" className="size-4" />
        </EnlaceBoton>
        <BotonComparar siteId={sitio.site_id} />
      </div>
      <p className="text-apoyo mt-4">
        <Link to={RUTAS.ANALISIS(sitio.site_id)} className="text-texto-2 hover:text-texto underline decoration-linea underline-offset-4">{T.analisis.enlace}</Link>
      </p>
    </article>
  );
}
