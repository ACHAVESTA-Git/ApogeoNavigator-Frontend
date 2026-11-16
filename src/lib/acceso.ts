// Escena de la pantalla de Acceso: geometría decorativa y determinista (sin azar ni datos de la API).

export interface EstrellaEscena {
  /** Posición en % del ancho y del alto del cielo. */
  x: number;
  y: number;
  /** Diámetro en px. */
  d: number;
  opacidad: number;
}

// Inversos de la constante plástica (y de su cuadrado) y de la razón áurea: sucesiones de baja discrepancia,
// que reparten los puntos sin cúmulos ni rejilla visible.
const PASO_X = 0.7548776662466927;
const PASO_Y = 0.5698402909980532;
const PASO_BRILLO = 0.6180339887498949;
const frac = (v: number): number => v - Math.floor(v);

/** `n` estrellas siempre iguales: mismas posiciones, tamaños y brillos en cada visita. */
export function estrellasEscena(n: number): EstrellaEscena[] {
  return Array.from({ length: Math.max(0, Math.floor(n)) }, (_, i) => {
    const brillo = frac((i + 1) * PASO_BRILLO);
    return { x: frac(0.5 + (i + 1) * PASO_X) * 100, y: frac(0.5 + (i + 1) * PASO_Y) * 100, d: brillo > 0.85 ? 2 : 1, opacidad: 0.25 + brillo * 0.5 };
  });
}
