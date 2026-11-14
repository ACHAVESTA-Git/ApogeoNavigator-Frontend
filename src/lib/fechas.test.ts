import { describe, expect, it } from "vitest";
import { aCampoLocal, aMs, aUtc, desdeCampoLocal, diasEntre, esMesCompleto, esUtc, fechaHora, fechaLarga, horaLima,
  horasEntre, redondearHora, sumarHoras, sumarMeses } from "./fechas";

describe("fechas", () => {
  it("convierte entre el formato del estándar y milisegundos", () => {
    expect(aUtc(aMs("2026-12-14T23:00Z"))).toBe("2026-12-14T23:00Z");
    expect(aMs("2026-12-01T00:00Z")).toBe(Date.UTC(2026, 11, 1));
  });
  it("valida el formato UTC del estándar CSV", () => {
    expect(esUtc("2026-12-01T00:00Z")).toBe(true);
    expect(esUtc("2026-12-01T00:00:00Z")).toBe(false);
    expect(esUtc("2026-12-01 00:00")).toBe(false);
    expect(esUtc(null)).toBe(false);
  });
  it("suma horas cruzando el cambio de año", () => {
    expect(sumarHoras("2026-12-31T23:00Z", 1)).toBe("2027-01-01T00:00Z");
    expect(horasEntre("2026-12-01T00:00Z", "2027-01-01T00:00Z")).toBe(744);
    expect(diasEntre("2026-12-01T00:00Z", "2027-01-01T00:00Z")).toBe(31);
  });
  it("da la hora de Lima (UTC−5)", () => {
    expect(horaLima("2026-12-14T23:00Z")).toBe("18:00");
    expect(horaLima("2026-12-15T03:30Z")).toBe("22:30");
  });
  it("formatea para lectura y para lectores de pantalla", () => {
    expect(fechaHora("2026-12-14T23:00Z")).toBe("2026-12-14 23:00");
    expect(fechaLarga("2026-12-14T23:00Z")).toBe("14 de diciembre de 2026, 23:00 UTC");
  });
  it("lee y escribe el campo datetime-local como UTC", () => {
    expect(aCampoLocal("2026-12-14T23:00Z")).toBe("2026-12-14T23:00");
    expect(desdeCampoLocal("2026-12-14T23:00")).toBe("2026-12-14T23:00Z");
    expect(desdeCampoLocal("")).toBeNull();
  });
  it("redondea a la hora y reconoce meses completos", () => {
    expect(aUtc(redondearHora(aMs("2026-12-14T23:00Z") + 29 * 60_000))).toBe("2026-12-14T23:00Z");
    expect(sumarMeses("2026-12-14T23:00Z", 1)).toBe("2027-01-01T00:00Z");
    expect(esMesCompleto("2026-12-01T00:00Z", "2027-01-01T00:00Z")).toBe(true);
    expect(esMesCompleto("2026-12-01T00:00Z", "2026-12-08T00:00Z")).toBe(false);
  });
});
