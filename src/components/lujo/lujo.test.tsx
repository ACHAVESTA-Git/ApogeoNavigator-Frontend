import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OrigenDatos } from "../../lib/analisis";
import { CifraHeroe, Medidor, PanelVidrio, Sello, Veredicto, estadoSello } from "./index";

const HUELLA = "9f2c41d07ab3e5c8119d4f6072ab35cc0e8d17f4a6b2c3d4e5f60718293a4b5c";
const manifiesto = (firmado: boolean | null, extra: Partial<NonNullable<OrigenDatos["manifiesto"]>> = {}) =>
  ({ sha3_256: HUELLA, generado_utc: "2026-11-01T00:00Z", firmado, coincide: true, ...extra });
const origen = (o: Partial<OrigenDatos> = {}): OrigenDatos =>
  ({ tipo: "semilla_nasa", descripcion: "", sha3_256: HUELLA, coincide_con_semilla: true, ultima_carga: null, manifiesto: manifiesto(true), ...o });

describe("Medidor", () => {
  it("es un role=meter con valor, escala y lectura con nivel", () => {
    render(<Medidor valor={97} umbrales={{ reservas: 80, viable: 95 }} rotulo="Ajuste del Sol" unidad="%" animar={false} />);
    const m = screen.getByRole("meter", { name: "Ajuste del Sol" });
    expect(m).toHaveAttribute("aria-valuenow", "97");
    expect(m).toHaveAttribute("aria-valuemin", "0");
    expect(m).toHaveAttribute("aria-valuemax", "100");
    expect(m).toHaveAttribute("aria-valuetext", "97 % · Viable");
    expect(m).toHaveAccessibleDescription("Con reservas desde 80 %; viable desde 95 %.");
    // El nivel también va en palabra visible, no solo en el color del arco.
    expect(screen.getByText("Viable")).toBeVisible();
    expect(m.querySelectorAll("[data-marca-umbral]")).toHaveLength(2);
  });
  it("clasifica con reservas y crítico, y admite escalas donde menos es mejor", () => {
    const { rerender } = render(<Medidor valor={85} umbrales={{ reservas: 80, viable: 95 }} rotulo="A" animar={false} />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuetext", "85 · Con reservas");
    rerender(<Medidor valor={40} umbrales={{ reservas: 80, viable: 95 }} rotulo="A" animar={false} />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuetext", "40 · Crítico");
    rerender(<Medidor valor={0.4} min={0} max={5} umbrales={{ viable: 0.5, reservas: 2 }} rotulo="Error" unidad="°" animar={false} />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuetext", "0,4 ° · Viable");
    expect(screen.getByRole("meter")).toHaveAccessibleDescription("Viable hasta 0,5 °; con reservas hasta 2 °.");
  });
  it("el arco ocupa la fracción del valor y se anima solo si se pide", () => {
    const { container, rerender } = render(<Medidor valor={25} umbrales={{ reservas: 80, viable: 95 }} rotulo="A" />);
    const arco = () => container.querySelector<SVGPathElement>("path[pathLength]")!;
    expect(arco().style.strokeDasharray).toBe("0.25 1");
    expect(arco()).toHaveClass("medidor-arco");
    rerender(<Medidor valor={25} umbrales={{ reservas: 80, viable: 95 }} rotulo="A" animar={false} />);
    expect(arco()).not.toHaveClass("medidor-arco");
  });
  it("sin dato no inventa un valor: pista vacía y «Sin dato»", () => {
    const { container } = render(<Medidor valor={null} umbrales={{ reservas: 80, viable: 95 }} rotulo="A" />);
    const m = screen.getByRole("meter");
    expect(m).not.toHaveAttribute("aria-valuenow");
    expect(m).toHaveAttribute("aria-valuetext", "Sin dato");
    expect(container.querySelector("path[pathLength]")).toBeNull();
    expect(screen.getByText("Sin dato")).toBeVisible();
  });
});

describe("CifraHeroe", () => {
  it("muestra el valor, la unidad y el contexto", () => {
    render(<CifraHeroe valor={744} unidad="h" rotulo="Tierra visible" contexto="vs. Apolo 11" animar={false} />);
    expect(screen.getByText("Tierra visible")).toBeVisible();
    expect(screen.getByText("vs. Apolo 11")).toBeVisible();
    expect(screen.getByText("744 h")).toHaveClass("sr-only"); // lectura única para el lector de pantalla
    expect(screen.getByText("744", { selector: "span" })).toBeVisible();
  });
  it("con conteo, el lector de pantalla recibe el valor final desde el principio", async () => {
    render(<CifraHeroe valor={156} unidad="%" formato={(v) => `+${Math.round(v)}`} />);
    expect(screen.getByText("+156 %")).toHaveClass("sr-only");
    await waitFor(() => expect(screen.getByText("+156", { selector: "span[aria-hidden] > span" })).toBeInTheDocument(), { timeout: 2000 });
  });
});

describe("Veredicto", () => {
  it("dice el estado con icono y palabra, sin línea lateral", () => {
    const { container } = render(<Veredicto nivel="amarillo" como="h2">La proyección acierta 11 de 12 meses.</Veredicto>);
    expect(screen.getByRole("heading", { level: 2, name: "La proyección acierta 11 de 12 meses." })).toBeVisible();
    expect(screen.getByText("Con reservas")).toBeVisible();
    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(container.innerHTML).not.toMatch(/border-[lsre]\b/);
  });
  it("admite una etiqueta propia", () => {
    render(<Veredicto nivel="verde" etiqueta="Opción más sólida">Apolo 11.</Veredicto>);
    expect(screen.getByText("Opción más sólida")).toBeVisible();
  });
});

describe("PanelVidrio", () => {
  it("usa el material con borde completo y solo eleva si se pide", () => {
    const { rerender } = render(<PanelVidrio como="section" aria-label="Panel">hola</PanelVidrio>);
    const panel = screen.getByRole("region", { name: "Panel" });
    expect(panel).toHaveClass("vidrio");
    expect(panel).not.toHaveClass("vidrio-elevable");
    rerender(<PanelVidrio como="section" aria-label="Panel" elevable>hola</PanelVidrio>);
    expect(screen.getByRole("region", { name: "Panel" })).toHaveClass("vidrio-elevable");
  });
});

describe("Sello", () => {
  it("semilla con firma válida: nombra a NASA/JPL Horizons y queda verificado", () => {
    render(<Sello origen={origen()} />);
    const sello = screen.getByRole("region", { name: "Certificado de procedencia" });
    expect(within(sello).getByRole("heading", { name: "Datos de NASA/JPL Horizons" })).toBeVisible();
    expect(within(sello).getByText("Verificado")).toBeVisible();
    expect(within(sello).getByText("firmado (firma válida)")).toBeVisible();
    expect(within(sello).getByText("9f2c41d07ab3…")).toHaveAttribute("title", HUELLA);
  });
  it("nunca dice «NASA» si los datos son subidos, modificados o sin registro", () => {
    for (const tipo of ["subido", "modificado", "sin_registro"] as const) {
      const { container, unmount } = render(<Sello origen={origen({ tipo, coincide_con_semilla: false })} />);
      expect(container.textContent).not.toMatch(/NASA/);
      expect(screen.getByText("Sin verificar")).toBeVisible();
      unmount();
    }
  });
  it("distingue firma no válida, no verificable y sin manifiesto, con su nota", () => {
    const { rerender } = render(<Sello origen={origen({ manifiesto: manifiesto(false, { firma_nota: "La clave pública no coincide." }) })} />);
    expect(screen.getByText("Firma no válida")).toBeVisible();
    expect(screen.getByText("sin firma válida")).toBeVisible();
    expect(screen.getByText("La clave pública no coincide.")).toBeVisible();
    rerender(<Sello origen={origen({ manifiesto: manifiesto(null, { firma_nota: "Falta la biblioteca de verificación." }) })} />);
    expect(screen.getByText("Sin verificar")).toBeVisible();
    expect(screen.getByText("firma no verificable")).toBeVisible();
    expect(screen.getByText("Falta la biblioteca de verificación.")).toBeVisible();
    rerender(<Sello origen={origen({ manifiesto: null })} />);
    expect(screen.getByText("No hay manifiesto firmado para este archivo.")).toBeVisible();
    expect(screen.getByText("Sin verificar")).toBeVisible();
  });
  it("un manifiesto que no corresponde al archivo no certifica nada", () => {
    const o = origen({ manifiesto: manifiesto(true, { coincide: false }) });
    expect(estadoSello(o)).toBe("sinConfirmar");
    render(<Sello origen={o} />);
    expect(screen.getByText("El manifiesto firmado no corresponde a este archivo.")).toBeVisible();
  });
  it("copia la huella completa y lo anuncia", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Sello origen={origen()} />);
    fireEvent.click(screen.getByRole("button", { name: "Copiar la huella completa" }));
    expect(writeText).toHaveBeenCalledWith(HUELLA);
    expect(await screen.findByText("Huella copiada")).toBeVisible();
  });
});
