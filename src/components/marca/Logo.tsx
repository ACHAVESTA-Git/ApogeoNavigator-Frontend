import { MARCA } from "../../lib/constants";
import { unir } from "../ui/clases";

/**
 * Símbolo de Apogeo Navigator: una órbita que sube sobre la línea de horizonte rasante, con la Tierra en el foco
 * y el apogeo (el punto más alto de la órbita) marcado con el color del Sol. `mono` lo dibuja en un solo color.
 * Mismo dibujo que public/favicon.svg y public/marca/simbolo.svg.
 */
export function SimboloMarca({ mono = false, className }: { mono?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={MARCA.SIMBOLO_PX} height={MARCA.SIMBOLO_PX} aria-hidden="true" focusable="false" className={unir("shrink-0", className)}>
      <g fill="none" strokeLinecap="round" strokeWidth="1.75">
        <path d="M4 23A12 15 0 0 1 11.5 9.09M20.5 9.09A12 15 0 0 1 28 23" className="stroke-current" />
        <path d="M1 23h30" className={mono ? "stroke-current opacity-55" : "stroke-horizonte"} />
      </g>
      <circle cx="16" cy="23" r="2.75" className={mono ? "fill-current" : "fill-tierra"} />
      <circle cx="16" cy="8" r="3.5" className={mono ? "fill-current" : "fill-sol"} />
    </svg>
  );
}

/**
 * Logo completo: símbolo y logotipo. «Apogeo» va en Archivo ancha y negrita; «Navigator», en peso normal y un tono
 * más bajo. Con `compacto`, «Navigator» se esconde en pantallas muy estrechas (el nombre accesible lo pone quien
 * lo use). El alto queda fijado por el símbolo: no mueve nada al cargar la fuente.
 */
export function Logo({ mono = false, compacto = false, className }: { mono?: boolean; compacto?: boolean; className?: string }) {
  return (
    <span className={unir("text-texto inline-flex items-center gap-2 whitespace-nowrap", className)}>
      <SimboloMarca mono={mono} />
      <span aria-hidden="true" className="logotipo">
        {MARCA.NOMBRE_1}
        <span className={unir("logotipo-2", mono && "text-current!", compacto && "hidden min-[400px]:inline")}> {MARCA.NOMBRE_2}</span>
      </span>
    </span>
  );
}
