import { describe, expect, it } from "vitest";

describe("entorno de pruebas", () => {
  it("tiene DOM disponible", () => {
    expect(document.createElement("div")).toBeInstanceOf(HTMLElement);
  });
});
