import { describe, expect, it } from "vitest";
import { MINI_HORIZONTE, MS_POR_HORA } from "./constants";
import { aMs, sumarHoras } from "./fechas";
import type { FilaEfemeride } from "./tipos";
import { avanzarReloj, posicionMiniHorizonte, proximoEvento } from "./vivo";

const T0 = "2026-12-01T00:00Z";
const serie = (sol: number[], tierra: number[]): FilaEfemeride[] =>
  sol.map((el, i) => ({ utc: sumarHoras(T0, i), sol_az_deg: 90, sol_el_deg: el, tierra_az_deg: 180, tierra_el_deg: tierra[i] }));

describe("posición en el mini horizonte", () => {
  it("el azimut recorre el ancho (0° a la izquierda, 180° en el centro) y se envuelve", () => {
    expect(posicionMiniHorizonte(0, 10).x).toBe(0);
    expect(posicionMiniHorizonte(180, 10).x).toBe(0.5);
    expect(posicionMiniHorizonte(-90, 10).x).toBe(0.75);
  });
  it("a 0° el astro está en la línea del horizonte y no cuenta como visible (misma regla que el backend)", () => {
    expect(posicionMiniHorizonte(90, 0)).toMatchObject({ y: MINI_HORIZONTE.HORIZONTE, visible: false });
  });
  it("sobre el horizonte sube (cenit = borde superior) y bajo él se hunde sin salirse de la caja", () => {
    expect(posicionMiniHorizonte(90, 90).y).toBeCloseTo(0);
    const rasante = posicionMiniHorizonte(90, 1.5);
    expect(rasante.visible).toBe(true);
    expect(rasante.y).toBeLessThan(MINI_HORIZONTE.HORIZONTE);
    const abajo = posicionMiniHorizonte(90, -40);
    expect(abajo.visible).toBe(false);
    expect(abajo.y).toBeGreaterThan(MINI_HORIZONTE.HORIZONTE);
    expect(posicionMiniHorizonte(90, -90).y).toBe(1);
  });
});

describe("reloj del catálogo", () => {
  const [a, b] = [aMs(T0), aMs(sumarHoras(T0, 744))];
  it("a 6 h/s, un segundo real son seis horas simuladas", () => {
    expect(avanzarReloj(a, 1000, 6, a, b)).toBe(a + 6 * MS_POR_HORA);
  });
  it("al llegar al final del periodo vuelve al principio (y un periodo vacío no avanza)", () => {
    expect(avanzarReloj(b - MS_POR_HORA, 1000, 6, a, b)).toBe(a);
    expect(avanzarReloj(a, 1000, 6, a, a)).toBe(a);
  });
});

describe("próximo evento desde un instante", () => {
  //                    h: 0  1  2   3   4  5  6   7
  const filas = serie([1, 1, 1, -1, -1, 1, 1, -1], [1, 1, 1, 1, 1, -1, -1, -1]);
  it("usa la puesta de la API mientras siga por delante y elige la que llega antes", () => {
    const e = proximoEvento(T0, filas, { proxima_puesta_sol_utc: sumarHoras(T0, 3), proxima_puesta_tierra_utc: sumarHoras(T0, 5) });
    expect(e).toEqual({ astro: "sol", utc: sumarHoras(T0, 3), horas: 3 });
  });
  it("si la puesta de la API ya pasó, toma el siguiente cruce de la serie", () => {
    const e = proximoEvento(sumarHoras(T0, 4), filas, { proxima_puesta_sol_utc: sumarHoras(T0, 3), proxima_puesta_tierra_utc: sumarHoras(T0, 5) });
    expect(e).toEqual({ astro: "tierra", utc: sumarHoras(T0, 5), horas: 1 });
    expect(proximoEvento(sumarHoras(T0, 5), filas, { proxima_puesta_sol_utc: sumarHoras(T0, 3) })).toEqual({ astro: "sol", utc: sumarHoras(T0, 7), horas: 2 });
  });
  it("sin el bloque de la API calcula con la serie; sin puestas por delante devuelve null (nunca inventa)", () => {
    expect(proximoEvento(T0, filas)).toMatchObject({ astro: "sol", horas: 3 });
    expect(proximoEvento(sumarHoras(T0, 7), filas)).toBeNull();
    expect(proximoEvento(T0, [], null)).toBeNull();
    expect(proximoEvento("ayer" as never, filas)).toBeNull();
  });
});
