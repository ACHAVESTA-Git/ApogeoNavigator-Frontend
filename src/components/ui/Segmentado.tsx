import type { KeyboardEvent } from "react";
import { NavLink } from "react-router";
import { unir } from "./clases";

const ITEM =
  "tactil inline-flex items-center justify-center px-3 md:px-4 text-apoyo font-semibold whitespace-nowrap border-b-2 " +
  "transition-[color,border-color,transform] duration-(--dur-micro)";
const estado = (activo: boolean) => (activo ? "border-texto text-texto" : "border-transparent text-texto-2 hover:text-texto");

export interface OpcionSegmento<V extends string> {
  valor: V;
  etiqueta: string;
  desactivada?: boolean;
  nota?: string;
}
/**
 * Control segmentado de selección única (filtros, conmutadores de vista). Con `comoRadio` se expone como
 * radiogroup: un solo tabulador y flechas para cambiar, como un grupo de radios nativo.
 */
export function Segmentado<V extends string>({ etiqueta, opciones, valor, alCambiar, comoRadio = false, className }: {
  etiqueta: string; opciones: readonly OpcionSegmento<V>[]; valor: V; alCambiar: (valor: V) => void; comoRadio?: boolean; className?: string;
}) {
  const alPulsar = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!comoRadio) return;
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    e.stopPropagation(); // las flechas no deben mover también el tiempo del gráfico
    const activas = opciones.filter((o) => !o.desactivada);
    const siguiente = activas[(activas.findIndex((o) => o.valor === valor) + delta + activas.length) % activas.length];
    alCambiar(siguiente.valor);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-valor="${siguiente.valor}"]`)?.focus();
  };
  return (
    <div role={comoRadio ? "radiogroup" : "group"} aria-label={etiqueta} onKeyDown={alPulsar}
      className={unir("border-linea flex max-w-full overflow-x-auto border-b", className)}>
      {opciones.map((o) => {
        const activo = o.valor === valor;
        const estadoAria = comoRadio ? { role: "radio", "aria-checked": activo, tabIndex: activo ? 0 : -1 } : { "aria-pressed": activo };
        return (
          <button key={o.valor} type="button" data-valor={o.valor} disabled={o.desactivada} title={o.nota} onClick={() => alCambiar(o.valor)}
            className={unir(ITEM, estado(activo), "active:scale-[0.98] disabled:opacity-45")} {...estadoAria}>
            {o.etiqueta}
          </button>
        );
      })}
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
