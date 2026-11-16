import type { DatosFila } from "../../hooks/useFilasComparacion";
import { rachaDe, RACHAS, varianteRacha } from "../../lib/comparar";
import { esMesCompleto, horasEntre } from "../../lib/fechas";
import { horas } from "../../lib/formato";
import { T, periodoLegible } from "../../lib/textos";
import { Desplegable } from "../ui/Desplegable";

/**
 * «Qué significa para tu misión»: las horas seguidas más largas de cada fila (noche, sin enlace con la Tierra y
 * ventana con Sol y Tierra) en lenguaje operativo. Sale del bloque opcional `indicadores_astronauta` de la API:
 * si no llega, no se pinta nada. Una racha cortada por el borde del periodo se dice «al menos».
 */
export function FrasesMision({ filas, modo, className }: { filas: DatosFila[]; modo: "sitios" | "fechas"; className?: string }) {
  const t = T.comparar.podio;
  const conDatos = filas.filter((f) => f.metrica);
  if (!conDatos.some((d) => RACHAS.some((r) => rachaDe(d.metrica!.indicadores_astronauta, r)))) return null;
  return (
    <Desplegable titulo={t.mision} className={className}>
      <dl className="grid gap-x-8 gap-y-5 md:grid-cols-3">
        {RACHAS.map((clave) => (
          <div key={clave} className="min-w-0">
            <dt className="rotulo">{t.rachas[clave]}</dt>
            {conDatos.map((d) => {
              const racha = rachaDe(d.metrica!.indicadores_astronauta, clave);
              if (!racha) return null;
              const variante = varianteRacha(racha, horasEntre(d.desde, d.hasta), esMesCompleto(d.desde, d.hasta));
              return (
                <dd key={d.clave} className="text-apoyo text-texto-2 mt-2 text-pretty">
                  <span className="text-texto font-semibold first-letter:uppercase">{d.etiqueta}. </span>
                  {t.frases[clave][variante]({ horas: horas(racha.horas), sitio: modo === "sitios" ? d.etiqueta : d.detalle, mes: periodoLegible(d.desde, d.hasta) })}
                </dd>
              );
            })}
          </div>
        ))}
      </dl>
      <p className="text-texto-2 mt-4 text-[0.75rem]">{t.avisoRachas}</p>
    </Desplegable>
  );
}
