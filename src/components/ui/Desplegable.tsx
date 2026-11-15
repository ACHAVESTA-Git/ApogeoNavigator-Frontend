import { ChevronDown } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { unir } from "./clases";
import { Plegable } from "./Plegable";

/**
 * Revelado progresivo: un botón con `aria-expanded` y el contenido en un pliegue que se abre y se cierra con
 * suavidad (alto y opacidad; con movimiento reducido, solo opacidad). Lo plegado queda inerte: fuera del
 * orden de tabulación y de los lectores de pantalla.
 */
export function Desplegable({ titulo, children, className, abierto = false }: { titulo: ReactNode; children: ReactNode; className?: string; abierto?: boolean }) {
  const id = useId();
  const [visible, setVisible] = useState(abierto);
  // Quien lo usa puede forzar la apertura (p. ej. un error dentro): nunca lo cierra por su cuenta.
  useEffect(() => {
    if (abierto) setVisible(true);
  }, [abierto]);
  return (
    <div className={unir("border-linea border-t", className)}>
      <button type="button" aria-expanded={visible} aria-controls={id} onClick={() => setVisible((v) => !v)}
        className="tactil text-apoyo text-texto-2 hover:text-texto flex w-full items-center justify-between gap-3 text-left font-semibold">
        {titulo}
        <ChevronDown aria-hidden="true" className={unir("size-4 shrink-0 transition-transform duration-(--dur-corta) ease-salida", visible && "rotate-180")} />
      </button>
      <Plegable abierto={visible} rapido>
        <div id={id} className="pb-5">{children}</div>
      </Plegable>
    </div>
  );
}
