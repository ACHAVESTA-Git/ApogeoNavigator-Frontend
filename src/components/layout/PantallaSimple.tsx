import type { ReactNode } from "react";
import { useAnclaHorizonte } from "./horizonteContexto";
import { TituloPagina } from "./TituloPagina";

/** Pantalla sobria: rótulo, título y texto sobre un horizonte plano (404, Acceso). */
export function PantallaSimple({ documento, rotulo, titulo, children }: { documento: string; rotulo: string; titulo: string; children: ReactNode }) {
  const ancla = useAnclaHorizonte("linea");
  return (
    <div className="flex min-h-[calc(100svh-var(--nav-alto)-var(--barra-inferior-alto))] flex-col md:min-h-[calc(100svh-var(--nav-alto))]">
      <section className="contenedor flex flex-[3] flex-col justify-end pb-10">
        <p className="rotulo">{rotulo}</p>
        <TituloPagina documento={documento} className="mt-3 max-w-2xl">{titulo}</TituloPagina>
      </section>
      <div ref={ancla} aria-hidden="true" className="h-px w-full" />
      <section className="bg-regolito flex-[2]">
        <div className="contenedor text-texto-2 max-w-none py-8">{children}</div>
      </section>
    </div>
  );
}
