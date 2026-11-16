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
  it("solo Apolo 11, 15 y 17 llevan parche (archivos de public/insignias); el resto, monograma", () => {
    expect([...RANKING.INSIGNIAS].sort()).toEqual(["apollo11", "apollo15", "apollo17"]);
    const { container, unmount } = render(<Insignia siteId="apollo15" nombre="Apolo 15 - Hadley-Apeninos" />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/insignias/apollo15.jpg");
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("Insignia de la misión Apolo 15");
    expect(screen.getByText("Insignia: NASA")).toBeTruthy();
    unmount();
    for (const [id, nombre] of [["shackleton", "Cráter Shackleton (centro)"], ["im1_odysseus", "IM-1 Odysseus - Malapert A"], ["slim", "SLIM - Cráter Shioli"]]) {
      const r = render(<Insignia siteId={id} nombre={nombre} />);
      expect(r.container.querySelector("img")).toBeNull();
      expect(r.container.querySelector("[data-monograma]")).not.toBeNull();
      r.unmount();
    }
  });
  it("cada parche declarado en RANKING.INSIGNIAS tiene su archivo en public/insignias (no se inventan archivos)", () => {
    expect(RANKING.INSIGNIAS.filter((id) => !existsSync(`public${RANKING.RUTA_INSIGNIA(id)}`))).toEqual([]);
  });
});
