import { describe, expect, it } from "vitest";
import { estrellasEscena } from "./acceso";

describe("escena de Acceso", () => {
  it("las estrellas son deterministas y caben en el cielo", () => {
    const a = estrellasEscena(44);
    expect(a).toEqual(estrellasEscena(44));
    expect(a).toHaveLength(44);
    for (const e of a) {
      expect(e.x).toBeGreaterThanOrEqual(0);
      expect(e.x).toBeLessThan(100);
      expect(e.y).toBeGreaterThanOrEqual(0);
      expect(e.y).toBeLessThan(100);
      expect(e.opacidad).toBeGreaterThanOrEqual(0.25);
      expect(e.opacidad).toBeLessThanOrEqual(0.75);
    }
    expect(new Set(a.map((e) => `${e.x.toFixed(3)},${e.y.toFixed(3)}`)).size).toBe(44); // sin puntos repetidos
  });
  it("sin estrellas pedidas no hay ninguna", () => {
    expect(estrellasEscena(0)).toEqual([]);
    expect(estrellasEscena(-3)).toEqual([]);
  });
});
