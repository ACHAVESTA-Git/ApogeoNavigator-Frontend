import { cubicBezier } from "motion";
import { useEffect, useRef } from "react";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { HERO, HORIZONTE_COPIAS, MOVIMIENTO } from "../../lib/constants";
import { mezclarTrazos, trazoAPath, trazoAnillo, trazoArco, trazoLinea, type Caja, type Trazo } from "../../lib/horizonte";
import type { FormaHorizonte, RegistroHorizonte } from "./horizonteContexto";

const TRAZAR: Record<FormaHorizonte, (caja: Caja) => Trazo> = { linea: trazoLinea, arco: trazoArco, anillo: trazoAnillo };
const suavizar = cubicBezier(...MOVIMIENTO.EASE_ORBITA);
const suavizarSalida = cubicBezier(...MOVIMIENTO.EASE_SALIDA);
const COPIAS = Array.from({ length: HORIZONTE_COPIAS }, (_, i) => i);

function introPendiente(): boolean {
  try {
    if (sessionStorage.getItem(HERO.CLAVE_SESION_INTRO)) return false;
    sessionStorage.setItem(HERO.CLAVE_SESION_INTRO, "1");
    return true;
  } catch {
    return false;
  }
}

interface Morph {
  desde: Trazo[];
  opacidadDesde: number[];
  inicio: number;
}

/**
 * La línea del horizonte, única y persistente: vive en el layout y cambia de forma al navegar
 * (arco en Inicio, anillo en Sitios, recta en el Cielo, horizontes apilados en Comparar).
 * Dibuja en coordenadas del contenedor y escribe el atributo `d` sin pasar por React.
 */
export function HorizonteContinuo({ registro, contenedor }: { registro: RegistroHorizonte; contenedor: React.RefObject<HTMLElement> }) {
  const reducido = useMovimientoReducido();
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let cuadro = 0;
    let firma = "";
    let dibujado: Trazo[] | null = null;
    let opacidad: number[] = COPIAS.map(() => 0);
    let morph: Morph | null = null;
    let intro: number | null = null; // instante de inicio del trazo de entrada

    const pintar = (trazos: Trazo[], opacidades: number[], progresoIntro: number) => {
      trazos.forEach((trazo, i) => {
        const path = paths.current[i];
        if (!path) return;
        path.setAttribute("d", trazoAPath(trazo));
        path.style.opacity = String(opacidades[i]);
        path.style.strokeDashoffset = String(1 - progresoIntro);
      });
      dibujado = trazos;
      opacidad = opacidades;
    };

    const fotograma = (ahora: number) => {
      cuadro = requestAnimationFrame(fotograma);
      const base = contenedor.current?.getBoundingClientRect();
      if (!base || document.hidden) return;
      const anclas = COPIAS.map((i) => registro.anclas.get(i));
      const principal = anclas.find(Boolean);
      if (!principal) return; // ruta en transición: la línea se queda donde estaba

      const cajaDe = (el: HTMLElement): Caja => {
        const r = el.getBoundingClientRect();
        return { x: r.left - base.left, y: r.top - base.top, ancho: r.width, alto: r.height };
      };
      // Las copias sin ancla propia se pliegan sobre la principal y se desvanecen.
      const objetivo = anclas.map((a) => TRAZAR[(a ?? principal).forma](cajaDe((a ?? principal).el)));
      const opacidadObjetivo = anclas.map((a) => (a ? 1 : 0));
      const nuevaFirma = anclas.map((a) => a?.forma ?? "-").join("|");

      if (nuevaFirma !== firma) {
        const primera = firma === "";
        firma = nuevaFirma;
        if (primera) {
          if (!reducido && principal.forma === "arco" && introPendiente()) intro = ahora;
        } else if (!reducido && dibujado) {
          morph = { desde: dibujado, opacidadDesde: opacidad, inicio: ahora };
        }
      }
      let progresoIntro = 1;
      if (intro !== null) {
        const p = Math.min(1, (ahora - intro) / MOVIMIENTO.ESCENA);
        progresoIntro = suavizarSalida(p);
        if (p >= 1) intro = null;
      }
      // Durante el morph la línea pasa POR DEBAJO del contenido (no cruza por encima de los textos); al terminar
      // vuelve arriba, porque en reposo debe verse sobre los fondos de cada pantalla.
      if (svg.current) svg.current.style.zIndex = morph ? "0" : "";
      if (morph) {
        const p = Math.min(1, (ahora - morph.inicio) / MOVIMIENTO.LARGA);
        const f = suavizar(p);
        const { desde, opacidadDesde } = morph;
        if (p >= 1) morph = null;
        pintar(
          objetivo.map((t, i) => mezclarTrazos(desde[i], t, f)),
          opacidadObjetivo.map((o, i) => opacidadDesde[i] + (o - opacidadDesde[i]) * f),
          progresoIntro,
        );
        return;
      }
      pintar(objetivo, opacidadObjetivo, progresoIntro);
    };
    cuadro = requestAnimationFrame(fotograma);
    return () => cancelAnimationFrame(cuadro);
  }, [registro, contenedor, reducido]);

  return (
    <svg ref={svg} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 size-full overflow-visible">
      {COPIAS.map((i) => (
        <path
          key={i}
          ref={(el) => { paths.current[i] = el; }}
          pathLength={1}
          strokeDasharray={1}
          className="stroke-horizonte fill-none"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          style={{ opacity: 0 }}
        />
      ))}
    </svg>
  );
}
