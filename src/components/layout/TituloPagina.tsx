import { useEffect, useRef, type ReactNode } from "react";
import { T } from "../../lib/textos";
import { unir } from "../ui/clases";

let haNavegado = false;
/** AppShell lo llama en cada cambio de ruta: desde entonces el h1 recibe el foco al montarse. */
export const marcarNavegacion = (): void => {
  haNavegado = true;
};

/** El único h1 de la ruta: fija el título del documento y recibe el foco tras navegar (no en la primera carga). */
export function TituloPagina({ documento, className, children }: { documento: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = `${documento} · ${T.marca}`;
  }, [documento]);
  useEffect(() => {
    if (haNavegado) ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <h1 ref={ref} tabIndex={-1} className={unir("titulo-instrumento text-titulo text-texto text-balance", className)}>
      {children}
    </h1>
  );
}
