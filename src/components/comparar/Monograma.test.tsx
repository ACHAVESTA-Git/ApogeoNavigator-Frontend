import { fireEvent, render, screen } from "@testing-library/react";
import { existsSync } from "node:fs";
import { RANKING } from "../../lib/constants";
import { Insignia } from "./Monograma";

describe("insignia de un sitio", () => {
  it("sin parche disponible muestra el monograma neutro (iniciales en código), sin imagen ni crédito", () => {
    const { container } = render(<Insignia siteId="change4" nombre="Chang'e 4 - Cráter Von Kármán" />);
    expect(container.querySelector("[data-monograma]")?.textContent).toBe("C4");
    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByText("Insignia: NASA")).toBeNull();
  });
  it("con parche disponible lo muestra sin modificar (sin recorte ni filtros) y con el crédito visible", () => {
    render(<Insignia siteId="apollo11" nombre="Apolo 11 - Mar de la Tranquilidad" parche />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("/insignias/apollo11.jpg");
    expect(img.className).toContain("object-contain");
    expect(img.className).not.toMatch(/filter|grayscale|invert|object-cover|rounded-full|opacity/);
    expect(screen.getByText("Insignia: NASA")).toBeTruthy();
  });
  it("si el archivo no carga (se borró), cae al monograma: quitar el archivo lo revierte", () => {
    const { container } = render(<Insignia siteId="apollo11" nombre="Apolo 11 - Mar de la Tranquilidad" parche />);
    fireEvent.error(screen.getByRole("img"));
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[data-monograma]")?.textContent).toBe("A11");
    expect(screen.queryByText("Insignia: NASA")).toBeNull();
  });
  it("cada parche declarado en RANKING.INSIGNIAS tiene su archivo en public/insignias (no se inventan archivos)", () => {
    expect(RANKING.INSIGNIAS.filter((id) => !existsSync(`public${RANKING.RUTA_INSIGNIA(id)}`))).toEqual([]);
  });
});
