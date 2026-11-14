import { describe, expect, it } from "vitest";
import { avisoRelieve, describirCielo, describirInstante, faltanPara, periodoLegible, proximoCambio, umbralNivel, veredicto } from "./textos";

const fila = { sol_az_deg: 151.4, sol_el_deg: 1.17, tierra_az_deg: 237.48, tierra_el_deg: -45.4 };

describe("textos generados", () => {
  it("describe el cielo para lectores de pantalla", () => {
    const texto = describirCielo("2026-12-14T23:00Z", fila);
    expect(texto).toContain("14 de diciembre de 2026, 23:00 UTC");
    expect(texto).toContain("1,2° sobre el horizonte");
    expect(texto).toContain("45,4° bajo el horizonte");
    expect(describirInstante("2026-12-14T23:00Z", fila)).toContain("Sol 1,2° sobre el horizonte");
  });
  it("explica el próximo cambio de un astro", () => {
    const visible = { visible: true, proxima_puesta_utc: "2026-12-27T02:00Z", proxima_salida_utc: null, horas_restantes: 291 };
    expect(proximoCambio(visible)).toBe("se pone en 291 h · 2026-12-27 02:00 UTC");
    expect(faltanPara("tierra", visible)).toBe("Faltan 291 h para la puesta de la Tierra");
    const fijo = { visible: true, proxima_puesta_utc: null, proxima_salida_utc: null, horas_restantes: null };
    expect(proximoCambio(fijo)).toBe("no se pone en el periodo con datos");
    expect(faltanPara("sol", { ...visible, visible: false, horas_restantes: 9 })).toBe("Faltan 9 h para la salida del Sol");
  });
  it("genera el veredicto solo con las métricas", () => {
    const texto = veredicto(
      [
        { nombre: "Apolo 11", horas_sol: 356, pct_sol: 47.85, horas_tierra_visible: 744, pct_tierra: 100 },
        { nombre: "IM-1 Odysseus", horas_sol: 417, pct_sol: 56.05, horas_tierra_visible: 744, pct_tierra: 100 },
        { nombre: "Chang'e 4", horas_sol: 370, pct_sol: 49.73, horas_tierra_visible: 0, pct_tierra: 0 },
      ],
      "diciembre de 2026",
    );
    expect(texto).toContain("IM-1 Odysseus tiene 61 h más de sol que Apolo 11 en diciembre de 2026");
    expect(texto).toContain("Apolo 11 y IM-1 Odysseus ven la Tierra todo el periodo");
    expect(texto).toContain("Chang'e 4 no la ve nunca");
    expect(veredicto([], "x")).toBe("");
  });
  it("nombra el periodo y los umbrales", () => {
    expect(periodoLegible("2026-12-01T00:00Z", "2027-01-01T00:00Z")).toBe("diciembre de 2026");
    expect(periodoLegible("2026-12-01T00:00Z", "2026-12-08T00:00Z")).toBe("2026-12-01 → 2026-12-08");
    expect(umbralNivel("rojo", { VERDE_MIN: 70, AMARILLO_MIN: 40 })).toBe("< 40 %");
    expect(umbralNivel("amarillo", { VERDE_MIN: 70, AMARILLO_MIN: 40 })).toBe("40–70 %");
  });
  it("avisa de los datos sensibles al relieve", () => {
    expect(avisoRelieve({ sol_el_max_deg: 1.7385, pct_sol: 100 })).toContain("nunca supera 1,7°");
  });
});
