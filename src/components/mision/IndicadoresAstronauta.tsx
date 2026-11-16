import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { PARAM_URL, RUTAS } from "../../lib/constants";
import { fechaHora, horasEntre } from "../../lib/fechas";
import { grados, horas, numeroCorto } from "../../lib/formato";
import { esRacha, esRachaCortada, horasHasta, motivoSinPuesta, varianteRacha } from "../../lib/indicadores";
import { T, periodoLegible } from "../../lib/textos";
import type { Metrica, Racha } from "../../lib/tipos";
import { CifraHeroe } from "../lujo";
import { Desplegable } from "../ui/Desplegable";

type Clave = "noche" | "apagon" | "ventana";

/** La frase «qué significa para tu misión» que es CIERTA para la racha (indicadores-astronauta §4 y §6). */
function frase(clave: Clave, racha: Racha, horasPeriodo: number, sitio: string, periodo: string): string {
  const t = T.mision[clave];
  const h = horas(racha.horas);
  switch (varianteRacha(racha, horasPeriodo)) {
    case "cero": return t.cero(periodo);
    case "todo": return t.todo(h, periodo);
    case "cortada": return t.cortada(h);
    default: return t.normal(h, sitio, periodo);
  }
}

/** Primer nivel, en lenguaje operativo: «Tendrás Sol y Tierra a la vez 291 h seguidas», «Sin enlace… durante ≥ 335 h». */
function operativa(clave: Clave, racha: Racha, horasPeriodo: number): string {
  const t = T.mision.operativa[clave];
  const h = `${esRachaCortada(racha) ? "≥ " : ""}${horas(racha.horas)}`;
  const variante = varianteRacha(racha, horasPeriodo);
  return variante === "cero" ? t.cero : variante === "todo" ? t.todo(h) : t.racha(h);
}

/** Una racha: cifra («≥» si toca un borde del periodo), su rango en UTC y la frase. Sin dato deja el hueco. */
function Indicador({ clave, racha, horasPeriodo, sitio, periodo, children }: {
  clave: Clave; racha: unknown; horasPeriodo: number; sitio: string; periodo: string; children?: React.ReactNode;
}) {
  const rotulo = T.mision[clave].rotulo;
  if (!esRacha(racha)) {
    return (
      <div className="min-w-0">
        <p className="rotulo mb-2">{rotulo}</p>
        <p className="text-dato-xl text-texto-2 font-mono" aria-hidden="true">—</p>
        <p className="text-apoyo text-texto-2 mt-2">{T.lujo.sinDato}</p>
      </div>
    );
  }
  const cortada = esRachaCortada(racha);
  return (
    <div className="min-w-0" data-variante={varianteRacha(racha, horasPeriodo)}>
      <CifraHeroe valor={racha.horas} unidad="h" rotulo={rotulo} tamano="media" animar={false}
        formato={(v) => (cortada ? `≥ ${numeroCorto(v)}` : numeroCorto(v))}
        contexto={<><span className="text-texto block font-medium">{operativa(clave, racha, horasPeriodo)}</span><span className="mt-1 block">{frase(clave, racha, horasPeriodo, sitio, periodo)}</span></>} />
      {racha.inicio_utc && racha.fin_utc && (
        <p className="text-texto-2 mt-1.5 font-mono text-[0.75rem]" data-dato>{T.mision.rango(fechaHora(racha.inicio_utc), fechaHora(racha.fin_utc))}</p>
      )}
      {children}
    </div>
  );
}

/**
 * Indicadores para astronautas de un sitio y un periodo (`indicadores_astronauta` de `/api/metricas`).
 * Evidencia: noche más larga, apagón de enlace y ventana Sol+Tierra. Detalle (plegado): elevación media y próximas
 * puestas, con el aviso de horizonte ideal. Si la API no trae el bloque, se dice y no se enseña ninguna cifra.
 */
export function IndicadoresAstronauta({ metrica, sitio }: { metrica: Metrica; sitio: { site_id: string; nombre: string } }) {
  const t = T.mision;
  const ind = metrica.indicadores_astronauta;
  if (!ind) return <p className="text-apoyo text-texto-2">{t.sinIndicadores}</p>;
  const horasPeriodo = horasEntre(metrica.inicio_utc, metrica.fin_utc);
  const periodo = periodoLegible(metrica.inicio_utc, metrica.fin_utc);
  const comun = { horasPeriodo, sitio: sitio.nombre, periodo };
  const ventana = ind.ventana_sol_y_tierra;
  const inicioVentana = esRacha(ventana) && ventana.horas > 0 ? ventana.inicio_utc : null;
  const elevacion = ind.sol_el_media_horas_sol_deg;
  const puestas = ([["sol", ind.proxima_puesta_sol_utc], ["tierra", ind.proxima_puesta_tierra_utc]] as const).flatMap(([astro, utc]) => {
    const h = horasHasta(metrica.inicio_utc, utc);
    if (h !== null && utc) return [t.puestas[astro](fechaHora(utc), horas(h))];
    // `null` = sin puesta dentro del periodo pedido; `undefined` = la API no trae el campo (hueco).
    if (utc !== null) return [];
    // Sin horas visibles el astro no sale en el periodo: se dice eso, no «sin puesta antes de…» (que lo daría por visible).
    if (motivoSinPuesta(astro === "sol" ? metrica.horas_sol : metrica.horas_tierra_visible) === "noSale") return [`${astro === "sol" ? t.noSaleSol : t.noSaleTierra}.`];
    return [astro === "sol" ? t.sinPuestaSol(fechaHora(metrica.fin_utc)) : t.sinPuestaTierra(fechaHora(metrica.fin_utc))];
  });
  return (
    <div>
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
        <Indicador clave="noche" racha={ind.noche_mas_larga} {...comun} />
        <Indicador clave="apagon" racha={ind.apagon_tierra_mas_largo} {...comun} />
        <Indicador clave="ventana" racha={ventana} {...comun}>
          {inicioVentana && (
            <Link to={`${RUTAS.CIELO(sitio.site_id)}?${new URLSearchParams({ [PARAM_URL.DESDE]: metrica.inicio_utc, [PARAM_URL.HASTA]: metrica.fin_utc, [PARAM_URL.T]: inicioVentana })}`}
              className="text-apoyo text-texto hover:text-sol mt-2 inline-flex min-h-12 items-center gap-1.5 underline decoration-linea underline-offset-4">
              {t.verCielo}<ArrowRight aria-hidden="true" className="size-4 shrink-0" />
            </Link>
          )}
        </Indicador>
      </div>
      <Desplegable titulo={t.detalle} className="mt-4">
        <dl className="text-apoyo grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {elevacion !== undefined && (elevacion !== null || metrica.horas_sol === 0) && (
            <div>
              <dt className="rotulo">{t.elevacion.rotulo}</dt>
              {elevacion !== null && <dd className="text-dato-lg text-texto mt-1 font-mono" data-dato>{grados(elevacion, 1)}</dd>}
              <dd className="text-texto-2 mt-1">{elevacion !== null ? t.elevacion.normal(grados(elevacion, 1)) : t.elevacion.cero(periodo)}</dd>
            </div>
          )}
          {puestas.length > 0 && (
            <div>
              <dt className="rotulo">{t.puestas.rotulo}</dt>
              {puestas.map((p) => <dd key={p} className="text-texto-2 mt-1">{p}</dd>)}
              <dd className="text-texto-2 mt-1 text-[0.75rem]">{t.puestas.nota}</dd>
            </div>
          )}
        </dl>
        <p className="text-texto-2 mt-4 max-w-medida text-[0.75rem]">{t.avisoLargo}</p>
      </Desplegable>
    </div>
  );
}
