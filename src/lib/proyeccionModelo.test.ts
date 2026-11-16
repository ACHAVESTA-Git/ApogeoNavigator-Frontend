import { describe, expect, it } from "vitest";
import { bandaError, errorControl, esPasoHoras, mesesParciales, msDeFecha, nivelDelMes, resumenMeses, rmseEnHorizonte, type MesProyeccion } from "./proyeccionModelo";
import type { FilaEfemeride, NivelSemaforo } from "./tipos";

const mes = (m: string, energia: NivelSemaforo, comunicacion: NivelSemaforo): MesProyeccion => ({ mes: m, pct_sol: 50, pct_tierra: 50, semaforo: { energia, comunicacion } });
const fila = (utc: string): FilaEfemeride => ({ utc, sol_az_deg: 0, sol_el_deg: 1, tierra_az_deg: 0, tierra_el_deg: 2 });
const HORIZONTES = [
  { meses: 1, rmse_sol_el_deg: 0.2, rmse_tierra_el_deg: 0.4 },
  { meses: 3, rmse_sol_el_deg: 0.6, rmse_tierra_el_deg: null },
  { meses: 12, rmse_sol_el_deg: 1.5, rmse_tierra_el_deg: 2 },
];

describe("resumen de meses proyectados", () => {
  it("el nivel de un mes es el peor de energía y comunicación", () => {
    expect(nivelDelMes(mes("2027-06", "verde", "rojo"))).toBe("rojo");
    expect(nivelDelMes(mes("2027-06", "verde", "amarillo"))).toBe("amarillo");
  });
  it("cuenta viables, con reservas y críticos, y da el último mes", () => {
    const r = resumenMeses([mes("2027-06", "verde", "verde"), mes("2028-07", "verde", "amarillo"), mes("2027-07", "rojo", "verde")]);
    expect(r).toEqual({ total: 3, viables: 1, reservas: 1, criticos: 1, nivel: "amarillo", ultimoMes: "2028-07" });
  });
  it("viable solo si todos los meses lo son; crítico desde la mitad de meses críticos; sin meses no afirma", () => {
    expect(resumenMeses([mes("2027-06", "verde", "verde")]).nivel).toBe("verde");
    expect(resumenMeses([mes("2027-06", "rojo", "verde"), mes("2027-07", "verde", "verde")]).nivel).toBe("rojo");
    expect(resumenMeses([])).toMatchObject({ total: 0, nivel: "amarillo", ultimoMes: null });
  });
});

describe("error contra Horizons", () => {
  const control = [
    { site_id: "shackleton", utc: "2027-09-01T00:00Z", variable: "sol_el_deg", error_deg: -0.4 },
    { site_id: "shackleton", utc: "2027-09-01T00:00Z", variable: "tierra_el_deg", error_deg: 0.2 },
    { site_id: "shackleton", utc: "2027-09-01T00:00Z", variable: "sol_az_deg", error_deg: 90 }, // el azimut no cuenta
    { site_id: "apollo11", utc: "2027-09-01T00:00Z", variable: "sol_el_deg", error_deg: 1 },
    { site_id: "apollo11", utc: "2027-09-01T00:00Z", variable: "sol_el_deg", error_deg: null },
  ];
  it("media y máximo del error absoluto de elevación, con los puntos del sitio", () => {
    const e = errorControl({ control_horizons: control }, "shackleton");
    expect(e).toMatchObject({ puntos: 2, deEsteSitio: true, maxAbs: 0.4 });
    expect(e?.mediaAbs).toBeCloseTo(0.3);
  });
  it("si el sitio no tiene control usa el de todos y lo dice; sin control, null", () => {
    expect(errorControl({ control_horizons: control }, "im1_odysseus")).toMatchObject({ puntos: 3, deEsteSitio: false });
    expect(errorControl({ control_horizons: null }, "shackleton")).toBeNull();
    expect(errorControl(null, "shackleton")).toBeNull();
    expect(errorControl(undefined, "shackleton")).toBeNull();
  });
});

describe("banda de error según el horizonte", () => {
  it("interpola entre horizontes medidos y no extrapola fuera de ellos", () => {
    expect(rmseEnHorizonte(HORIZONTES, "sol", 0)).toBe(0.2);
    expect(rmseEnHorizonte(HORIZONTES, "sol", 2)).toBeCloseTo(0.4);
    expect(rmseEnHorizonte(HORIZONTES, "sol", 12)).toBe(1.5);
    expect(rmseEnHorizonte(HORIZONTES, "sol", 40)).toBe(1.5);
  });
  it("salta los horizontes sin dato de ese astro; sin tabla, null", () => {
    expect(rmseEnHorizonte(HORIZONTES, "tierra", 3)).toBeCloseTo(0.4 + (1.6 * 2) / 11);
    expect(rmseEnHorizonte(null, "sol", 3)).toBeNull();
    expect(rmseEnHorizonte([{ meses: 1, rmse_sol_el_deg: null }], "sol", 3)).toBeNull();
  });
  it("la banda crece con los meses desde el fin del entrenamiento", () => {
    const b = bandaError({ entrenado_hasta: "2027-06-01T00:00Z", error: { por_horizonte: HORIZONTES } }, "sol");
    expect(b?.tipo).toBe("horizonte");
    const en = (utc: string) => b!.en(msDeFecha(utc) as number);
    expect(en("2027-06-10T00:00Z")).toBe(0.2);
    expect(en("2028-06-01T00:00Z")).toBeGreaterThan(en("2027-10-01T00:00Z"));
    expect(en("2027-01-01T00:00Z")).toBe(0.2); // antes del fin del entrenamiento no baja de lo medido
  });
  it("sin tabla por horizonte usa el RMSE global (fija); sin ninguno, no hay banda", () => {
    const fija = bandaError({ entrenado_hasta: "2027-06-01T00:00Z", error: { por_horizonte: null, rmse_deg: { sol_el_deg: 0.7 } } }, "sol");
    expect(fija?.tipo).toBe("fija");
    expect(fija?.en(0)).toBe(0.7);
    expect(bandaError({ entrenado_hasta: "2027-06-01T00:00Z", error: null }, "sol")).toBeNull();
    expect(bandaError({ entrenado_hasta: "2027-06-01T00:00Z", error: { rmse_deg: { sol_el_deg: null } } }, "tierra")).toBeNull();
  });
});

describe("meses parciales y utilidades", () => {
  const meses = [{ mes: "2027-06" }, { mes: "2027-07" }, { mes: "2027-08" }];
  it("un mes al que le falta menos de un paso en el extremo está completo", () => {
    const serie = [fila("2027-06-01T01:00Z"), fila("2027-07-15T00:00Z"), fila("2027-08-31T23:00Z")];
    expect([...mesesParciales(serie, meses, 6)]).toEqual([]);
  });
  it("marca el primero y el último si la serie no los cubre; los intermedios nunca", () => {
    const serie = [fila("2027-06-12T00:00Z"), fila("2027-07-02T00:00Z"), fila("2027-08-09T00:00Z")];
    expect([...mesesParciales(serie, meses, 6)].sort()).toEqual(["2027-06", "2027-08"]);
    expect([...mesesParciales([], meses, 6)]).toEqual([]);
  });
  it("lee fechas de la API y valida el paso", () => {
    expect(msDeFecha("2027-06-01T00:00Z")).toBe(Date.UTC(2027, 5, 1));
    expect(msDeFecha("2027-06-01")).toBe(Date.UTC(2027, 5, 1));
    expect(msDeFecha("no es fecha")).toBeNull();
    expect(msDeFecha(null)).toBeNull();
    expect([1, 6, 24].every(esPasoHoras)).toBe(true);
    expect(esPasoHoras(12)).toBe(false);
  });
});
