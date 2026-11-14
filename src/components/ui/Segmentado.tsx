import { NavLink } from "react-router";
import { unir } from "./clases";

const ITEM =
  "tactil inline-flex items-center justify-center px-3 md:px-4 text-apoyo font-semibold whitespace-nowrap border-b-2 " +
  "transition-colors duration-(--dur-micro)";
const estado = (activo: boolean) => (activo ? "border-texto text-texto" : "border-transparent text-texto-2 hover:text-texto");

export interface OpcionSegmento<V extends string> {
  valor: V;
  etiqueta: string;
  desactivada?: boolean;
  nota?: string;
}
/** Control segmentado de selección única (filtros, conmutadores de vista). */
export function Segmentado<V extends string>({ etiqueta, opciones, valor, alCambiar, className }: {
  etiqueta: string; opciones: readonly OpcionSegmento<V>[]; valor: V; alCambiar: (valor: V) => void; className?: string;
}) {
  return (
    <div role="group" aria-label={etiqueta} className={unir("border-linea flex max-w-full overflow-x-auto border-b", className)}>
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={o.valor === valor}
          disabled={o.desactivada}
          title={o.nota}
          onClick={() => alCambiar(o.valor)}
          className={unir(ITEM, estado(o.valor === valor), "disabled:opacity-45")}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}

/** Pestañas que son rutas: enlaces reales con aria-current. */
export function PestanasRuta({ etiqueta, pestanas }: { etiqueta: string; pestanas: readonly { a: string; etiqueta: string }[] }) {
  return (
    <nav aria-label={etiqueta} className="border-linea flex max-w-full overflow-x-auto border-b">
      {pestanas.map((p) => (
        <NavLink key={p.a} to={p.a} className={({ isActive }) => unir(ITEM, estado(isActive))}>
          {p.etiqueta}
        </NavLink>
      ))}
    </nav>
  );
}
