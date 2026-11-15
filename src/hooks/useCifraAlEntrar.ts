import { useEffect, useRef } from "react";
import { HERO } from "../lib/constants";
import { animarNumero } from "../lib/motion/animar";

/**
 * Cifra que cuenta desde 0 UNA vez, cuando `activa` pasa a true (su acto entra en escena). Es una escena de
 * primera vez, no una respuesta de interfaz; con movimiento reducido aparece ya con su valor.
 */
export function useCifraAlEntrar<E extends HTMLElement>(valor: number, formato: (v: number) => string, activa: boolean) {
  const ref = useRef<E>(null);
  const hecha = useRef(false);
  useEffect(() => {
    if (!activa || hecha.current) return;
    hecha.current = true;
    return animarNumero(0, valor, (v) => {
      if (ref.current) ref.current.textContent = formato(v);
    }, { duracion: HERO.RELATO.CONTEO_MS, escena: true });
  }, [activa, valor, formato]);
  return ref;
}
