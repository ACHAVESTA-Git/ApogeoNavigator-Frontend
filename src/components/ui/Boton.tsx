import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router";
import { T } from "../../lib/textos";
import { clasesBoton, type VarianteBoton } from "./clases";

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
}
export const Boton = forwardRef<HTMLButtonElement, PropsBoton>(function Boton(
  { variante, className, type = "button", ...resto },
  ref,
) {
  return <button ref={ref} type={type} className={clasesBoton(variante, className)} {...resto} />;
});

/** Enlace interno con aspecto de botón. */
export function EnlaceBoton({ variante, className, ...resto }: LinkProps & { variante?: VarianteBoton }) {
  return <Link className={clasesBoton(variante, className)} {...resto} />;
}

/** Enlace externo: siempre en otra pestaña, con aviso para lectores de pantalla. */
export function EnlaceExterno({ children, className, ...resto }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "text-texto decoration-horizonte hover:decoration-texto underline underline-offset-4"}
      {...resto}
    >
      {children}
      <span className="sr-only"> {T.seAbreEnOtraPestana}</span>
    </a>
  );
}
