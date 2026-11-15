import { describe, expect, it } from "vitest";
import { PROYECCION } from "./constants";
import { bandaAcotada, fiabilidadDe } from "./proyeccion";
import type { FilaEfemeride, PuntoSimulacion } from "./tipos";

const base: FilaEfemeride = { utc: "2027-06-10T00:00Z", sol_az_deg: 120, sol_el_deg: 1.2, tierra_az_deg: 3, tierra_el_deg: 5 };
const punto = (u: PuntoSimulacion["incertidumbre_deg"], extra: Partial<PuntoSimulacion> = {}): PuntoSimulacion =>
  ({ ...base, origen: u ? "proyeccion" : "datos", incertidumbre_deg: u, ...extra });
const u = (sol_az_deg: number, resto = 0.1) => ({ sol_az_deg, sol_el_deg: resto, tierra_az_deg: resto, tierra_el_deg: resto });

describe("fiabilidadDe", () => {
  it("un dato de Horizons no es proyección ni lleva banda", () => {
    expect(fiabilidadDe(base)).toEqual({ esProyeccion: false, bandaDeg: 0, azimutFiable: { sol: true, tierra: true } });
    expect(fiabilidadDe(punto(null)).esProyeccion).toBe(false);
    expect(fiabilidadDe(undefined).esProyeccion).toBe(false);
  });

  it("la banda es el doble del mayor RMSE acotable", () => {
    const f = fiabilidadDe(punto(u(0.4)));
    expect(f.esProyeccion).toBe(true);
    expect(f.bandaDeg).toBeCloseTo(0.4 * PROYECCION.FACTOR_BANDA);
    expect(f.azimutFiable.sol).toBe(true);
  });

  it("tolera que el backend aún no envíe azimut_solar_fiable", () => {
    expect(fiabilidadDe(punto(u(0.4))).azimutFiable.sol).toBe(true);
    expect(fiabilidadDe(punto(u(0.4), { azimut_solar_fiable: true })).azimutFiable.sol).toBe(true);
  });

  it("azimut_solar_fiable=false marca el azimut y no ensancha la banda", () => {
    const f = fiabilidadDe(punto(u(180), { azimut_solar_fiable: false }));
    expect(f.azimutFiable.sol).toBe(false);
    expect(f.bandaDeg).toBeCloseTo(0.1 * PROYECCION.FACTOR_BANDA);
  });

  it("un RMSE de azimut enorme sin marca tampoco produce una banda absurda", () => {
    const f = fiabilidadDe(punto(u(180)));
    expect(f.azimutFiable.sol).toBe(false);
    expect(f.bandaDeg).toBeLessThanOrEqual(PROYECCION.BANDA_MAX_DEG);
  });

  it("marcado como no fiable aunque su RMSE sea pequeño", () => {
    expect(fiabilidadDe(punto(u(0.2), { azimut_solar_fiable: false })).azimutFiable.sol).toBe(false);
  });

  it("si nada es acotable la banda es 0 y sigue siendo proyección", () => {
    const f = fiabilidadDe(punto({ sol_az_deg: 180, sol_el_deg: 90, tierra_az_deg: 170, tierra_el_deg: 95 }));
    expect(f).toEqual({ esProyeccion: true, bandaDeg: 0, azimutFiable: { sol: false, tierra: false } });
  });
});

describe("bandaAcotada", () => {
  it("devuelve null con valores ausentes, negativos o no finitos", () => {
    for (const v of [undefined, null, NaN, Infinity, -1, "3"]) expect(bandaAcotada(v)).toBeNull();
  });
  it("acepta el límite exacto", () => {
    expect(bandaAcotada(PROYECCION.BANDA_MAX_DEG / PROYECCION.FACTOR_BANDA)).toBe(PROYECCION.BANDA_MAX_DEG);
  });
});
