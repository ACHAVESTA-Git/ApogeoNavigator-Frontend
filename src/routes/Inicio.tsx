import { ArrowRight } from "lucide-react";
import { Suspense, lazy, useMemo, useState } from "react";
import { DiagramaPolo } from "../components/hero/DiagramaPolo";
import { HeroPortada } from "../components/hero/HeroPortada";
import { Pie } from "../components/layout/Pie";
import { TituloPagina } from "../components/layout/TituloPagina";
import { EnlaceBoton, EnlaceExterno } from "../components/ui/Boton";
import { Desplegable } from "../components/ui/Desplegable";
import { DATOS, ENLACES, INCLINACION_EJE_LUNAR_DEG, MUESTRA, RUTAS } from "../lib/constants";
import { aUtc, soloFecha } from "../lib/fechas";
import { grados } from "../lib/formato";
import { diaPortada } from "../lib/portada";
import { T } from "../lib/textos";
import { cargarSitios } from "../rutas";
import { unir } from "../components/ui/clases";

const SECCION = "contenedor grid grid-cols-1 gap-x-6 gap-y-6 py-14 md:grid-cols-12 md:py-20";
const TITULO_SECCION = "rotulo md:col-span-3";
const TITULAR_PORTADA = unir(
  "text-display! mt-3 max-w-[26ch] md:mt-5",
  // Alto reservado en líneas, medido con Playwright sobre el build. Español: 5 líneas hasta 369 px, 4 hasta 497 px y 3 desde 498 px.
  "min-h-[5lh] min-[23.125rem]:min-h-[4lh] min-[31.125rem]:min-h-[3lh]",
  // Inglés: 5 hasta 329 px, 4 hasta 455 px y 3 desde 456 px.
  "min-[20.625rem]:[:lang(en)_&]:min-h-[4lh] min-[28.5rem]:[:lang(en)_&]:min-h-[3lh]",
);

// Bajo la portada: en un trozo aparte para no engordar el JS inicial. Su hueco reserva alto (no hay salto al llegar).
const RecorridoInicio = lazy(() => import("../components/inicio/RecorridoInicio"));

export default function Inicio() {
  const t = T.inicio;
  const inclinacion = grados(INCLINACION_EJE_LUNAR_DEG, 2);
  // «Hoy» se lee una vez al entrar: el día de la portada no cambia mientras se mira.
  const [ahora] = useState(() => Date.now());
  const dia = useMemo(() => diaPortada(ahora), [ahora]);
  return (
    <>
      <HeroPortada
        dia={dia}
        hoy={soloFecha(aUtc(ahora))}
        titulo={
          // Alto reservado en líneas: la fuente de respaldo parte el titular en menos líneas y, al llegar la
          // definitiva, empujaría el resto del bloque. Las líneas por ancho e idioma están medidas con Playwright.
          <TituloPagina documento={t.documento} className={TITULAR_PORTADA}>
            {t.titular.antes}<span className="text-sol">{t.titular.acento}</span>{t.titular.despues}
          </TituloPagina>
        }
        cta={
          <EnlaceBoton to={RUTAS.SITIOS} variante="primario" className="px-6" onPointerEnter={() => void cargarSitios()} onFocus={() => void cargarSitios()}>
            {t.cta}
            <ArrowRight aria-hidden="true" className="size-4" />
          </EnlaceBoton>
        }
      />

      <div className="bg-regolito">
        <Suspense fallback={<div className="min-h-[120svh]" />}>
          <RecorridoInicio dia={dia} />
        </Suspense>

        <section aria-labelledby="polo" className={`${SECCION} border-linea border-t`}>
          <h2 id="polo" className={TITULO_SECCION}>{t.polo.titulo}</h2>
          <div className="md:col-span-5">
            <p className="text-texto max-w-medida text-entrada">{t.polo.texto(inclinacion)}</p>
            <Desplegable titulo={t.polo.glosario} className="mt-8">
              <dl className="space-y-4">
                {t.polo.terminos.map((g) => (
                  <div key={g.termino}>
                    <dt className="text-texto font-semibold">{g.termino}</dt>
                    <dd className="text-texto-2 text-apoyo mt-0.5 max-w-medida">{g.definicion}</dd>
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
            <p className="text-texto max-w-medida text-entrada">{t.datos.texto}</p>
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
            <p className="text-texto text-entrada">{t.equipo.texto}</p>
            {t.equipo.roles.length > 0 && (
              <ul className="text-texto-2 mt-4 space-y-1">
                {t.equipo.roles.map((rol) => <li key={rol}>{rol}</li>)}
              </ul>
            )}
          </div>
        </section>
        <Pie />
      </div>
    </>
  );
}
