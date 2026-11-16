import { describe, expect, it } from "vitest";
import { columnasRejilla, enlaceCielo, estanciaDeUrl, hayEmpate, mesesCalendario, moverEnRejilla, nivelCalor, retrasoCelda, sinVentanaUtil } from "./alunizaje";
import type { DiaVentana, VentanaAlunizaje } from "./tipos";

const dia = (d: string, horas: number, pct: number): DiaVentana => ({ dia_utc: d, llegada_utc: `${d}T23:00Z`, horas_sol_y_tierra: horas, pct_sol_y_tierra: pct });
const ventana = (llegada: string, horas: number): VentanaAlunizaje => ({ llegada_utc: llegada, salida_utc: llegada, horas_sol_y_tierra: horas });

describe("escala del calendario de calor", () => {
  it("separa «nada» de «algo» y sube un escalón en 25, 50 y 75 %", () => {
    expect([0, 0.01, 24.99, 25, 49.9, 50, 74.9, 75, 100].map(nivelCalor)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
    expect(nivelCalor(Number.NaN)).toBe(0);
  });
});

describe("estancia de la URL", () => {
  it("solo acepta 72, 156 y 336 h; lo demás es la estancia de referencia", () => {
    expect(estanciaDeUrl("72")).toBe(72);
    expect(estanciaDeUrl("336")).toBe(336);
    expect(estanciaDeUrl(null)).toBe(156);
    expect(estanciaDeUrl("100")).toBe(156);
  });
});

describe("meses del calendario", () => {
  const meses = mesesCalendario([dia("2026-12-14", 156, 100), dia("2027-02-07", 60, 38.46)]);
  it("cubre de diciembre de 2026 a mayo de 2027 con todos los días", () => {
    expect(meses.map((m) => m.inicio)).toEqual(["2026-12-01T00:00Z", "2027-01-01T00:00Z", "2027-02-01T00:00Z", "2027-03-01T00:00Z", "2027-04-01T00:00Z", "2027-05-01T00:00Z"]);
    expect(meses.map((m) => m.dias.length)).toEqual([31, 31, 28, 31, 30, 31]);
  });
  it("pone cada dato en su día y deja sin dato los días que la API no evalúa", () => {
    expect(meses[0].dias[13]).toMatchObject({ dia: "2026-12-14", dato: { pct_sol_y_tierra: 100 } });
    expect(meses[0].dias[0].dato).toBeUndefined();
    expect(meses.map((m) => m.maxPct)).toEqual([100, null, 38.46, null, null, null]);
  });
});

describe("reglas de la mejor ventana", () => {
  it("una mejor ventana con 0 h de Sol y Tierra no es una ventana que recomendar", () => {
    expect(sinVentanaUtil([ventana("2026-12-01T22:00Z", 0)])).toBe(true);
    expect(sinVentanaUtil([ventana("2026-12-14T23:00Z", 156)])).toBe(false);
    expect(sinVentanaUtil([])).toBe(false);
  });
  it("hay empate si otra ventana u otro día igualan el máximo", () => {
    const mejores = [ventana("2026-12-14T23:00Z", 156), ventana("2027-01-11T02:00Z", 156)];
    expect(hayEmpate({ mejores, serie_diaria: [] })).toBe(true);
    expect(hayEmpate({ mejores: [mejores[0]], serie_diaria: [dia("2026-12-14", 156, 100), dia("2026-12-15", 156, 100)] })).toBe(true);
    expect(hayEmpate({ mejores: [ventana("2027-01-09T12:00Z", 298), ventana("2026-12-13T02:00Z", 291)], serie_diaria: [dia("2027-01-09", 298, 88.69), dia("2027-01-10", 290, 86.3)] })).toBe(false);
    expect(hayEmpate({ mejores: [ventana("2026-12-01T22:00Z", 0), ventana("2026-12-04T22:00Z", 0)], serie_diaria: [] })).toBe(false);
  });
});

describe("rejilla", () => {
  it("caben 5 columnas en el panel a 360 px (294 px útiles) y nunca más de 16", () => {
    expect(columnasRejilla(0)).toBe(5);
    expect(columnasRejilla(294)).toBe(5);
    expect(columnasRejilla(328)).toBe(6);
    expect(columnasRejilla(664)).toBe(12);
    expect(columnasRejilla(4000)).toBe(16);
  });
  it("las celdas entran escalonadas con techo: la última termina antes de 320 ms", () => {
    expect(retrasoCelda(0)).toBe(0);
    expect(retrasoCelda(30) + 180).toBeLessThanOrEqual(320);
    expect(retrasoCelda(200)).toBe(retrasoCelda(30));
  });
  it("las flechas mueven un día o una fila y cruzan de mes; Inicio y Fin van a los extremos de la fila", () => {
    // diciembre ocupa los índices 0–30 y enero 31–61, con 6 columnas
    expect(moverEnRejilla("ArrowRight", 30, 181, 6, 0, 30)).toBe(31);
    expect(moverEnRejilla("ArrowLeft", 0, 181, 6, 0, 30)).toBe(0);
    expect(moverEnRejilla("ArrowDown", 2, 181, 6, 0, 30)).toBe(8);
    expect(moverEnRejilla("ArrowDown", 28, 181, 6, 0, 30)).toBe(31);
    expect(moverEnRejilla("ArrowUp", 33, 181, 6, 31, 61)).toBe(30);
    expect(moverEnRejilla("Home", 9, 181, 6, 0, 30)).toBe(6);
    expect(moverEnRejilla("End", 30, 181, 6, 0, 30)).toBe(30);
    expect(moverEnRejilla("a", 3, 181, 6, 0, 30)).toBeNull();
  });
});

describe("salto al Cielo", () => {
  it("lleva el instante de llegada y el mes que lo contiene", () => {
    expect(decodeURIComponent(enlaceCielo("shackleton", "2026-12-14T23:00Z"))).toBe("/sitios/shackleton/cielo?desde=2026-12-01T00:00Z&hasta=2027-01-01T00:00Z&t=2026-12-14T23:00Z");
  });
});
