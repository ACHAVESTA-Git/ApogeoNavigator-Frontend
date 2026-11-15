import type { DatosFila } from "../../hooks/useFilasComparacion";
import { esSensibleAlRelieve } from "../../lib/astro";
import { grados, horas, pct } from "../../lib/formato";
import { T } from "../../lib/textos";
import type { ValoresMetricas } from "../../lib/tipos";
import { GlifoSemaforo } from "../glifos/GlifoSemaforo";

const NUMERICAS: { clave: keyof Omit<ValoresMetricas, "sol_el_media_deg">; formato: (v: number) => string }[] = [
  { clave: "horas_sol", formato: horas },
  { clave: "pct_sol", formato: pct },
  { clave: "sol_el_max_deg", formato: (v) => grados(v, 2, true) },
  { clave: "horas_tierra_visible", formato: horas },
  { clave: "pct_tierra", formato: pct },
];
const EJES = ["energia", "comunicacion", "global"] as const;

/** Las mismas cifras en tabla. El mejor valor de cada fila se marca con la palabra «mejor», no solo con color. */
export function TablaComparacion({ filas }: { filas: DatosFila[] }) {
  const t = T.comparar;
  const conDatos = filas.filter((f) => f.metrica);
  return (
    <div className="overflow-x-auto">
      <table className="text-dato-sm w-full min-w-[32rem] border-collapse">
        <caption className="sr-only">{t.tablaTitulo}</caption>
        <thead>
          <tr>
            <th scope="col" className="rotulo bg-vacio sticky left-0 py-2 pr-4 text-left">{t.metrica}</th>
            {conDatos.map((f) => <th key={f.clave} scope="col" className="text-texto px-3 py-2 text-right font-semibold first-letter:uppercase">{f.etiqueta}</th>)}
          </tr>
        </thead>
        <tbody>
          {NUMERICAS.map(({ clave, formato }) => {
            const valores = conDatos.map((f) => f.metrica![clave]);
            const maximo = Math.max(...valores);
            const hayMejor = valores.filter((v) => v === maximo).length === 1;
            return (
              <tr key={clave} className="capilar-t">
                <th scope="row" className="text-texto-2 bg-vacio sticky left-0 py-2 pr-4 text-left font-normal">{t.filas[clave]}</th>
                {valores.map((v, i) => (
                  <td key={conDatos[i].clave} className="text-texto px-3 py-2 text-right font-mono whitespace-nowrap" data-dato>
                    {formato(v)}
                    {hayMejor && v === maximo && <span className="text-viable font-sans font-semibold"> · {t.mejor}</span>}
                  </td>
                ))}
              </tr>
            );
          })}
          {EJES.map((eje) => (
            <tr key={eje} className="capilar-t">
              <th scope="row" className="text-texto-2 bg-vacio sticky left-0 py-2 pr-4 text-left font-normal">{t.filas[eje]}</th>
              {conDatos.map((f) => (
                <td key={f.clave} className="px-3 py-2 text-right">
                  <GlifoSemaforo nivel={f.metrica!.semaforo[eje]} nota={eje === "energia" && esSensibleAlRelieve(f.metrica!)} className="justify-end" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
