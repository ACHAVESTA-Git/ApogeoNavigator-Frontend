/** Parte una lista en grupos de `tamano` como máximo (la API de métricas acepta pocos sitios por petición). */
export function trocear<T>(lista: readonly T[], tamano: number): T[][] {
  const grupos: T[][] = [];
  for (let i = 0; i < lista.length; i += tamano) grupos.push(lista.slice(i, i + tamano));
  return grupos;
}

/** Media aritmética; `null` si no hay valores (nunca se inventa un 0). */
export const media = (valores: readonly number[]): number | null =>
  valores.length ? valores.reduce((suma, v) => suma + v, 0) / valores.length : null;
