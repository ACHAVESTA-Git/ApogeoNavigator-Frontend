// Parte del respaldo con datos de ejemplo: se borra junto con lib/muestra.ts.
import { TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { MUESTRA } from "../../lib/constants";
import { useMuestraActiva } from "../../lib/muestra";
import { T } from "../../lib/textos";
import { useApp } from "./contexto";

export function BannerDatosEjemplo() {
  const activa = useMuestraActiva();
  const [cerrado, setCerrado] = useState(false);
  const { anunciar } = useApp();
  useEffect(() => {
    if (activa) anunciar(T.banner.corto);
  }, [activa, anunciar]);
  if (!activa || cerrado) return null;
  return (
    <aside aria-label={T.banner.corto} className="bg-regolito border-reservas border-b">
      <div className="contenedor flex items-start gap-3 py-2">
        <TriangleAlert aria-hidden="true" className="text-reservas mt-0.5 size-4 shrink-0" />
        <p className="text-apoyo text-texto min-w-0 flex-1">
          <strong className="text-reservas font-semibold">{T.banner.corto}.</strong> {T.banner.texto(MUESTRA.FECHA_INSTANTANEA)}
        </p>
        <button type="button" aria-label={T.banner.cerrar} onClick={() => setCerrado(true)}
          className="tactil text-texto-2 hover:text-texto -my-2 -mr-3 inline-flex shrink-0 items-center justify-center">
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
    </aside>
  );
}
