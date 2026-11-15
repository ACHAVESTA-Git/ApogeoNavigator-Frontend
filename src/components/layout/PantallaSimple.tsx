import type { ReactNode } from "react";
import { useAnclaHorizonte } from "./horizonteContexto";
import { TituloPagina } from "./TituloPagina";

/** Pantalla sobria: un solo panel centrado sobre el horizonte (404, Acceso y la clave del gestor). */
export function PantallaSimple({ documento, rotulo, titulo, children }: { documento: string; rotulo: string; titulo: string; children: ReactNode }) {
  const ancla = useAnclaHorizonte("linea");
  return (
    <div className="relative flex min-h-[calc(100svh-var(--nav-alto)-var(--barra-inferior-alto))] items-center justify-center px-(--margen) py-10 md:min-h-[calc(100svh-var(--nav-alto))]">
      {/* El horizonte cruza por detrás del panel: cielo arriba, regolito abajo */}
      <div aria-hidden="true" className="bg-regolito absolute inset-x-0 top-[58%] bottom-0" />
      <div ref={ancla} aria-hidden="true" className="absolute inset-x-0 top-[58%] h-px" />
      <section className="bg-elevada shadow-flotante relative w-full max-w-xl rounded-capa border border-texto/10 p-6 md:p-9">
        <p className="rotulo">{rotulo}</p>
        <TituloPagina documento={documento} className="mt-3">{titulo}</TituloPagina>
        <div className="text-texto-2 mt-5">{children}</div>
      </section>
    </div>
  );
}
