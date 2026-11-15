import { act, render, screen } from "@testing-library/react";
import { motionValue } from "motion/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { FUNCIONES } from "../../lib/constants";
import { aMs, sumarHoras } from "../../lib/fechas";
import { fijarInstanteGlobal } from "../../lib/relojGlobal";
import type { FilaEfemeride } from "../../lib/tipos";
import { CifrasAhora } from "./CifrasAhora";
import { EnlacePlanear } from "./EnlacePlanear";
import { IndicadoresAstronauta } from "./IndicadoresAstronauta";
import { MiniHorizonte } from "./MiniHorizonte";

const T0 = "2026-12-01T00:00Z";
//                              h: 0    1    2     3    4
const filas: FilaEfemeride[] = [0.4, 1.7, 12.3, -2.5, -8].map((sol, i) => ({ utc: sumarHoras(T0, i), sol_az_deg: 90, sol_el_deg: sol, tierra_az_deg: 180, tierra_el_deg: 61.06 }));

describe("CifrasAhora (Sol ahora, Tierra ahora, próximo evento)", () => {
  it("lee la fila de la hora del reloj y da la próxima puesta con su nota de paso horario", () => {
    act(() => fijarInstanteGlobal(sumarHoras(T0, 1)));
    const { container } = render(<CifrasAhora filas={filas} indicadores={{ proxima_puesta_sol_utc: sumarHoras(T0, 3), proxima_puesta_tierra_utc: null }} />);
    expect(container).toHaveTextContent("Sol ahora+1,7°sobre el horizonte");
    expect(container).toHaveTextContent("Tierra ahora+61°sobre el horizonte");
    expect(container).toHaveTextContent("Próximo evento2 hPuesta del Sol · 2026-12-01 03:00 UTC · paso horario, ±1 h");
    expect(container).toHaveTextContent("Instante de la simulación: 2026-12-01 01:00 UTC");
  });
  it("sigue al reloj: bajo el horizonte lo dice y, sin puestas por delante, no inventa una", () => {
    act(() => fijarInstanteGlobal(sumarHoras(T0, 1)));
    const { container } = render(<CifrasAhora filas={filas} indicadores={{ proxima_puesta_sol_utc: sumarHoras(T0, 3) }} />);
    act(() => fijarInstanteGlobal(sumarHoras(T0, 4)));
    expect(container).toHaveTextContent("Sol ahora−8,0°bajo el horizonte");
    expect(container).toHaveTextContent("Sin puestas por delante en los datos de este periodo");
    expect(container).not.toHaveTextContent("Puesta del Sol");
  });
  it("fuera del periodo o sin serie deja el hueco, y el aviso de relieve va siempre a la vista", () => {
    act(() => fijarInstanteGlobal("2027-03-01T00:00Z"));
    const { container, rerender } = render(<CifrasAhora filas={filas} sensible />);
    expect(container).toHaveTextContent("El instante de la simulación queda fuera de este periodo");
    expect(container.querySelector("[data-aviso-relieve]")).toHaveTextContent("* sensible al relieve");
    expect(container.querySelectorAll("[data-dato]")).toHaveLength(3);
    expect(container).not.toHaveTextContent("°");
    rerender(<CifrasAhora filas={undefined} />);
    expect(screen.getAllByText("Sin dato")).toHaveLength(3);
  });
});

describe("EnlacePlanear («Planear alunizaje»)", () => {
  it("no se dibuja mientras la pantalla de la ventana de alunizaje no exista (sin ruta rota)", () => {
    expect(FUNCIONES.VENTANA_ALUNIZAJE).toBe(false);
    render(<MemoryRouter><EnlacePlanear siteId="shackleton" /></MemoryRouter>);
    expect(screen.queryByRole("link")).toBeNull();
  });
  it("activo, enlaza a /sitios/:id/ventana", () => {
    render(<MemoryRouter><EnlacePlanear siteId="shackleton" activo /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Planear alunizaje" })).toHaveAttribute("href", "/sitios/shackleton/ventana");
  });
});

describe("MiniHorizonte", () => {
  it("sin serie dibuja solo el horizonte, con el mismo alto reservado", () => {
    const { container } = render(<MiniHorizonte filas={undefined} t={motionValue(aMs(T0))} />);
    const caja = screen.getByRole("img", { name: /Sol y Tierra sobre el horizonte ideal/ });
    expect(caja).toHaveAttribute("data-mini-horizonte", "sin-serie");
    expect(caja).toHaveStyle({ height: "56px" });
    expect(container.querySelectorAll(".rounded-full")).toHaveLength(0);
  });
  it("con serie dibuja los dos astros", () => {
    const { container } = render(<MiniHorizonte filas={filas} t={motionValue(aMs(T0))} />);
    expect(container.querySelector("[data-mini-horizonte]")).toHaveAttribute("data-mini-horizonte", "vivo");
    expect(container.querySelectorAll(".rounded-full")).toHaveLength(2);
  });
});

describe("lenguaje operativo de los indicadores", () => {
  it("primer nivel en segunda persona, con «≥» si la racha está cortada", () => {
    const racha = (horas: number, trunca_inicio = false) => ({ horas, inicio_utc: horas ? T0 : null, fin_utc: horas ? sumarHoras(T0, horas) : null, trunca_inicio, trunca_fin: false });
    render(
      <MemoryRouter>
        <IndicadoresAstronauta sitio={{ site_id: "shackleton", nombre: "Shackleton" }} metrica={{
          site_id: "shackleton", inicio_utc: T0, fin_utc: sumarHoras(T0, 744), horas_sol: 744, pct_sol: 100, sol_el_max_deg: 1.7, sol_el_media_deg: 1.2,
          horas_tierra_visible: 291, pct_tierra: 39.11, semaforo: { energia: "verde", comunicacion: "rojo", global: "rojo" }, avisos: [], origen: "calculado", referencia: null,
          indicadores_astronauta: { noche_mas_larga: racha(0), apagon_tierra_mas_largo: racha(335, true), ventana_sol_y_tierra: racha(291) },
        }} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Tendrás Sol y Tierra a la vez 291 h seguidas")).toBeInTheDocument();
    expect(screen.getByText("Sin enlace con la Tierra durante ≥ 335 h")).toBeInTheDocument();
    expect(screen.getByText("Sin noche en este periodo")).toBeInTheDocument();
  });
});
