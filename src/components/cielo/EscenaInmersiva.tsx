import { animate, useMotionValue, useMotionValueEvent } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { ESCENA } from "../../lib/constants";
import { limitar } from "../../lib/fechas";
import { unir } from "../ui/clases";

/** Alto de la escena dentro de la página para un alto de ventana (en móvil una fracción; desde 768 px, hasta el borde inferior). */
export function altoDeEscena(altoVentana: number, ancha: boolean): number {
  const { movil, escritorio } = ESCENA.ALTO;
  return Math.round(ancha ? limitar(altoVentana - escritorio.descuento, escritorio.min, escritorio.max) : limitar(altoVentana * movil.fraccion, movil.min, movil.max));
}

/** Deja inertes a los hermanos de `el` y a los de sus antepasados (lo que queda tapado). Devuelve cómo deshacerlo. */
export function aislar(el: Element): () => void {
  const tocados: Element[] = [];
  for (let nodo: Element | null = el; nodo && nodo !== document.body; nodo = nodo.parentElement) {
    for (const hermano of nodo.parentElement?.children ?? []) {
      if (hermano !== nodo && !hermano.hasAttribute("inert") && !hermano.hasAttribute("aria-live")) {
        hermano.setAttribute("inert", "");
        tocados.push(hermano);
      }
    }
  }
  return () => tocados.forEach((nodo) => nodo.removeAttribute("inert"));
}

/**
 * Caja de la escena del cielo que puede pasar a pantalla completa. No cambia de sitio en el árbol: la misma
 * escena (con su giro, su instante y su tarjeta abierta) crece desde donde está hasta llenar la ventana y vuelve.
 *
 * La caja cambia de tamaño de verdad en cada fotograma, en lugar de escalarse con `transform`: así el horizonte,
 * los astros y el relieve se vuelven a proyectar a cada tamaño y nada se deforma. Mientras tanto está en
 * `position: fixed`, de modo que el resto de la página no se recoloca. El muelle no tiene rebote y se puede
 * invertir a medio camino (conserva la velocidad).
 */
export function EscenaInmersiva({ activa, alSalir, alto, barra, pie, children, className }: {
  activa: boolean; alSalir: () => void;
  /** alto de la escena dentro de la página, en px; sin él, la caja toma el alto de su contenido */
  alto?: number;
  /** título y controles: van encima de la escena, también en pantalla completa */
  barra: (fijada: boolean) => ReactNode;
  /** lo que va pegado al pie de la escena (el control de tiempo) */
  pie?: ReactNode;
  children: (fijada: boolean) => ReactNode;
  className?: string;
}) {
  const reducido = useMovimientoReducido();
  const hueco = useRef<HTMLDivElement>(null);
  const caja = useRef<HTMLDivElement>(null);
  const origen = useRef({ top: 0, alto: 0 });
  const restaurar = useRef<(() => void) | null>(null);
  const avance = useMotionValue(0); // 0 = en la página … 1 = pantalla completa
  const [fijada, setFijada] = useState(false);

  const colocar = useCallback((f: number) => {
    const el = caja.current;
    if (!el) return;
    el.style.top = `${origen.current.top * (1 - f)}px`;
    el.style.height = f >= 1 ? "100dvh" : `${origen.current.alto + (window.innerHeight - origen.current.alto) * f}px`;
  }, []);
  useMotionValueEvent(avance, "change", colocar);

  const soltar = useCallback(() => {
    restaurar.current?.();
    restaurar.current = null;
    delete document.documentElement.dataset.inmersivo;
    if (hueco.current) hueco.current.style.height = "";
    if (caja.current) caja.current.style.top = caja.current.style.height = "";
  }, []);

  useLayoutEffect(() => {
    const el = caja.current;
    if (!el || !hueco.current) return;
    if (activa) {
      if (!restaurar.current) {
        // Primera vez: la caja se fija exactamente donde está y su hueco conserva el sitio en la página.
        const r = el.getBoundingClientRect();
        origen.current = { top: r.top, alto: r.height };
        hueco.current.style.height = `${r.height}px`;
        document.documentElement.dataset.inmersivo = "";
        restaurar.current = aislar(el);
        setFijada(true);
        colocar(avance.get());
      }
    } else if (restaurar.current) {
      origen.current.top = hueco.current.getBoundingClientRect().top; // la página pudo cambiar mientras tanto
    } else {
      return;
    }
    const destino = activa ? 1 : 0;
    const alTerminar = () => {
      if (avance.get() !== 0) return;
      soltar();
      setFijada(false);
    };
    if (reducido) {
      avance.set(destino);
      alTerminar();
      return;
    }
    const control = animate(avance, destino, ESCENA.INMERSION);
    void control.then(alTerminar);
    return () => control.stop();
  }, [activa, reducido, avance, colocar, soltar]);
  useEffect(() => soltar, [soltar]); // al desmontar (cambio de ruta en pantalla completa) no queda nada inerte
  // Escape sale de la pantalla completa, esté donde esté el foco (si otra capa ya lo ha usado, no).
  useEffect(() => {
    if (!activa) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) alSalir();
    };
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [activa, alSalir]);

  return (
    <div ref={hueco} className={className}>
      <div ref={caja} data-inmersiva={fijada || undefined} style={alto === undefined ? undefined : ({ "--alto-escena": `${alto}px` } as CSSProperties)}
        className={unir("group/escena", fijada && "bg-vacio fixed inset-x-0 z-50 flex flex-col overflow-clip")}>
        {barra(fijada)}
        <div className="relative flex min-h-0 flex-col group-data-inmersiva/escena:flex-1">
          <div className={unir(alto !== undefined && "h-(--alto-escena)", "group-data-inmersiva/escena:h-auto group-data-inmersiva/escena:min-h-0 group-data-inmersiva/escena:flex-1")}>
            {children(fijada)}
          </div>
          {pie}
        </div>
      </div>
    </div>
  );
}
