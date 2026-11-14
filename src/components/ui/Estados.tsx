import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { mensajeDeError } from "../../lib/errores";
import { T } from "../../lib/textos";
import { Boton } from "./Boton";
import { unir } from "./clases";

export function EstadoCarga({ texto = T.cargando, className }: { texto?: string; className?: string }) {
  return (
    <p role="status" aria-busy="true" className={unir("rotulo py-10", className)}>
      {texto}
    </p>
  );
}

export function EstadoError({ error, titulo, alReintentar, children, className }: {
  error?: unknown; titulo?: string; alReintentar?: () => void; children?: ReactNode; className?: string;
}) {
  return (
    <div role="alert" className={unir("border-critico max-w-xl border-l-2 py-2 pl-4", className)}>
      <p className="text-texto flex items-center gap-2 font-semibold">
        <TriangleAlert aria-hidden="true" className="text-critico size-4 shrink-0" />
        {titulo ?? T.errores.sinServicio}
      </p>
      {error !== undefined && <p className="text-apoyo text-texto-2 mt-1">{mensajeDeError(error, T.errores.generico)}</p>}
      <div className="mt-3 flex flex-wrap gap-3">
        {alReintentar && <Boton onClick={alReintentar}>{T.reintentar}</Boton>}
        {children}
      </div>
    </div>
  );
}

export function EstadoVacio({ titulo, children, className }: { titulo: string; children?: ReactNode; className?: string }) {
  return (
    <div className={unir("max-w-xl py-6", className)}>
      <p className="text-subtitulo text-texto">{titulo}</p>
      <div className="mt-4 flex flex-wrap gap-3">{children}</div>
    </div>
  );
}
