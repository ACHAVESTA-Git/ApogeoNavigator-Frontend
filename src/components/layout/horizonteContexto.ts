// Registro de anclas del horizonte continuo: cada ruta dice DÓNDE y con QUÉ forma va la línea.
import { createContext, useCallback, useContext, useEffect, useRef } from "react";

export type FormaHorizonte = "linea" | "arco" | "anillo";
export interface Ancla {
  forma: FormaHorizonte;
  el: HTMLElement;
  /** La pantalla ya pinta su propio horizonte en un lienzo: un anillo no hace morph hacia ella, se funde. */
  lienzo: boolean;
}
export interface RegistroHorizonte {
  /** Anclas por copia (0…HORIZONTE_COPIAS−1). La capa las lee en cada fotograma. */
  anclas: Map<number, Ancla>;
}
export const ContextoHorizonte = createContext<RegistroHorizonte | null>(null);

/**
 * Devuelve un ref para el elemento que marca el horizonte de la pantalla:
 *  - "linea": la línea recorre el borde superior del elemento;
 *  - "arco": el centro toca el borde superior y los extremos caen la altura del elemento;
 *  - "anillo": circunferencia inscrita en el elemento.
 * `copia` distingue los horizontes apilados de Comparar. `lienzo` marca la escena del Cielo, que pinta su
 * propio horizonte: el anillo del mapa se funde al llegar a ella en vez de deformarse por encima.
 */
export function useAnclaHorizonte(forma: FormaHorizonte, copia = 0, lienzo = false) {
  const registro = useContext(ContextoHorizonte);
  const actual = useRef<HTMLElement | null>(null);
  const ref = useCallback(
    (el: HTMLElement | null) => {
      actual.current = el;
      if (!registro) return;
      if (el) registro.anclas.set(copia, { forma, el, lienzo });
      else registro.anclas.delete(copia);
    },
    [registro, forma, copia, lienzo],
  );
  useEffect(
    () => () => {
      if (registro?.anclas.get(copia)?.el === actual.current) registro?.anclas.delete(copia);
    },
    [registro, copia],
  );
  return ref;
}
