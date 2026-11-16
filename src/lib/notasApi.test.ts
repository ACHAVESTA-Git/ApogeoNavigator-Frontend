import { describe, expect, it } from "vitest";
import { PANORAMA } from "./constants";
import { textoMotivoValidacion } from "./notasApi";
import * as en from "./textos.en";
import * as es from "./textos.es";

const CODIGOS = ["horizonte_ideal", "no_sustituye_efemerides", "validacion_no_ciega", "sol_rasante_polo", "cenit_ecuador", "validacion_de_otros_datos"];
const ESPANOL = /\b(el|la|los|las|del|que|puede|ventana|ajuste|datos|luna|modelo|periodos|mide|estos)\b|[áéíóúñ]/i;

describe("notas de la API traducidas", () => {
  it("el motivo de validación ausente se traduce por su forma; lo desconocido se deja como llega", () => {
    expect(en.T.notasApi.sinValidacion).not.toMatch(ESPANOL);
    expect(es.T.notasApi.sinValidacion).toBe("Este sitio no tiene validación contra Horizons.");
    expect(textoMotivoValidacion("Este sitio no tiene validación contra Horizons")).toBe(es.T.notasApi.sinValidacion); // pruebas en español
    expect(textoMotivoValidacion("Otro motivo desconocido")).toBe("Otro motivo desconocido");
    expect(textoMotivoValidacion(null)).toBeNull();
  });
  it("cada código conocido tiene traducción EN y ES", () => {
    for (const c of CODIGOS) {
      expect(en.T.notasApi.limitaciones[c], c).toBeTruthy();
      expect(es.T.notasApi.limitaciones[c], c).toBeTruthy();
    }
  });
  it("ningún texto EN de las notas contiene palabras españolas típicas", () => {
    const textos = [...Object.values(en.T.notasApi.limitaciones), en.T.notasApi.ventanaCorta("182", "346.6"), en.T.notasApi.espectro("29.53", "27.55", "27.21"), en.T.notasApi.r2];
    for (const t of textos) expect(t).not.toMatch(ESPANOL);
  });
  it("no se ven identificadores internos y el año de eclipses tiene etiqueta", () => {
    expect(JSON.stringify(en.T.notasApi) + JSON.stringify(es.T.notasApi)).not.toMatch(/rmse_deg|anio_de_eclipses/);
    expect(en.T.analisis.espectro.candidatos.anio_de_eclipses).toMatch(/eclipse year/);
    expect(es.T.analisis.espectro.candidatos.anio_de_eclipses).toMatch(/año de eclipses/);
  });
  it("el oeste es W en inglés y O en español", () => {
    expect(en.T.oeste).toBe("W");
    expect(es.T.oeste).toBe("O");
    expect(PANORAMA.CARDINALES.find((c) => c.deg === 270)?.letra).toBe("O"); // las pruebas corren en español
  });
});
