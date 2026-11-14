import { describe, expect, it } from "vitest";
import { aMs } from "./fechas";
import { indiceEn, interpolarFila } from "./interpolar";
import type { FilaEfemeride } from "./tipos";

const filas: FilaEfemeride[] = [
  { utc: "2026-12-01T00:00Z", sol_az_deg: 1, sol_el_deg: 1, tierra_az_deg: 237, tierra_el_deg: -1 },
  { utc: "2026-12-01T01:00Z", sol_az_deg: 359, sol_el_deg: 2, tierra_az_deg: 238, tierra_el_deg: 1 },
  { utc: "2026-12-01T02:00Z", sol_az_deg: 357, sol_el_deg: 3, tierra_az_deg: 239, tierra_el_deg: 3 },
];
const t0 = aMs(filas[0].utc);

describe("interpolación entre filas horarias", () => {
  it("devuelve la fila exacta en la hora en punto", () => {
    expect(interpolarFila(filas, aMs(filas[1].utc))).toMatchObject({ sol_az_deg: 359, sol_el_deg: 2 });
  });
  it("interpola el azimut por el camino corto al cruzar el norte", () => {
    const medio = interpolarFila(filas, t0 + 30 * 60_000);
    expect(medio.sol_az_deg).toBeCloseTo(0);
    expect(medio.sol_el_deg).toBeCloseTo(1.5);
    expect(medio.tierra_el_deg).toBeCloseTo(0);
  });
  it("se queda en los extremos fuera del rango", () => {
    expect(interpolarFila(filas, t0 - 1e7).sol_el_deg).toBe(1);
    expect(interpolarFila(filas, t0 + 1e9).sol_el_deg).toBe(3);
    expect(indiceEn(filas, t0 + 1e9)).toBe(2);
    expect(indiceEn(filas, t0 - 5)).toBe(0);
  });
});
