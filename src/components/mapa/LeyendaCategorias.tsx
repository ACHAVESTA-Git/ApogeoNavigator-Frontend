import { NOMBRE_CATEGORIA, T } from "../../lib/textos";
import type { Categoria } from "../../lib/tipos";
import { GlifoCategoria } from "../glifos/GlifoCategoria";

export function LeyendaCategorias({ categorias }: { categorias: readonly Categoria[] }) {
  return (
    <ul aria-label={T.sitios.leyenda} className="text-apoyo text-texto-2 flex flex-wrap gap-x-5 gap-y-2">
      {categorias.map((c) => (
        <li key={c} className="inline-flex items-center gap-2">
          <GlifoCategoria categoria={c} className="text-texto size-3.5" />
          {NOMBRE_CATEGORIA[c]}
        </li>
      ))}
    </ul>
  );
}
