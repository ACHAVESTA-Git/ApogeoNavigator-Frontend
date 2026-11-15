import { describe, expect, it } from "vitest";
import { abreviarHuella, fraccion, masEsMejor, nivelPorUmbrales, puntoArco } from "./lujo";

describe("lujo · cálculo de las primitivas", () => {
  it("clasifica cuando más es mejor (límites inclusivos)", () => {
    const u = { reservas: 0.8, viable: 0.95 };
    expect(masEsMejor(u)).toBe(true);
    expect(nivelPorUmbrales(0.95, u)).toBe("verde");
    expect(nivelPorUmbrales(0.94, u)).toBe("amarillo");
    expect(nivelPorUmbrales(0.8, u)).toBe("amarillo");
    expect(nivelPorUmbrales(0.79, u)).toBe("rojo");
  });
  it("clasifica cuando menos es mejor (viable < reservas)", () => {
    const u = { viable: 0.5, reservas: 2 };
    expect(masEsMejor(u)).toBe(false);
    expect(nivelPorUmbrales(0.5, u)).toBe("verde");
    expect(nivelPorUmbrales(1.2, u)).toBe("amarillo");
    expect(nivelPorUmbrales(2.1, u)).toBe("rojo");
  });
  it("recorta la fracción a 0–1 y no se rompe con rangos vacíos", () => {
    expect(fraccion(50, 0, 100)).toBe(0.5);
    expect(fraccion(-3, 0, 100)).toBe(0);
    expect(fraccion(140, 0, 100)).toBe(1);
    expect(fraccion(5, 10, 10)).toBe(0);
    expect(fraccion(Number.NaN, 0, 1)).toBe(0);
  });
  it("sitúa puntos sobre el arco", () => {
    const [x, y] = puntoArco(60, 60, 50, 90);
    expect(x).toBeCloseTo(60);
    expect(y).toBeCloseTo(110);
  });
  it("abrevia la huella sin alterar las cortas", () => {
    expect(abreviarHuella("abcdef0123456789", 12)).toBe("abcdef012345…");
    expect(abreviarHuella("abc", 12)).toBe("abc");
  });
});
