import { describe, expect, it } from "vitest";
import { actoDe, instanteDelRelato } from "./relato";

const CORTES = [0.25, 0.75];
const HITOS = [0, 100, 300, 1000];

describe("relato de la portada", () => {
  it("el acto cambia justo en cada corte", () => {
    expect([0, 0.24, 0.25, 0.74, 0.75, 1].map((p) => actoDe(p, CORTES))).toEqual([0, 0, 1, 1, 2, 2]);
  });
  it("cada acto recorre su tramo entre hitos a ritmo constante y sin saltos en los cortes", () => {
    expect(instanteDelRelato(0, HITOS, CORTES)).toBe(0);
    expect(instanteDelRelato(0.125, HITOS, CORTES)).toBe(50);
    expect(instanteDelRelato(0.25, HITOS, CORTES)).toBe(100);
    expect(instanteDelRelato(0.5, HITOS, CORTES)).toBe(200);
    expect(instanteDelRelato(0.75, HITOS, CORTES)).toBe(300);
    expect(instanteDelRelato(1, HITOS, CORTES)).toBe(1000);
  });
  it("fuera de 0…1 se queda en los extremos", () => {
    expect(instanteDelRelato(-1, HITOS, CORTES)).toBe(0);
    expect(instanteDelRelato(2, HITOS, CORTES)).toBe(1000);
  });
});
