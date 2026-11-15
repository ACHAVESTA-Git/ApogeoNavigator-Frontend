import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { GlifoSemaforo } from "./glifos/GlifoSemaforo";
import { PanelLectura } from "./cielo/PanelLectura";
import { Transporte } from "./tiempo/Transporte";
import { EstadoError } from "./ui/Estados";
import { ErrorTable } from "./upload/ErrorTable";
import { ApiError } from "../lib/errores";
import { sumarHoras } from "../lib/fechas";
import type { FilaEfemeride } from "../lib/tipos";

const T0 = "2026-12-14T23:00Z";
const filas: FilaEfemeride[] = Array.from({ length: 48 }, (_, i) => ({
  utc: sumarHoras(T0, i), sol_az_deg: 340.82 - i * 0.5, sol_el_deg: 1.69, tierra_az_deg: 225.16, tierra_el_deg: i < 24 ? 0.02 : -0.5,
}));

describe("GlifoSemaforo", () => {
  it("dice el nivel con palabra, no solo con color", () => {
    render(<><GlifoSemaforo nivel="verde" /><GlifoSemaforo nivel="amarillo" /><GlifoSemaforo nivel="rojo" nota /></>);
    expect(screen.getByText("Viable")).toBeInTheDocument();
    expect(screen.getByText("Con reservas")).toBeInTheDocument();
    expect(screen.getByText("Crítico")).toBeInTheDocument();
  });
  it("mantiene el texto para lectores de pantalla aunque se oculte", () => {
    render(<GlifoSemaforo nivel="rojo" conTexto={false} />);
    expect(screen.getByText("Crítico")).toHaveClass("sr-only");
  });
});

describe("PanelLectura", () => {
  const eventos = {
    sol: { visible: true, proxima_puesta_utc: "2027-01-27T11:00Z", proxima_salida_utc: null, horas_restantes: 1044 },
    tierra: { visible: true, proxima_puesta_utc: "2026-12-27T02:00Z", proxima_salida_utc: null, horas_restantes: 291 },
  };
  it("muestra UTC, Lima, azimut y elevación con unidades", () => {
    render(<PanelLectura utc={T0} posicion={filas[0]} eventos={eventos} periodo={{ desde: "2026-12-01T00:00Z", hasta: "2027-01-01T00:00Z" }} />);
    expect(screen.getByText("2026-12-14 23:00")).toBeInTheDocument();
    expect(screen.getByText(/18:00 \(UTC−5\)/)).toBeInTheDocument();
    expect(screen.getByText("340,82°")).toBeInTheDocument();
    expect(screen.getByText("+1,69°")).toBeInTheDocument();
    expect(screen.getAllByText("Sobre el horizonte")).toHaveLength(2);
  });
  it("cuenta el tiempo hasta la puesta y no contradice el mes mostrado", () => {
    render(<PanelLectura utc={T0} posicion={filas[0]} eventos={eventos} periodo={{ desde: "2026-12-01T00:00Z", hasta: "2027-01-01T00:00Z" }} />);
    expect(screen.getByText("se pone en 291 h · 2026-12-27 02:00 UTC")).toBeInTheDocument();
    expect(screen.getByText("no se pone en diciembre de 2026 · próxima puesta: 2027-01-27 11:00 UTC")).toBeInTheDocument();
  });
  it("rotula «bajo el horizonte» un astro oculto", () => {
    render(<PanelLectura utc={filas[30].utc} posicion={filas[30]} eventos={null} />);
    expect(screen.getByText("Bajo el horizonte")).toBeInTheDocument();
  });
});

describe("Transporte", () => {
  const control = { indice: 0, reproduciendo: false, alternar: vi.fn(), irAIndice: vi.fn(), paso: vi.fn(), reiniciar: vi.fn(), velocidad: 6, setVelocidad: vi.fn() };
  it("la regla es un range nativo con el instante descrito en aria-valuetext", () => {
    render(<Transporte filas={filas} control={control} />);
    const regla = screen.getByRole("slider", { name: "Instante" });
    expect(regla).toHaveAttribute("max", "47");
    expect(regla.getAttribute("aria-valuetext")).toContain("14 de diciembre de 2026, 23:00 UTC");
    expect(regla.getAttribute("aria-valuetext")).toContain("Sol 1,7° sobre el horizonte");
  });
  it("ofrece alternativas con botones al arrastre y un grupo de velocidades", () => {
    render(<Transporte filas={filas} control={control} />);
    for (const nombre of ["Retroceder 1 día", "Retroceder 1 hora", "Reproducir", "Avanzar 1 hora", "Avanzar 1 día"]) {
      expect(screen.getByRole("button", { name: nombre })).toBeInTheDocument();
    }
    expect(screen.getByRole("radio", { name: "6 h/s" })).toBeChecked();
    screen.getByRole("button", { name: "Avanzar 1 día" }).click();
    expect(control.paso).toHaveBeenCalledWith(24);
  });
  it("la variante mínima deja solo reproducir y la regla", () => {
    render(<Transporte filas={filas} control={control} variante="minima" />);
    expect(screen.queryByRole("button", { name: "Avanzar 1 hora" })).toBeNull();
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });
});

describe("ErrorTable", () => {
  const errores = Array.from({ length: 8 }, (_, i) => ({ fila: 12 + i, columna: "sol_el_deg", codigo: "E_RANGO", mensaje: "Debe estar entre -90 y 90", valor: "123.4" }));
  it("muestra 5 errores y el enlace para ver todos", () => {
    render(<ErrorTable titulo="Errores" incidencias={errores} total={8} />);
    expect(screen.getAllByRole("row")).toHaveLength(6); // cabecera + 5
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ver los 8 errores" })).toHaveAttribute("aria-expanded", "false");
  });
});

describe("EstadoError", () => {
  const backend = { codigo: "SITIO_NO_ENCONTRADO", estado: 404, titulo: "Sitio no encontrado", mensaje: "No hay ningún sitio con el identificador «noexiste».", accion: "Elige un sitio del catálogo." };
  it("muestra el título y el mensaje del backend tal cual, aunque la pantalla proponga otro título", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<MemoryRouter><EstadoError error={new ApiError(404, "", backend)} titulo="Este sitio no tiene efemérides cargadas" /></MemoryRouter>);
    expect(screen.getByText("Sitio no encontrado")).toBeInTheDocument();
    expect(screen.getByText(/No hay ningún sitio con el identificador «noexiste»/)).toBeInTheDocument();
    expect(screen.queryByText("Este sitio no tiene efemérides cargadas")).not.toBeInTheDocument();
  });
  it("sin objeto `error` del backend, vale el título de la pantalla", () => {
    render(<MemoryRouter><EstadoError error={new ApiError(404, "")} titulo="Este sitio no tiene efemérides cargadas" /></MemoryRouter>);
    expect(screen.getByText("Este sitio no tiene efemérides cargadas")).toBeInTheDocument();
  });
});
