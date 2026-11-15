import { describe, expect, it } from "vitest";
import { HORIZONTE_PUNTOS, MOVIMIENTO } from "./constants";
import { fasesFundido, fundeHaciaLienzo, mezclarTrazos, trazoAPath, trazoAnillo, trazoArco, trazoLinea, trazosIguales } from "./horizonte";

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

describe("del anillo del mapa al lienzo del Cielo", () => {
  const { FUNDIDO_ANILLO: SALIDA, CORTA: ENTRADA, LARGA } = MOVIMIENTO;
  it("solo se funde un anillo cuyo destino es el lienzo; el resto de transiciones sigue con su morph", () => {
    expect(fundeHaciaLienzo("anillo|-|-", true)).toBe(true); // catálogo → Cielo, y vista cenital → panorama
    expect(fundeHaciaLienzo("anillo|-|-", false)).toBe(false); // catálogo → Ventanas, Día lunar, Comparar…
    expect(fundeHaciaLienzo("linea|-|-", true)).toBe(false); // Ventanas → Cielo: la línea se desliza como antes
    expect(fundeHaciaLienzo("linea|linea|linea", true)).toBe(false);
    expect(fundeHaciaLienzo("arco|-|-", true)).toBe(false);
    expect(fundeHaciaLienzo("", true)).toBe(false); // primera pantalla: no hay nada que fundir
  });
  it("el anillo se apaga en 160 ms y la línea aparece después: nunca se ven los dos", () => {
    expect(SALIDA).toBe(160);
    expect(fasesFundido(0, SALIDA, ENTRADA)).toEqual({ saliendo: true, p: 0, fin: false });
    expect(fasesFundido(80, SALIDA, ENTRADA)).toEqual({ saliendo: true, p: 0.5, fin: false });
    expect(fasesFundido(SALIDA, SALIDA, ENTRADA)).toEqual({ saliendo: false, p: 0, fin: false });
    expect(fasesFundido(SALIDA + ENTRADA / 2, SALIDA, ENTRADA)).toEqual({ saliendo: false, p: 0.5, fin: false });
    expect(fasesFundido(SALIDA + ENTRADA, SALIDA, ENTRADA)).toEqual({ saliendo: false, p: 1, fin: true });
    expect(fasesFundido(5000, SALIDA, ENTRADA)).toEqual({ saliendo: false, p: 1, fin: true });
    expect(fasesFundido(-4, SALIDA, ENTRADA).p).toBe(0);
    expect(fasesFundido(SALIDA, SALIDA, 0).fin).toBe(true);
    // y todo acaba antes de lo que tardaba el morph
    expect(SALIDA + ENTRADA).toBeLessThan(LARGA);
  });
});
