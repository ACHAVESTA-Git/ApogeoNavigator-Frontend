import { describe, expect, it } from "vitest";
import { esCaraOculta, proyectarPolar, radioLatitud } from "./geo";

const R = 300;
describe("proyección polar sur", () => {
  it("pone el polo en el centro y +30° en el borde", () => {
    expect(radioLatitud(-90, R)).toBe(0);
    expect(radioLatitud(30, R)).toBe(R);
    expect(radioLatitud(-30, R)).toBe(R / 2);
  });
  it("apunta 0° hacia arriba (Tierra) y el este en sentido horario", () => {
    const arriba = proyectarPolar(0, 0, R);
    expect(arriba.x).toBeCloseTo(0);
    expect(arriba.y).toBeLessThan(0);
    expect(proyectarPolar(0, 90, R).x).toBeGreaterThan(0);
    expect(proyectarPolar(0, -90, R).x).toBeLessThan(0);
  });
  it("coloca los sitios reales donde corresponde", () => {
    const shackleton = proyectarPolar(-89.66, 129.2, R);
    expect(Math.hypot(shackleton.x, shackleton.y)).toBeLessThan(1);
    expect(proyectarPolar(-45.457, 177.589, R).y).toBeGreaterThan(0); // Chang'e 4: mitad inferior
    expect(proyectarPolar(-41.6385, -153.9852, R).y).toBeGreaterThan(0); // Chang'e 6
    expect(proyectarPolar(0.67416, 23.47314, R).y).toBeLessThan(0); // Apolo 11: cara visible
  });
  it("distingue la cara oculta", () => {
    expect(esCaraOculta(177.589)).toBe(true);
    expect(esCaraOculta(-153.9852)).toBe(true);
    expect(esCaraOculta(61.81)).toBe(false);
  });
});
