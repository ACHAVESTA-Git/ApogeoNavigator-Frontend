import { Info } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { unir } from "../ui/clases";

/**
 * Nota de ayuda accesible (tooltip): un botón con `aria-describedby` y la nota siempre en el DOM. Se ve al pasar
 * el puntero, al recibir el foco (teclado) o al tocar; Escape la cierra. Nace desde su botón (origen arriba a la
 * derecha) con opacidad y escala, 140 ms.
 */
export function NotaAyuda({ etiqueta, children, className }: { etiqueta: string; children: ReactNode; className?: string }) {
  const id = useId();
  const [fija, setFija] = useState(false);
  const [oculta, setOculta] = useState(false); // Escape la quita aunque el puntero o el foco sigan encima
  return (
    <span className={unir("group/ayuda", className)} onPointerLeave={() => setOculta(false)}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        setFija(false);
        setOculta(true);
      }}>
      <button type="button" aria-label={etiqueta} aria-describedby={id} aria-expanded={fija}
        onClick={() => { setOculta(false); setFija((v) => !v); }} onBlur={() => { setFija(false); setOculta(false); }}
        className="tactil text-texto-2 hover:text-texto absolute top-0 right-0 z-30 grid place-items-center rounded-full transition-[color,transform] duration-(--dur-micro) ease-salida active:scale-[0.97]">
        <Info aria-hidden="true" className="size-4" />
      </button>
      <span role="tooltip" id={id} data-fija={fija || undefined} data-oculta={oculta || undefined}
        className={unir(
          "bg-elevada border-texto/10 text-apoyo text-texto shadow-flotante rounded-panel pointer-events-none absolute inset-x-0 top-11 z-20 origin-top-right border p-3 text-left",
          "scale-[0.97] opacity-0 transition-[opacity,transform] duration-(--dur-micro) ease-salida",
          "group-hover/ayuda:scale-100 group-hover/ayuda:opacity-100 group-focus-within/ayuda:scale-100 group-focus-within/ayuda:opacity-100",
          "data-fija:scale-100 data-fija:opacity-100 data-oculta:scale-[0.97]! data-oculta:opacity-0!",
        )}>
        {children}
      </span>
    </span>
  );
}
