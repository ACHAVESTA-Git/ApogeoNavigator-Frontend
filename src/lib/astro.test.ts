import { describe, expect, it } from "vitest";
import { calcularMetricas, esSemaforo, esSensibleAlRelieve, eventosCruce, instantePorDefecto, mediasNoches, nivel,
  proximosEventos, resumenDiario, semaforo, tramosVisibles } from "./astro";
import { SEMAFORO } from "./constants";
import { aMs, sumarHoras } from "./fechas";
import type { FilaEfemeride } from "./tipos";

const T0 = "2026-12-01T00:00Z";
/** Serie sintética de 1 h: el Sol y la Tierra siguen las elevaciones dadas. */
const serie = (sol: number[], tierra: number[] = sol.map(() => -1)): FilaEfemeride[] =>
  sol.map((el, i) => ({ utc: sumarHoras(T0, i), sol_az_deg: 100, sol_el_deg: el, tierra_az_deg: 200, tierra_el_deg: tierra[i] }));

describe("métricas (misma regla que el backend)", () => {
  const filas = serie([1, 2, 0, -1, 3, 3], [1, 1, 1, -1, -1, -1]);
  it("usa el intervalo semiabierto [desde, hasta) y cuenta solo elevación > 0", () => {
    const m = calcularMetricas(filas, T0, sumarHoras(T0, 5))!;
    expect(m.horas_sol).toBe(3); // 1, 2 y 3; el 0 exacto no cuenta y la última fila queda fuera
    expect(m.pct_sol).toBe(60);
    expect(m.sol_el_max_deg).toBe(3);
    expect(m.sol_el_media_deg).toBe(2);
    expect(m.horas_tierra_visible).toBe(3);
  });
  it("deja la media en null sin horas de sol y devuelve null sin filas", () => {
    expect(calcularMetricas(serie([-1, -2, -3]), T0, sumarHoras(T0, 3))!.sol_el_media_deg).toBeNull();
    expect(calcularMetricas(filas, sumarHoras(T0, 50), sumarHoras(T0, 60))).toBeNull();
  });
  it("redondea el porcentaje a 2 decimales", () => {
    expect(calcularMetricas(serie([1, -1, -1]), T0, sumarHoras(T0, 3))!.pct_sol).toBe(33.33);
  });
});

describe("semáforo", () => {
  it("aplica los umbrales de cada eje y el global es el peor", () => {
    const e = SEMAFORO.ENERGIA;
    expect(nivel(e.VERDE_MIN, e)).toBe("verde");
    expect(nivel(e.VERDE_MIN - 0.01, e)).toBe("amarillo");
    expect(nivel(e.AMARILLO_MIN, e)).toBe("amarillo");
    expect(nivel(e.AMARILLO_MIN - 0.01, e)).toBe("rojo");
    expect(semaforo(100, 39.11)).toEqual({ energia: "verde", comunicacion: "rojo", global: "rojo" });
  });
  it("valida la forma que llega de la API", () => {
    expect(esSemaforo({ energia: "verde", comunicacion: "rojo", global: "rojo" })).toBe(true);
    expect(esSemaforo({ energia: "azul", comunicacion: "rojo", global: "rojo" })).toBe(false);
    expect(esSemaforo(null)).toBe(false);
  });
  it("marca como sensible al relieve un Sol que nunca supera 3°", () => {
    expect(esSensibleAlRelieve({ sol_el_max_deg: 1.7385, horas_sol: 744 })).toBe(true);
    expect(esSensibleAlRelieve({ sol_el_max_deg: 11.07, horas_sol: 417 })).toBe(false);
    expect(esSensibleAlRelieve({ sol_el_max_deg: -0.4, horas_sol: 0 })).toBe(false);
  });
});

describe("cruces del horizonte", () => {
  const filas = serie([1, 1, 0, -1, -1, 2, 2], [-1, -1, -1, -1, -1, -1, -1]);
  it("fecha la puesta en la primera fila ≤ 0 y la salida en la primera > 0", () => {
    expect(eventosCruce(filas, "sol")).toEqual([
      { utc: sumarHoras(T0, 2), tipo: "puesta", astro: "sol" },
      { utc: sumarHoras(T0, 5), tipo: "salida", astro: "sol" },
    ]);
    expect(eventosCruce(filas, "tierra")).toEqual([]);
  });
  it("da los próximos eventos con la forma de /api/puestas", () => {
    const e = proximosEventos(filas, T0)!;
    expect(e.sol).toEqual({ visible: true, proxima_puesta_utc: sumarHoras(T0, 2), proxima_salida_utc: sumarHoras(T0, 5), horas_restantes: 2 });
    expect(e.tierra).toEqual({ visible: false, proxima_puesta_utc: null, proxima_salida_utc: null, horas_restantes: null });
    expect(proximosEventos(filas, sumarHoras(T0, 3))!.sol.horas_restantes).toBe(2);
    expect(proximosEventos(filas, sumarHoras(T0, 99))).toBeNull();
  });
  it("agrupa las horas visibles en tramos continuos", () => {
    const tramos = tramosVisibles(filas, "sol", T0, sumarHoras(T0, 7));
    expect(tramos).toHaveLength(2);
    expect(tramos[0]).toMatchObject({ inicioMs: aMs(T0), horas: 2, elevacionMedia: 1 });
    expect(tramos[1]).toMatchObject({ inicioMs: aMs(sumarHoras(T0, 5)), horas: 2, elevacionMedia: 2 });
  });
});

describe("derivados", () => {
  it("elige el primer instante con ambos astros visibles o el de Sol más alto", () => {
    expect(instantePorDefecto(serie([1, 2, 3], [-1, 1, 1]))).toBe(sumarHoras(T0, 1));
    expect(instantePorDefecto(serie([1, 5, 3]))).toBe(sumarHoras(T0, 1));
    expect(instantePorDefecto([])).toBeNull();
  });
  it("resume por día UTC", () => {
    const filas = serie(Array.from({ length: 48 }, (_, i) => (i < 30 ? 1 : -1)));
    const dias = resumenDiario(filas, T0, sumarHoras(T0, 48));
    expect(dias.map((d) => d.horasSol)).toEqual([24, 6]);
    expect(dias[0].fecha).toBe("2026-12-01");
  });
  it("lista las medianoches del rango", () => {
    expect(mediasNoches(aMs(T0), aMs(sumarHoras(T0, 48)))).toHaveLength(3);
  });
});
