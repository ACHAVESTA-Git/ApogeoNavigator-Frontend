import { describe, expect, it } from "vitest";
import type { Analisis, PuntoSerie, ValidacionAnalisis } from "./analisis";
import { esMinimo, momentosClave, puntosCursor, ritmoDominante, umbralesAciertos, varianteRacha, veredictoConfianza } from "./informe";

const validacion = (v: Partial<ValidacionAnalisis>): ValidacionAnalisis => ({ disponible: true, vigente: true, motivo: null, ...v });
const aciertos = (n: number, meses = 12) => ({ meses, aciertos_energia: n, aciertos_comunicacion: n, aciertos_global: n });
const p = (utc: string, observado: number | null, ajustado: number | null, proyectado: number | null): PuntoSerie => ({ utc, observado, ajustado, proyectado });
const FIN = "2026-12-03T00:00Z";

describe("veredictoConfianza", () => {
  it("umbrales en meses enteros: de 12, ámbar desde 9 y verde desde 11", () => {
    expect(umbralesAciertos(12)).toEqual({ reservas: 9, viable: 11 });
  });
  it("con validación propia el nivel sale de los aciertos del semáforo", () => {
    const v = (n: number) => veredictoConfianza({ validacion: validacion({ semaforo_aciertos: aciertos(n), rmse_deg: { sol_el_deg: 1.54 } }) });
    expect(v(12)).toEqual({ estado: "propia", nivel: "verde", aciertos: 12, meses: 12, rmseSol: 1.54 });
    expect(v(11).nivel).toBe("verde");
    expect(v(9).nivel).toBe("amarillo");
    expect(v(8).nivel).toBe("rojo");
  });
  it("una validación de referencia (otros datos) nunca da verde, pero sí conserva un rojo", () => {
    expect(veredictoConfianza({ validacion: validacion({ vigente: false, semaforo_aciertos: aciertos(12) }) })).toMatchObject({ estado: "referencia", nivel: "amarillo" });
    expect(veredictoConfianza({ validacion: validacion({ vigente: false, semaforo_aciertos: aciertos(3) }) }).nivel).toBe("rojo");
  });
  it("sin validación o sin aciertos no afirma nada: ámbar y sin cifras", () => {
    expect(veredictoConfianza({ validacion: validacion({ disponible: false, semaforo_aciertos: aciertos(12) }) })).toEqual({ estado: "ausente", nivel: "amarillo", aciertos: null, meses: null, rmseSol: null });
    expect(veredictoConfianza({ validacion: validacion({ semaforo_aciertos: null }) })).toMatchObject({ nivel: "amarillo", aciertos: null });
  });
});

describe("puntosCursor (regla 4)", () => {
  it("descarta lo proyectado dentro de los datos y lo observado o ajustado después", () => {
    const puntos = puntosCursor({ fin_datos_utc: FIN, puntos: [p("2026-12-02T00:00Z", 1, 1.1, 9), p("2026-12-04T00:00Z", 7, 7, 2), p("2026-12-05T00:00Z", null, null, null)] });
    expect(puntos).toHaveLength(2);
    expect(puntos[0]).toMatchObject({ observado: 1, ajustado: 1.1, proyectado: null });
    expect(puntos[1]).toMatchObject({ observado: null, ajustado: null, proyectado: 2 });
  });
});

describe("momentosClave", () => {
  const puntos = puntosCursor({
    fin_datos_utc: FIN,
    puntos: [
      p("2026-12-01T00:00Z", 5, 5.1, null), p("2026-12-01T12:00Z", -2, -1.5, null), p("2026-12-02T00:00Z", 3, 3, null), p("2026-12-03T00:00Z", 4, 4.2, null),
      p("2026-12-04T00:00Z", null, null, 1), p("2026-12-05T00:00Z", null, null, -1), p("2026-12-06T00:00Z", null, null, 2),
    ],
  });
  it("mayor desvío dentro de los datos, último cruce observado y primer cruce proyectado", () => {
    const m = momentosClave(puntos, "sol_el_deg");
    expect(m.map((x) => x.tipo)).toEqual(["desvio", "cruceObservado", "cruceProyectado"]);
    expect(m[0]).toMatchObject({ indice: 1 });
    expect(m[0].valor).toBeCloseTo(0.5);
    expect(m[1]).toMatchObject({ indice: 2, sube: true });
    expect(m[2]).toMatchObject({ indice: 5, sube: false });
  });
  it("0° exacto cuenta como bajo el horizonte (mismo criterio que la API)", () => {
    const m = momentosClave(puntosCursor({ fin_datos_utc: FIN, puntos: [p("2026-12-01T00:00Z", 1, 1, null), p("2026-12-02T00:00Z", 0, 0, null)] }), "tierra_el_deg");
    expect(m[1]).toMatchObject({ tipo: "cruceObservado", indice: 1, sube: false });
  });
  it("en un azimut no hay horizonte que cruzar: solo el desvío", () => {
    expect(momentosClave(puntos, "sol_az_deg").map((x) => x.tipo)).toEqual(["desvio"]);
  });
  it("sin puntos no devuelve nada", () => {
    expect(momentosClave([], "sol_el_deg")).toEqual([]);
  });
});

describe("ritmoDominante", () => {
  const espectro = (series: Analisis["espectro"]["series"]): Analisis["espectro"] => ({ ventana_dias: 182, resolucion_dias: 4.8, sinodico_teorico_dias: 29.53, sinodico_afinado_dias: 29.52, nota: "", series });
  const pico = (periodo_dias: number, amplitud_rel: number, es_sinodico = false) => ({ periodo_dias, amplitud_rel, candidatos: [], es_sinodico });
  it("elige el pico de mayor peso de la elevación del Sol", () => {
    expect(ritmoDominante(espectro([{ variable: "sol_el_deg", nombre: "", picos: [pico(9.8, 0.1), pico(29.57, 1, true)] }]))).toEqual({ variable: "sol_el_deg", periodo_dias: 29.57, es_sinodico: true });
  });
  it("si esa serie no llega, no hay ritmo que contar", () => {
    expect(ritmoDominante(espectro([{ variable: "tierra_az_deg", nombre: "", picos: [pico(27.3, 1)] }]))).toBeNull();
    expect(ritmoDominante(espectro([{ variable: "sol_el_deg", nombre: "", picos: [] }]))).toBeNull();
  });
});

describe("varianteRacha (indicadores para astronautas)", () => {
  const r = (horas: number, trunca_inicio = false, trunca_fin = false) => ({ horas, inicio_utc: null, fin_utc: null, trunca_inicio, trunca_fin });
  it("sin dato no es cero", () => {
    expect(varianteRacha(undefined, 744)).toBe("sinDato");
    expect(varianteRacha(null, 744)).toBe("sinDato");
    expect(varianteRacha(r(0), 744)).toBe("cero");
  });
  it("todo el periodo manda sobre «cortada»; el final cortado manda sobre el inicio", () => {
    expect(varianteRacha(r(744, true, true), 744)).toBe("todo");
    expect(varianteRacha(r(329, true, true), 744)).toBe("sigue");
    expect(varianteRacha(r(335, true, false), 744)).toBe("veniaDeAntes");
    expect(varianteRacha(r(291), 744)).toBe("normal");
  });
  it("una racha que toca un borde es un mínimo (≥)", () => {
    expect(esMinimo(r(335, true))).toBe(true);
    expect(esMinimo(r(329, false, true))).toBe(true);
    expect(esMinimo(r(291))).toBe(false);
  });
});
