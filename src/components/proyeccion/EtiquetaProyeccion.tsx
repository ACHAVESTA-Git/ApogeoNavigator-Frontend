import { FlaskConical } from "lucide-react";
import { T } from "../../lib/textos";
import { AvisoHorizonteIdeal } from "../layout/AvisoHorizonteIdeal";
import { unir } from "../ui/clases";

/**
 * Etiqueta permanente de la pestaña: lo que se ve es una proyección del modelo, no una efeméride. Va siempre con el
 * aviso de horizonte ideal. No se puede cerrar ni depende del estado de la carga.
 */
export function EtiquetaProyeccion({ className }: { className?: string }) {
  const t = T.proyeccion;
  return (
    <div className={unir("flex flex-col gap-2", className)} data-etiqueta-proyeccion="">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <strong className="bg-tierra/12 text-tierra text-apoyo inline-flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-3 font-semibold">
          <FlaskConical aria-hidden="true" className="size-4 shrink-0" />
          {t.etiqueta}
        </strong>
        <span className="text-apoyo text-texto-2">{t.etiquetaNota}</span>
      </p>
      <AvisoHorizonteIdeal />
    </div>
  );
}
