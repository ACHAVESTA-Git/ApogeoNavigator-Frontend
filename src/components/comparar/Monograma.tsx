import { useState } from "react";
import { monograma } from "../../lib/comparar";
import { RANKING } from "../../lib/constants";
import { nombreCorto } from "../../lib/formato";
import { T } from "../../lib/textos";
import { unir } from "../ui/clases";

/**
 * Monograma neutro de un sitio: sus iniciales sobre un círculo sólido, generado en código y con el mismo
 * tratamiento para todos (docs/frontend/insignias-misiones.md). No es un parche ni un logotipo: es decorativo
 * (`aria-hidden`), porque el nombre del sitio va siempre en texto al lado.
 */
export function Monograma({ nombre, className }: { nombre: string; className?: string }) {
  return (
    <span aria-hidden="true" data-monograma=""
      className={unir("bg-elevada text-texto border-texto/8 grid size-12 shrink-0 place-content-center rounded-full border font-mono text-[0.8125rem] font-semibold tracking-tight", className)}>
      {monograma(nombreCorto(nombre))}
    </span>
  );
}

/**
 * Insignia de un sitio. Si su parche auténtico está disponible (`parche`, por defecto según `RANKING.INSIGNIAS`)
 * se muestra TAL CUAL (sin recortar, recolorear ni redibujar: `object-contain`, sin filtros) con el crédito visible;
 * si no lo está, o el archivo no carga (p. ej. porque se borró), cae al monograma neutro. Reversible sin tocar código.
 */
export function Insignia({ siteId, nombre, parche = RANKING.INSIGNIAS.includes(siteId), className }: { siteId: string; nombre: string; parche?: boolean; className?: string }) {
  const [fallo, setFallo] = useState(false);
  if (!parche || fallo) return <Monograma nombre={nombre} className={className} />;
  return (
    <figure className="m-0 flex shrink-0 flex-col items-center gap-1">
      <img src={RANKING.RUTA_INSIGNIA(siteId)} alt={T.comparar.top.insignia(nombreCorto(nombre))} width={48} height={48} loading="lazy"
        onError={() => setFallo(true)} className={unir("size-12 object-contain", className)} />
      <figcaption className="text-texto-2 max-w-16 text-center text-[0.75rem] leading-tight">{T.comparar.top.creditoInsignia}</figcaption>
    </figure>
  );
}
