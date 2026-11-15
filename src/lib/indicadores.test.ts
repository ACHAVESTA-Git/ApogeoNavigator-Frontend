import { describe, expect, it } from "vitest";
import { aMs, sumarHoras } from "./fechas";
import { esRachaCortada, horasHasta, motivoSinPuesta, varianteRacha, ventanaMasLarga, ventanasConjuntas, ventanasDe } from "./indicadores";
import type { FilaEfemeride, Racha } from "./tipos";

const T0 = "2026-12-01T00:00Z";
const serie = (sol: number[], tierra: number[]): FilaEfemeride[] =>
  sol.map((el, i) => ({ utc: sumarHoras(T0, i), sol_az_deg: 100, sol_el_deg: el, tierra_az_deg: 200, tierra_el_deg: tierra[i] }));
const racha = (horas: number, extra: Partial<Racha> = {}): Racha =>
  ({ horas, inicio_utc: horas ? T0 : null, fin_utc: horas ? sumarHoras(T0, horas) : null, trunca_inicio: false, trunca_fin: false, ...extra });

describe("variante de frase de una racha (indicadores-astronauta §6)", () => {
  it("sin dato no es cero: un campo ausente o mal formado no da cifra", () => {
    expect(varianteRacha(undefined, 840)).toBe("sinDato");
    expect(varianteRacha(null, 840)).toBe("sinDato");
    expect(varianteRacha({ horas: "12" }, 840)).toBe("sinDato");
    expect(varianteRacha({ horas: Number.NaN }, 840)).toBe("sinDato");
  });
  it("distingue 0 h, racha completa, racha cortada por un borde y periodo entero", () => {
    expect(varianteRacha(racha(0), 840)).toBe("cero");
    expect(varianteRacha(racha(291), 840)).toBe("normal");
    expect(varianteRacha(racha(335, { trunca_inicio: true }), 840)).toBe("cortada");
    expect(varianteRacha(racha(120, { trunca_fin: true }), 840)).toBe("cortada");
    expect(varianteRacha(racha(840, { trunca_inicio: true, trunca_fin: true }), 840)).toBe("todo");
  });
  it("una racha de 0 h nunca está cortada", () => {
    expect(esRachaCortada(racha(0, { trunca_inicio: true }))).toBe(false);
    expect(esRachaCortada(racha(5, { trunca_fin: true }))).toBe(true);
  });
});

describe("horas hasta una puesta", () => {
  it("cuenta horas enteras desde el inicio del periodo", () => {
    expect(horasHasta(T0, "2026-12-29T13:00Z")).toBe(685);
  });
  it("devuelve null sin puesta, con una fecha no válida o si no es posterior", () => {
    expect(horasHasta(T0, null)).toBeNull();
    expect(horasHasta(T0, undefined)).toBeNull();
    expect(horasHasta(T0, "mañana")).toBeNull();
    expect(horasHasta(T0, T0)).toBeNull();
  });
});

describe("puesta nula", () => {
  it("con 0 h visibles el astro no sale: no se dice «sin puesta antes de…»", () => {
    expect(motivoSinPuesta(0)).toBe("noSale");
    expect(motivoSinPuesta(291)).toBe("sinPuesta");
  });
});

describe("ventanas Sol+Tierra de la serie", () => {
  //             h: 0  1  2   3  4  5   6  7
  const filas = serie([1, 2, 3, -1, 4, 5, -1, 6], [-1, 1, 1, 1, 1, -1, 1, 1]);
  const hasta = sumarHoras(T0, 8);
  it("solo cuenta las horas con los dos astros sobre el horizonte y agrupa las contiguas", () => {
    const v = ventanasConjuntas(filas, T0, hasta);
    expect(v.map((x) => [(x.inicioMs - aMs(T0)) / 3_600_000, x.horas])).toEqual([[1, 2], [4, 1], [7, 1]]);
    expect(v.map((x) => x.cortada)).toEqual([false, false, true]); // la última toca el final de la serie
  });
  it("marca como cortada la ventana que empieza con la serie", () => {
    expect(ventanasDe(filas, "sol", T0, hasta)[0]).toMatchObject({ horas: 3, cortada: true });
  });
  it("el 0° exacto no es visible (misma regla que el backend) y sin coincidencia no hay ventanas", () => {
    expect(ventanasConjuntas(serie([0, 1], [1, 0]), T0, sumarHoras(T0, 2))).toEqual([]);
  });
  it("elige la ventana más larga y devuelve null sin ventanas", () => {
    expect(ventanaMasLarga(ventanasConjuntas(filas, T0, hasta))?.horas).toBe(2);
    expect(ventanaMasLarga([])).toBeNull();
  });
});
