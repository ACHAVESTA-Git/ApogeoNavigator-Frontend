import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMetricas } from "../../hooks/useMetricas";
import { esSensibleAlRelieve } from "../../lib/astro";
import { RANGO_POR_DEFECTO, RUTAS } from "../../lib/constants";
import { coordenadas, horas, pct } from "../../lib/formato";
import { NOMBRE_CATEGORIA, T, periodoLegible } from "../../lib/textos";
import type { Site } from "../../lib/tipos";
import { GlifoAstro } from "../glifos/Astros";
import { GlifoCategoria } from "../glifos/GlifoCategoria";
import { GlifoSemaforo } from "../glifos/GlifoSemaforo";
import { Boton, EnlaceBoton, EnlaceExterno } from "../ui/Boton";
import { Lectura } from "../ui/Lectura";
import { BotonComparar } from "./BotonComparar";

const RANGO = RANGO_POR_DEFECTO;

const Cifra = ({ pct: p, horas: h }: { pct: number; horas: number }) => (
  <>
    <span className="text-subtitulo whitespace-nowrap">{pct(p)}</span>{" "}
    <span className="text-texto-2 whitespace-nowrap">· {horas(h)}</span>
  </>
);

/** Detalle bajo demanda de un sitio: datos del catálogo, dos mini-lecturas del periodo y las acciones. */
export function FichaSitio({ sitio, alVolver, idTitulo }: { sitio: Site; alVolver?: () => void; idTitulo: string }) {
  const t = T.sitios;
  const { data } = useMetricas([sitio.site_id], RANGO);
  const m = data?.resultados[0];
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
      <h2 id={idTitulo} tabIndex={-1} className="titulo-instrumento text-titulo text-texto mt-2 text-balance outline-none">{sitio.nombre}</h2>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
        <Lectura rotulo={t.mision}><span className="font-sans">{sitio.mision}</span></Lectura>
        <Lectura rotulo={t.agencia}><span className="font-sans">{sitio.agencia}</span></Lectura>
        <Lectura rotulo={t.coordenadas} className="col-span-2">{coordenadas(sitio.lat_deg, sitio.lon_este_deg)}</Lectura>
      </dl>

      <dl className="border-linea mt-5 grid grid-cols-2 gap-x-6 border-y py-4" aria-busy={!m}>
        <Lectura rotulo={<span className="inline-flex items-center gap-2"><GlifoAstro astro="sol" px={12} />{t.solPeriodo}</span>}
          nota={m && <GlifoSemaforo nivel={m.semaforo.energia} nota={esSensibleAlRelieve(m)} className="mt-1" />}>
          {m ? <Cifra pct={m.pct_sol} horas={m.horas_sol} /> : "—"}
        </Lectura>
        <Lectura rotulo={<span className="inline-flex items-center gap-2"><GlifoAstro astro="tierra" px={12} />{t.tierraPeriodo}</span>}
          nota={m && <GlifoSemaforo nivel={m.semaforo.comunicacion} className="mt-1" />}>
          {m ? <Cifra pct={m.pct_tierra} horas={m.horas_tierra_visible} /> : "—"}
        </Lectura>
        <p className="text-texto-3 col-span-2 mt-3 text-[0.75rem]">{periodo}. {T.avisoHorizonteCorto}{m && esSensibleAlRelieve(m) ? ` * ${T.semaforo.sensible}.` : ""}</p>
      </dl>

      {sitio.notas && <p className="text-apoyo text-texto-2 mt-4 max-w-[60ch]">{sitio.notas}</p>}
      <p className="text-apoyo mt-3">
        <EnlaceExterno href={sitio.fuente_url}>{T.fuente}: {new URL(sitio.fuente_url).hostname}</EnlaceExterno>
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <EnlaceBoton to={RUTAS.CIELO(sitio.site_id)} variante="primario">
          {t.verCielo}
          <ArrowRight aria-hidden="true" className="size-4" />
        </EnlaceBoton>
        <BotonComparar siteId={sitio.site_id} />
      </div>
    </article>
  );
}
