import { describe, expect, it } from "vitest";
import { avisosDe, calcularMetricas, esSemaforo, esSensibleAlRelieve, eventosCruce, instantePorDefecto, mediasNoches, nivel,
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
  it("energía: verde ≥ 45 %, amarillo de 25 % a < 45 %, rojo < 25 %", () => {
    expect(semaforo(47.85, 100)).toEqual({ energia: "verde", comunicacion: "verde", global: "verde" }); // Apolo 11, dic 2026
    expect(semaforo(45, 100).energia).toBe("verde");
    expect(semaforo(44.49, 100).energia).toBe("amarillo"); // IM-1 Odysseus, mar 2027
    expect(semaforo(25, 100).energia).toBe("amarillo");
    expect(semaforo(24.99, 100).energia).toBe("rojo");
    expect(semaforo(0, 40.99)).toEqual({ energia: "rojo", comunicacion: "amarillo", global: "rojo" }); // Shackleton, mar 2027
  });
  it("comunicación: mantiene 70 % y 40 %", () => {
    expect(semaforo(100, 70).comunicacion).toBe("verde");
    expect(semaforo(100, 69.99).comunicacion).toBe("amarillo");
    expect(semaforo(100, 39.11).comunicacion).toBe("rojo"); // Shackleton, dic 2026
  });
  it("valida la forma que llega de la API", () => {
    expect(esSemaforo({ energia: "verde", comunicacion: "rojo", global: "rojo" })).toBe(true);
    expect(esSemaforo({ energia: "azul", comunicacion: "rojo", global: "rojo" })).toBe(false);
    expect(esSemaforo(null)).toBe(false);
  });
  it("respaldo: avisa de un Sol que nunca supera 3° (misma regla que el backend)", () => {
    expect(avisosDe({ sol_el_max_deg: 1.7385 })).toEqual([{ codigo: "sensible_al_relieve", mensaje: expect.stringContaining("3°") }]);
    expect(avisosDe({ sol_el_max_deg: -0.4291 })).toHaveLength(1); // el backend también avisa con el Sol bajo el horizonte
    expect(avisosDe({ sol_el_max_deg: 11.07 })).toEqual([]);
  });
  it("lee el aviso de relieve que manda la API", () => {
    expect(esSensibleAlRelieve({ avisos: [{ codigo: "sensible_al_relieve", mensaje: "x" }] })).toBe(true);
    expect(esSensibleAlRelieve({ avisos: [] })).toBe(false);
    expect(esSensibleAlRelieve({})).toBe(false);
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
