import { describe, expect, it } from "vitest";
import { PANORAMA } from "./constants";
import { textoLimitacion, textoMetodoProyeccion, textoMotivoValidacion } from "./notasApi";
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
  it("limitaciones de la proyección: cada código produce texto EN sin español y el desconocido usa el de la API", () => {
    const api = {
      proyeccion_no_es_efemeride: "Es una proyección de un modelo, no una efeméride de JPL Horizons: su error está medido contra Horizons.",
      horizonte_ideal: "Elevación respecto a un horizonte ideal (Luna lisa, sin relieve): el relieve real solo puede empeorar las cifras.",
      sin_datos_de_proyeccion: "No hay proyección cargada para: shackleton, apollo11. Se devuelve vacía; no se inventa ningún valor.",
      modelo_no_disponible: "No hay archivo del modelo: los errores de la proyección no están disponibles.",
    };
    for (const [codigo, msg] of Object.entries(api)) {
      const t = codigo === "sin_datos_de_proyeccion" ? en.T.notasApi.sinDatosProyeccion("shackleton, apollo11") : en.T.notasApi.limitaciones[codigo];
      expect(t, codigo).toBeTruthy();
      expect(t, codigo).not.toMatch(ESPANOL);
      expect(es.T.notasApi.limitaciones[codigo] ?? es.T.notasApi.sinDatosProyeccion("x"), codigo).toBeTruthy();
      expect(textoLimitacion(codigo, msg)).toBe(es.T.notasApi.limitaciones[codigo] ?? es.T.notasApi.sinDatosProyeccion("shackleton, apollo11"));
    }
    expect(textoLimitacion("codigo_nuevo", "Texto de la API")).toBe("Texto de la API");
    expect(textoLimitacion("sin_datos_de_proyeccion", "Formato raro")).toBe("Formato raro");
    expect(en.T.notasApi.metodoProyeccion).not.toMatch(ESPANOL);
    expect(textoMetodoProyeccion("Otro método")).toBe("Otro método");
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
