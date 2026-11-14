import { forwardRef, useId } from "react";
import { T } from "../../lib/textos";

const CAMPO = "tactil bg-superficie border-linea text-texto mt-1.5 w-full rounded-xs border px-3 font-mono focus-visible:-outline-offset-2 aria-[invalid=true]:border-critico";

/** Clave de la API. Se escribe aquí y se guarda solo en sessionStorage: nunca viaja en el bundle. */
export const CampoClave = forwardRef<HTMLInputElement, { etiqueta?: string; ayuda?: string; valor: string; invalida: boolean; alCambiar: (valor: string) => void }>(
  function CampoClave({ etiqueta = T.carga.clave, ayuda = T.carga.claveAyuda, valor, invalida, alCambiar }, ref) {
    const id = useId();
    return (
      <div>
        <label htmlFor={id} className="rotulo">{etiqueta}</label>
        <input ref={ref} id={id} type="password" autoComplete="off" spellCheck={false} value={valor} onChange={(e) => alCambiar(e.target.value)}
          aria-invalid={invalida} aria-describedby={`${id}-ayuda`} className={CAMPO} />
        <p id={`${id}-ayuda`} className="mt-1 text-[0.8125rem]">
          {invalida && <strong role="alert" className="text-critico font-semibold">{T.carga.claveInvalida}. </strong>}
          <span className="text-texto-3">{ayuda}</span>
        </p>
      </div>
    );
  },
);
