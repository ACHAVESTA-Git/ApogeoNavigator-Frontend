import { Check, Plus } from "lucide-react";
import { useComparacion } from "../../hooks/useComparacion";
import { DATOS } from "../../lib/constants";
import { T } from "../../lib/textos";
import { useApp } from "../layout/contexto";
import { Boton } from "../ui/Boton";

/** «Añadir a comparar (n/3)»: bloquea el cuarto sitio con un aviso en vez de fallar en silencio. */
export function BotonComparar({ siteId, className }: { siteId: string; className?: string }) {
  const { ids, alternar } = useComparacion();
  const { anunciar } = useApp();
  const fijado = ids.includes(siteId);
  const lleno = !fijado && ids.length >= DATOS.MAX_COMPARAR;
  const texto = (fijado ? T.comparacion.quitar : T.comparacion.anadir)(ids.length, DATOS.MAX_COMPARAR);
  return (
    <Boton
      aria-pressed={fijado}
      aria-disabled={lleno}
      title={lleno ? T.comparacion.llena(DATOS.MAX_COMPARAR) : undefined}
      className={className}
      onClick={() => {
        if (!alternar(siteId)) anunciar(T.comparacion.llena(DATOS.MAX_COMPARAR));
      }}
    >
      {fijado ? <Check aria-hidden="true" className="size-4" /> : <Plus aria-hidden="true" className="size-4" />}
      {texto}
    </Boton>
  );
}
