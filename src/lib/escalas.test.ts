import { describe, expect, it } from "vitest";
import { desenrollar, diferenciaAngular, elevacionAY, escalaLineal, lineal, lupa, lupaInversa, normalizarAz } from "./escalas";

describe("escala de lupa", () => {
  it("es simétrica, pasa por 0 y satura en ±90°", () => {
    expect(lupa(0)).toBe(0);
    expect(lupa(90)).toBeCloseTo(1);
    expect(lupa(-90)).toBeCloseTo(-1);
    expect(lupa(-5)).toBeCloseTo(-lupa(5));
  });
  it("da al tramo 0–5° una parte grande de la altura (≈ un tercio)", () => {
    expect(lupa(5)).toBeGreaterThan(0.3);
    expect(lupa(5)).toBeLessThan(0.45);
    expect(lupa(5)).toBeGreaterThan(lineal(5) * 5);
  });
  it("tiene inversa", () => {
    for (const e of [-45.4, -1, 0.02, 1.74, 11.07, 88.09]) expect(lupaInversa(lupa(e))).toBeCloseTo(e, 6);
  });
  it("convierte a píxeles con el horizonte fijo", () => {
    const y = elevacionAY(lupa, 300, 280, 150);
    expect(y(0)).toBe(300);
    expect(y(90)).toBeCloseTo(20);
    expect(y(-90)).toBeCloseTo(450);
  });
});

describe("azimut", () => {
  it("normaliza a 0…360", () => {
    expect(normalizarAz(-10)).toBe(350);
    expect(normalizarAz(725)).toBe(5);
  });
  it("mide por el camino corto", () => {
    expect(diferenciaAngular(350, 10)).toBe(20);
    expect(diferenciaAngular(10, 350)).toBe(-20);
    expect(diferenciaAngular(0, 180)).toBe(180);
  });
  it("desenrolla series que cruzan el norte", () => {
    expect(desenrollar([2, 1, 0.5, 359.5, 359])).toEqual([2, 1, 0.5, -0.5, -1]);
  });
  it("escala linealmente", () => {
    const x = escalaLineal(0, 744, 0, 372);
    expect(x(372)).toBe(186);
    expect(escalaLineal(5, 5, 0, 10)(5)).toBe(0);
  });
});
