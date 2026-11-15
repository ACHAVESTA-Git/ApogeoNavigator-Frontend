import { describe, expect, it } from "vitest";
import { describirCielo, describirInstante, faltanPara, periodoLegible, proximoCambio, umbralNivel, veredicto, veredictoFechas } from "./textos";

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
    // La puesta existe, pero cae fuera del mes que se está mirando: no se contradice el relato del mes.
    const diciembre = { desde: "2026-12-01T00:00Z", hasta: "2027-01-01T00:00Z" };
    const enEnero = { visible: true, proxima_puesta_utc: "2027-01-27T11:00Z", proxima_salida_utc: null, horas_restantes: 1044 };
    expect(proximoCambio(enEnero, diciembre)).toBe("no se pone en diciembre de 2026 · próxima puesta: 2027-01-27 11:00 UTC");
    expect(proximoCambio(visible, diciembre)).toBe("se pone en 291 h · 2026-12-27 02:00 UTC");
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
    expect(texto).toContain("Chang'e 4 no la ve en el periodo");
    expect(veredicto([], "x")).toBe("");
    const conAviso = veredicto(
      [
        { nombre: "Cráter Shackleton", horas_sol: 744, pct_sol: 100, horas_tierra_visible: 291, pct_tierra: 39.11, sensible: true },
        { nombre: "Apolo 11", horas_sol: 356, pct_sol: 47.85, horas_tierra_visible: 744, pct_tierra: 100 },
      ],
      "diciembre de 2026",
    );
    expect(conAviso).toContain("Cráter Shackleton tiene 388 h más de sol que Apolo 11");
    expect(conAviso).toContain("Ojo: las horas de sol de Cráter Shackleton son del horizonte ideal y dependen del relieve.");
  });
  it("compara fechas de un mismo sitio", () => {
    const texto = veredictoFechas(
      [
        { nombre: "diciembre de 2026", horas_sol: 744, pct_sol: 100, horas_tierra_visible: 291, pct_tierra: 39.11 },
        { nombre: "abril de 2027", horas_sol: 0, pct_sol: 0, horas_tierra_visible: 328, pct_tierra: 45.56 },
      ],
      "Cráter Shackleton",
    );
    expect(texto).toBe("En Cráter Shackleton, diciembre de 2026 tiene 744 h más de sol que abril de 2027. La Tierra se ve 291 h en diciembre de 2026 y 328 h en abril de 2027.");
  });
  it("nombra el periodo y los umbrales", () => {
    expect(periodoLegible("2026-12-01T00:00Z", "2027-01-01T00:00Z")).toBe("diciembre de 2026");
    expect(periodoLegible("2026-12-01T00:00Z", "2026-12-08T00:00Z")).toBe("2026-12-01 → 2026-12-08");
    expect(umbralNivel("rojo", { VERDE_MIN: 70, AMARILLO_MIN: 40 })).toBe("< 40 %");
    expect(umbralNivel("amarillo", { VERDE_MIN: 70, AMARILLO_MIN: 40 })).toBe("40–70 %");
  });
});

// Validación de coherencia (docs/entrega/validacion-coherencia.md §6): frases que afirmaban algo falso o sin
// respaldo. Si alguna vuelve a aparecer en cualquier texto de la interfaz, esta prueba falla.
describe("frases prohibidas por la validación de coherencia", () => {
  const PROHIBIDAS = [
    /moon trek/i, /nada se inventa/i, /se estima a ojo/i, /son del equipo/i, /equipo apogeo/i, /respecto a su órbita/i,
    /casi 4 veces/i, /no la ven? nunca/i, /un polo"/i, /unos kilómetros/i, /hay que pasarlo con baterías/i, /depende por completo de baterías/i,
    /cubrir con baterías/i, /en el polo sur, el sol no se pone en todo el mes/i,
  ];
  /** Todos los textos: las cadenas tal cual y las funciones evaluadas con argumentos de relleno. */
  function recoger(valor: unknown, salida: string[] = []): string[] {
    if (typeof valor === "string") salida.push(valor);
    else if (typeof valor === "function") {
      try {
        recoger((valor as (...a: unknown[]) => unknown)("x", "y", "z", false, false), salida);
        recoger((valor as (...a: unknown[]) => unknown)("x", "y", "z", true, true), salida);
      } catch { /* funciones con argumentos estructurados: se cubren en sus propias pruebas */ }
    } else if (valor && typeof valor === "object") Object.values(valor).forEach((v) => recoger(v, salida));
    return salida;
  }
  it("ningún texto de la interfaz las contiene", async () => {
    const modulo = await import("./textos");
    const textos = recoger(modulo.T).concat(recoger(modulo.NOMBRE_CATEGORIA)).join("\n");
    expect(textos.length).toBeGreaterThan(5000);
    for (const frase of PROHIBIDAS) expect(textos).not.toMatch(frase);
    expect(modulo.veredicto([
      { nombre: "A", horas_sol: 10, pct_sol: 1, horas_tierra_visible: 0, pct_tierra: 0, sensible: false },
      { nombre: "B", horas_sol: 5, pct_sol: 1, horas_tierra_visible: 5, pct_tierra: 1, sensible: false },
    ] as never, "diciembre de 2026")).not.toMatch(/nunca/);
  });
  it("el equipo no lleva nombres ni roles sin confirmar y Shackleton no figura como misión Artemis", async () => {
    const { T, NOMBRE_CATEGORIA } = await import("./textos");
    expect(T.inicio.equipo.roles).toHaveLength(0);
    expect(NOMBRE_CATEGORIA.artemis).not.toMatch(/^artemis$/i);
  });
});

describe("veredicto en partes", () => {
  it("da una frase principal y, como mucho, dos matices", async () => {
    const { partesVeredicto, partesVeredictoFechas } = await import("./textos");
    const v = partesVeredicto(
      [
        { nombre: "Cráter Shackleton", horas_sol: 744, pct_sol: 100, horas_tierra_visible: 291, pct_tierra: 39.11, sensible: true },
        { nombre: "Apolo 11", horas_sol: 356, pct_sol: 47.85, horas_tierra_visible: 744, pct_tierra: 100 },
      ],
      "diciembre de 2026",
    );
    expect(v.principal).toBe("Cráter Shackleton tiene 388 h más de sol que Apolo 11 en diciembre de 2026.");
    expect(v.matices).toHaveLength(2);
    expect(v.matices[1]).toMatch(/^Ojo: /);
    expect(partesVeredicto([], "x")).toEqual({ principal: "", matices: [] });
    const f = partesVeredictoFechas(
      [
        { nombre: "diciembre de 2026", horas_sol: 744, pct_sol: 100, horas_tierra_visible: 291, pct_tierra: 39.11 },
        { nombre: "abril de 2027", horas_sol: 0, pct_sol: 0, horas_tierra_visible: 328, pct_tierra: 45.56 },
      ],
      "Cráter Shackleton",
    );
    expect(f.matices).toHaveLength(1);
  });
});
