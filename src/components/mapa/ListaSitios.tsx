import { ChevronRight } from "lucide-react";
import { CATEGORIAS } from "../../lib/constants";
import { latitud } from "../../lib/formato";
import { NOMBRE_CATEGORIA, T } from "../../lib/textos";
import type { Site } from "../../lib/tipos";
import { GlifoCategoria } from "../glifos/GlifoCategoria";
import { unir } from "../ui/clases";

/** Lista agrupada por categoría. Pasar el ratón o el foco por una fila resalta su punto y su anillo en el mapa. */
export function ListaSitios({ sitios, activo, alActivar, alSeleccionar }: {
  sitios: readonly Site[]; activo: string | null; alActivar: (id: string | null) => void; alSeleccionar: (id: string) => void;
}) {
  const grupos = CATEGORIAS.map((c) => ({ categoria: c, sitios: sitios.filter((s) => s.categoria === c) })).filter((g) => g.sitios.length);
  if (!grupos.length) return <p className="text-texto-2 py-6">{T.sitios.sinCategoria}</p>;
  return (
    <div aria-label={T.sitios.lista} role="group">
      {grupos.map((g) => (
        <section key={g.categoria} className="mt-6 first:mt-0">
          <h2 className="rotulo flex items-center gap-2">
            <GlifoCategoria categoria={g.categoria} className="size-3" />
            {NOMBRE_CATEGORIA[g.categoria]}
          </h2>
          <ul className="mt-2">
            {g.sitios.map((s) => (
              <li key={s.site_id} className="border-linea border-t last:border-b">
                <button
                  type="button"
                  onClick={() => alSeleccionar(s.site_id)}
                  onPointerEnter={() => alActivar(s.site_id)}
                  onPointerLeave={() => alActivar(null)}
                  onFocus={() => alActivar(s.site_id)}
                  onBlur={() => alActivar(null)}
                  className={unir("tactil flex w-full items-center gap-3 py-2.5 pr-1 pl-2 text-left transition-[background-color,transform] duration-(--dur-micro) active:scale-[0.98]",
                    s.site_id === activo ? "bg-superficie" : "hover:bg-superficie")}
                >
                  <span className="min-w-0 flex-1">
                    <span className="text-texto block truncate font-medium">{s.nombre}</span>
                    <span className="text-apoyo text-texto-3 block truncate">{s.agencia}</span>
                  </span>
                  <span className="text-dato-sm text-texto-2 font-mono whitespace-nowrap" data-dato>{latitud(s.lat_deg)}</span>
                  <ChevronRight aria-hidden="true" className="text-horizonte size-4 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
