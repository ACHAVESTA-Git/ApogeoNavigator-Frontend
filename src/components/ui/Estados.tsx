import { CalendarOff, Copy, TriangleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";
import { usePeriodo } from "../../hooks/useParametrosUrl";
import { DATOS, RUTAS } from "../../lib/constants";
import { ApiError, traducirError, type ErrorTraducido } from "../../lib/errores";
import { mesLargo, sumarMeses } from "../../lib/fechas";
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

/**
 * Espera honesta de la consulta en vivo a JPL Horizons (varios segundos la primera vez): dice qué se está
 * haciendo y por qué tarda. El pulso es solo de opacidad, así que vale también con movimiento reducido.
 */
export function CargaHorizons({ className }: { className?: string }) {
  return (
    <div role="status" aria-busy="true" className={unir("py-10", className)}>
      <p className="rotulo flex items-center gap-2.5">
        <span aria-hidden="true" className="bg-sol size-1.5 animate-pulse rounded-full" />
        {T.puntoPropio.cargando}
      </p>
      <p className="text-apoyo text-texto-2 mt-2 max-w-[52ch]">{T.puntoPropio.cargandoNota}</p>
    </div>
  );
}

const sinCodigo = { titulo: T.errores.sinServicio, mensaje: "", sugerencia: "", accion: "reintentar" as const, requestId: undefined };

/**
 * Mes sin datos: no es un fallo, así que no lleva rojo ni código de seguimiento. Dice qué pasa y ofrece la
 * salida: el mes anterior o el último mes con datos.
 */
function EstadoMesSinDatos({ e, className }: { e: Pick<ErrorTraducido, "titulo" | "mensaje" | "sugerencia">; className?: string }) {
  const periodo = usePeriodo();
  const ultimo = sumarMeses(DATOS.COBERTURA.HASTA, -1);
  return (
    <div role="status" className={unir("panel max-w-xl p-4 md:p-5", className)}>
      <p className="text-texto flex items-start gap-2 font-semibold">
        <CalendarOff aria-hidden="true" className="text-texto-2 mt-1 size-4 shrink-0" />
        {e.titulo}
      </p>
      <p className="text-apoyo text-texto-2 mt-1.5">{e.mensaje} <span className="text-texto">{e.sugerencia}</span></p>
      <div className="mt-3 flex flex-wrap gap-3 empty:hidden">
        {periodo.desde !== ultimo
          ? <Boton onClick={() => periodo.fijar(ultimo, DATOS.COBERTURA.HASTA)}>{T.errores.acciones.ultimoMes(mesLargo(ultimo))}</Boton>
          : periodo.hayAnterior && <Boton onClick={() => periodo.moverMes(-1)}>{T.errores.acciones.mesAnterior}</Boton>}
      </div>
    </div>
  );
}

/**
 * Aviso de error estándar: qué pasó (título y mensaje), qué hacer (sugerencia y UN botón según la acción) y el
 * código de seguimiento copiable. Todo sale del traductor único; aquí no se interpreta ningún estado.
 */
export function EstadoError({ error, titulo, alReintentar, alIntroducirClave, compacto = false, children, className }: {
  error?: unknown; titulo?: string; alReintentar?: () => void; alIntroducirClave?: () => void; compacto?: boolean; children?: ReactNode; className?: string;
}) {
  const e = error === undefined || error === null ? sinCodigo : traducirError(error);
  // El título que trae el backend en su objeto `error` manda sobre el que proponga la pantalla.
  const tituloVisible = error instanceof ApiError && error.error ? e.titulo : (titulo ?? e.titulo);
  const [copiado, setCopiado] = useState(false);
  const copiar = () => {
    if (!e.requestId) return;
    void navigator.clipboard?.writeText(e.requestId).then(() => setCopiado(true)).catch(() => undefined);
  };
  if (e.accion === "mes") return <EstadoMesSinDatos e={e} className={className} />;
  return (
    <div role="alert" className={unir("panel border-l-critico max-w-xl border-l-2", compacto ? "p-3" : "p-4 md:p-5", className)}>
      <p className="text-texto flex items-start gap-2 font-semibold">
        <TriangleAlert aria-hidden="true" className="text-critico mt-1 size-4 shrink-0" />
        {tituloVisible}
      </p>
      {(e.mensaje || e.sugerencia) && (
        <p className="text-apoyo text-texto-2 mt-1.5">{e.mensaje} {e.sugerencia && <span className="text-texto">{e.sugerencia}</span>}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-3 empty:hidden">
        {e.accion === "reintentar" && alReintentar && <Boton onClick={alReintentar}>{T.errores.acciones.reintentar}</Boton>}
        {e.accion === "clave" && alIntroducirClave && <Boton onClick={alIntroducirClave}>{T.errores.acciones.clave}</Boton>}
        {/* Dentro de un formulario (compacto) un 404 no es «otro sitio»: basta el mensaje, que dice qué revisar. */}
        {e.accion === "sitios" && !compacto && <EnlaceBoton to={RUTAS.SITIOS}>{T.errores.acciones.sitios}</EnlaceBoton>}
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
