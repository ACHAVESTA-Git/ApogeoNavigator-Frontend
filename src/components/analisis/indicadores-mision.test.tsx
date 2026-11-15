import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IndicadoresMision } from "./IndicadoresMision";

const respuesta = vi.hoisted(() => ({ data: undefined as unknown, isPending: false }));
vi.mock("../../hooks/useMetricas", () => ({ useMetricas: () => respuesta }));

const DESDE = "2026-12-01T00:00Z";
const HASTA = "2027-01-01T00:00Z";
/** Métrica mínima del sitio: solo las horas a la vista y las próximas puestas (`null` = la API no da ninguna). */
const con = (horas_sol: number, horas_tierra_visible: number) => {
  respuesta.data = {
    resultados: [{
      site_id: "s", inicio_utc: DESDE, fin_utc: HASTA, horas_sol, horas_tierra_visible,
      indicadores_astronauta: { proxima_puesta_sol_utc: null, proxima_puesta_tierra_utc: null },
    }],
  };
  return render(<IndicadoresMision siteId="s" sitio="Sitio" desde={DESDE} hasta={HASTA} />).container;
};

describe("IndicadoresMision · próximas puestas sin fecha", () => {
  beforeEach(() => { respuesta.data = undefined; });

  it("con 0 h a la vista dice que el astro no sale, nunca «no hay puesta»", () => {
    const sinSol = con(0, 744);
    expect(sinSol).toHaveTextContent("El Sol no sale en este periodo.");
    expect(sinSol).not.toHaveTextContent("No hay puesta del Sol");
    expect(sinSol).toHaveTextContent("No hay puesta de la Tierra dentro de diciembre de 2026.");

    const sinTierra = con(372, 0);
    expect(sinTierra).toHaveTextContent("La Tierra no está a la vista en este periodo.");
    expect(sinTierra).not.toHaveTextContent("No hay puesta de la Tierra");
    expect(sinTierra).toHaveTextContent("No hay puesta del Sol dentro de diciembre de 2026.");
  });

  it("con horas a la vista y sin puesta dentro del periodo, lo dice tal cual", () => {
    const c = con(744, 291);
    expect(c).toHaveTextContent("No hay puesta del Sol dentro de diciembre de 2026.");
    expect(c).toHaveTextContent("No hay puesta de la Tierra dentro de diciembre de 2026.");
    expect(c).not.toHaveTextContent("no sale");
    expect(c).not.toHaveTextContent("no está a la vista");
  });
});
