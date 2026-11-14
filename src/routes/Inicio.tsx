import { ArrowRight, Sunset } from "lucide-react";
import { GlifoSol, GlifoTierra } from "../components/glifos/Astros";
import { DiagramaPolo } from "../components/hero/DiagramaPolo";
import { EscenaHero } from "../components/hero/EscenaHero";
import { Pie } from "../components/layout/Pie";
import { TituloPagina } from "../components/layout/TituloPagina";
import { EnlaceBoton, EnlaceExterno } from "../components/ui/Boton";
import { Desplegable } from "../components/ui/Desplegable";
import { DATOS, ENLACES, INCLINACION_EJE_LUNAR_DEG, MUESTRA, PARAM_URL, RUTAS } from "../lib/constants";
import { mesLargo, soloFecha } from "../lib/fechas";
import { grados, latitud } from "../lib/formato";
import { T } from "../lib/textos";
import { cargarSitios } from "../rutas";

const LAT_SHACKLETON = -89.66; // sites.csv
const ICONO = { sol: <GlifoSol px={22} />, tierra: <GlifoTierra px={22} />, puesta: <Sunset aria-hidden="true" className="text-texto size-[22px]" strokeWidth={1.5} /> };
const SECCION = "contenedor grid gap-x-6 gap-y-6 py-14 md:grid-cols-12 md:py-20";
const TITULO_SECCION = "rotulo md:col-span-3";

export default function Inicio() {
  const t = T.inicio;
  const inclinacion = grados(INCLINACION_EJE_LUNAR_DEG, 2);
  return (
    <>
      <EscenaHero>
        <p className="rotulo">{t.rotulo(latitud(LAT_SHACKLETON), mesLargo(DATOS.DESDE_POR_DEFECTO))}</p>
        <TituloPagina documento={t.documento} className="text-display! mt-3 max-w-[17ch] md:mt-5">{t.titular}</TituloPagina>
        <p className="text-texto-2 max-md:text-apoyo mt-3 max-w-[52ch] md:mt-6 md:text-[1.0625rem]">{t.apoyo}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 md:mt-8">
          <EnlaceBoton to={RUTAS.SITIOS} variante="primario" className="px-5" onPointerEnter={() => void cargarSitios()} onFocus={() => void cargarSitios()}>
            {t.explorar}
            <ArrowRight aria-hidden="true" className="size-4" />
          </EnlaceBoton>
          <EnlaceBoton to={`${RUTAS.CIELO(DATOS.SITIO_DESTACADO)}?${PARAM_URL.T}=${DATOS.T_POR_DEFECTO}`} variante="texto">
            {t.verCielo}
          </EnlaceBoton>
        </div>
      </EscenaHero>

      <div className="bg-regolito">
        <section aria-labelledby="preguntas" className={SECCION}>
          <h2 id="preguntas" className={TITULO_SECCION}>{t.preguntas.titulo}</h2>
          <ol className="grid gap-8 md:col-span-9 md:grid-cols-3 md:gap-6">
            {t.preguntas.lista.map((p) => (
              <li key={p.pregunta} className="border-linea border-t pt-5">
                {ICONO[p.astro]}
                <h3 className="text-subtitulo text-texto mt-4 font-medium">{p.pregunta}</h3>
                <p className="text-texto-2 mt-2">{p.respuesta}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="polo" className={`${SECCION} border-linea border-t`}>
          <h2 id="polo" className={TITULO_SECCION}>{t.polo.titulo}</h2>
          <div className="md:col-span-5">
            <p className="text-texto max-w-[60ch] text-[1.0625rem]">{t.polo.texto(inclinacion)}</p>
            <Desplegable titulo={t.polo.glosario} className="mt-8">
              <dl className="space-y-4">
                {t.polo.terminos.map((g) => (
                  <div key={g.termino}>
                    <dt className="text-texto font-semibold">{g.termino}</dt>
                    <dd className="text-texto-2 text-apoyo mt-0.5 max-w-[60ch]">{g.definicion}</dd>
                  </div>
                ))}
              </dl>
            </Desplegable>
          </div>
          <div className="md:col-span-4"><DiagramaPolo /></div>
        </section>

        <section aria-labelledby="datos" className={`${SECCION} border-linea border-t`}>
          <h2 id="datos" className={TITULO_SECCION}>{t.datos.titulo}</h2>
          <div className="md:col-span-9">
            <p className="text-texto max-w-[60ch] text-[1.0625rem]">{t.datos.texto}</p>
            <ul className="mt-6">
              {t.datos.fuentes.map((f) => (
                <li key={f.clave} className="border-linea grid gap-1 border-t py-3 md:grid-cols-[14rem_1fr]">
                  <EnlaceExterno href={ENLACES[f.clave]}>{f.nombre}</EnlaceExterno>
                  <span className="text-texto-2 text-apoyo">{f.uso}</span>
                </li>
              ))}
            </ul>
            <p className="text-dato-sm text-texto-3 mt-4 font-mono" data-dato>
              {t.datos.periodo(soloFecha(DATOS.COBERTURA.DESDE), soloFecha(DATOS.COBERTURA.HASTA), MUESTRA.FECHA_INSTANTANEA)}
            </p>
          </div>
        </section>

        <section aria-labelledby="equipo" className={`${SECCION} border-linea border-t`}>
          <h2 id="equipo" className={TITULO_SECCION}>{t.equipo.titulo}</h2>
          <div className="md:col-span-9">
            <p className="text-texto text-[1.0625rem]">{t.equipo.texto}</p>
            <ul className="text-texto-2 mt-4 space-y-1">
              {t.equipo.roles.map((rol) => <li key={rol}>{rol}</li>)}
            </ul>
          </div>
        </section>
        <Pie />
      </div>
    </>
  );
}
