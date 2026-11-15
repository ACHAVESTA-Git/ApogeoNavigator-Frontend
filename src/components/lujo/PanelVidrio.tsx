import type { HTMLAttributes, ReactNode } from "react";
import { unir } from "../ui/clases";

type Etiqueta = "div" | "section" | "article" | "aside" | "li" | "header" | "footer";
const RELLENO = { ninguno: "", compacto: "p-4", normal: "p-4 md:p-6" } as const;

export interface PanelVidrioProps extends HTMLAttributes<HTMLElement> {
  /** Etiqueta HTML del panel (por defecto `div`). */
  como?: Etiqueta;
  /** Profundidad al pasar el puntero: sube 2 px y gana sombra (solo con puntero fino; nunca en táctil). */
  elevable?: boolean;
  relleno?: keyof typeof RELLENO;
  children?: ReactNode;
}

/**
 * Material translúcido del lenguaje «lujo»: desenfoque moderado del fondo y borde neutro de 1 px al 7 % en TODO el
 * contorno (nunca un solo lado). Con «reducir transparencia» o «más contraste» pasa a una superficie sólida.
 */
export function PanelVidrio({ como: Etiqueta = "div", elevable = false, relleno = "normal", className, children, ...resto }: PanelVidrioProps) {
  return (
    <Etiqueta {...resto} data-elevable={elevable || undefined}
      className={unir("vidrio min-w-0", elevable && "vidrio-elevable", RELLENO[relleno], className)}>
      {children}
    </Etiqueta>
  );
}
