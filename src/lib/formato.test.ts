import { describe, expect, it } from "vitest";
import { coordenadas, grados, horas, latitud, numero, pct, tamanoArchivo } from "./formato";

describe("formato de cifras", () => {
  it("usa coma decimal y signo tipográfico", () => {
    expect(numero(39.11)).toBe("39,11");
    expect(numero(-45.4, 1)).toBe("−45,4");
  });
  it("da grados con y sin signo", () => {
    expect(grados(1.173151, 2, true)).toBe("+1,17°");
    expect(grados(-1.79, 2, true)).toBe("−1,79°");
    expect(grados(151.4)).toBe("151,40°");
  });
  it("no rellena ceros en porcentajes ni horas", () => {
    expect(pct(100)).toBe("100 %");
    expect(pct(39.11)).toBe("39,11 %");
    expect(horas(291)).toBe("291 h");
  });
  it("escribe coordenadas con hemisferio", () => {
    expect(latitud(-89.66)).toBe("89,66° S");
    expect(coordenadas(-89.66, 129.2)).toBe("89,66° S · 129,20° E");
    expect(coordenadas(26.13239, -153.9852)).toBe("26,13° N · 153,99° O");
  });
  it("resume el tamaño de un archivo", () => {
    expect(tamanoArchivo(512)).toBe("512 B");
    expect(tamanoArchivo(45_875)).toBe("44,8 KB");
    expect(tamanoArchivo(5 * 1024 * 1024)).toBe("5,0 MB");
  });
});

describe("separador del porcentaje por idioma", () => {
  it("pct usa el idioma activo (las pruebas corren en español)", async () => {
    const { pct, separadorUnidad } = await import("./formato");
    expect(pct(39.11)).toBe("39,11 %");
    expect(separadorUnidad("h")).toBe(" ");
  });
});
