// «Prueba de oro»: el cálculo en el cliente reproduce metricas.csv con los CSV reales de la muestra.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { calcularMetricas, eventosCruce, proximosEventos } from "./astro";
import { expandirEfemerides, resolverRango, type EfemeridesColumnar } from "./muestra";
import type { FilaReferencia, Site } from "./tipos";

const leer = <T,>(ruta: string): T => JSON.parse(readFileSync(path.join(process.cwd(), "public/muestra", ruta), "utf8")) as T;
const filasDe = (id: string) => expandirEfemerides(leer<EfemeridesColumnar>(`efemerides/${id}.json`));
const referencia = leer<FilaReferencia[]>("metricas-referencia.json");
const DIC = ["2026-12-01T00:00Z", "2027-01-01T00:00Z"] as const;

describe("prueba de oro: metricas.csv", () => {
  it("hay referencia para todos los sitios del catálogo", () => {
    const ids = leer<Site[]>("sites.json").map((s) => s.site_id).sort();
    expect([...new Set(referencia.map((r) => r.site_id))].sort()).toEqual(ids);
    expect(ids).toHaveLength(10);
  });
  it("ningún texto visible del catálogo de muestra nombra a Artemis (rótulo sin fuente: NASA no ha fijado sitio)", () => {
    const visibles = leer<Site[]>("sites.json").flatMap((s) => [s.nombre, s.mision, s.agencia, s.notas ?? ""]);
    expect(visibles.filter((v) => /artemis/i.test(v))).toEqual([]);
  });
  it.each(referencia.map((r) => [`${r.site_id} ${r.inicio_utc.slice(0, 7)}`, r] as const))("%s", (_, ref) => {
    const m = calcularMetricas(filasDe(ref.site_id), ref.inicio_utc, ref.fin_utc)!;
    expect(m.horas_sol).toBe(ref.horas_sol);
    expect(m.pct_sol).toBe(ref.pct_sol);
    expect(m.horas_tierra_visible).toBe(ref.horas_tierra_visible);
    expect(m.pct_tierra).toBe(ref.pct_tierra);
    expect(m.sol_el_max_deg).toBeCloseTo(ref.sol_el_max_deg, 3);
    if (ref.sol_el_media_deg === null) expect(m.sol_el_media_deg).toBeNull();
    else expect(m.sol_el_media_deg).toBeCloseTo(ref.sol_el_media_deg, 3);
  });
  it("cifras del relato: Shackleton, Apolo 11 y Chang'e 4 en diciembre de 2026", () => {
    expect(calcularMetricas(filasDe("shackleton"), ...DIC)).toMatchObject({ horas_sol: 744, pct_sol: 100, horas_tierra_visible: 291, pct_tierra: 39.11 });
    expect(calcularMetricas(filasDe("apollo11"), ...DIC)).toMatchObject({ horas_sol: 356, pct_sol: 47.85 });
    expect(calcularMetricas(filasDe("change4"), ...DIC)).toMatchObject({ horas_tierra_visible: 0, pct_tierra: 0 });
  });
});

describe("eventos reales de Shackleton", () => {
  const filas = filasDe("shackleton");
  const diciembre = filas.filter((f) => f.utc < DIC[1]);
  it("la Tierra sale el 14/12 a las 23:00 y se pone el 27/12 a las 02:00 (UTC)", () => {
    expect(eventosCruce(diciembre, "tierra")).toEqual([
      { utc: "2026-12-14T23:00Z", tipo: "salida", astro: "tierra" },
      { utc: "2026-12-27T02:00Z", tipo: "puesta", astro: "tierra" },
    ]);
  });
  it("el Sol no se pone en diciembre y se mantiene entre 0,73° y 1,74°", () => {
    expect(eventosCruce(diciembre, "sol")).toEqual([]);
    const elevaciones = diciembre.map((f) => f.sol_el_deg);
    expect(Math.min(...elevaciones)).toBeGreaterThan(0.7);
    expect(Math.max(...elevaciones)).toBeLessThan(1.75);
  });
  it("a la salida de la Tierra faltan 291 h para su puesta", () => {
    const e = proximosEventos(diciembre, "2026-12-14T23:00Z")!;
    expect(e.tierra).toMatchObject({ visible: true, proxima_puesta_utc: "2026-12-27T02:00Z", horas_restantes: 291 });
    expect(e.sol).toMatchObject({ visible: true, horas_restantes: null });
  });
});

describe("rango de consulta (misma regla que el backend)", () => {
  const [primera, ultima] = ["2026-12-01T00:00Z", "2027-06-01T00:00Z"];
  it("por defecto da 35 días desde la primera fila", () => {
    expect(resolverRango(primera, ultima)).toEqual({ desde: primera, hasta: "2027-01-05T00:00Z" });
  });
  it("rechaza rangos fuera de los datos, invertidos o de más de 35 días", () => {
    expect(() => resolverRango(primera, ultima, { desde: "2026-11-01T00:00Z" })).toThrow(/fuera del rango/);
    expect(() => resolverRango(primera, ultima, { hasta: "2027-07-01T00:00Z" })).toThrow(/fuera del rango/);
    expect(() => resolverRango(primera, ultima, { desde: DIC[1], hasta: DIC[0] })).toThrow(/posterior/);
    expect(() => resolverRango(primera, ultima, { desde: primera, hasta: "2027-02-01T00:00Z" })).toThrow(/35 días/);
  });
});
