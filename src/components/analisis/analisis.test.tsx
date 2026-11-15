import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Analisis, PuntoSerie } from "../../lib/analisis";
import { ActoVeredicto } from "./ActoVeredicto";
import { GraficoSerie } from "./GraficoSerie";

const p = (utc: string, observado: number | null, ajustado: number | null, proyectado: number | null): PuntoSerie => ({ utc, observado, ajustado, proyectado });
const analisis = (validacion: Partial<Analisis["validacion"]> = {}): Analisis => ({
  site_id: "apollo11",
  modelo: { r2: { sol_el_deg: 0.9991, tierra_el_deg: 0.95 }, residuos: {} },
  validacion: { disponible: true, vigente: true, motivo: null, rmse_deg: { sol_el_deg: 1.5392 },
    semaforo_aciertos: { meses: 12, aciertos_energia: 12, aciertos_comunicacion: 12, aciertos_global: 12 }, ...validacion },
  serie: { variable: "sol_el_deg", nombre: "Elevación del Sol", paso_horas: 24, fin_datos_utc: "2026-12-03T00:00Z", puntos: [
    p("2026-12-01T00:00Z", 5, 5.5, null), p("2026-12-02T00:00Z", -2, -2, null), p("2026-12-03T00:00Z", -4, -4.1, 99),
    p("2026-12-04T00:00Z", 77, 77, -1), p("2026-12-05T00:00Z", null, null, 3),
  ] },
} as unknown as Analisis);

describe("ActoVeredicto", () => {
  it("con validación propia da la frase con cifras de la API, el error típico y tres medidores", () => {
    render(<ActoVeredicto a={analisis()} />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("La proyección acierta el semáforo en 12 de 12 meses; error típico de 1,54° en la elevación del Sol.");
    expect(screen.getByText("Confianza alta")).toBeTruthy();
    expect(screen.getByText(/optimista; no es un intervalo/)).toBeTruthy();
    expect(screen.getAllByRole("meter")).toHaveLength(3);
    expect(screen.getAllByRole("tooltip")).toHaveLength(3);
  });
  it("el R² se rotula como ajuste (alto, medio o bajo), nunca «Viable»: es interno, no acierto fuera de los datos", () => {
    render(<ActoVeredicto a={analisis()} />);
    expect(screen.getByRole("meter", { name: "Ajuste R² · elevación del Sol" }).getAttribute("aria-valuetext")).toBe("0,999 · Ajuste alto");
    expect(screen.getByRole("meter", { name: "Ajuste R² · elevación de la Tierra" }).getAttribute("aria-valuetext")).toBe("0,950 · Ajuste medio");
    expect(screen.getByRole("meter", { name: "Aciertos del semáforo" }).getAttribute("aria-valuetext")).toBe("12 / 12 · Viable");
    expect(screen.getAllByText("Viable")).toHaveLength(1);
    expect(screen.getAllByRole("tooltip")[0].textContent).toMatch(/ajuste alto desde 0,990, medio desde 0,900 y bajo por debajo/);
  });
  it("una validación con otros datos se rotula «de referencia» y nunca «confianza alta»", () => {
    render(<ActoVeredicto a={analisis({ vigente: false })} />);
    expect(screen.getByText("De referencia")).toBeTruthy();
    expect(screen.queryByText("Confianza alta")).toBeNull();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toMatch(/^Con otros datos/);
  });
  it("sin validación no afirma nada: sin cifra héroe y el medidor de aciertos «Sin dato»", () => {
    render(<ActoVeredicto a={analisis({ disponible: false, motivo: "No hay validación." })} />);
    expect(screen.getByText("Sin validar")).toBeTruthy();
    expect(screen.queryByText(/RMSE de validación/)).toBeNull();
    expect(screen.getByRole("meter", { name: "Aciertos del semáforo" }).getAttribute("aria-valuetext")).toBe("Sin dato");
  });
});

describe("GraficoSerie · cursor", () => {
  it("arranca en la última muestra real y el teclado lo lleva a la proyección, con cada valor solo en su tramo (regla 4)", () => {
    render(<GraficoSerie analisis={analisis()} />);
    const cursor = screen.getByRole("slider");
    expect(cursor.getAttribute("aria-valuetext")).toMatch(/2026-12-03 00:00 UTC · Dentro de los datos · Observado −4,00° · Ajustado −4,10°/);
    expect(cursor.getAttribute("aria-valuetext")).not.toMatch(/99/); // lo «proyectado» dentro de los datos se descarta
    fireEvent.keyDown(cursor, { key: "ArrowRight" });
    expect(cursor.getAttribute("aria-valuetext")).toMatch(/2026-12-04 00:00 UTC · Proyección, fuera de los datos · Proyectado −1,00° · Banda \(RMSE\) ± 1,54°/);
    expect(cursor.getAttribute("aria-valuetext")).not.toMatch(/77/); // lo «observado» fuera de los datos, también
    fireEvent.keyDown(cursor, { key: "Home" });
    expect(cursor.getAttribute("aria-valuenow")).toBe("0");
  });
  it("los momentos clave salen de la serie y llevan el cursor a su muestra", () => {
    render(<GraficoSerie analisis={analisis()} />);
    const momentos = screen.getAllByRole("button", { pressed: false }).filter((b) => /desvío|cruce/.test(b.textContent ?? ""));
    expect(momentos.map((b) => b.textContent)).toEqual([
      "1Mayor desvío del modelo dentro de los datos: 0,50°, el 2026-12-01 00:00 UTC.",
      "2Último cruce del horizonte en los datos: el Sol se pone hacia el 2026-12-02 00:00 UTC.",
      "3Primer cruce del horizonte proyectado: el Sol sale hacia el 2026-12-05 00:00 UTC (estimación).",
    ]);
    fireEvent.click(momentos[0]);
    expect(screen.getByRole("slider").getAttribute("aria-valuenow")).toBe("0");
  });
});
