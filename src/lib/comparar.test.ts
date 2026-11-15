import { decidir, diferencias, type LineaComparada } from "./comparar";
import * as en from "./textos.en";
import * as es from "./textos.es";

const linea = (nombre: string, horas_sol: number, horas_tierra_visible: number, semaforo: LineaComparada["semaforo"], sensible = false): LineaComparada => ({
  nombre, horas_sol, pct_sol: (horas_sol / 744) * 100, horas_tierra_visible, pct_tierra: (horas_tierra_visible / 744) * 100, semaforo, sensible,
});
// Cifras reales de la API para diciembre de 2026.
const SHACKLETON = linea("Shackleton", 744, 291, { energia: "verde", comunicacion: "rojo", global: "rojo" }, true);
const APOLO11 = linea("Apolo 11", 356, 744, { energia: "verde", comunicacion: "verde", global: "verde" });
const AMARILLO = { energia: "amarillo", comunicacion: "amarillo", global: "amarillo" } as const;

describe("diferencias", () => {
  it("resta cada fila con la mejor de las demás: horas de sol y Tierra en % relativo", () => {
    const [s, a] = diferencias([SHACKLETON, APOLO11]);
    expect(s).toMatchObject({ nombre: "Shackleton", sol_h: 388, rivalSol: "Apolo 11", tierra_h: -453, rivalTierra: "Apolo 11" });
    expect(s.tierra_pct).toBeCloseTo(-60.89, 1); // (291 − 744) / 744
    expect(a.sol_h).toBe(-388);
    expect(a.tierra_pct).toBeCloseTo(155.67, 1);
  });
  it("con tres filas, cada eje se compara con su propio rival", () => {
    const medio = linea("Medio", 500, 400, AMARILLO);
    const [s] = diferencias([SHACKLETON, APOLO11, medio]);
    expect(s).toMatchObject({ sol_h: 244, rivalSol: "Medio", tierra_h: -453, rivalTierra: "Apolo 11" });
  });
  it("si el rival no ve la Tierra no hay porcentaje (no se divide entre cero)", () => {
    const [a] = diferencias([linea("A", 10, 5, AMARILLO), linea("B", 10, 0, AMARILLO)]);
    expect(a.tierra_pct).toBeNull();
    expect(a.tierra_h).toBe(5);
  });
  it("con una sola fila no hay nada que comparar", () => {
    expect(diferencias([SHACKLETON])).toEqual([]);
    expect(decidir([SHACKLETON])).toBeNull();
  });
});

describe("decidir", () => {
  it("recomienda la fila con mejor semáforo global de la API, aunque otra tenga más sol", () => {
    const d = decidir([SHACKLETON, APOLO11])!;
    expect(d.recomendadas).toEqual([1]);
    expect([d.liderSol, d.liderTierra]).toEqual([null, null]); // sin empate no hace falta líder
    expect(d.contrapartida).toBe(0); // lo que se deja de ganar: el sol de Shackleton
  });
  it("a igual nivel global desempata con los niveles de energía y comunicación", () => {
    const a = linea("A", 300, 300, { energia: "verde", comunicacion: "amarillo", global: "amarillo" });
    const b = linea("B", 400, 200, AMARILLO);
    expect(decidir([b, a])!.recomendadas).toEqual([1]);
  });
  it("si empatan del todo, recomienda a las dos y no hay contrapartida", () => {
    const d = decidir([linea("A", 300, 200, AMARILLO), linea("B", 200, 300, AMARILLO)])!;
    expect(d.recomendadas).toEqual([0, 1]);
    expect(d.contrapartida).toBeNull();
    expect([d.liderSol, d.liderTierra]).toEqual([0, 1]);
  });
  it("en un empate, los líderes salen de las filas empatadas, no de las descartadas", () => {
    const verde = { energia: "verde", comunicacion: "verde", global: "verde" } as const;
    const d = decidir([SHACKLETON, linea("Apolo 11", 356, 744, verde), linea("Apolo 17", 380, 744, verde)])!;
    expect(d.recomendadas).toEqual([1, 2]);
    expect(d.liderSol).toBe(2); // Shackleton tiene más sol, pero no está entre las recomendadas
    expect(d.liderTierra).toBeNull();
    expect(d.contrapartida).toBe(0);
    expect(es.partesDecision([SHACKLETON, linea("Apolo 11", 356, 744, verde), linea("Apolo 17", 380, 744, verde)], "enero").principal)
      .toBe("Apolo 11 y Apolo 17 empatan en el semáforo en enero: Apolo 17 tiene más sol.");
  });
  it("sin diferencia en las cifras no hay líder", () => {
    const d = decidir([linea("A", 300, 300, AMARILLO), linea("B", 300, 300, AMARILLO)])!;
    expect([d.liderSol, d.liderTierra]).toEqual([null, null]);
  });
});

describe("relato de la diferencia", () => {
  it("cuenta la diferencia con las cifras reales, en español y en inglés", () => {
    const [s, a] = diferencias([SHACKLETON, APOLO11]);
    expect(es.relatoDiferencia(s)).toBe("+388 h de sol, pero −61 % de Tierra");
    expect(es.relatoDiferencia(a)).toBe("−388 h de sol, pero +156 % de Tierra");
    expect(en.relatoDiferencia(s)).toMatch(/^\+388 h of sunlight, but −61 ?% of Earth$/);
  });
  it("une con «y» cuando gana o pierde en los dos ejes, y dice cuándo no hay diferencia", () => {
    const [a, b] = diferencias([linea("A", 500, 500, AMARILLO), linea("B", 400, 250, AMARILLO)]);
    expect(es.relatoDiferencia(a)).toBe("+100 h de sol y +100 % de Tierra");
    expect(es.relatoDiferencia(b)).toBe("−100 h de sol y −50 % de Tierra");
    const [igual] = diferencias([linea("A", 300, 300, AMARILLO), linea("B", 300, 300, AMARILLO)]);
    expect(es.relatoDiferencia(igual)).toBe("las mismas horas de sol y la misma Tierra");
    expect(en.relatoDiferencia(igual)).toBe("the same hours of sunlight and the same view of the Earth");
  });
  it("sin Tierra en el rival, la diferencia va en horas", () => {
    const [a] = diferencias([linea("A", 10, 5, AMARILLO), linea("B", 10, 0, AMARILLO)]);
    expect(es.relatoDiferencia(a)).toBe("las mismas horas de sol y +5 h de Tierra");
  });
});

describe("veredicto para decidir", () => {
  it("una frase principal con el porqué y dos matices: lo que cuesta y la cautela del relieve", () => {
    const v = es.partesDecision([SHACKLETON, APOLO11], "diciembre de 2026");
    expect(v.principal).toBe("Apolo 11 es la opción más sólida en diciembre de 2026: viable en energía y en comunicación.");
    expect(v.matices).toHaveLength(2);
    expect(v.matices[0]).toBe("Shackleton: +388 h de sol, pero −61 % de Tierra.");
    expect(v.matices[1]).toMatch(/horizonte ideal/);
  });
  it("nombra los dos niveles cuando no coinciden", () => {
    const a = linea("A", 300, 300, { energia: "verde", comunicacion: "amarillo", global: "amarillo" });
    expect(es.partesDecision([a, SHACKLETON], "enero").principal).toBe("A es la opción más sólida en enero: energía viable y comunicación con reservas.");
  });
  it("en un empate lo dice y deja decidir a las cifras", () => {
    const v = es.partesDecision([linea("A", 300, 200, AMARILLO), linea("B", 200, 300, AMARILLO)], "enero");
    expect(v.principal).toBe("A y B empatan en el semáforo en enero: A tiene más sol y B ve más la Tierra.");
    expect(v.matices).toHaveLength(0);
  });
  it("en inglés dice lo mismo", () => {
    const v = en.partesDecision([SHACKLETON, APOLO11], "December 2026");
    expect(v.principal).toBe("Apolo 11 is the most solid option in December 2026: viable for power and for communication.");
    expect(v.matices[0]).toMatch(/^Shackleton: \+388 h of sunlight, but −61 ?% of Earth\.$/);
  });
  it("los textos nuevos de la pantalla existen en los dos idiomas", () => {
    const nuevas = ["veredicto", "diferencias", "frenteAlMejor", "frenteADos", "recomendada", "mismoInstante", "mismoInstanteAyuda", "horizonteDe", "instante", "tiempo", "reproducir", "pausar", "bajo", "actualizando", "verCielo"] as const;
    for (const clave of nuevas) {
      expect(es.T.comparar[clave], `es: ${clave}`).toBeTruthy();
      expect(en.T.comparar[clave], `en: ${clave}`).toBeTruthy();
      expect(typeof en.T.comparar[clave]).toBe(typeof es.T.comparar[clave]);
    }
    expect(Object.keys(en.T.comparar).sort()).toEqual(Object.keys(es.T.comparar).sort());
  });
});
