import { m, useMotionTemplate, useTransform } from "motion/react";
import { franjaTiempo } from "../../lib/relojGlobal";

/** Barra de 2 px en color Sol: qué parte del periodo se está mirando. Se mueve con el reloj, sin estado de React. */
export function BarraTiempo() {
  const derecha = useTransform(franjaTiempo.hasta, (v) => 100 - v);
  const clipPath = useMotionTemplate`inset(0 ${derecha}% 0 ${franjaTiempo.desde}%)`;
  return <m.div aria-hidden="true" className="bg-sol h-0.5 w-full" style={{ clipPath }} />;
}
