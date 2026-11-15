import type { ReactNode } from "react";
import { T } from "../../lib/textos";
import { useAnclaHorizonte } from "../layout/horizonteContexto";
import { PanelVidrio } from "../lujo";
import { EscenaAcceso } from "./EscenaAcceso";

/**
 * Pantalla partida de la sesión (Acceso y Mi perfil): la escena lunar ocupa todo el fondo y el contenido va en un
 * panel de vidrio, a la derecha en escritorio y a todo el ancho en móvil (con la escena atenuada detrás).
 * No hay divisor: las dos mitades las separa el espacio.
 */
export function PantallaAcceso({ children }: { children: ReactNode }) {
  const ancla = useAnclaHorizonte("linea");
  return (
    <div className="relative flex min-h-[calc(100svh-var(--nav-alto)-var(--barra-inferior-alto))] md:min-h-[calc(100svh-var(--nav-alto))]">
      <EscenaAcceso />
      <div className="contenedor relative grid items-center gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:py-12">
        {/* La línea del horizonte llega hasta el panel y no pasa por detrás del vidrio (cruzaría los campos). En móvil
            el panel ocupa el ancho: el ancla se pliega y el horizonte queda en el cambio de tono del suelo. */}
        <div ref={ancla} aria-hidden="true" className="absolute top-[62%] left-0 h-px w-0 lg:right-[calc(28rem+var(--margen)+1.5rem)] lg:left-[-100vw] lg:w-auto" />
        <p className="text-apoyo text-texto-3 hidden max-w-xs self-end lg:block">{T.acceso.escena}</p>
        <PanelVidrio como="section" className="shadow-flotante w-full max-w-md justify-self-center p-5 md:p-8 lg:justify-self-end" relleno="ninguno">
          {children}
        </PanelVidrio>
      </div>
    </div>
  );
}
