import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { sumarHoras } from "../../lib/fechas";
import type { FilaEfemeride, Metrica } from "../../lib/tipos";
import { LineaVentanas } from "../ventanas/LineaVentanas";
import { IndicadoresAstronauta } from "./IndicadoresAstronauta";
import { MedidoresMision } from "./MedidoresMision";

const SITIO = { site_id: "shackleton", nombre: "Cráter Shackleton" };
const racha = (horas: number, inicio: string | null, fin: string | null, trunca_inicio = false, trunca_fin = false) =>
  ({ horas, inicio_utc: inicio, fin_utc: fin, trunca_inicio, trunca_fin });
/** Respuesta real de `GET /api/metricas?site_id=shackleton` (rango por defecto de la API), 15/11. */
const SHACKLETON: Metrica = {
  site_id: "shackleton", inicio_utc: "2026-12-01T00:00Z", fin_utc: "2027-01-05T00:00Z", horas_sol: 840, pct_sol: 100,
  sol_el_max_deg: 1.7385, sol_el_media_deg: 1.2448, horas_tierra_visible: 291, pct_tierra: 34.64,
  semaforo: { energia: "verde", comunicacion: "rojo", global: "rojo" }, avisos: [], origen: "calculado", referencia: null,
  indicadores_astronauta: {
    noche_mas_larga: racha(0, null, null),
    apagon_tierra_mas_largo: racha(335, "2026-12-01T00:00Z", "2026-12-14T23:00Z", true),
    ventana_sol_y_tierra: racha(291, "2026-12-14T23:00Z", "2026-12-27T02:00Z"),
    proxima_puesta_sol_utc: null, proxima_puesta_tierra_utc: "2026-12-27T02:00Z", sol_el_media_horas_sol_deg: 1.2448,
  },
};
const pintar = (metrica: Metrica) => render(<MemoryRouter><IndicadoresAstronauta metrica={metrica} sitio={SITIO} /></MemoryRouter>);

describe("IndicadoresAstronauta", () => {
  it("antepone «≥» a la racha cortada por el borde y usa la frase «al menos»", () => {
    const { container } = pintar(SHACKLETON);
    const apagon = container.querySelector('[data-variante="cortada"]')!;
    expect(apagon).toHaveTextContent("≥ 335 h");
    expect(apagon).toHaveTextContent("Al menos 335 h sin ver la Tierra; el apagón sigue fuera del periodo.");
    expect(apagon).toHaveTextContent("2026-12-01 00:00 → 2026-12-14 23:00 UTC");
  });
  it("con 0 h dice la variante de cero, sin «≥» ni rango", () => {
    const { container } = pintar(SHACKLETON);
    const noche = container.querySelector('[data-variante="cero"]')!;
    expect(noche).toHaveTextContent("0 h");
    expect(noche).toHaveTextContent("No hay noche en");
    expect(noche).not.toHaveTextContent("≥");
    expect(noche).not.toHaveTextContent("UTC"); // sin racha no hay rango de fechas
  });
  it("la ventana completa no lleva «≥» y enlaza al cielo en su primer instante", () => {
    const { container } = pintar(SHACKLETON);
    expect(container.querySelector('[data-variante="normal"]')).toHaveTextContent("291 h");
    const enlace = screen.getByRole("link", { name: /Ver el cielo al inicio de esta ventana/ });
    expect(enlace.getAttribute("href")).toContain("/sitios/shackleton/cielo?");
    expect(enlace.getAttribute("href")).toContain("t=2026-12-14T23%3A00Z");
  });
  it("puesta nula: «sin puesta antes del fin del periodo», nunca una fecha inventada; la otra, con su nota de paso horario", () => {
    pintar(SHACKLETON);
    expect(screen.getByText("Sin puesta del Sol antes del 2027-01-05 00:00 UTC, fin del periodo consultado.")).toBeInTheDocument();
    expect(screen.getByText(/La Tierra se pone el 2026-12-27 02:00 UTC, a 626 h del inicio del periodo/)).toBeInTheDocument();
    expect(screen.getByText("Paso horario, ±1 h.")).toBeInTheDocument();
  });
  it("da la elevación media con su contexto y sin etiqueta de «baja»", () => {
    pintar(SHACKLETON);
    expect(screen.getByText(/Durante las horas de sol, el Sol está a 1,2° de media sobre el horizonte ideal\./)).toBeInTheDocument();
    expect(screen.queryByText(/baja|solo/i)).toBeNull();
  });
  it("sin el bloque de la API deja el hueco: lo dice y no enseña ninguna cifra", () => {
    const { container } = pintar({ ...SHACKLETON, indicadores_astronauta: undefined });
    expect(screen.getByText(/no traen los indicadores para astronautas/)).toBeInTheDocument();
    expect(container.querySelector("[data-dato]")).toBeNull();
  });
  it("un campo suelto que falta queda «Sin dato» y los demás siguen", () => {
    const { container } = pintar({ ...SHACKLETON, indicadores_astronauta: { ...SHACKLETON.indicadores_astronauta, noche_mas_larga: undefined, proxima_puesta_sol_utc: undefined } });
    expect(screen.getByText("Sin dato")).toBeInTheDocument();
    expect(container.querySelector('[data-variante="cero"]')).toBeNull();
    expect(screen.queryByText(/Sin puesta del Sol/)).toBeNull();
  });
});

describe("MedidoresMision", () => {
  it("lee energía y comunicación de la métrica y trunca la cifra para no contradecir el nivel", () => {
    render(<MedidoresMision metrica={{ pct_sol: 44.6, pct_tierra: 100 }} />);
    expect(screen.getByRole("meter", { name: "Energía" })).toHaveAttribute("aria-valuetext", "44 % · Con reservas");
    expect(screen.getByRole("meter", { name: "Comunicación" })).toHaveAttribute("aria-valuetext", "100 % · Viable");
  });
  it("sin métrica dibuja las pistas vacías: «Sin dato», nunca un valor", () => {
    render(<MedidoresMision metrica={undefined} />);
    for (const m of screen.getAllByRole("meter")) expect(m).not.toHaveAttribute("aria-valuenow");
  });
});

describe("LineaVentanas", () => {
  const T0 = "2026-12-01T00:00Z";
  const filas: FilaEfemeride[] = [1, 2, -1, 3, 4, 5].map((sol, i) => ({ utc: sumarHoras(T0, i), sol_az_deg: 90, sol_el_deg: sol, tierra_az_deg: 180, tierra_el_deg: i >= 3 && i < 5 ? 2 : -2 }));
  it("cada ventana es un enlace al cielo en su primer instante (Enter lo sigue, como cualquier enlace)", () => {
    render(<MemoryRouter><LineaVentanas filas={filas} desde={T0} hasta={sumarHoras(T0, 6)} siteId="apollo11" /></MemoryRouter>);
    const conjunta = screen.getByRole("link", { name: /Sol y Tierra a la vez: desde 2026-12-01 03:00 UTC, 2 h\./ });
    expect(conjunta.getAttribute("href")).toBe("/sitios/apollo11/cielo?desde=2026-12-01T00%3A00Z&hasta=2026-12-01T06%3A00Z&t=2026-12-01T03%3A00Z");
    // La ventana de Sol que empieza con la serie está cortada: «al menos».
    expect(screen.getByRole("link", { name: /Sol sobre el horizonte: desde 2026-12-01 00:00 UTC, al menos 2 h/ })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(4); // 1 conjunta + 2 de Sol + 1 de Tierra
  });
  it("sin ventanas lo dice en la fila", () => {
    render(<MemoryRouter><LineaVentanas filas={filas.map((f) => ({ ...f, tierra_el_deg: -1 }))} desde={T0} hasta={sumarHoras(T0, 6)} siteId="apollo11" /></MemoryRouter>);
    expect(screen.getAllByText("Ninguna ventana en este periodo")).toHaveLength(2);
  });
});
