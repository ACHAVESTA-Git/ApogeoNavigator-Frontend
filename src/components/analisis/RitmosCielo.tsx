import type { Analisis } from "../../lib/analisis";
import { numero } from "../../lib/formato";
import { ritmoDominante } from "../../lib/informe";
import { T } from "../../lib/textos";
import { Desplegable } from "../ui/Desplegable";
import { GraficoEspectro } from "./GraficoEspectro";

/**
 * «Ritmos del cielo»: el espectro contado como una sola idea. El ritmo más fuerte de la elevación del Sol es el día
 * lunar (solo se dice si la API marca ese pico como sinódico); el espectro completo queda en un desplegable.
 */
export function RitmosCielo({ a }: { a: Analisis }) {
  const t = T.analisis.informe.ritmos;
  const ritmo = ritmoDominante(a.espectro);
  return (
    <section aria-labelledby="ritmos-cielo" className="mt-12">
      <h3 id="ritmos-cielo" className="titulo-instrumento text-seccion text-texto">{t.titulo}</h3>
      {ritmo && (
        <div className="mt-4 grid gap-x-10 gap-y-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
          <div>
            <p className="rotulo">{t.cifra}</p>
            <p className="text-dato-xl text-texto mt-2 font-mono font-medium whitespace-nowrap" data-dato>
              {numero(ritmo.periodo_dias, 1)}<span className="text-texto-2 ml-[0.18em] text-[0.5em] font-light tracking-normal">{t.unidad}</span>
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-entrada text-texto max-w-medida">
              {ritmo.es_sinodico ? t.sinodico(numero(ritmo.periodo_dias, 1), numero(a.espectro.sinodico_teorico_dias, 2)) : t.otro(numero(ritmo.periodo_dias, 1))}
            </p>
            {ritmo.es_sinodico && <p className="text-apoyo text-texto-2 mt-2 max-w-medida">{t.mision}</p>}
          </div>
        </div>
      )}
      <Desplegable titulo={t.ver} className="mt-5 border-y">
        <p className="text-apoyo text-texto-2 max-w-medida">{T.analisis.espectro.entrada}</p>
        <div className="grid gap-x-8 lg:grid-cols-2">
          {a.espectro.series.map((s) => <GraficoEspectro key={s.variable} serie={s} sinodico={a.espectro.sinodico_teorico_dias} />)}
        </div>
        <p className="text-apoyo text-texto-2 mt-3 max-w-medida">{a.espectro.nota}</p>
      </Desplegable>
    </section>
  );
}
