import { useState } from "react";
import { CARGA } from "../../lib/constants";
import { T } from "../../lib/textos";
import type { IncidenciaCsv } from "../../lib/tipos";
import { unir } from "../ui/clases";

/** Tabla compacta fila · columna · mensaje (formato del informe del estándar CSV §5): 5 como máximo y «ver los N». */
export function ErrorTable({ titulo, incidencias, total }: { titulo: string; incidencias: readonly IncidenciaCsv[]; total: number }) {
  const [todos, setTodos] = useState(false);
  const visibles = todos ? incidencias : incidencias.slice(0, CARGA.MAX_ERRORES_FILA);
  const [fila, columna, mensaje] = T.carga.columnas;
  return (
    <div className="pt-1 pb-3 pl-11">
      <div className={unir(todos && "max-h-56 overflow-y-auto overscroll-contain")}>
        <table className="w-full border-collapse text-left text-[0.8125rem]">
          <caption className="sr-only">{titulo}</caption>
          <thead>
            <tr className="text-texto-3 max-sm:sr-only">
              <th scope="col" className="w-12 py-1 pr-3 font-normal">{fila}</th>
              <th scope="col" className="w-32 py-1 pr-3 font-normal">{columna}</th>
              <th scope="col" className="py-1 font-normal">{mensaje}</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((e, i) => (
              <tr key={i} className="capilar-t align-top max-sm:grid max-sm:grid-cols-[3rem_1fr] max-sm:py-1">
                <td className="text-texto py-1 pr-3 font-mono" data-dato>{e.fila}</td>
                <td className="text-texto-2 py-1 pr-3 font-mono break-all">{e.columna ?? T.carga.archivo}</td>
                {/* En móvil el mensaje pasa a una segunda línea */}
                <td className="text-texto py-1 max-sm:col-span-2 max-sm:pt-0">
                  {e.mensaje}
                  {e.valor !== null && <span className="text-texto-3 font-mono"> · «{e.valor}»</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > CARGA.MAX_ERRORES_FILA && (
        <p className="mt-1 text-[0.8125rem]">
          <button type="button" onClick={() => setTodos((v) => !v)} aria-expanded={todos}
            className="text-texto decoration-horizonte hover:decoration-texto inline-flex min-h-8 items-center underline underline-offset-4">
            {todos ? T.carga.verMenos : T.carga.verErrores(total)}
          </button>
          {todos && total > incidencias.length && <span className="text-texto-3"> {T.carga.limiteServidor(incidencias.length, total)}</span>}
        </p>
      )}
    </div>
  );
}
