import { useId, useState } from "react";
import { DATOS } from "../../lib/constants";
import { latitud } from "../../lib/formato";
import { NOMBRE_CATEGORIA, T } from "../../lib/textos";
import type { Site } from "../../lib/tipos";
import { GlifoCategoria } from "../glifos/GlifoCategoria";
import { Boton } from "../ui/Boton";
import { unir } from "../ui/clases";

export interface Opcion {
  valor: string;
  etiqueta: string;
  detalle?: string;
  sitio?: Site;
}
/** Lista compacta con casillas: de 2 a 3 opciones. Al intentar la cuarta se avisa, no se ignora en silencio. */
export function SelectorMultiple({ titulo, opciones, inicial, alComparar }: {
  titulo: string; opciones: readonly Opcion[]; inicial: readonly string[]; alComparar: (valores: string[]) => void;
}) {
  const id = useId();
  const [elegidos, setElegidos] = useState<string[]>(() => inicial.filter((v) => opciones.some((o) => o.valor === v)));
  const [aviso, setAviso] = useState(false);
  const alternar = (valor: string) => {
    const lleno = !elegidos.includes(valor) && elegidos.length >= DATOS.MAX_COMPARAR;
    setAviso(lleno);
    if (!lleno) setElegidos((actual) => (actual.includes(valor) ? actual.filter((v) => v !== valor) : [...actual, valor]));
  };
  return (
    <fieldset>
      <legend className="rotulo">{titulo}</legend>
      <ul className="mt-2 grid gap-x-6 sm:grid-cols-2">
        {opciones.map((o) => {
          const marcado = elegidos.includes(o.valor);
          return (
            <li key={o.valor} className="capilar-b">
              <label className={unir("tactil flex items-center gap-3 px-2 py-1.5 transition-[background-color,transform] duration-(--dur-micro) active:scale-[0.98]",
                marcado ? "bg-superficie" : "hover:bg-superficie")}>
                <input type="checkbox" checked={marcado} onChange={() => alternar(o.valor)} aria-describedby={aviso ? `${id}-aviso` : undefined}
                  className="accent-texto size-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="text-texto block truncate font-medium first-letter:uppercase">{o.etiqueta}</span>
                  {o.sitio && (
                    <span className="text-texto-3 flex items-center gap-1.5 text-[0.8125rem]">
                      <GlifoCategoria categoria={o.sitio.categoria} className="size-2.5" />
                      {NOMBRE_CATEGORIA[o.sitio.categoria]} · {o.sitio.agencia}
                    </span>
                  )}
                </span>
                {o.sitio && <span className="text-dato-sm text-texto-2 font-mono whitespace-nowrap" data-dato>{latitud(o.sitio.lat_deg)}</span>}
              </label>
            </li>
          );
        })}
      </ul>
      <p id={`${id}-aviso`} role="status" className="text-apoyo text-reservas mt-2 min-h-[1.45em]">{aviso && T.comparar.maximo(DATOS.MAX_COMPARAR)}</p>
      <Boton variante="primario" disabled={elegidos.length < DATOS.MIN_COMPARAR} onClick={() => alComparar(elegidos)} className="mt-1 min-w-36">
        {T.comparar.comparar(elegidos.length)}
      </Boton>
    </fieldset>
  );
}
