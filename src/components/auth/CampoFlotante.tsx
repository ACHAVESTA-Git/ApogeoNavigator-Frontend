import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { unir } from "../ui/clases";

const SUBIDA = "-translate-y-[1.4rem] scale-[0.78]";
const CAMPO =
  "peer bg-vacio/45 text-texto text-cuerpo h-14 w-full rounded-control border border-texto/12 px-3.5 pt-5 pb-1 " +
  "transition-[border-color,background-color] duration-(--dur-micro) hover:border-texto/25 focus-visible:border-texto/45 " +
  "focus-visible:-outline-offset-2 aria-[invalid=true]:border-critico/80 " +
  "autofill:shadow-[inset_0_0_0_100px_var(--color-superficie)] autofill:[-webkit-text-fill-color:var(--color-texto)]";
// La etiqueta descansa dentro del campo y sube al enfocarlo o al tener valor. Solo cambian translate y scale.
const ETIQUETA =
  `text-texto-2 pointer-events-none absolute top-1/2 left-3.5 origin-left ${SUBIDA} transition-transform duration-(--dur-corta) ease-salida ` +
  "peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 " +
  "peer-autofill:-translate-y-[1.4rem] peer-autofill:scale-[0.78] peer-focus:-translate-y-[1.4rem] peer-focus:scale-[0.78]";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
  id: string;
  etiqueta: string;
  /** Control dentro del campo, a la derecha (p. ej. mostrar la contraseña). */
  accion?: ReactNode;
}

/** Campo de texto con etiqueta flotante: la etiqueta es un `label` real, siempre visible. */
export const CampoFlotante = forwardRef<HTMLInputElement, Props>(function CampoFlotante({ id, etiqueta, accion, className, ...resto }, ref) {
  return (
    <div className={unir("relative", className)}>
      {/* El marcador vacío es lo que permite saber por CSS si el campo tiene valor */}
      <input ref={ref} id={id} placeholder=" " {...resto} className={unir(CAMPO, accion ? "pr-13" : undefined)} />
      <label htmlFor={id} className={ETIQUETA}>{etiqueta}</label>
      {accion && <div className="absolute inset-y-0 right-1 flex items-center">{accion}</div>}
    </div>
  );
});
