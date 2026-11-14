import { describe, expect, it } from "vitest";
import { HORIZONTE_PUNTOS } from "./constants";
import { mezclarTrazos, trazoAPath, trazoAnillo, trazoArco, trazoLinea, trazosIguales } from "./horizonte";

const caja = { x: 10, y: 100, ancho: 200, alto: 200 };
describe("formas del horizonte", () => {
  it("todas tienen el mismo número de puntos", () => {
    for (const trazo of [trazoLinea(caja), trazoArco(caja), trazoAnillo(caja)]) expect(trazo).toHaveLength(HORIZONTE_PUNTOS);
  });
  it("la línea va de izquierda a derecha a la altura de la caja", () => {
    const linea = trazoLinea(caja);
    expect(linea[0]).toEqual([10, 100]);
    expect(linea[HORIZONTE_PUNTOS - 1]).toEqual([210, 100]);
  });
  it("el arco tiene el centro más alto que los extremos", () => {
    const arco = trazoArco({ ...caja, alto: 30 });
    expect(arco[0][1]).toBeCloseTo(130);
    expect(arco[32][1]).toBeLessThan(101);
  });
  it("el anillo se cierra y empieza a la izquierda", () => {
    const anillo = trazoAnillo(caja);
    expect(anillo[0][0]).toBeCloseTo(10);
    expect(anillo[HORIZONTE_PUNTOS - 1][0]).toBeCloseTo(anillo[0][0]);
    expect(anillo[HORIZONTE_PUNTOS - 1][1]).toBeCloseTo(anillo[0][1]);
  });
  it("mezcla dos formas y las serializa", () => {
    const medio = mezclarTrazos(trazoLinea(caja), trazoLinea({ ...caja, y: 200 }), 0.5);
    expect(medio[0][1]).toBe(150);
    expect(trazoAPath(medio).startsWith("M10 150L")).toBe(true);
    expect(trazosIguales(medio, medio)).toBe(true);
    expect(trazosIguales(medio, trazoLinea(caja))).toBe(false);
  });
});
