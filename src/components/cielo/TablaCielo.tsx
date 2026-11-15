import { PANORAMA } from "../../lib/constants";
import { fechaHora } from "../../lib/fechas";
import { numero } from "../../lib/formato";
import { T } from "../../lib/textos";
import type { FilaEfemeride } from "../../lib/tipos";
import { unir } from "../ui/clases";

/** Alternativa textual del panorama: las ±12 filas alrededor del instante, con unidades en la cabecera. */
export function TablaCielo({ filas, indice }: { filas: readonly FilaEfemeride[]; indice: number }) {
  const desde = Math.max(0, indice - PANORAMA.RASTRO_HORAS);
  const tramo = filas.slice(desde, indice + PANORAMA.RASTRO_HORAS + 1);
  return (
    <div className="overflow-x-auto">
      <table className="text-dato-sm w-full min-w-[34rem] border-collapse font-mono" data-dato>
        <caption className="text-apoyo text-texto-2 pb-3 text-left font-sans">{T.cielo.tablaTitulo(PANORAMA.RASTRO_HORAS)}. {T.avisoHorizonteCorto}</caption>
        <thead>
          <tr>
            {T.cielo.columnas.map((c, i) => (
              <th key={c} scope="col" className={unir("rotulo border-linea border-b py-2 font-sans", i ? "text-right" : "text-left")}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tramo.map((f, k) => {
            const actual = desde + k === indice;
            return (
              <tr key={f.utc} aria-current={actual ? "true" : undefined} className={unir("border-linea border-b", actual ? "bg-superficie text-texto" : "text-texto-2")}>
                <th scope="row" className="py-1.5 pr-3 text-left font-normal whitespace-nowrap">{fechaHora(f.utc)}</th>
                {[f.sol_az_deg, f.sol_el_deg, f.tierra_az_deg, f.tierra_el_deg].map((v, i) => (
                  <td key={i} className="py-1.5 pl-3 text-right">{numero(v)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
