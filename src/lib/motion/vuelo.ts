// Transición compartida ENTRE rutas. Dentro de una pantalla se usa `layoutId`; entre rutas no sirve, porque la
// ruta saliente se desmonta antes de que la nueva (diferida) exista. Aquí se guarda dónde estaba el elemento
// al salir y el de llegada vuela desde allí (FLIP solo de posición, spring sin rebote, interrumpible).
import { animate } from "motion";
import { MOVIMIENTO } from "../constants";
import { movimientoReducido } from "./animar";

const origenes = new Map<string, { rect: DOMRect; cuando: number }>();

/** Guarda la caja en pantalla del elemento de salida. Se llama justo antes de navegar. */
export function recordarOrigen(clave: string, elemento: Element | null): void {
  if (elemento) origenes.set(clave, { rect: elemento.getBoundingClientRect(), cuando: performance.now() });
}

/** Si hay un origen reciente para `clave`, el elemento llega volando desde él. Devuelve cómo detenerlo. */
export function llegarDesdeOrigen(clave: string, elemento: HTMLElement): (() => void) | undefined {
  const origen = origenes.get(clave);
  origenes.delete(clave);
  if (!origen || performance.now() - origen.cuando > MOVIMIENTO.VUELO_VIGENCIA_MS || movimientoReducido()) return undefined;
  const destino = elemento.getBoundingClientRect();
  const [dx, dy] = [origen.rect.left - destino.left, origen.rect.top - destino.top];
  if (dx === 0 && dy === 0) return undefined;
  const control = animate(elemento, { x: [dx, 0], y: [dy, 0] }, MOVIMIENTO.SPRING_SUAVE);
  return () => control.stop();
}
