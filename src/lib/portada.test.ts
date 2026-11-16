import { describe, expect, it } from "vitest";
import { aMs } from "./fechas";
import { centroDeVista, diaPortada, fraccionDelCiclo, horasCubiertas } from "./portada";

const COBERTURA = { DESDE: "2026-12-01T00:00Z", HASTA: "2027-06-01T00:00Z" };
const CICLO = { AVANCE_MS: 24_000, PAUSA_MS: 1_000, RETORNO_MS: 1_000 };

describe("diaPortada", () => {
  it("con datos para hoy, recorre el día UTC actual y descansa en la hora en curso", () => {
    expect(diaPortada(aMs("2027-01-27T11:00Z") + 25 * 60_000, COBERTURA))
      .toEqual({ desde: "2027-01-27T00:00Z", hasta: "2027-01-28T00:00Z", referencia: "2027-01-27T11:00Z", fuera: null });
  });
  it("antes del periodo con datos usa el primer día con datos y lo marca", () => {
    expect(diaPortada(aMs("2026-11-15T22:40Z"), COBERTURA))
      .toEqual({ desde: "2026-12-01T00:00Z", hasta: "2026-12-02T00:00Z", referencia: "2026-12-01T00:00Z", fuera: "antes" });
  });
  it("después del periodo usa el último día y el último instante con datos", () => {
    expect(diaPortada(aMs("2027-08-03T05:00Z"), COBERTURA))
      .toEqual({ desde: "2027-05-31T00:00Z", hasta: "2027-06-01T00:00Z", referencia: "2027-06-01T00:00Z", fuera: "despues" });
  });
  it("en los extremos del periodo nunca pide horas fuera de los datos", () => {
    expect(diaPortada(aMs("2026-12-01T00:00Z"), COBERTURA)).toMatchObject({ desde: "2026-12-01T00:00Z", fuera: null });
    expect(diaPortada(aMs("2027-06-01T00:00Z"), COBERTURA)).toMatchObject({ desde: "2027-05-31T00:00Z", hasta: "2027-06-01T00:00Z", fuera: null });
  });
});

describe("fraccionDelCiclo", () => {
  it("avanza de forma lineal, se detiene al final del día y vuelve al inicio sin saltos", () => {
    expect(fraccionDelCiclo(0, CICLO)).toBe(0);
    expect(fraccionDelCiclo(12_000, CICLO)).toBeCloseTo(0.5);
    expect(fraccionDelCiclo(24_500, CICLO)).toBe(1);
    expect(fraccionDelCiclo(25_000, CICLO)).toBe(1); // empieza el retorno desde el final
    expect(fraccionDelCiclo(25_500, CICLO)).toBeCloseTo(0.5);
    expect(fraccionDelCiclo(25_999, CICLO)).toBeLessThan(0.001);
    expect(fraccionDelCiclo(26_000, CICLO)).toBe(0); // el ciclo se repite
  });
});

describe("horasCubiertas", () => {
  it("cuenta las horas entre la primera y la última fila del archivo", () => {
    expect(horasCubiertas({ inicio_utc: "2026-12-01T00:00Z", fin_utc: "2027-06-01T00:00Z" })).toBe(4368);
    expect(horasCubiertas({ inicio_utc: "2026-12-02T00:00Z", fin_utc: "2026-12-01T00:00Z" })).toBe(0);
  });
});

describe("centroDeVista", () => {
  it("centra entre el Sol y la Tierra cuando caben en la ventana", () => {
    expect(centroDeVista(150, 240, 150, 0.72, 0.7)).toBe(195);
    expect(centroDeVista(350, 30, 150, 0.72, 0.7)).toBe(10); // cruza el norte
  });
  it("si no caben, o la vista es el panorama completo, deja la Tierra en su fracción del ancho", () => {
    expect(centroDeVista(60, 240, 150, 0.72, 0.7)).toBeCloseTo(240 - 0.22 * 150);
    expect(centroDeVista(150, 240, 360, 0.7, 0.7)).toBeCloseTo(240 - 0.2 * 360);
  });
});
