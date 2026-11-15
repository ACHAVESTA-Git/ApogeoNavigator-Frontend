import { Copy, TriangleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";
import { RUTAS } from "../../lib/constants";
import { traducirError } from "../../lib/errores";
import { T } from "../../lib/textos";
import { Boton, EnlaceBoton } from "./Boton";
import { unir } from "./clases";

export function EstadoCarga({ texto = T.cargando, className }: { texto?: string; className?: string }) {
  return (
    <p role="status" aria-busy="true" className={unir("rotulo py-10", className)}>
      {texto}
    </p>
  );
}

const sinCodigo = { titulo: T.errores.sinServicio, mensaje: "", sugerencia: "", accion: "reintentar" as const, requestId: undefined };

/**
 * Aviso de error estándar: qué pasó (título y mensaje), qué hacer (sugerencia y UN botón según la acción) y el
 * código de seguimiento copiable. Todo sale del traductor único; aquí no se interpreta ningún estado.
 */
export function EstadoError({ error, titulo, alReintentar, alIntroducirClave, compacto = false, children, className }: {
  error?: unknown; titulo?: string; alReintentar?: () => void; alIntroducirClave?: () => void; compacto?: boolean; children?: ReactNode; className?: string;
}) {
  const e = error === undefined || error === null ? sinCodigo : traducirError(error);
  const [copiado, setCopiado] = useState(false);
  const copiar = () => {
    if (!e.requestId) return;
    void navigator.clipboard?.writeText(e.requestId).then(() => setCopiado(true)).catch(() => undefined);
  };
  return (
    <div role="alert" className={unir("panel border-l-critico max-w-xl border-l-2", compacto ? "p-3" : "p-4 md:p-5", className)}>
      <p className="text-texto flex items-start gap-2 font-semibold">
        <TriangleAlert aria-hidden="true" className="text-critico mt-1 size-4 shrink-0" />
        {titulo ?? e.titulo}
      </p>
      {(e.mensaje || e.sugerencia) && (
        <p className="text-apoyo text-texto-2 mt-1.5">{e.mensaje} {e.sugerencia && <span className="text-texto">{e.sugerencia}</span>}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-3 empty:hidden">
        {e.accion === "reintentar" && alReintentar && <Boton onClick={alReintentar}>{T.errores.acciones.reintentar}</Boton>}
        {e.accion === "clave" && alIntroducirClave && <Boton onClick={alIntroducirClave}>{T.errores.acciones.clave}</Boton>}
        {e.accion === "sitios" && <EnlaceBoton to={RUTAS.SITIOS}>{T.errores.acciones.sitios}</EnlaceBoton>}
        {e.accion !== "reintentar" && e.accion !== "clave" && alReintentar && !compacto && <Boton variante="texto" onClick={alReintentar}>{T.errores.acciones.reintentar}</Boton>}
        {children}
      </div>
      {e.requestId && (
        <p className="text-texto-3 mt-3 flex flex-wrap items-center gap-x-2 text-[0.75rem]">
          {T.errores.seguimiento}: <code className="text-texto-2 font-mono select-all" data-dato>{e.requestId}</code>
          <button type="button" onClick={copiar} className="text-texto-2 hover:text-texto -my-2 inline-flex min-h-11 items-center gap-1 px-1 underline underline-offset-4">
            <Copy aria-hidden="true" className="size-3.5" />
            <span aria-live="polite">{copiado ? T.errores.copiado : T.errores.copiar}</span>
          </button>
        </p>
      )}
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
