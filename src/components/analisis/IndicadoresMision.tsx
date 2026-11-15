import { useMetricas } from "../../hooks/useMetricas";
import { fechaHora, horasEntre } from "../../lib/fechas";
import { grados, numeroCorto } from "../../lib/formato";
import { motivoSinPuesta } from "../../lib/indicadores";
import { esMinimo, varianteRacha } from "../../lib/informe";
import { T, periodoLegible } from "../../lib/textos";
import type { RachaAstronauta, Utc } from "../../lib/tipos";
import { Desplegable } from "../ui/Desplegable";

type TextosRacha = {
  rotulo: string; cero: (mes: string) => string; sigue: (h: string) => string;
  veniaDeAntes: (h: string, mes: string) => string; todo: (mes: string, h: string) => string;
};

/** Una racha: la cifra (con «≥» si toca un borde del periodo), cuándo ocurre y qué significa para la misión. */
function Racha({ racha, horasPeriodo, mes, textos, normal }: { racha: RachaAstronauta | null | undefined; horasPeriodo: number; mes: string; textos: TextosRacha; normal: (h: string) => string }) {
  const t = T.analisis.informe.mision;
  const variante = varianteRacha(racha, horasPeriodo);
  if (variante === "sinDato" || !racha) return null; // sin dato no es cero: se deja el hueco
  const h = numeroCorto(racha.horas);
  const frase = variante === "cero" ? textos.cero(mes) : variante === "todo" ? textos.todo(mes, h)
    : variante === "sigue" ? textos.sigue(h) : variante === "veniaDeAntes" ? textos.veniaDeAntes(h, mes) : normal(h);
  return (
    <li className="min-w-0" data-variante={variante}>
      <p className="rotulo">{textos.rotulo}</p>
      <p className="text-dato-xl text-texto mt-2 font-mono font-medium whitespace-nowrap" data-dato>
        {esMinimo(racha) && variante !== "cero" ? t.minimo(h) : h}<span className="text-texto-2 ml-[0.18em] text-[0.5em] font-light tracking-normal">h</span>
      </p>
      {racha.inicio_utc && racha.fin_utc && racha.horas > 0 && (
        <p className="text-texto-2 mt-1.5 font-mono text-[0.75rem]" data-dato>{t.rango(fechaHora(racha.inicio_utc), fechaHora(racha.fin_utc))}</p>
      )}
      <p className="text-apoyo text-texto mt-2 max-w-medida-corta">{frase}</p>
    </li>
  );
}

/**
 * Indicadores para astronautas (campo aditivo `indicadores_astronauta` de GET /api/metricas) del periodo elegido en
 * la cabecera del sitio. Si la API no los trae, se dice «sin datos»: nunca se calcula ni se inventa una cifra aquí.
 * Frases y reglas: docs/datos/indicadores-astronauta.md (sin «elevación baja»; puestas a hora entera, ±1 h).
 */
export function IndicadoresMision({ siteId, sitio, desde, hasta }: { siteId: string; sitio: string; desde: Utc; hasta: Utc }) {
  const t = T.analisis.informe.mision;
  const { data, isPending } = useMetricas([siteId], { desde, hasta });
  const m = data?.resultados.find((r) => r.site_id === siteId);
  const ind = m?.indicadores_astronauta;
  const mes = periodoLegible(desde, hasta);
  const horasPeriodo = m ? horasEntre(m.inicio_utc, m.fin_utc) : 0;
  // Sin próxima puesta (`null`) hay dos casos distintos: el astro no sale en todo el periodo (0 h a la vista) o está a
  // la vista y no llega a ponerse. Decir «no hay puesta» en el primero daría el astro por visible.
  const puesta = (utc: Utc | null | undefined, horasVisible: number, con: (fecha: string, h: string, mes: string) => string, sin: (mes: string) => string, noSale: string) =>
    utc === undefined ? null : utc !== null ? con(fechaHora(utc), numeroCorto(horasEntre(desde, utc)), mes)
      : motivoSinPuesta(horasVisible) === "noSale" ? `${noSale}.` : sin(mes);
  const elevacion = ind?.sol_el_media_horas_sol_deg;
  const detalle = ind && m ? [
    { clave: "elevacion", rotulo: t.elevacion.rotulo, frases: [typeof elevacion === "number" ? t.elevacion.normal(grados(elevacion, 1)) : elevacion === null && m.horas_sol === 0 ? t.elevacion.cero(mes) : null], nota: null },
    { clave: "puestas", rotulo: t.puestas.rotulo, nota: t.puestas.nota,
      frases: [puesta(ind.proxima_puesta_sol_utc, m.horas_sol, t.puestas.sol, t.puestas.sinSol, T.mision.noSaleSol),
        puesta(ind.proxima_puesta_tierra_utc, m.horas_tierra_visible, t.puestas.tierra, t.puestas.sinTierra, T.mision.noSaleTierra)] },
  ].map((d) => ({ ...d, frases: d.frases.filter((f): f is string => f !== null) })).filter((d) => d.frases.length > 0) : [];
  return (
    <section aria-labelledby="indicadores-mision" className="mt-12 min-h-64" aria-busy={isPending}>
      <h3 id="indicadores-mision" className="titulo-instrumento text-seccion text-texto">{t.titulo}</h3>
      <p className="rotulo mt-2">{t.periodo(mes)}</p>
      {!isPending && !ind && <p className="text-texto-2 mt-4">{t.sinDatos}</p>}
      {ind && m && (
        <>
          <ul className="mt-6 grid gap-x-8 gap-y-8 md:grid-cols-3">
            <Racha racha={ind.noche_mas_larga} horasPeriodo={horasPeriodo} mes={mes} textos={t.noche} normal={(h) => t.noche.normal(h, sitio, mes)} />
            <Racha racha={ind.apagon_tierra_mas_largo} horasPeriodo={horasPeriodo} mes={mes} textos={t.apagon} normal={(h) => t.apagon.normal(h, sitio, mes)} />
            <Racha racha={ind.ventana_sol_y_tierra} horasPeriodo={horasPeriodo} mes={mes} textos={t.ventana} normal={t.ventana.normal} />
          </ul>
          <p className="text-apoyo text-texto-2 mt-6 max-w-medida">{t.aviso}</p>
          {detalle.length > 0 && (
            <Desplegable titulo={detalle.map((d) => d.rotulo).join(" · ")} className="mt-4 border-y">
              <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
                {detalle.map((d) => (
                  <div key={d.clave} className="min-w-0">
                    <dt className="rotulo">{d.rotulo}</dt>
                    {d.frases.map((f) => <dd key={f} className="text-apoyo text-texto mt-1.5">{f}</dd>)}
                    {d.nota && <dd className="text-texto-2 mt-1.5 text-[0.75rem]">{d.nota}</dd>}
                  </div>
                ))}
              </dl>
            </Desplegable>
          )}
        </>
      )}
    </section>
  );
}
